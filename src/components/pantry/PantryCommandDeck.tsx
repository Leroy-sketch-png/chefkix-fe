import { motion } from 'framer-motion'
import { AlertTriangle, Package, Search, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PantryCommandDeckProps {
	itemCount: number
	expiredCount: number
	expiringCount: number
	searchQuery: string
	onSearchChange: (value: string) => void
	showingCategory: string
	hasSuggestionsOpen: boolean
	onOpenSuggestions: () => void
	onClearExpired: () => void
	canClearExpired: boolean
	className?: string
	children: React.ReactNode
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
	tone: 'brand' | 'warning' | 'muted'
}) {
	const toneClass = {
		brand: 'border-brand/20 bg-brand/8 text-brand',
		warning: 'border-warning/20 bg-warning/8 text-warning',
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

export function PantryCommandDeck({
	itemCount,
	expiredCount,
	expiringCount,
	searchQuery,
	onSearchChange,
	showingCategory,
	hasSuggestionsOpen,
	onOpenSuggestions,
	onClearExpired,
	canClearExpired,
	className,
	children,
}: PantryCommandDeckProps) {
	return (
		<motion.section
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				'rounded-2xl border border-border-subtle bg-gradient-to-br from-bg-card via-bg-card to-success/8 p-4 shadow-card md:p-5',
				className,
			)}
		>
			<div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
				<div>
					<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-success'>
						Pantry Command
					</p>
					<h2 className='mt-1 text-lg font-black text-text-primary'>
						Stock. Filter. Rescue Ingredients.
					</h2>
				</div>
				<div className='flex flex-wrap gap-2'>
					<button
						type='button'
						onClick={onOpenSuggestions}
						className='inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-brand/20 bg-brand/8 px-4 py-2 text-sm font-semibold text-brand transition-all hover:bg-brand/12'
					>
						<Sparkles className='size-4' />
						{hasSuggestionsOpen ? 'Suggestions open' : 'What can I cook?'}
					</button>
					{canClearExpired && (
						<button
							type='button'
							onClick={onClearExpired}
							className='inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-warning/20 bg-warning/8 px-4 py-2 text-sm font-semibold text-warning transition-all hover:bg-warning/12'
						>
							<AlertTriangle className='size-4' />
							Clear expired
						</button>
					)}
				</div>
			</div>

			<div className='mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4'>
				<StatCard
					label='Tracked'
					value={itemCount.toString()}
					icon={Package}
					tone='muted'
				/>
				<StatCard
					label='Expiring'
					value={expiringCount.toString()}
					icon={AlertTriangle}
					tone={expiringCount > 0 ? 'warning' : 'muted'}
				/>
				<StatCard
					label='Expired'
					value={expiredCount.toString()}
					icon={AlertTriangle}
					tone={expiredCount > 0 ? 'warning' : 'muted'}
				/>
				<StatCard
					label='Filter'
					value={showingCategory}
					icon={Search}
					tone='brand'
				/>
			</div>

			<div className='mb-4 relative'>
				<Search className='absolute left-4 top-1/2 size-4 -translate-y-1/2 text-text-muted' />
				<input
					value={searchQuery}
					onChange={e => onSearchChange(e.target.value)}
					placeholder='Search pantry ingredients'
					aria-label='Search pantry ingredients'
					className='h-11 w-full rounded-xl border border-border-subtle bg-bg px-11 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none focus-visible:ring-1 focus-visible:ring-brand'
				/>
			</div>

			{children}
		</motion.section>
	)
}
