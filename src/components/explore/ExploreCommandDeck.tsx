import { motion } from 'framer-motion'
import {
	Compass,
	Filter,
	Flame,
	Sparkles,
	ArrowUpDown,
	Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SlideTabs } from '@/components/ui/slide-tabs'
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

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
	const hasResultSignals =
		resultCount > 0 || activeFiltersCount > 0 || viewMode === 'trending'

	return (
		<motion.section
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				'rounded-2xl border border-border-subtle bg-gradient-to-br from-bg-card via-bg-card to-brand/5 p-3 shadow-card sm:p-4 md:p-5',
				className,
			)}
		>
			{/* Header: identity + mode signal */}
			<div className='mb-3 flex flex-wrap items-start justify-between gap-3 sm:mb-4'>
				<div className='min-w-0'>
					<p className='text-2xs font-bold uppercase tracking-widest text-brand'>
						{labels.eyebrow}
					</p>
					<h2 className='mt-1 text-base font-black leading-tight text-text-primary sm:text-[1.1rem]'>
						<AnimatedGradientText
							from='var(--color-brand)'
							via='var(--color-streak)'
							to='var(--color-xp)'
							duration={7}
						>
							{labels.heading}
						</AnimatedGradientText>
					</h2>
					<p className='mt-1 text-xs font-medium text-text-secondary'>
						Find one dish worth cooking tonight.
					</p>
				</div>

				<div className='inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/8 px-2.5 py-1 text-2xs font-semibold text-brand'>
					<Sparkles className='size-3.5' />
					{labels.modeChip}
				</div>
			</div>

			{/* Search slot: one clear command zone */}
			<div className='mb-3 rounded-2xl border border-border-subtle/80 bg-bg-card/70 p-2 sm:mb-4 sm:p-2.5'>
				<div className='pointer-events-none mb-2 inline-flex items-center gap-1.5 rounded-full bg-bg-elevated px-2 py-0.5 text-2xs font-bold uppercase tracking-widest text-text-muted'>
					<Search className='size-3' />
					Command Input
				</div>
				{children}
			</div>

			{/* Controls row */}
			<div className='flex flex-col gap-2.5 sm:gap-3'>
				<div className='flex items-center gap-2'>
					<div className='min-w-0 flex-1'>
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
							className='w-full'
						/>
					</div>

					<div className='w-40 shrink-0 sm:w-44'>
						<label htmlFor='explore-sort-select' className='sr-only'>
							{labels.sort}
						</label>
						<div className='relative'>
							<ArrowUpDown className='pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-text-muted' />
							<Select
								value={sortValue}
								onValueChange={onSortChange}
								disabled={sortDisabled}
							>
								<SelectTrigger
									id='explore-sort-select'
									aria-label={labels.sort}
									className={cn(
										'h-9 w-full rounded-xl border border-border-medium bg-bg-card pl-8 pr-3 text-sm font-semibold text-text-secondary outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10',
									)}
								>
									<SelectValue placeholder={labels.sort} />
								</SelectTrigger>
								<SelectContent>
									{sortOptions.map(option => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

				{hasResultSignals && (
					<div className='flex flex-wrap items-center gap-2 text-2xs font-semibold text-text-muted sm:text-xs'>
						{resultCount > 0 && (
							<span className='inline-flex items-center gap-1 rounded-full border border-border-subtle bg-bg-elevated px-2 py-1'>
								<Compass className='size-3.5' />
								{labels.results}: {resultCount.toString()}
							</span>
						)}
						{activeFiltersCount > 0 && (
							<span className='inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand/10 px-2 py-1 text-brand'>
								<Filter className='size-3.5' />
								{labels.activeFilters}: {activeFiltersCount.toString()}
							</span>
						)}
						{viewMode === 'trending' && (
							<span className='inline-flex items-center gap-1 rounded-full border border-xp/25 bg-xp/10 px-2 py-1 text-xp'>
								<Flame className='size-3.5' />
								{labels.modeTrending}
							</span>
						)}
						<span className='inline-flex items-center gap-1 rounded-full border border-border-subtle bg-bg-elevated px-2 py-1'>
							<ArrowUpDown className='size-3.5' />
							{labels.sort}: {activeSortLabel}
						</span>
					</div>
				)}
			</div>
		</motion.section>
	)
}
