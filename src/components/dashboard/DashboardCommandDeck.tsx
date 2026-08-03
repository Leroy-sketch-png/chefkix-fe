import type { ComponentType } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
	AlertTriangle,
	ChefHat,
	Clock,
	Flame,
	PenSquare,
	Sparkles,
	TrendingUp,
	Users2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { PremiumSurface } from '@/components/layout/PremiumSurface'
import { PATHS } from '@/constants'
import type { Statistics } from '@/lib/types/profile'
import { TRANSITION_SPRING } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface DashboardCommandDeckProps {
	stats?: Statistics
	hasStreakAtRisk?: boolean
	pendingSessionCount?: number
	className?: string
}

const CHEF_TITLE_LABELS: Record<Statistics['title'], string> = {
	BEGINNER: 'titleBeginner',
	AMATEUR: 'titleAmateur',
	SEMIPRO: 'titleSemiPro',
	PRO: 'titlePro',
}

interface SignalProps {
	label: string
	value: string
	icon: ComponentType<{ className?: string }>
	tone: 'brand' | 'xp' | 'streak' | 'error'
}

const signalToneClasses: Record<SignalProps['tone'], string> = {
	brand: 'bg-brand/10 text-brand',
	xp: 'bg-xp/10 text-xp',
	streak: 'bg-streak/10 text-streak',
	error: 'bg-error/10 text-error',
}

function Signal({ label, value, icon: Icon, tone }: SignalProps) {
	return (
		<div className='flex min-w-0 items-center gap-3 px-1 py-2 sm:px-4'>
			<span
				className={cn(
					'grid size-9 shrink-0 place-items-center rounded-lg',
					signalToneClasses[tone],
				)}
			>
				<Icon className='size-4' />
			</span>
			<span className='min-w-0'>
				<span className='block text-xs font-medium text-text-muted'>
					{label}
				</span>
				<span className='block truncate text-sm font-semibold text-text-primary'>
					{value}
				</span>
			</span>
		</div>
	)
}

export function DashboardCommandDeck({
	stats,
	hasStreakAtRisk = false,
	pendingSessionCount,
	className,
}: DashboardCommandDeckProps) {
	const t = useTranslations('dashboard')
	const level = stats?.currentLevel ?? 1
	const xp = stats?.currentXP ?? 0
	const xpGoal = Math.max(stats?.currentXPGoal ?? 100, 100)
	const streak = stats?.streakCount ?? 0
	const chefTitle = stats?.title
		? t(CHEF_TITLE_LABELS[stats.title])
		: t('titleDefault')
	const xpPercent = Math.min(Math.max(Math.round((xp / xpGoal) * 100), 0), 100)
	const xpRemaining = Math.max(xpGoal - xp, 0)
	const hasPendingSessions =
		typeof pendingSessionCount === 'number' && pendingSessionCount > 0

	const leadCopy = hasStreakAtRisk
		? t('cmdStreakRiskSubtitle')
		: hasPendingSessions
			? t('cmdLeadPending', { count: pendingSessionCount })
			: t('cmdLeadDefault')

	const signals: SignalProps[] = [
		{
			label: t('cmdStatLevel'),
			value: `Lv. ${level} - ${chefTitle}`,
			icon: Sparkles,
			tone: 'brand',
		},
		{
			label: t('cmdStatStreak'),
			value: t('cmdStreakValue', { count: streak }),
			icon: Flame,
			tone: hasStreakAtRisk ? 'error' : 'streak',
		},
		hasPendingSessions
			? {
					label: t('cmdStatPending'),
					value: t('cmdPendingValue', { count: pendingSessionCount }),
					icon: Clock,
					tone: 'brand',
				}
			: {
					label: t('cmdStatXp'),
					value: `${xp.toLocaleString()} XP`,
					icon: TrendingUp,
					tone: 'xp',
				},
	]

	return (
		<motion.section
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={TRANSITION_SPRING}
			className={className}
			aria-labelledby='dashboard-command-title'
		>
			<PremiumSurface tone='brand' className='p-4 sm:p-5'>
				<div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center'>
					<div className='min-w-0'>
						<div className='flex flex-wrap items-center gap-2'>
							<span className='text-xs font-semibold text-brand'>
								{chefTitle} - Lv.{level}
							</span>
							{hasStreakAtRisk && (
								<span
									role='status'
									className='inline-flex items-center gap-1 text-xs font-semibold text-error'
								>
									<AlertTriangle className='size-3.5' />
									{t('cmdStreakRisk')}
								</span>
							)}
						</div>

						<h2
							id='dashboard-command-title'
							className='mt-2 text-xl font-bold leading-tight text-text-primary sm:text-2xl'
						>
							{t('cmdTitle')}
						</h2>
						<p className='mt-1 max-w-2xl text-sm leading-6 text-text-secondary'>
							{leadCopy}
						</p>
					</div>

					<div className='flex flex-wrap gap-2 lg:justify-end'>
						<Button asChild size='lg'>
							<Link href={PATHS.COOK}>
								<ChefHat />
								{t('cmdBtnQuickCook')}
							</Link>
						</Button>
						<Button asChild size='lg' variant='outline'>
							<Link href='/create'>
								<PenSquare />
								{t('cmdBtnCreatePost')}
							</Link>
						</Button>
						<Button asChild size='lg' variant='ghost'>
							<Link href='/community'>
								<Users2 />
								{t('cmdBtnCommunity')}
							</Link>
						</Button>
					</div>
				</div>

				<div className='mt-4 border-t border-border-subtle pt-3'>
					<div className='grid gap-1 sm:grid-cols-3 sm:divide-x sm:divide-border-subtle'>
						{signals.map(signal => (
							<Signal key={signal.label} {...signal} />
						))}
					</div>

					<div className='mt-3 flex items-center gap-3'>
						<div
							role='progressbar'
							aria-label={t('cmdRhythmTitle')}
							aria-valuemin={0}
							aria-valuemax={xpGoal}
							aria-valuenow={Math.min(Math.max(xp, 0), xpGoal)}
							className='h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-bg-elevated'
						>
							<motion.div
								initial={{ width: 0 }}
								animate={{ width: `${xpPercent}%` }}
								transition={{ duration: 0.8, ease: 'easeOut' }}
								className='h-full rounded-full bg-xp'
							/>
						</div>
						<p className='shrink-0 text-xs font-medium text-text-secondary'>
							{t('cmdProgressToNext', {
								xp: xpRemaining,
								level: level + 1,
							})}
						</p>
					</div>
				</div>
			</PremiumSurface>
		</motion.section>
	)
}
