import Link from 'next/link'
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
	const level = stats?.currentLevel ?? 1
	const xp = stats?.currentXP ?? 0
	const xpGoal = Math.max(stats?.currentXPGoal ?? 100, 100)
	const streak = stats?.streakCount ?? 0

	const statCards: StatCardProps[] = [
		{ label: 'Level', value: `Lv.${level}`, tone: 'brand' },
		{
			label: 'Current XP',
			value: `${xp.toLocaleString()} / ${xpGoal.toLocaleString()}`,
			tone: 'xp',
		},
		{
			label: 'Cooking streak',
			value: `${streak} day${streak === 1 ? '' : 's'}`,
			tone: hasStreakAtRisk ? 'error' : 'streak',
		},
		{
			label: 'Pending sessions',
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
				eyebrow='Command Center'
				title='Cook. Post. Grow. Repeat.'
				subtitle={
					hasStreakAtRisk
						? 'Your streak is at risk today. Ship one cook story now.'
						: 'Keep your growth flywheel running with one cook and one post.'
				}
				gradient='brand'
				stats={statCards}
			>
				<div className='mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2'>
					<Button asChild variant='brand' className='h-10 justify-start gap-2'>
						<Link href='/explore'>
							<BookOpen className='size-4' />
							Explore recipes
						</Link>
					</Button>
					<Button asChild variant='gaming' className='h-10 justify-start gap-2'>
						<Link href='/explore?difficulty=Beginner'>
							<ChefHat className='size-4' />
							Quick cook now
						</Link>
					</Button>
					<Button
						asChild
						variant='outline'
						className='h-10 justify-start gap-2'
					>
						<Link href='/create'>
							<PenSquare className='size-4' />
							Create post
						</Link>
					</Button>
					<Button
						asChild
						variant='outline'
						className='h-10 justify-start gap-2'
					>
						<Link href='/community'>
							<Users2 className='size-4' />
							Join community
						</Link>
					</Button>
				</div>

				<motion.div
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ ...TRANSITION_SPRING, delay: 0.1 }}
					className='mt-4 flex flex-col items-start justify-between gap-3 rounded-xl border border-streak/25 bg-streak/6 p-3 sm:flex-row sm:items-center'
				>
					<div>
						<p className='text-sm font-semibold text-text-primary'>
							Daily rhythm check
						</p>
						<p className='mt-1 text-xs text-text-secondary'>
							One complete cook + one post keeps your growth loop honest.
						</p>
					</div>
					<div className='inline-flex shrink-0 items-center gap-2 rounded-full bg-bg-elevated px-3 py-1.5 text-xs font-semibold text-text-secondary'>
						{hasStreakAtRisk ? (
							<AlertTriangle className='size-3.5 text-error' />
						) : (
							<Clock className='size-3.5 text-streak' />
						)}
						{hasStreakAtRisk
							? 'Streak at risk today'
							: 'Ship one cook story today'}
					</div>
				</motion.div>
			</CommandDeckBase>
		</motion.div>
	)
}
