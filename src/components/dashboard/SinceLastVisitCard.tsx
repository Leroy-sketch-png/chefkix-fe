'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Heart,
	MessageCircle,
	UserPlus,
	Trophy,
	Sparkles,
	Award,
	X,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING, BUTTON_SUBTLE_HOVER, BUTTON_SUBTLE_TAP } from '@/lib/motion'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { getActivitySummary } from '@/services/heartbeat'
import type { NotificationSummaryResponse } from '@/lib/types/heartbeat'

// ============================================
// TYPES
// ============================================

interface SinceLastVisitCardProps {
	className?: string
}

// ============================================
// CONSTANTS
// ============================================

const LAST_VISIT_KEY = 'chefkix_last_visit'
const MIN_ABSENCE_HOURS = 4 // Only show if away for 4+ hours

// ============================================
// HELPERS
// ============================================

function getLastVisit(): Date | null {
	if (typeof window === 'undefined') return null
	const stored = localStorage.getItem(LAST_VISIT_KEY)
	return stored ? new Date(stored) : null
}

function setLastVisit(): void {
	if (typeof window === 'undefined') return
	localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString())
}

function formatTimeSince(date: Date, t: (key: string, params?: Record<string, number>) => string): string {
	const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60))
	if (hours < 24) return t('slHoursAgo', { count: hours })
	const days = Math.floor(hours / 24)
	return t('slDaysAgo', { count: days })
}

// ============================================
// COMPONENT
// ============================================

export const SinceLastVisitCard = ({ className }: SinceLastVisitCardProps) => {
	const t = useTranslations('dashboard')
	const router = useRouter()
	const [data, setData] = useState<NotificationSummaryResponse | null>(null)
	const [lastVisit, setLastVisitDate] = useState<Date | null>(null)
	const [isVisible, setIsVisible] = useState(false)
	const [isDismissed, setIsDismissed] = useState(false)

	useEffect(() => {
		const fetchActivity = async () => {
			const storedLastVisit = getLastVisit()
			const now = new Date()

			// First visit or < MIN_ABSENCE_HOURS since last
			if (!storedLastVisit) {
				setLastVisit()
				return
			}

			const hoursSinceVisit =
				(now.getTime() - storedLastVisit.getTime()) / (1000 * 60 * 60)
			if (hoursSinceVisit < MIN_ABSENCE_HOURS) {
				setLastVisit()
				return
			}

			// Use the new backend endpoint for pre-aggregated summary
			try {
				const response = await getActivitySummary(storedLastVisit.toISOString())
				if (
					response.success &&
					response.data &&
					response.data.totalNotifications > 0
				) {
					setData(response.data)
					setLastVisitDate(storedLastVisit)
					setIsVisible(true)
				}
			} catch {
				// Non-critical — silently fail, card just won't show
			}

			// Update last visit time
			setLastVisit()
		}

		fetchActivity()
	}, [])

	const handleDismiss = () => {
		setIsDismissed(true)
		setTimeout(() => setIsVisible(false), 300)
	}

	if (!isVisible || !data || !lastVisit) return null

	const stats = [
		{
			icon: Heart,
			value: data.newLikes,
			label: t('slLikes'),
			color: 'text-error',
			href: '/notifications',
		},
		{
			icon: MessageCircle,
			value: data.newComments,
			label: t('slComments'),
			color: 'text-info',
			href: '/notifications',
		},
		{
			icon: UserPlus,
			value: data.newFollowers,
			label: t('slFollowers'),
			color: 'text-success',
			href: '/community',
		},
		{
			icon: Sparkles,
			value: data.xpAwarded,
			label: t('slXp'),
			color: 'text-accent-purple',
			href: '/profile/badges',
		},
		{
			icon: Trophy,
			value: data.badgesEarned,
			label: t('slBadges'),
			color: 'text-medal-gold',
			href: '/profile/badges',
		},
		{
			icon: Award,
			value: data.levelsGained,
			label: t('slLevels'),
			color: 'text-xp',
			href: '/profile/badges',
		},
	].filter(s => s.value > 0)

	return (
		<AnimatePresence>
			{!isDismissed && (
				<motion.div
					initial={{ opacity: 0, y: -20, scale: 0.95 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: -20, scale: 0.95 }}
					transition={TRANSITION_SPRING}
					className={cn(
						'relative overflow-hidden rounded-2xl border border-border-subtle bg-gradient-to-br from-bg-elevated to-bg-card p-4',
						className,
					)}
				>
					{/* Background decoration */}
					<div className='absolute -right-6 -top-6 size-24 rounded-full bg-brand/5 blur-2xl' />
					<div className='absolute -bottom-4 -left-4 size-16 rounded-full bg-accent-purple/5 blur-xl' />

					{/* Dismiss button */}
					<button
						type='button'
						onClick={handleDismiss}
						className='absolute right-3 top-3 rounded-full p-1 text-text-muted transition-colors hover:bg-bg-card hover:text-text'
						aria-label={t('slDismissLabel')}
					>
						<X className='size-4' />
					</button>

					{/* Content */}
					<div className='relative'>
						<h3 className='mb-1 text-sm font-semibold text-text'>
							{t('slWelcomeBack')}
						</h3>
						<p className='mb-3 text-xs text-text-muted'>
							{t('slSinceLastVisit', { timeAgo: formatTimeSince(lastVisit, t) })}
						</p>

						{/* Stats grid */}
						<div className='flex flex-wrap gap-3'>
							{stats.map(({ icon: Icon, value, label, color, href }) => (
								<motion.button
									type='button'
									key={label}
										whileHover={BUTTON_SUBTLE_HOVER}
										whileTap={BUTTON_SUBTLE_TAP}
										transition={TRANSITION_SPRING}
									onClick={() => router.push(href)}
									className='flex items-center gap-1.5 rounded-lg bg-bg-card/80 px-2.5 py-1.5 transition-colors hover:bg-bg-elevated focus-visible:ring-2 focus-visible:ring-brand/50'
								>
									<Icon className={cn('size-4', color)} />
									<span className='text-sm font-semibold text-text tabular-nums'>
										<AnimatedNumber value={value} />
									</span>
									<span className='text-xs text-text-muted'>{label}</span>
								</motion.button>
							))}
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}
