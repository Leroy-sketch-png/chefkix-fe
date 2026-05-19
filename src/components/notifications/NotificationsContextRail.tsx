import Link from 'next/link'
import { motion } from 'framer-motion'
import { Bell, Compass, Flame, Sparkles, Users, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface NotificationsContextRailProps {
	counts: {
		all: number
		gamified: number
		social: number
		unread: number
	}
	className?: string
}

function RailStat({
	label,
	value,
	icon: Icon,
	tone,
}: {
	label: string
	value: string
	icon: React.ComponentType<{ className?: string }>
	tone: 'brand' | 'xp' | 'social' | 'muted'
}) {
	const toneClass = {
		brand: 'border-brand/20 bg-brand/8 text-brand',
		xp: 'border-xp/20 bg-xp/8 text-xp',
		social: 'border-error/20 bg-error/8 text-error',
		muted: 'border-border-subtle bg-bg-elevated text-text-muted',
	}[tone]

	return (
		<div className='rounded-lg border border-border-subtle bg-bg-card p-3'>
			<div className='flex items-center justify-between gap-2'>
				<div>
					<p className='text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted'>
						{label}
					</p>
					<p className='mt-1 text-lg font-black text-text-primary tabular-nums'>
						{value}
					</p>
				</div>
				<div className={cn('rounded-md border p-1.5', toneClass)}>
					<Icon className='size-3.5' />
				</div>
			</div>
		</div>
	)
}

export function NotificationsContextRail({
	counts,
	className,
}: NotificationsContextRailProps) {
	const t = useTranslations('notifications')
	const safeTotal = Math.max(counts.all, 1)
	const unreadPercent = Math.round((counts.unread / safeTotal) * 100)
	const socialPercent = Math.round((counts.social / safeTotal) * 100)
	const activityPercent = Math.round((counts.gamified / safeTotal) * 100)
	const calmMode = counts.unread === 0
	return (
		<motion.aside
			initial={{ opacity: 0, x: 10 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				'hidden xl:flex xl:flex-col xl:gap-6 xl:sticky xl:top-24 xl:self-start',
				className,
			)}
		>
			<div className='rounded-2xl border border-border-subtle/80 bg-gradient-to-br from-bg-card via-bg-card to-brand/8 p-4 shadow-card'>
				<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-brand'>
					{t('railEyebrow')}
				</p>
				<h3 className='mt-1 text-lg font-black text-text-primary'>
					{t('railHeading')}
				</h3>

				<div className='mt-3 rounded-lg border border-border-subtle bg-bg-card p-3'>
					<div className='flex items-center justify-between gap-2'>
						<p className='text-xs font-semibold text-text-secondary'>
							{t('cmdCardUnread')}
						</p>
						<span
							className={cn(
								'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums',
								calmMode
									? 'bg-success/12 text-success'
									: 'bg-warning/12 text-warning',
							)}
						>
							<Flame className='size-3' />
							{unreadPercent}%
						</span>
					</div>
					<div className='mt-2 h-2 w-full overflow-hidden rounded-full bg-bg-elevated'>
						<div
							className={cn(
								'h-full rounded-full transition-all duration-500',
								calmMode ? 'bg-success/70' : 'bg-warning/70',
							)}
							style={{ width: `${unreadPercent}%` }}
						/>
					</div>
				</div>

				<div className='mt-3 grid gap-2'>
					<RailStat
						label={t('cmdCardUnread')}
						value={counts.unread.toString()}
						icon={Flame}
						tone={counts.unread > 0 ? 'brand' : 'muted'}
					/>
					<RailStat
						label={t('cmdCardGamified')}
						value={counts.gamified.toString()}
						icon={Sparkles}
						tone='xp'
					/>
					<RailStat
						label={t('cmdCardSocial')}
						value={counts.social.toString()}
						icon={Users}
						tone='social'
					/>
					<RailStat
						label={t('cmdCardTotal')}
						value={counts.all.toString()}
						icon={Bell}
						tone='muted'
					/>
				</div>

				<div className='mt-3 rounded-lg border border-border-subtle bg-bg-card p-3'>
					<p className='text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted'>
						{t('cmdFilterAll')}
					</p>
					<div className='mt-2 space-y-2'>
						<div>
							<div className='mb-1 flex items-center justify-between text-xs'>
								<span className='font-medium text-text-secondary'>
									{t('cmdCardGamified')}
								</span>
								<span className='font-semibold tabular-nums text-text-muted'>
									{activityPercent}%
								</span>
							</div>
							<div className='h-1.5 overflow-hidden rounded-full bg-bg-elevated'>
								<div
									className='h-full rounded-full bg-xp/70 transition-all duration-500'
									style={{ width: `${activityPercent}%` }}
								/>
							</div>
						</div>
						<div>
							<div className='mb-1 flex items-center justify-between text-xs'>
								<span className='font-medium text-text-secondary'>
									{t('cmdCardSocial')}
								</span>
								<span className='font-semibold tabular-nums text-text-muted'>
									{socialPercent}%
								</span>
							</div>
							<div className='h-1.5 overflow-hidden rounded-full bg-bg-elevated'>
								<div
									className='h-full rounded-full bg-brand/70 transition-all duration-500'
									style={{ width: `${socialPercent}%` }}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className='rounded-2xl border border-border-subtle/80 bg-bg-card p-4 shadow-card'>
				<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted'>
					{t('railQuickMoves')}
				</p>
				<div className='mt-3 grid gap-2'>
					<Link
						href='/explore'
						className='group inline-flex items-center justify-between gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2.5 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<span className='inline-flex items-center gap-2'>
							<Compass className='size-3.5' />
							{t('railExploreRecipes')}
						</span>
						<ArrowRight className='size-3.5 text-text-muted transition-transform group-hover:translate-x-0.5' />
					</Link>
					<Link
						href='/challenges'
						className='group inline-flex items-center justify-between gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2.5 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<span className='inline-flex items-center gap-2'>
							<Sparkles className='size-3.5' />
							{t('railOpenChallenges')}
						</span>
						<ArrowRight className='size-3.5 text-text-muted transition-transform group-hover:translate-x-0.5' />
					</Link>
					<Link
						href='/community'
						className='group inline-flex items-center justify-between gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2.5 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<span className='inline-flex items-center gap-2'>
							<Users className='size-3.5' />
							{t('railVisitCommunity')}
						</span>
						<ArrowRight className='size-3.5 text-text-muted transition-transform group-hover:translate-x-0.5' />
					</Link>
				</div>
			</div>
		</motion.aside>
	)
}
