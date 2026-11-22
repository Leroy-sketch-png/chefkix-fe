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
		subtitle: string
		commandInput: string
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
	const hasResultSignals = resultCount > 0 || activeFiltersCount > 0

	return (
		<motion.section
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				'explore-command-deck sm:rounded-2xl sm:border sm:border-border-subtle sm:bg-gradient-to-br sm:from-bg-card sm:via-bg-card sm:to-brand/5 sm:p-4 sm:shadow-card md:p-5',
				className,
			)}
		>
			{/* Header: identity + mode signal */}
			<div className='explore-command-intro sm:mb-4'>
				<div className='min-w-0'>
					<p className='hidden text-2xs font-bold uppercase tracking-widest text-brand sm:block'>
						{labels.eyebrow}
					</p>
					<h2 className='sr-only font-bold leading-tight text-text-primary sm:not-sr-only sm:mt-1 sm:block sm:text-[1.1rem]'>
						{labels.heading}
					</h2>
					<p className='hidden font-medium text-text-secondary sm:mt-1 sm:block sm:text-xs'>
						{labels.subtitle}
					</p>
				</div>

				<div className='hidden items-center gap-1.5 rounded-full border border-brand/20 bg-brand/8 px-2.5 py-1 text-2xs font-semibold text-brand sm:inline-flex'>
					<Sparkles className='size-3.5' />
					{labels.modeChip}
				</div>
			</div>

			{/* Search slot: one clear command zone */}
			<div className='explore-command-search sm:mb-4 sm:rounded-2xl sm:border sm:border-border-subtle/80 sm:bg-bg-card/70 sm:p-2.5'>
				<div className='explore-command-input-label pointer-events-none mb-2 hidden items-center gap-1.5 rounded-full bg-bg-elevated px-2 py-0.5 text-2xs font-bold uppercase tracking-widest text-text-muted sm:inline-flex'>
					<Search className='size-3' />
					{labels.commandInput}
				</div>
				{children}
			</div>

			{/* Controls row */}
			<div className='flex flex-col gap-2 sm:gap-3'>
				<div className='flex flex-row flex-wrap items-center gap-2 max-[319px]:flex-col max-[319px]:items-stretch sm:gap-3'>
					<div className='min-w-0 flex-[1_1_100%] sm:flex-[1_1_11.5rem]'>
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
							className='w-full [&>button]:min-h-11 [&>button]:whitespace-normal [&>button]:px-1.5 [&>button]:text-center [&>button]:text-xs sm:[&>button]:px-4 sm:[&>button]:text-sm'
						/>
					</div>

					<div className='w-32 shrink-0 max-[319px]:w-full sm:w-44'>
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
										'h-11 w-full rounded-xl border border-border-medium bg-bg-card pl-8 pr-3 text-sm font-semibold text-text-secondary outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10',
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
							<span className='explore-command-result-count text-xs font-medium text-text-muted'>
								{labels.results}: {resultCount.toString()}
							</span>
						)}
						{activeFiltersCount > 0 && (
							<span className='inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand/10 px-2 py-1 text-brand'>
								<Filter className='size-3.5' />
								{labels.activeFilters}: {activeFiltersCount.toString()}
							</span>
						)}
					</div>
				)}
			</div>
		</motion.section>
	)
}
