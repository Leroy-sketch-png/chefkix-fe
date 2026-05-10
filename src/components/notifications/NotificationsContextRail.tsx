import Link from 'next/link'
import { motion } from 'framer-motion'
import { Bell, Compass, Flame, Sparkles, Users } from 'lucide-react'
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
	return (
		<motion.aside
			initial={{ opacity: 0, x: 10 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				'hidden xl:flex xl:flex-col xl:gap-4 xl:sticky xl:top-24 xl:self-start',
				className,
			)}
		>
			<div className='rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card'>
				<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-brand'>
					{t('railEyebrow')}
				</p>
				<h3 className='mt-1 text-lg font-black text-text-primary'>
					{t('railHeading')}
				</h3>
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
			</div>

			<div className='rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card'>
				<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted'>
					{t('railQuickMoves')}
				</p>
				<div className='mt-3 grid gap-2'>
					<Link
						href='/explore'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<Compass className='size-3.5' />
						{t('railExploreRecipes')}
					</Link>
					<Link
						href='/challenges'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<Sparkles className='size-3.5' />
						{t('railOpenChallenges')}
					</Link>
					<Link
						href='/community'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<Users className='size-3.5' />
						{t('railVisitCommunity')}
					</Link>
				</div>
			</div>
		</motion.aside>
	)
}
