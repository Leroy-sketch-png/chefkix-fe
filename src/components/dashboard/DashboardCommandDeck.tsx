import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
	Users2,
	BookOpen,
	ChefHat,
	PenSquare,
	Clock,
	AlertTriangle,
	Flame,
	Sparkles,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING } from '@/lib/motion'
import type { Statistics } from '@/lib/types/profile'

interface DashboardCommandDeckProps {
	stats?: Statistics
	hasStreakAtRisk: boolean
	pendingSessionCount: number
	className?: string
}

type MetricTone = 'brand' | 'xp' | 'streak' | 'muted' | 'error'

interface MetricCardProps {
	label: string
	value: string
	icon: React.ComponentType<{ className?: string }>
	tone: MetricTone
}

const metricToneClasses: Record<MetricTone, string> = {
	brand: 'border-brand/20 bg-brand/8 text-brand',
	xp: 'border-xp/20 bg-xp/8 text-xp',
	streak: 'border-streak/20 bg-streak/8 text-streak',
	muted: 'border-border-subtle bg-bg-elevated text-text-muted',
	error: 'border-error/20 bg-error/8 text-error',
}

function MetricCard({ label, value, icon: Icon, tone }: MetricCardProps) {
	return (
		<div className='rounded-[1.25rem] border border-border-subtle bg-bg-card/90 p-3 shadow-card sm:rounded-[1.35rem] sm:p-4'>
			<div className='flex items-start justify-between gap-3'>
				<div className='min-w-0'>
					<p className='text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted'>
						{label}
					</p>
					<p className='mt-2 text-[1.75rem] font-black tracking-tight text-text-primary sm:mt-3 sm:text-[1.9rem]'>
						{value}
					</p>
				</div>
				<div
					className={cn(
						'inline-flex size-8 shrink-0 items-center justify-center rounded-xl border sm:size-9 sm:rounded-2xl',
						metricToneClasses[tone],
					)}
				>
					<Icon className='size-4 sm:size-4.5' />
				</div>
			</div>
		</div>
	)
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

	const statCards: MetricCardProps[] = [
		{
			label: t('cmdStatLevel'),
			value: `Lv.${level}`,
			icon: Sparkles,
			tone: 'brand',
		},
		{
			label: t('cmdStatXp'),
			value: `${xp.toLocaleString()} / ${xpGoal.toLocaleString()}`,
			icon: ChefHat,
			tone: 'xp',
		},
		{
			label: t('cmdStatStreak'),
			value: t('cmdStreakValue', { count: streak }),
			icon: Flame,
			tone: hasStreakAtRisk ? 'error' : 'streak',
		},
		{
			label: t('cmdStatPending'),
			value: pendingSessionCount.toString(),
			icon: Clock,
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
			<section className='rounded-[1.75rem] border border-border-subtle bg-gradient-to-br from-bg-card via-bg-card to-brand/6 p-3 shadow-card sm:rounded-[1.9rem] sm:p-5 lg:p-6'>
				<div className='grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)] lg:gap-5'>
					<div className='space-y-4'>
						<div className='space-y-2'>
							<p className='text-[11px] font-bold uppercase tracking-[0.22em] text-brand'>
								{t('cmdEyebrow')}
							</p>
							<h2 className='text-3xl font-black tracking-tight text-text-primary sm:text-4xl'>
								{t('cmdTitle')}
							</h2>
							<p className='max-w-2xl text-sm text-text-secondary sm:text-lg'>
								{hasStreakAtRisk
									? t('cmdStreakRiskSubtitle')
									: t('cmdSubtitle')}
							</p>
						</div>

						<div className='grid grid-cols-2 gap-2.5'>
							<Button
								asChild
								variant='brand'
								className='h-11 justify-start gap-2 rounded-2xl px-3 text-sm font-semibold sm:h-12 sm:gap-2.5 sm:px-4 sm:text-base'
							>
								<Link href='/explore'>
									<BookOpen className='size-4 sm:size-4.5' />
									{t('cmdBtnExplore')}
								</Link>
							</Button>
							<Button
								asChild
								variant='gaming'
								className='h-11 justify-start gap-2 rounded-2xl px-3 text-sm font-semibold sm:h-12 sm:gap-2.5 sm:px-4 sm:text-base'
							>
								<Link href='/explore?difficulty=Beginner'>
									<ChefHat className='size-4 sm:size-4.5' />
									{t('cmdBtnQuickCook')}
								</Link>
							</Button>
							<Button
								asChild
								variant='outline'
								className='h-11 justify-start gap-2 rounded-2xl px-3 text-sm font-medium sm:gap-2.5 sm:px-4 sm:text-base'
							>
								<Link href='/create'>
									<PenSquare className='size-4 sm:size-4.5' />
									{t('cmdBtnCreatePost')}
								</Link>
							</Button>
							<Button
								asChild
								variant='outline'
								className='h-11 justify-start gap-2 rounded-2xl px-3 text-sm font-medium sm:gap-2.5 sm:px-4 sm:text-base'
							>
								<Link href='/community'>
									<Users2 className='size-4 sm:size-4.5' />
									{t('cmdBtnCommunity')}
								</Link>
							</Button>
						</div>

						<motion.div
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ ...TRANSITION_SPRING, delay: 0.1 }}
							className='rounded-[1.35rem] border border-streak/25 bg-streak/6 p-3.5'
						>
							<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
								<div className='min-w-0'>
									<p className='text-sm font-semibold text-text-primary'>
										{t('cmdRhythmTitle')}
									</p>
									<p className='mt-1 hidden text-sm text-text-secondary sm:block'>
										{t('cmdRhythmDesc')}
									</p>
								</div>
								<div className='inline-flex shrink-0 items-center gap-2 rounded-full bg-bg-elevated px-3 py-1.5 text-sm font-semibold text-text-secondary'>
									{hasStreakAtRisk ? (
										<AlertTriangle className='size-4 text-error' />
									) : (
										<Clock className='size-4 text-streak' />
									)}
									{hasStreakAtRisk ? t('cmdStreakRisk') : t('cmdStreakGoal')}
								</div>
							</div>
						</motion.div>

						<div className='grid grid-cols-2 gap-2.5 lg:hidden'>
							{statCards.map(card => (
								<MetricCard key={card.label} {...card} />
							))}
						</div>
					</div>

					<div className='hidden lg:grid lg:grid-cols-2 lg:gap-3 lg:content-start'>
						{statCards.map(card => (
							<MetricCard key={card.label} {...card} />
						))}
					</div>
				</div>
			</section>
		</motion.div>
	)
}
