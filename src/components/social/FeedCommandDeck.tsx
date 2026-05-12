import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
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
		<div className='rounded-xl border border-border-subtle bg-bg-card p-2 shadow-card sm:p-3'>
			<div className='flex items-center justify-between gap-2'>
				<div>
					<p className='text-[8px] font-bold uppercase tracking-[0.14em] text-text-muted sm:text-[10px]'>
						{label}
					</p>
					<p className='mt-1 text-sm font-black tabular-nums text-text-primary sm:text-lg'>
						{value}
					</p>
				</div>
				<div className={cn('rounded-md border p-1 sm:p-1.5', toneClass)}>
					<Icon className='size-3 sm:size-3.5' />
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
	const t = useTranslations('feed')
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
			<div className='mb-2 flex items-center justify-between gap-3'>
				<div>
					<p className='text-[10px] font-bold uppercase tracking-[0.14em] text-brand sm:hidden'>
						{t('title')}
					</p>
					<p className='hidden text-[10px] font-bold uppercase tracking-[0.16em] text-brand sm:block sm:text-[11px]'>
						{t('commandEyebrow')}
					</p>
					<h2 className='mt-1 hidden text-sm font-black text-text-primary sm:block sm:text-lg'>
						{t('commandHeading')}
					</h2>
				</div>
				<div className='hidden items-center gap-1 rounded-full border border-brand/20 bg-brand/8 px-3 py-1.5 text-xs font-semibold text-brand sm:inline-flex'>
					<MessageSquare className='size-3.5' />
					{t('commandChip')}
				</div>
			</div>

			<div className='mt-2 grid grid-cols-2 gap-2 rounded-full bg-bg-elevated p-1 sm:mt-0 sm:inline-flex sm:rounded-none sm:bg-transparent sm:p-0'>
				<button
					type='button'
					onClick={() => onFeedModeChange('latest')}
					className={cn(
						'inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all sm:min-h-10 sm:w-auto sm:px-4 sm:py-2 sm:text-sm',
						feedMode === 'latest'
							? 'border-brand/25 bg-brand/10 text-brand shadow-sm'
							: 'border-border-subtle bg-bg-elevated text-text-secondary hover:bg-bg-hover hover:text-text-primary',
					)}
				>
					<Sparkles className='size-3.5 sm:size-4' />
					{t('filterLatest')}
				</button>
				<button
					type='button'
					onClick={() => onFeedModeChange('trending')}
					className={cn(
						'inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all sm:min-h-10 sm:w-auto sm:px-4 sm:py-2 sm:text-sm',
						feedMode === 'trending'
							? 'border-xp/25 bg-xp/10 text-xp shadow-sm'
							: 'border-border-subtle bg-bg-elevated text-text-secondary hover:bg-bg-hover hover:text-text-primary',
					)}
				>
					<Flame className='size-3.5 sm:size-4' />
					{t('filterTrending')}
				</button>
			</div>
		</motion.section>
	)
}
