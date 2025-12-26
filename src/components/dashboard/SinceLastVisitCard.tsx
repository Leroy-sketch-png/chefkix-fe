'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Heart,
	MessageCircle,
	UserPlus,
	Trophy,
	Sparkles,
	X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING, CARD_HOVER } from '@/lib/motion'
import { getNotifications, type Notification } from '@/services/notification'

// ============================================
// TYPES
// ============================================

interface ActivitySummary {
	likesReceived: number
	commentsReceived: number
	newFollowers: number
	xpEarned: number
	badgesEarned: number
	lastVisit: Date
}

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

function aggregateNotifications(
	notifications: Notification[],
	since: Date,
): ActivitySummary {
	const summary: ActivitySummary = {
		likesReceived: 0,
		commentsReceived: 0,
		newFollowers: 0,
		xpEarned: 0,
		badgesEarned: 0,
		lastVisit: since,
	}

	for (const notif of notifications) {
		const notifDate = new Date(notif.createdAt)
		if (notifDate < since) continue

		switch (notif.type) {
			case 'POST_LIKE':
				summary.likesReceived += notif.count || 1
				break
			case 'POST_COMMENT':
				summary.commentsReceived += notif.count || 1
				break
			case 'NEW_FOLLOWER':
			case 'FOLLOW':
				summary.newFollowers += notif.count || 1
				break
			case 'XP_AWARDED':
				// Try to parse XP from content like "You earned 50 XP for..."
				const xpMatch = notif.content?.match(/(\d+)\s*XP/i)
				if (xpMatch) summary.xpEarned += parseInt(xpMatch[1])
				break
			case 'BADGE_EARNED':
				summary.badgesEarned += 1
				break
		}
	}

	return summary
}

function formatTimeSince(date: Date): string {
	const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60))
	if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
	const days = Math.floor(hours / 24)
	return `${days} day${days !== 1 ? 's' : ''} ago`
}

// ============================================
// COMPONENT
// ============================================

export const SinceLastVisitCard = ({ className }: SinceLastVisitCardProps) => {
	const [summary, setSummary] = useState<ActivitySummary | null>(null)
	const [isVisible, setIsVisible] = useState(false)
	const [isDismissed, setIsDismissed] = useState(false)

	useEffect(() => {
		const fetchActivity = async () => {
			const lastVisit = getLastVisit()
			const now = new Date()

			// First visit or < MIN_ABSENCE_HOURS since last
			if (!lastVisit) {
				setLastVisit()
				return
			}

			const hoursSinceVisit =
				(now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60)
			if (hoursSinceVisit < MIN_ABSENCE_HOURS) {
				setLastVisit()
				return
			}

			// Fetch notifications to aggregate activity
			const response = await getNotifications({ size: 100 })
			if (response.success && response.data) {
				const aggregated = aggregateNotifications(
					response.data.notifications,
					lastVisit,
				)

				// Only show if there's something to report
				const hasActivity =
					aggregated.likesReceived > 0 ||
					aggregated.commentsReceived > 0 ||
					aggregated.newFollowers > 0 ||
					aggregated.xpEarned > 0 ||
					aggregated.badgesEarned > 0

				if (hasActivity) {
					setSummary(aggregated)
					setIsVisible(true)
				}
			}

			// Update last visit time
			setLastVisit()
		}

		fetchActivity()
	}, [])

	const handleDismiss = () => {
		setIsDismissed(true)
		// Animate out then remove
		setTimeout(() => setIsVisible(false), 300)
	}

	if (!isVisible || !summary) return null

	const stats = [
		{
			icon: Heart,
			value: summary.likesReceived,
			label: 'likes',
			color: 'text-red-500',
		},
		{
			icon: MessageCircle,
			value: summary.commentsReceived,
			label: 'comments',
			color: 'text-blue-500',
		},
		{
			icon: UserPlus,
			value: summary.newFollowers,
			label: 'followers',
			color: 'text-green-500',
		},
		{
			icon: Sparkles,
			value: summary.xpEarned,
			label: 'XP',
			color: 'text-purple-500',
		},
		{
			icon: Trophy,
			value: summary.badgesEarned,
			label: 'badges',
			color: 'text-yellow-500',
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
						'relative overflow-hidden rounded-2xl border border-border-subtle bg-gradient-to-br from-bg-elevated to-bg-card p-4 shadow-warm',
						className,
					)}
				>
					{/* Background decoration */}
					<div className='absolute -right-6 -top-6 size-24 rounded-full bg-brand/5 blur-2xl' />
					<div className='absolute -bottom-4 -left-4 size-16 rounded-full bg-purple-500/5 blur-xl' />

					{/* Dismiss button */}
					<button
						onClick={handleDismiss}
						className='absolute right-3 top-3 rounded-full p-1 text-text-muted transition-colors hover:bg-bg-card hover:text-text'
						aria-label='Dismiss'
					>
						<X className='size-4' />
					</button>

					{/* Content */}
					<div className='relative'>
						<h3 className='mb-1 text-sm font-semibold text-text'>
							Welcome back! 👋
						</h3>
						<p className='mb-3 text-xs text-text-muted'>
							Since your last visit {formatTimeSince(summary.lastVisit)}
						</p>

						{/* Stats grid */}
						<div className='flex flex-wrap gap-3'>
							{stats.map(({ icon: Icon, value, label, color }) => (
								<motion.div
									key={label}
									whileHover={{ scale: 1.05 }}
									className='flex items-center gap-1.5 rounded-lg bg-bg-card/80 px-2.5 py-1.5'
								>
									<Icon className={cn('size-4', color)} />
									<span className='text-sm font-semibold text-text'>
										{value}
									</span>
									<span className='text-xs text-text-muted'>{label}</span>
								</motion.div>
							))}
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}
