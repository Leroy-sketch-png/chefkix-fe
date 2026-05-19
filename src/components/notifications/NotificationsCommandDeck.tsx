import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Bell, CheckCheck, Filter, Flame, Sparkles, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type NotificationFilter = 'all' | 'gamified' | 'social' | 'unread'

interface NotificationsCommandDeckProps {
	counts: {
		all: number
		gamified: number
		social: number
		unread: number
	}
	activeFilter: NotificationFilter
	onFilterChange: (filter: NotificationFilter) => void
	onMarkAllRead: () => void
	isMarkingAllRead: boolean
	className?: string
}

export function NotificationsCommandDeck({
	counts,
	activeFilter,
	onFilterChange,
	onMarkAllRead,
	isMarkingAllRead,
	className,
}: NotificationsCommandDeckProps) {
	const t = useTranslations('notifications')
	const filters: {
		id: NotificationFilter
		label: string
		icon: typeof Bell
	}[] = [
		{ id: 'all', label: t('cmdFilterAll'), icon: Bell },
		{ id: 'gamified', label: t('filterActivity'), icon: Sparkles },
		{ id: 'social', label: t('filterSocial'), icon: Users },
		{ id: 'unread', label: t('filterUnread'), icon: Filter },
	]

	const hasUnread = counts.unread > 0

	return (
		<motion.section
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				'relative overflow-hidden rounded-2xl border border-border-subtle bg-gradient-to-br from-bg-card via-bg-card to-brand/8 p-3 shadow-card sm:p-4 md:p-5',
				className,
			)}
		>
			<div className='pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-brand/10 blur-2xl' />

			<div className='relative flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between'>
				<div className='min-w-0 flex-1'>
					<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-brand'>
						{t('cmdEyebrow')}
					</p>
					<h2 className='text-base font-black text-text-primary sm:mt-1 sm:text-lg'>
						{t('cmdTitle')}
					</h2>
					<div className='mt-2 inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-elevated px-2.5 py-1 text-xs font-semibold text-text-secondary'>
						{hasUnread ? (
							<Flame className='size-3.5 text-warning' />
						) : (
							<Bell className='size-3.5 text-brand' />
						)}
						{hasUnread
							? `${counts.unread} ${t('filterUnread').toLowerCase()}`
							: t('noUnread')}
					</div>
				</div>
				<Button
					variant={hasUnread ? 'brand' : 'outline'}
					size='sm'
					onClick={onMarkAllRead}
					disabled={isMarkingAllRead || !hasUnread}
					className={cn(
						'h-9 self-start rounded-full gap-2 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm',
						hasUnread && 'shadow-warm',
					)}
				>
					<CheckCheck className='size-3.5 sm:size-4' />
					{isMarkingAllRead ? t('markingAllRead') : t('markAllRead')}
				</Button>
			</div>

			<div className='relative mt-3 flex flex-wrap items-center gap-2 sm:mt-4'>
				<span className='inline-flex items-center gap-1 rounded-full border border-border-subtle bg-bg-card px-2 py-1 text-[11px] font-semibold text-text-muted'>
					<Bell className='size-3' />
					{counts.all}
				</span>
				<span className='inline-flex items-center gap-1 rounded-full border border-border-subtle bg-bg-card px-2 py-1 text-[11px] font-semibold text-text-muted'>
					<Sparkles className='size-3 text-xp' />
					{counts.gamified}
				</span>
				<span className='inline-flex items-center gap-1 rounded-full border border-border-subtle bg-bg-card px-2 py-1 text-[11px] font-semibold text-text-muted'>
					<Users className='size-3 text-brand' />
					{counts.social}
				</span>
			</div>

			<div className='relative mt-3 flex flex-wrap gap-2 sm:mt-4'>
				{filters.map(filter => {
					const Icon = filter.icon
					const isActive = activeFilter === filter.id
					const count = counts[filter.id]
					return (
						<button
							type='button'
							key={filter.id}
							onClick={() => onFilterChange(filter.id)}
							className={cn(
								'inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all sm:min-h-10 sm:px-3.5 sm:py-2 sm:text-sm',
								isActive
									? 'border-brand/25 bg-brand/12 text-brand shadow-sm'
									: 'border-border-subtle bg-bg-elevated text-text-secondary hover:bg-bg-hover hover:text-text-primary',
							)}
						>
							<Icon className='size-3.5' />
							<span>{filter.label}</span>
							{count > 0 && (
								<span className='rounded-full bg-bg-card px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-text-muted sm:text-[10px]'>
									{count}
								</span>
							)}
						</button>
					)
				})}
			</div>
		</motion.section>
	)
}
