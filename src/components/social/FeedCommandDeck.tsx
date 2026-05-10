import { motion } from 'framer-motion'
import { Flame, MessageSquare, Sparkles, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeedCommandDeckProps {
	feedMode: 'latest' | 'trending'
	onFeedModeChange: (mode: 'latest' | 'trending') => void
	postCount: number
	hasMore: boolean
	className?: string
}

function StatCard({
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
		<div className='rounded-xl border border-border-subtle bg-bg-card p-3 shadow-card'>
			<div className='flex items-center justify-between gap-2'>
				<div>
					<p className='text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted'>
						{label}
					</p>
					<p className='mt-1 text-lg font-black tabular-nums text-text-primary'>
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

export function FeedCommandDeck({
	feedMode,
	onFeedModeChange,
	postCount,
	hasMore,
	className,
}: FeedCommandDeckProps) {
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
			<div className='mb-4 flex items-center justify-between gap-3'>
				<div>
					<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-brand'>
						Feed Command
					</p>
					<h2 className='mt-1 text-lg font-black text-text-primary'>
						Control The Public Pulse
					</h2>
				</div>
				<div className='inline-flex items-center gap-1 rounded-full border border-brand/20 bg-brand/8 px-3 py-1.5 text-xs font-semibold text-brand'>
					<MessageSquare className='size-3.5' />
					Live stream
				</div>
			</div>

			<div className='mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4'>
				<StatCard
					label='Posts'
					value={postCount.toString()}
					icon={MessageSquare}
					tone='muted'
				/>
				<StatCard
					label='Mode'
					value={feedMode === 'latest' ? 'Latest' : 'Trending'}
					icon={feedMode === 'latest' ? Sparkles : Flame}
					tone={feedMode === 'latest' ? 'brand' : 'xp'}
				/>
				<StatCard
					label='Stream'
					value={hasMore ? 'Open' : 'End'}
					icon={Users}
					tone={hasMore ? 'social' : 'muted'}
				/>
				<StatCard label='Refresh' value='Live' icon={Sparkles} tone='brand' />
			</div>

			<div className='flex flex-wrap gap-2'>
				<button
					type='button'
					onClick={() => onFeedModeChange('latest')}
					className={cn(
						'inline-flex min-h-10 items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all',
						feedMode === 'latest'
							? 'border-brand/25 bg-brand/10 text-brand'
							: 'border-border-subtle bg-bg-elevated text-text-secondary hover:bg-bg-hover hover:text-text-primary',
					)}
				>
					<Sparkles className='size-4' />
					Latest
				</button>
				<button
					type='button'
					onClick={() => onFeedModeChange('trending')}
					className={cn(
						'inline-flex min-h-10 items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all',
						feedMode === 'trending'
							? 'border-xp/25 bg-xp/10 text-xp'
							: 'border-border-subtle bg-bg-elevated text-text-secondary hover:bg-bg-hover hover:text-text-primary',
					)}
				>
					<Flame className='size-4' />
					Trending
				</button>
			</div>
		</motion.section>
	)
}
