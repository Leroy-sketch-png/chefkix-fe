import { motion } from 'framer-motion'
import {
	Compass,
	Filter,
	Flame,
	Search,
	Sparkles,
	TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SlideTabs } from '@/components/ui/slide-tabs'

interface ExploreCommandDeckProps {
	activeFiltersCount: number
	resultCount: number
	viewMode: 'all' | 'trending'
	onViewModeChange: (mode: 'all' | 'trending') => void
	sortValue: string
	onSortChange: (value: string) => void
	sortOptions: Array<{ value: string; label: string }>
	sortDisabled?: boolean
	labels: {
		eyebrow: string
		heading: string
		modeChip: string
		results: string
		filters: string
		activeFilters: string
		mode: string
		sort: string
		sortNewest: string
		allRecipes: string
		trending: string
		modeAll: string
		modeTrending: string
	}
	className?: string
	children: React.ReactNode
}

function StatChip({
	label,
	value,
	icon: Icon,
	tone,
}: {
	label: string
	value: string
	icon: React.ComponentType<{ className?: string }>
	tone: 'brand' | 'xp' | 'muted'
}) {
	const toneClass = {
		brand: 'border-brand/20 bg-brand/8 text-brand',
		xp: 'border-xp/20 bg-xp/8 text-xp',
		muted: 'border-border-subtle bg-bg-elevated text-text-muted',
	}[tone]

	return (
		<div className='rounded-lg border border-border-subtle bg-bg-card p-3'>
			<div className='flex items-center justify-between gap-2'>
				<div>
					<p className='text-2xs font-bold uppercase tracking-[0.14em] text-text-muted'>
						{label}
					</p>
					<p className='mt-1 text-sm font-black tabular-nums text-text-primary'>
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

export function ExploreCommandDeck({
	activeFiltersCount,
	resultCount,
	viewMode,
	onViewModeChange,
	sortValue,
	onSortChange,
	sortOptions,
	sortDisabled = false,
	labels,
	className,
	children,
}: ExploreCommandDeckProps) {
	const activeSortLabel =
		sortOptions.find(option => option.value === sortValue)?.label ??
		labels.sortNewest
	const shouldShowSortControl = resultCount > 0 || activeFiltersCount > 0

	return (
		<motion.section
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				'rounded-2xl border border-border-subtle bg-gradient-to-br from-bg-card via-bg-card to-brand/6 p-3 shadow-card sm:p-4 md:p-5',
				className,
			)}
		>
			<div className='mb-3 flex flex-wrap items-start justify-between gap-2 sm:mb-4 sm:items-center sm:gap-3'>
				<div>
					<p className='text-xs font-bold uppercase tracking-[0.16em] text-brand'>
						{labels.eyebrow}
					</p>
					<h2 className='mt-1 text-base font-black text-text-primary sm:text-lg'>
						{labels.heading}
					</h2>
				</div>
				<div className='hidden items-center gap-2 rounded-full border border-brand/20 bg-brand/8 px-3 py-1.5 text-xs font-semibold text-brand sm:inline-flex'>
					<Sparkles className='size-3.5' />
					{labels.modeChip}
				</div>
			</div>

			<div className='mb-3 sm:mb-4'>{children}</div>

			<div className='mb-4 hidden grid-cols-2 gap-2 sm:grid'>
				<StatChip
					label={labels.results}
					value={resultCount.toString()}
					icon={Compass}
					tone='muted'
				/>
				<StatChip
					label={labels.activeFilters}
					value={activeFiltersCount.toString()}
					icon={Filter}
					tone={activeFiltersCount > 0 ? 'brand' : 'muted'}
				/>
			</div>

			<div className='flex flex-col gap-2 sm:gap-3'>
				<div className='flex items-center gap-2 sm:flex-wrap sm:items-center'>
					<div className='min-w-0 flex-1 sm:flex-none'>
						<SlideTabs
							tabs={[
								{
									id: 'all',
									label: labels.allRecipes,
									icon: (
										<Compass
											className={cn(
												'size-3.5',
												viewMode === 'all' ? 'text-brand' : 'text-text-muted',
											)}
										/>
									),
								},
								{
									id: 'trending',
									label: labels.trending,
									icon: (
										<Flame
											className={cn(
												'size-3.5',
												viewMode === 'trending' ? 'text-xp' : 'text-text-muted',
											)}
										/>
									),
								},
							]}
							activeTab={viewMode}
							onTabChange={value =>
								onViewModeChange(value as 'all' | 'trending')
							}
							variant='pill'
							size='sm'
							fullWidth
							className='w-full sm:w-auto'
						/>
					</div>

					{shouldShowSortControl && (
						<div className='w-36 shrink-0 sm:flex sm:w-auto sm:items-center sm:gap-2'>
							<label
								htmlFor='explore-sort-select'
								className='sr-only text-xs font-semibold uppercase tracking-[0.12em] text-text-muted sm:not-sr-only'
							>
								{labels.sort}
							</label>
							<select
								id='explore-sort-select'
								aria-label={labels.sort}
								value={sortValue}
								onChange={event => onSortChange(event.target.value)}
								disabled={sortDisabled}
								className={cn(
									'h-10 w-full rounded-xl border border-border-medium bg-bg-card px-3 text-sm font-semibold text-text-secondary outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-44 sm:w-auto',
								)}
							>
								{sortOptions.map(option => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
						</div>
					)}
				</div>
			</div>
		</motion.section>
	)
}
