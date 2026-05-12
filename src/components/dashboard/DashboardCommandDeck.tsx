import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
	Users2,
	BookOpen,
	ChefHat,
	PenSquare,
	Clock,
	AlertTriangle,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
	CommandDeckBase,
	type StatCardProps,
} from '@/components/layout/CommandDeckBase'
import { TRANSITION_SPRING } from '@/lib/motion'
import type { Statistics } from '@/lib/types/profile'

interface DashboardCommandDeckProps {
	stats?: Statistics
	hasStreakAtRisk: boolean
	pendingSessionCount: number
	className?: string
}

export function DashboardCommandDeck({
	stats,
	hasStreakAtRisk,
	pendingSessionCount,
	className,
}: DashboardCommandDeckProps) {
	const t = useTranslations('dashboard')
	const level = stats?.currentLevel ?? 1
	const xp = stats?.currentXP ?? 0
	const xpGoal = Math.max(stats?.currentXPGoal ?? 100, 100)
	const streak = stats?.streakCount ?? 0

	const statCards: StatCardProps[] = [
		{ label: t('cmdStatLevel'), value: `Lv.${level}`, tone: 'brand' },
		{
			label: t('cmdStatXp'),
			value: `${xp.toLocaleString()} / ${xpGoal.toLocaleString()}`,
			tone: 'xp',
		},
		{
			label: t('cmdStatStreak'),
			value: t('cmdStreakValue', { count: streak }),
			tone: hasStreakAtRisk ? 'error' : 'streak',
		},
		{
			label: t('cmdStatPending'),
			value: pendingSessionCount.toString(),
			tone: pendingSessionCount > 0 ? 'brand' : 'muted',
		},
	]

	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={TRANSITION_SPRING}
			className={className}
		>
			<CommandDeckBase
				eyebrow={t('cmdEyebrow')}
				title={t('cmdTitle')}
				subtitle={
					hasStreakAtRisk ? t('cmdStreakRiskSubtitle') : t('cmdSubtitle')
				}
				gradient='brand'
				stats={statCards}
				className='p-2.5 sm:p-4'
			>
				<div className='mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:grid-cols-2 sm:gap-3'>
					<Button
						asChild
						variant='brand'
						className='h-10 justify-start gap-2 px-3 text-sm sm:h-11'
					>
						<Link href='/explore'>
							<BookOpen className='size-4' />
							{t('cmdBtnExplore')}
						</Link>
					</Button>
					<Button
						asChild
						variant='gaming'
						className='h-10 justify-start gap-2 px-3 text-sm sm:h-11'
					>
						<Link href='/explore?difficulty=Beginner'>
							<ChefHat className='size-4' />
							{t('cmdBtnQuickCook')}
						</Link>
					</Button>
					<Button
						asChild
						variant='outline'
						className='h-10 justify-start gap-2 px-3 text-sm sm:h-11'
					>
						<Link href='/create'>
							<PenSquare className='size-4' />
							{t('cmdBtnCreatePost')}
						</Link>
					</Button>
					<Button
						asChild
						variant='outline'
						className='h-10 justify-start gap-2 px-3 text-sm sm:h-11'
					>
						<Link href='/community'>
							<Users2 className='size-4' />
							{t('cmdBtnCommunity')}
						</Link>
					</Button>
				</div>

				<motion.div
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ ...TRANSITION_SPRING, delay: 0.1 }}
					className='mt-2.5 flex flex-col items-start justify-between gap-2 rounded-xl border border-streak/25 bg-streak/6 p-2 sm:mt-4 sm:flex-row sm:items-center sm:gap-3 sm:p-3'
				>
					<div>
						<p className='text-xs font-semibold text-text-primary sm:text-sm'>
							{t('cmdRhythmTitle')}
						</p>
						<p className='mt-0.5 hidden text-[11px] text-text-secondary sm:block sm:mt-1 sm:text-xs'>
							{t('cmdRhythmDesc')}
						</p>
					</div>
					<div className='inline-flex shrink-0 items-center gap-2 rounded-full bg-bg-elevated px-3 py-1.5 text-xs font-semibold text-text-secondary'>
						{hasStreakAtRisk ? (
							<AlertTriangle className='size-3.5 text-error' />
						) : (
							<Clock className='size-3.5 text-streak' />
						)}
						{hasStreakAtRisk ? t('cmdStreakRisk') : t('cmdStreakGoal')}
					</div>
				</motion.div>
			</CommandDeckBase>
		</motion.div>
	)
}
