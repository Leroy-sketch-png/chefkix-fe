import type { ComponentType } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
	Users2,
	ChefHat,
	PenSquare,
	Clock,
	AlertTriangle,
	Flame,
	Sparkles,
	ArrowRight,
	TrendingUp,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text'
import { NumberTicker } from '@/components/ui/number-ticker'
import { AnimatedCircularProgressBar } from '@/components/ui/animated-circular-progress-bar'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING } from '@/lib/motion'
import type { Statistics } from '@/lib/types/profile'
import { PremiumSurface } from '@/components/layout/PremiumSurface'

interface DashboardCommandDeckProps {
	stats?: Statistics
	hasStreakAtRisk: boolean
	pendingSessionCount: number
	className?: string
}

const CHEF_TITLE_LABELS: Record<Statistics['title'], string> = {
	BEGINNER: 'Beginner',
	AMATEUR: 'Amateur Chef',
	SEMIPRO: 'Semi-Pro Chef',
	PRO: 'Pro Chef',
}

type SignalTone = 'brand' | 'xp' | 'streak' | 'muted' | 'error'
type ActionTone = 'brand' | 'warm' | 'muted'

interface SignalChipProps {
	label: string
	value: string
	icon: ComponentType<{ className?: string }>
	tone: SignalTone
}

interface ActionCardProps {
	href: string
	title: string
	description: string
	icon: ComponentType<{ className?: string }>
	tone: ActionTone
	className?: string
	badge?: string
}

const signalSurface: Record<SignalTone, string> = {
	brand: 'border-brand/20 bg-gradient-to-br from-brand/8 to-bg-card',
	xp: 'border-xp/20 bg-gradient-to-br from-xp/8 to-bg-card',
	streak: 'border-streak/20 bg-gradient-to-br from-streak/8 to-bg-card',
	muted: 'border-border-subtle bg-bg-card',
	error: 'border-error/20 bg-gradient-to-br from-error/8 to-bg-card',
}

const signalIcon: Record<SignalTone, string> = {
	brand: 'border-brand/20 bg-brand/10 text-brand',
	xp: 'border-xp/20 bg-xp/10 text-xp',
	streak: 'border-streak/20 bg-streak/10 text-streak',
	muted: 'border-border-subtle bg-bg-elevated text-text-muted',
	error: 'border-error/20 bg-error/10 text-error',
}

const actionSurface: Record<ActionTone, string> = {
	brand:
		'border-brand/20 bg-gradient-to-br from-brand/15 via-brand/5 to-bg-card',
	warm: 'border-streak/20 bg-gradient-to-br from-streak/15 via-streak/5 to-bg-card',
	muted: 'border-border-subtle bg-bg-card/90',
}

const actionIcon: Record<ActionTone, string> = {
	brand: 'border-brand/20 bg-brand/10 text-brand',
	warm: 'border-streak/20 bg-streak/10 text-streak',
	muted: 'border-border-subtle bg-bg-elevated text-text-secondary',
}

function SignalChip({ label, value, icon: Icon, tone }: SignalChipProps) {
	return (
		<div
			className={cn(
				'flex items-center gap-3 rounded-2xl border p-3 shadow-card transition-shadow duration-200 hover:shadow-warm sm:p-4',
				signalSurface[tone],
			)}
		>
			<div
				className={cn(
					'inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border',
					signalIcon[tone],
				)}
			>
				<Icon className='size-4' />
			</div>
			<div className='min-w-0'>
				<p className='text-2xs font-bold uppercase tracking-widest text-text-muted'>
					{label}
				</p>
				<p className='mt-1 text-sm font-semibold text-text-primary sm:text-base'>
					{value}
				</p>
			</div>
		</div>
	)
}

