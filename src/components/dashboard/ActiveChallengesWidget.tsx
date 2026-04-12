'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Clock, Flame, ChevronRight, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING } from '@/lib/motion'
import { AnimatedNumber } from '@/components/ui/animated-number'
import {
	getTodaysChallenge,
	getWeeklyChallenge,
	DailyChallenge,
	WeeklyChallenge,
} from '@/services/challenge'
import { logDevError } from '@/lib/dev-log'
import { useTranslations } from 'next-intl'

// ============================================
// HELPERS
// ============================================

function formatCountdown(endsAt: string, endedLabel = 'Ended'): string {
	const end = new Date(endsAt)
	if (isNaN(end.getTime())) return '—'
	const diff = end.getTime() - Date.now()
	if (diff <= 0) return endedLabel
	const hours = Math.floor(diff / (1000 * 60 * 60))
	if (hours < 1) {
		const mins = Math.floor(diff / (1000 * 60))
		return `${mins}m`
	}
	if (hours < 24) return `${hours}h`
	const days = Math.floor(hours / 24)
	return `${days}d`
}

// ============================================
// COMPONENT
// ============================================

interface ActiveChallengesWidgetProps {
	className?: string
}

export function ActiveChallengesWidget({
	className,
}: ActiveChallengesWidgetProps) {
	const [daily, setDaily] = useState<DailyChallenge | null>(null)
	const [weekly, setWeekly] = useState<WeeklyChallenge | null>(null)
	const [loaded, setLoaded] = useState(false)
	const [hasError, setHasError] = useState(false)
	const t = useTranslations('challengeWidget')

	const fetchChallenges = useCallback(async () => {
		setHasError(false)
		setLoaded(false)
		try {
			const [dailyRes, weeklyRes] = await Promise.all([
				getTodaysChallenge().catch(() => null),
				getWeeklyChallenge().catch(() => null),
			])

			if (!dailyRes && !weeklyRes) {
				setHasError(true)
			} else {
				if (
					dailyRes?.success &&
					dailyRes.data &&
					typeof dailyRes.data.title === 'string' &&
					dailyRes.data.endsAt &&
					!dailyRes.data.completed
				) {
					setDaily(dailyRes.data)
				}
				if (
					weeklyRes?.success &&
					weeklyRes.data &&
					typeof weeklyRes.data.title === 'string' &&
					!weeklyRes.data.completed
				) {
					setWeekly(weeklyRes.data)
				}
			}
		} catch (err) {
			logDevError('Failed to fetch challenges for widget:', err)
			setHasError(true)
		} finally {
			setLoaded(true)
		}
	}, [])

	useEffect(() => {
		fetchChallenges()
	}, [fetchChallenges])

	// Don't render if still loading
	if (!loaded) return null

	// Error state — API is down
	if (hasError) {
		return (
			<div
				className={cn(
					'flex items-center justify-between rounded-radius border border-border-subtle bg-bg-card p-4 text-sm text-text-muted shadow-card',
					className,
				)}
			>
				<div className='flex items-center gap-2'>
					<Trophy className='size-4 text-text-muted' />
					<span>{t('unavailable')}</span>
				</div>
				<button
					type='button'
					onClick={fetchChallenges}
					className='flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand transition-colors hover:bg-brand/10'
					aria-label={t('retry')}
				>
					<RefreshCw className='size-3' />
					{t('retry')}
				</button>
			</div>
		)
	}

	// No active challenges
	if (!daily && !weekly) return null

	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={TRANSITION_SPRING}
			className={cn(
				'rounded-radius border border-border-subtle bg-bg-card p-4 shadow-card',
				className,
			)}
		>
			<div className='mb-3 flex items-center justify-between'>
				<h3 className='flex items-center gap-2 text-sm font-bold text-text'>
					<Trophy className='size-4 text-brand' />
					{t('activeChallenges')}
				</h3>
				<Link
					href='/challenges'
					className='flex items-center gap-0.5 text-xs font-medium text-brand transition-colors hover:text-brand/80'
				>
					{t('viewAll')}
					<ChevronRight className='size-3.5' />
				</Link>
			</div>

			<div className='space-y-2.5'>
				{/* Daily Challenge */}
				{daily && (
					<Link
						href='/challenges'
						className='group flex items-center gap-3 rounded-lg bg-bg-elevated p-3 transition-colors hover:bg-brand/5'
					>
						<div className='grid size-9 shrink-0 place-items-center rounded-lg bg-streak/10 text-lg'>
							{daily.icon || <Flame className='size-4 text-streak' />}
						</div>
						<div className='min-w-0 flex-1'>
							<p className='truncate text-sm font-semibold text-text'>
								{daily.title}
							</p>
							<p className='flex items-center gap-1 text-xs text-text-muted'>
								<Clock className='size-3' />
								{t('remaining', {
									time: formatCountdown(daily.endsAt, t('ended')),
								})}
								<span className='ml-auto font-semibold tabular-nums text-xp'>
									+
									<AnimatedNumber
										value={daily.bonusXp}
										className='tabular-nums'
									/>{' '}
									XP
								</span>
							</p>
						</div>
						<ChevronRight className='size-4 text-text-muted transition-transform group-hover:translate-x-0.5' />
					</Link>
				)}

				{/* Weekly Challenge */}
				{weekly && (
					<Link
						href='/challenges'
						className='group flex items-center gap-3 rounded-lg bg-bg-elevated p-3 transition-colors hover:bg-brand/5'
					>
						<div className='grid size-9 shrink-0 place-items-center rounded-lg bg-xp/10'>
							<Trophy className='size-4 text-xp' />
						</div>
						<div className='min-w-0 flex-1'>
							<p className='truncate text-sm font-semibold text-text'>
								{weekly.title}
							</p>
							<div className='mt-1 flex items-center gap-2'>
								<div className='h-1.5 flex-1 overflow-hidden rounded-full bg-bg'>
									<div
										className='h-full rounded-full bg-gradient-brand transition-all duration-500'
										style={{
											width: `${weekly.target > 0 ? Math.min(100, (weekly.progress / weekly.target) * 100) : 0}%`,
										}}
									/>
								</div>
								<span className='text-xs font-medium tabular-nums text-text-muted'>
									<AnimatedNumber
										value={weekly.progress}
										className='tabular-nums'
									/>
									/{weekly.target}
								</span>
							</div>
						</div>
						<ChevronRight className='size-4 text-text-muted transition-transform group-hover:translate-x-0.5' />
					</Link>
				)}
			</div>
		</motion.div>
	)
}
