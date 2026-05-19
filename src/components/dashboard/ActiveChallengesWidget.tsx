'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Clock, Flame, ChevronRight, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING } from '@/lib/motion'
import { NumberTicker } from '@/components/ui/number-ticker'
import { MagicCard } from '@/components/ui/magic-card'
import {
	getTodaysChallenge,
	getWeeklyChallenge,
	DailyChallenge,
	WeeklyChallenge,
} from '@/services/challenge'
import { logDevError } from '@/lib/dev-log'
import { useTranslations } from 'next-intl'

interface ActiveChallengesWidgetProps {
	className?: string
}

const CHALLENGE_WIDGET_TIMEOUT_MS = 8000

function formatCountdown(endsAt: string, endedLabel = 'Ended'): string {
	const end = new Date(endsAt)
	if (isNaN(end.getTime())) return '-'

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

export function ActiveChallengesWidget({
	className,
}: ActiveChallengesWidgetProps) {
	const t = useTranslations('challengeWidget')
	const [daily, setDaily] = useState<DailyChallenge | null>(null)
	const [weekly, setWeekly] = useState<WeeklyChallenge | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [hasError, setHasError] = useState(false)

	const loadChallenges = useCallback(async () => {
		setHasError(false)
		setIsLoading(true)

		try {
			const [dailyRes, weeklyRes] = await Promise.all([
				getTodaysChallenge({
					timeoutMs: CHALLENGE_WIDGET_TIMEOUT_MS,
				}).catch(() => null),
				getWeeklyChallenge({
					timeoutMs: CHALLENGE_WIDGET_TIMEOUT_MS,
				}).catch(() => null),
			])

			if (!dailyRes && !weeklyRes) {
				setHasError(true)
				setDaily(null)
				setWeekly(null)
				return
			}

			if (
				dailyRes?.success &&
				dailyRes.data &&
				typeof dailyRes.data.title === 'string' &&
				dailyRes.data.endsAt &&
				!dailyRes.data.completed
			) {
				setDaily(dailyRes.data)
			} else {
				setDaily(null)
			}

			if (
				weeklyRes?.success &&
				weeklyRes.data &&
				typeof weeklyRes.data.title === 'string' &&
				!weeklyRes.data.completed
			) {
				setWeekly(weeklyRes.data)
			} else {
				setWeekly(null)
			}
		} catch (err) {
			logDevError('Failed to fetch challenges for widget:', err)
			setHasError(true)
			setDaily(null)
			setWeekly(null)
		} finally {
			setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		void loadChallenges()
	}, [loadChallenges])

	if (isLoading) {
		return (
			<div
				className={cn(
					'overflow-hidden rounded-2xl border border-border-subtle/80 bg-bg-card p-4 shadow-card sm:p-5',
					className,
				)}
			>
				<div>
					<div className='mb-3 flex items-center justify-between'>
						<div className='inline-flex items-center gap-2 text-sm font-bold text-text-primary'>
							<Trophy className='size-4 text-brand' />
							{t('activeChallenges')}
						</div>
						<div className='h-4 w-14 animate-pulse rounded bg-bg-elevated' />
					</div>
					<div className='space-y-2'>
						<div className='h-14 animate-pulse rounded-xl border border-border-subtle/70 bg-bg-elevated/60' />
						<div className='h-14 animate-pulse rounded-xl border border-border-subtle/70 bg-bg-elevated/60' />
					</div>
				</div>
			</div>
		)
	}

	if (hasError) {
		return (
			<div
				className={cn(
					'overflow-hidden rounded-2xl border border-border-subtle/80 bg-bg-card shadow-card',
					className,
				)}
			>
				<div className='flex items-center justify-between p-4 text-sm text-text-muted'>
					<div className='flex items-center gap-2'>
						<Trophy className='size-4 text-text-muted' />
						<span>{t('unavailable')}</span>
					</div>
					<button
						type='button'
						onClick={() => void loadChallenges()}
						className='inline-flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-medium text-brand transition-colors hover:bg-brand/10'
						aria-label={t('retry')}
					>
						<RefreshCw className='size-3' />
						{t('retry')}
					</button>
				</div>
			</div>
		)
	}

	if (!daily && !weekly) {
		return (
			<div
				className={cn(
					'overflow-hidden rounded-2xl border border-border-subtle/80 bg-bg-card shadow-card',
					className,
				)}
			>
				<div className='p-4'>
					<div className='mb-2 inline-flex items-center gap-2 text-sm font-bold text-text-primary'>
						<Trophy className='size-4 text-brand' />
						{t('activeChallenges')}
					</div>
					<p className='text-sm text-text-secondary'>{t('emptyState')}</p>
					<Link
						href='/challenges'
						className='mt-3 inline-flex items-center gap-1 rounded-xl border border-border-subtle bg-bg-elevated px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary'
					>
						{t('viewAll')}
						<ChevronRight className='size-3.5' />
					</Link>
				</div>
			</div>
		)
	}

	return (
		<MagicCard
			mode='gradient'
			className={cn(
				'overflow-hidden rounded-2xl border border-border-subtle/80 bg-bg-card/75 backdrop-blur-md shadow-card p-0',
				className,
			)}
		>
			<div className='p-4'>
				<div className='mb-3 flex items-center justify-between'>
					<h3 className='flex items-center gap-2 text-sm font-bold text-text-primary'>
						<Trophy className='size-4 text-brand' />
						{t('activeChallenges')}
					</h3>
					<Link
						href='/challenges'
						className='inline-flex items-center gap-0.5 text-xs font-medium text-brand transition-colors hover:text-brand/80'
					>
						{t('viewAll')}
						<ChevronRight className='size-3.5' />
					</Link>
				</div>

				<div className='space-y-2.5'>
					{daily && (
						<Link
							href='/challenges'
							className='group flex items-center gap-3 rounded-xl border border-border-subtle/50 bg-bg-elevated/70 p-3 transition-colors hover:bg-brand/5'
						>
							<div className='grid size-9 shrink-0 place-items-center rounded-xl bg-streak/10 text-lg'>
								{daily.icon || <Flame className='size-4 text-streak' />}
							</div>
							<div className='min-w-0 flex-1'>
								<p className='truncate text-sm font-semibold text-text-primary'>
									{daily.title}
								</p>
								<div className='flex items-center gap-1 text-xs text-text-muted'>
									<Clock className='size-3' />
									<span>
										{t('remaining', {
											time: formatCountdown(daily.endsAt, t('ended')),
										})}
									</span>
									<span className='ml-auto font-semibold tabular-nums text-xp'>
										+
										<NumberTicker
											value={daily.bonusXp}
											className='tabular-nums font-bold'
										/>{' '}
										XP
									</span>
								</div>
							</div>
							<ChevronRight className='size-4 text-text-muted transition-transform group-hover:translate-x-0.5' />
						</Link>
					)}

					{weekly && (
						<Link
							href='/challenges'
							className='group flex items-center gap-3 rounded-xl border border-border-subtle/50 bg-bg-elevated/70 p-3 transition-colors hover:bg-brand/5'
						>
							<div className='grid size-9 shrink-0 place-items-center rounded-xl bg-xp/10'>
								<Trophy className='size-4 text-xp' />
							</div>
							<div className='min-w-0 flex-1'>
								<p className='truncate text-sm font-semibold text-text-primary'>
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
										<NumberTicker
											value={weekly.progress}
											className='tabular-nums font-semibold'
										/>
										/{weekly.target}
									</span>
								</div>
							</div>
							<ChevronRight className='size-4 text-text-muted transition-transform group-hover:translate-x-0.5' />
						</Link>
					)}
				</div>
			</div>
		</MagicCard>
	)
}