function ActionCard({
	href,
	title,
	description,
	icon: Icon,
	tone,
	className,
	badge,
}: ActionCardProps) {
	return (
		<motion.div
			whileHover={{ scale: 1.015, y: -1 }}
			whileTap={{ scale: 0.985 }}
			transition={TRANSITION_SPRING}
			className={className}
		>
			<Link
				href={href}
				className={cn(
					'group flex h-full flex-col rounded-3xl border p-4 shadow-card transition-all duration-300 hover:shadow-warm sm:p-5',
					actionSurface[tone],
				)}
			>
				<div className='flex items-start justify-between gap-3'>
					<div
						className={cn(
							'inline-flex size-11 items-center justify-center rounded-2xl border',
							actionIcon[tone],
						)}
					>
						<Icon className='size-5' />
					</div>
					<ArrowRight className='mt-1 size-4 shrink-0 text-text-muted transition-transform duration-300 group-hover:translate-x-1 group-hover:text-text-primary' />
				</div>

				<div className='mt-4 space-y-1.5'>
					<h3 className='text-sm font-semibold text-text-primary sm:text-base'>
						{title}
					</h3>
					<p className='text-xs leading-5 text-text-secondary sm:text-sm'>
						{description}
					</p>
				</div>

				{badge && (
					<div className='mt-4'>
						<span className='inline-flex items-center rounded-full border border-brand/20 bg-bg-elevated/80 px-2.5 py-1 text-2xs font-semibold text-text-secondary'>
							{badge}
						</span>
					</div>
				)}
			</Link>
		</motion.div>
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
	const chefTitle = stats?.title ? CHEF_TITLE_LABELS[stats.title] : 'Chef'
	const xpPct = Math.round((xp / xpGoal) * 100)
	const xpRemaining = Math.max(xpGoal - xp, 0)

	const leadCopy = hasStreakAtRisk
		? t('cmdStreakRiskSubtitle')
		: pendingSessionCount > 0
			? t('cmdLeadPending', { count: pendingSessionCount })
			: t('cmdLeadDefault')

	const signalChips: SignalChipProps[] = [
		{
			label: t('cmdStatLevel'),
			value: `Lv. ${level} · ${chefTitle}`,
			icon: Sparkles,
			tone: 'brand',
		},
		{
			label: t('cmdStatStreak'),
			value: t('cmdStreakValue', { count: streak }),
			icon: Flame,
			tone: hasStreakAtRisk ? 'error' : 'streak',
		},
		...(pendingSessionCount > 0
			? [
					{
						label: t('cmdStatPending'),
						value: t('cmdPendingValue', { count: pendingSessionCount }),
						icon: Clock,
						tone: 'brand' as SignalTone,
					},
				]
			: [
					{
						label: t('cmdStatXp'),
						value: `${xp.toLocaleString()} XP`,
						icon: TrendingUp,
						tone: 'xp' as SignalTone,
					},
				]),
	]

	return (
		<motion.section
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={TRANSITION_SPRING}
			className={className}
		>
			<PremiumSurface
				tone='brand'
				className='overflow-hidden rounded-3xl border-border-subtle/80 p-4 shadow-card sm:p-5 lg:p-6'
			>
				<div className='grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-start lg:gap-6'>
					<div className='space-y-4 sm:space-y-5'>
						<div className='flex flex-wrap items-center gap-2'>
							<span className='inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-brand/8 px-2.5 py-1 text-2xs font-bold uppercase tracking-widest text-brand'>
								<Sparkles className='size-3' />
								{chefTitle} · Lv.{level}
							</span>
							{hasStreakAtRisk && (
								<span className='inline-flex items-center gap-1 rounded-full border border-error/25 bg-error/8 px-2.5 py-1 text-2xs font-bold uppercase tracking-widest text-error'>
									<AlertTriangle className='size-3' />
									{t('cmdStreakRisk')}
								</span>
							)}
						</div>

						<div className='space-y-3'>
							<h2 className='text-[1.75rem] font-black leading-[1.02] tracking-tight text-text-primary sm:text-[2.1rem]'>
								<AnimatedGradientText
									from='var(--color-brand)'
									via='var(--color-streak)'
									to='var(--color-xp)'
									duration={7}
								>
									{t('cmdTitle')}
								</AnimatedGradientText>
							</h2>
							<p className='max-w-2xl text-sm font-medium leading-6 text-text-secondary'>
								{leadCopy}
							</p>
						</div>

						<div className='rounded-3xl border border-border-subtle bg-bg-card/85 p-4 shadow-card sm:p-5'>
							<div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
								<div className='space-y-1.5'>
									<p className='text-2xs font-bold uppercase tracking-widest text-text-muted'>
										{t('cmdRhythmTitle')}
									</p>
									<p className='text-base font-semibold leading-tight text-text-primary sm:text-lg'>
										{t('cmdProgressToNext', {
											xp: xpRemaining,
											level: level + 1,
										})}
									</p>
									<p className='text-sm leading-6 text-text-secondary'>
										{t('cmdRhythmDesc')}
									</p>
								</div>
								<div className='flex items-center gap-4 self-start sm:self-end'>
									<AnimatedCircularProgressBar
										value={xp}
										max={xpGoal}
										gaugePrimaryColor='var(--color-xp)'
										gaugeSecondaryColor='color-mix(in oklch, var(--color-xp) 20%, transparent)'
										className='size-16 text-sm'
									/>
									<div className='shrink-0'>
										<p className='text-right text-2xs font-bold uppercase tracking-widest text-text-muted'>
											{t('cmdProgressRemaining')}
										</p>
										<p className='text-right text-3xl font-black tracking-tight text-text-primary sm:text-[2.2rem]'>
											<NumberTicker value={xpRemaining} locale='en-US' />
										</p>
									</div>
								</div>
							</div>

							<div className='mt-4 h-2 overflow-hidden rounded-full bg-bg-elevated'>
								<motion.div
									initial={{ width: 0 }}
									animate={{ width: `${Math.min(Math.max(xpPct, 0), 100)}%` }}
									transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }}
									className='h-full rounded-full bg-xp'
								/>
							</div>
						</div>

						<div className='grid gap-3 sm:grid-cols-3'>
							{signalChips.map(signal => (
								<SignalChip key={signal.label} {...signal} />
							))}
						</div>
					</div>

					<div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-1'>
						<ActionCard
							href='/explore?difficulty=Beginner'
							title={t('cmdBtnQuickCook')}
							description={t('cmdPrimaryCardDesc')}
							icon={ChefHat}
							tone='brand'
							className='sm:col-span-2 lg:col-span-1'
							badge={hasStreakAtRisk ? t('cmdStreakRisk') : undefined}
						/>
						<ActionCard
							href='/create'
							title={t('cmdBtnCreatePost')}
							description={
								pendingSessionCount > 0
									? t('cmdCreatePendingCardDesc', {
											count: pendingSessionCount,
										})
									: t('cmdCreateCardDesc')
							}
							icon={PenSquare}
							tone='warm'
						/>
						<ActionCard
							href='/community'
							title={t('cmdBtnCommunity')}
							description={t('cmdCommunityCardDesc')}
							icon={Users2}
							tone='muted'
						/>
					</div>
				</div>
			</PremiumSurface>
		</motion.section>
	)
}
