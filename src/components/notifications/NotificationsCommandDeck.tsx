import { motion } from 'framer-motion'
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
		<div className='rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card'>
			<div className='flex items-start justify-between gap-2'>
				<div>
					<p className='text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted'>
						{title}
					</p>
					<p className='mt-2 text-2xl font-black text-text-primary tabular-nums'>
						{value}
					</p>
				</div>
				<div className={cn('rounded-lg border p-2', toneClasses[tone])}>
					<Icon className='size-4' />
				</div>
			</div>
			<p className='mt-2 text-xs text-text-secondary'>{note}</p>
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
	const filters: {
		id: NotificationFilter
		label: string
		icon: typeof Bell
	}[] = [
		{ id: 'all', label: 'All streams', icon: Bell },
		{ id: 'gamified', label: 'Activity', icon: Sparkles },
		{ id: 'social', label: 'Social', icon: Users },
		{ id: 'unread', label: 'Unread', icon: Filter },
	]

	return (
		<motion.section
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				'rounded-2xl border border-border-subtle bg-gradient-to-br from-bg-card via-bg-card to-brand/6 p-4 shadow-card md:p-5',
				className,
			)}
		>
			<div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
				<div>
					<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-brand'>
						Notification Command
					</p>
					<h2 className='mt-1 text-lg font-black text-text-primary'>
						Triage Your Attention
					</h2>
				</div>
				<Button
					variant='outline'
					size='sm'
					onClick={onMarkAllRead}
					disabled={isMarkingAllRead || counts.unread === 0}
					className='gap-2'
				>
					<CheckCheck className='size-4' />
					{isMarkingAllRead ? 'Marking...' : 'Mark All Read'}
				</Button>
			</div>

			<div className='mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4'>
				<DeckCard
					title='Total'
					value={counts.all.toString()}
					note='All incoming signals'
					icon={Bell}
					tone='muted'
				/>
				<DeckCard
					title='Unread'
					value={counts.unread.toString()}
					note='Needs action now'
					icon={Flame}
					tone={counts.unread > 0 ? 'brand' : 'muted'}
				/>
				<DeckCard
					title='Gamified'
					value={counts.gamified.toString()}
					note='XP and progression'
					icon={Sparkles}
					tone='xp'
				/>
				<DeckCard
					title='Social'
					value={counts.social.toString()}
					note='Community pulse'
					icon={Users}
					tone='social'
				/>
			</div>

			<div className='grid grid-cols-2 gap-2 sm:flex sm:flex-wrap'>
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
								'inline-flex min-h-10 items-center justify-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all sm:text-sm',
								isActive
									? 'border-brand/25 bg-brand/10 text-brand'
									: 'border-border-subtle bg-bg-elevated text-text-secondary hover:bg-bg-hover hover:text-text-primary',
							)}
						>
							<Icon className='size-3.5' />
							{filter.label}
							{count > 0 && (
								<span className='rounded-full bg-bg-card px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-text-muted'>
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
