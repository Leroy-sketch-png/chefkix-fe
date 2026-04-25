'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, ChevronRight, Trophy, X } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	DURATION_S,
} from '@/lib/motion'
import { getSeasonalChallenges, SeasonalChallenge } from '@/services/challenge'
import { logDevError } from '@/lib/dev-log'

// ============================================
// HELPERS
// ============================================

function getTimeRemaining(
	endsAt: string,
	t: (key: string, params?: Record<string, unknown>) => string,
): string {
	const diff = new Date(endsAt).getTime() - Date.now()
	if (diff <= 0) return t('sbEnded')
	const days = Math.floor(diff / (1000 * 60 * 60 * 24))
	if (days > 1) return t('sbDaysLeft', { count: days })
	const hours = Math.floor(diff / (1000 * 60 * 60))
	if (hours > 1) return t('sbHoursLeft', { count: hours })
	return t('sbEndingSoon')
}

const DISMISSED_KEY = 'chefkix_seasonal_banner_dismissed'

function isDismissed(challengeId: string): boolean {
	try {
		const dismissed = sessionStorage.getItem(DISMISSED_KEY)
		return dismissed === challengeId
	} catch (err) {
		logDevError('sessionStorage read error:', err)
		return false
	}
}

function dismissBanner(challengeId: string): void {
	try {
		sessionStorage.setItem(DISMISSED_KEY, challengeId)
	} catch (err) {
		logDevError('sessionStorage write error:', err)
		// sessionStorage not available
	}
}

// ============================================
// COMPONENT
// ============================================

interface SeasonalBannerProps {
	className?: string
}

export function SeasonalBanner({ className }: SeasonalBannerProps) {
	const tc = useTranslations('common')
	const td = useTranslations('dashboard')
	const [challenge, setChallenge] = useState<SeasonalChallenge | null>(null)
	const [dismissed, setDismissed] = useState(false)

	useEffect(() => {
		let mounted = true

		async function fetchSeasonal() {
			try {
				const res = await getSeasonalChallenges()
				if (!mounted) return
				if (res.success && res.data && res.data.length > 0) {
					// Show first active challenge
					const active = res.data.find(c => c.status === 'ACTIVE')
					if (active) {
						if (!isDismissed(active.id)) {
							setChallenge(active)
						}
					}
				}
			} catch (err) {
				logDevError('Failed to fetch seasonal challenges:', err)
			}
		}

		fetchSeasonal()
		return () => {
			mounted = false
		}
	}, [])

	const showBanner = !!challenge && !dismissed

	const progressPercent =
		challenge && challenge.targetCount > 0
			? Math.min(
					100,
					Math.round((challenge.userProgress / challenge.targetCount) * 100),
				)
			: 0

	const handleDismiss = () => {
		if (challenge) dismissBanner(challenge.id)
		setDismissed(true)
	}

	return (
		<AnimatePresence>
			{showBanner && challenge && (
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -12 }}
					transition={TRANSITION_SPRING}
					className={cn(
						'group relative overflow-hidden rounded-radius border border-brand/20 bg-gradient-to-r from-brand/10 via-bg-card to-streak/10 p-3 shadow-card sm:p-4 md:p-5',
						className,
					)}
				>
					{/* Dismiss button */}
					<button
						type='button'
						onClick={handleDismiss}
						className='absolute right-2 top-2 flex size-10 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-elevated hover:text-text focus-visible:ring-2 focus-visible:ring-brand/50 sm:right-3 sm:top-3'
						aria-label={tc('ariaDismissSeasonalBanner')}
					>
						<X className='size-4' />
					</button>

					{/* Content */}
					<div className='flex items-start gap-3 sm:gap-4'>
						{/* Emoji / Icon */}
						<div className='grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-hero text-lg shadow-card shadow-brand/25 sm:size-12 sm:text-xl'>
							{challenge.emoji || '🎄'}
						</div>

						<div className='min-w-0 flex-1'>
							{/* Header */}
							<div className='flex flex-wrap items-center gap-1.5 pr-8 sm:gap-2'>
								<span className='rounded-full bg-brand/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-brand'>
									{td('sbSeasonalEvent')}
								</span>
								<span className='flex items-center gap-1 text-xs text-text-muted'>
									<Calendar className='size-3' />
									{getTimeRemaining(challenge.endsAt, td)}
								</span>
							</div>

							<h3 className='mt-1.5 text-sm font-bold text-text sm:text-base'>
								{challenge.title}
							</h3>
							<p
								className='mt-0.5 line-clamp-2 text-xs leading-relaxed text-text-secondary sm:text-sm'
								title={challenge.description}
							>
								{challenge.description}
							</p>

							{/* Progress bar */}
							{challenge.targetCount > 0 && (
								<div className='mt-3'>
									<div className='mb-1 flex items-center justify-between text-xs'>
										<span className='tabular-nums text-text-secondary'>
											{challenge.userProgress} / {challenge.targetCount}{' '}
											{challenge.targetUnit}
										</span>
										<span className='font-semibold tabular-nums text-brand'>
											{progressPercent}%
										</span>
									</div>
									<Progress value={progressPercent} className='h-2' />
								</div>
							)}

							{/* Footer: reward + CTA */}
							<div className='mt-2.5 flex flex-wrap items-center gap-2.5 sm:mt-3 sm:gap-3'>
								{challenge.rewardXp > 0 && (
									<span className='flex items-center gap-1 text-xs font-semibold text-xp'>
										<Trophy className='size-3.5' />
										{challenge.rewardXp} XP
										{challenge.rewardBadgeName &&
											` + ${challenge.rewardBadgeName}`}
									</span>
								)}
								<Link href='/challenges' className='ml-auto'>
									<motion.span
										whileHover={BUTTON_HOVER}
										whileTap={BUTTON_TAP}
										className='inline-flex items-center gap-1 rounded-lg bg-brand px-2.5 py-1.5 text-xs font-bold text-white shadow-card transition-shadow hover:shadow-warm sm:px-3'
									>
										{challenge.userCompleted
											? td('sbViewDetails')
											: td('sbJoinEvent')}
										<ChevronRight className='size-3.5' />
									</motion.span>
								</Link>
							</div>
						</div>
					</div>

					{/* Subtle decorative glow */}
					<div className='pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-brand/5 blur-2xl' />
				</motion.div>
			)}
		</AnimatePresence>
	)
}
