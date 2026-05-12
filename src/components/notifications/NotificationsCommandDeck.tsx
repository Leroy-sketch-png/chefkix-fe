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

interface DeckCardProps {
	title: string
	value: string
	note: string
	icon: React.ComponentType<{ className?: string }>
	tone?: 'brand' | 'xp' | 'social' | 'muted'
}

const toneClasses = {
	brand: 'border-brand/20 bg-brand/8 text-brand',
	xp: 'border-xp/20 bg-xp/8 text-xp',
	social: 'border-error/20 bg-error/8 text-error',
	muted: 'border-border-subtle bg-bg-elevated text-text-muted',
}

function DeckCard({
	title,
	value,
	note,
	icon: Icon,
	tone = 'muted',
}: DeckCardProps) {
	return (
		<div className='rounded-xl border border-border-subtle bg-bg-card p-2 shadow-card sm:p-4'>
			<div className='flex items-start justify-between gap-2'>
				<div>
					<p className='text-[8px] font-bold uppercase tracking-[0.16em] text-text-muted sm:text-[10px]'>
						{title}
					</p>
					<p className='mt-1 text-base font-black text-text-primary tabular-nums sm:mt-2 sm:text-2xl'>
						{value}
					</p>
				</div>
				<div
					className={cn('rounded-lg border p-1.5 sm:p-2', toneClasses[tone])}
				>
					<Icon className='size-3.5 sm:size-4' />
				</div>
			</div>
			<p className='mt-1.5 text-xs text-text-secondary sm:mt-2 hidden sm:block'>
				{note}
			</p>
		</div>
	)
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

	return (
		<motion.section
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				'rounded-2xl border border-border-subtle bg-gradient-to-br from-bg-card via-bg-card to-brand/6 p-2.5 shadow-card sm:p-4 md:p-5',
				className,
			)}
		>
			<div className='mb-2 flex flex-wrap items-center justify-between gap-3'>
				<div>
					<p className='hidden text-[11px] font-bold uppercase tracking-[0.16em] text-brand sm:block'>
						{t('cmdEyebrow')}
					</p>
					<h2 className='mt-0 text-sm font-black text-text-primary sm:mt-1 sm:text-lg'>
						{t('cmdTitle')}
					</h2>
				</div>
				<Button
					variant='outline'
					size='sm'
					onClick={onMarkAllRead}
					disabled={isMarkingAllRead || counts.unread === 0}
					className='h-8 gap-2 px-2.5 text-[11px] sm:h-10 sm:px-4 sm:text-sm'
				>
					<CheckCheck className='size-3.5 sm:size-4' />
					{isMarkingAllRead ? t('markingAllRead') : t('markAllRead')}
				</Button>
			</div>

			<div className='mt-2 sm:mt-0'>
				<div className='flex flex-wrap gap-2'>
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
									'inline-flex min-h-9 items-center justify-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all sm:min-h-10 sm:px-3.5 sm:py-2 sm:text-sm',
									isActive
										? 'border-brand/25 bg-brand/10 text-brand shadow-sm'
										: 'border-border-subtle bg-bg-elevated text-text-secondary hover:bg-bg-hover hover:text-text-primary',
								)}
							>
								<Icon className='size-3.5' />
								{filter.label}
								{count > 0 && (
									<span className='rounded-full bg-bg-card px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-text-muted sm:text-[10px]'>
										{count}
									</span>
								)}
							</button>
						)
					})}
				</div>
			</div>
		</motion.section>
	)
}
