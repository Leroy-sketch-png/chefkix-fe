'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Flame, History, Search, Sparkles, X } from 'lucide-react'
import { FeedTabBar, type TabItem } from '@/components/shared/FeedTabBar'
import { cn } from '@/lib/utils'
import { BUTTON_TAP, TRANSITION_SPRING } from '@/lib/motion'

interface TrendingTerm {
	term: string
	icon: React.ComponentType<{ className?: string }>
	iconClass: string
}

interface SearchDeckBaseProps {
	searchValue: string
	onSearchChange: (value: string) => void
	onClear: () => void
	searchPlaceholder: string
	clearLabel: string
	className?: string
}

interface SearchDiscoveryCommandDeckProps extends SearchDeckBaseProps {
	mode: 'discovery'
	eyebrow: string
	heading: string
	modeChipLabel: string
	suggestionsLabel: string
	suggestionTerms: string[]
	recentSearchesLabel: string
	recentSearches: string[]
	onSuggestionClick: (term: string) => void
	onRemoveRecent: (term: string) => void
	getRemoveRecentLabel: (term: string) => string
	trendingLabel: string
	trendingTerms: TrendingTerm[]
}

interface SearchResultsCommandDeckProps<TTab extends string>
	extends SearchDeckBaseProps {
	mode: 'results'
	eyebrow: string
	chipLabel: string
	backLabel: string
	onBack: () => void
	heading: string
	summary: string
	tabs: TabItem<TTab>[]
	activeTab: TTab
	onTabChange: (value: TTab) => void
}

type SearchCommandDeckProps<TTab extends string> =
	| SearchDiscoveryCommandDeckProps
	| SearchResultsCommandDeckProps<TTab>

export function SearchCommandDeck<TTab extends string>(
	props: SearchCommandDeckProps<TTab>,
) {
	return (
		<motion.section
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={TRANSITION_SPRING}
			className={cn(
				'rounded-2xl border border-border-subtle bg-gradient-to-br from-bg-card via-bg-card to-brand/6 p-3 shadow-card sm:p-4 md:rounded-2xl md:p-5',
				props.className,
			)}
		>
			{props.mode === 'discovery' ? (
				<SearchDiscoveryCommandDeck {...props} />
			) : (
				<SearchResultsCommandDeck {...props} />
			)}
		</motion.section>
	)
}

function SearchInput({
	searchValue,
	onSearchChange,
	onClear,
	searchPlaceholder,
	clearLabel,
}: SearchDeckBaseProps) {
	return (
		<div className='relative'>
			<Search className='pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-text-muted' />
			<input
				type='text'
				value={searchValue}
				onChange={event => onSearchChange(event.target.value)}
				placeholder={searchPlaceholder}
				aria-label={searchPlaceholder}
				className='w-full rounded-xl border border-border-subtle bg-bg-card py-3 pl-12 pr-11 text-text-primary placeholder:text-text-muted focus:border-brand/70 focus:outline-none focus-visible:ring-0 sm:py-3.5'
			/>
			{searchValue && (
				<motion.button
					type='button'
					onClick={onClear}
					whileTap={BUTTON_TAP}
					className='absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-primary focus-visible:ring-2 focus-visible:ring-brand/50'
					aria-label={clearLabel}
				>
					<X className='size-4' />
				</motion.button>
			)}
		</div>
	)
}

function SearchDiscoveryCommandDeck({
	eyebrow,
	heading,
	modeChipLabel,
	suggestionsLabel,
	suggestionTerms,
	recentSearchesLabel,
	recentSearches,
	onSuggestionClick,
	onRemoveRecent,
	getRemoveRecentLabel,
	trendingLabel,
	trendingTerms,
	...inputProps
}: SearchDiscoveryCommandDeckProps) {
	const hasTrendingTerms = trendingTerms.length > 0

	return (
		<>
			<div className='mb-3 flex flex-wrap items-start justify-between gap-2.5 sm:mb-4 sm:items-center sm:gap-3'>
				<div>
					<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-brand'>
						{eyebrow}
					</p>
					<h1 className='mt-1 text-lg font-black leading-tight text-text-primary sm:text-xl md:text-2xl'>
						{heading}
					</h1>
				</div>
				<div className='inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/8 px-2.5 py-1 text-[11px] font-semibold text-brand'>
					<Sparkles className='size-3.5' />
					{modeChipLabel}
				</div>
			</div>

			<SearchInput {...inputProps} />

			<div
				className={cn(
					'mt-4 grid gap-4',
					hasTrendingTerms && 'lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]',
				)}
			>
				<div className='space-y-4'>
					<div>
						<div className='mb-2 flex items-center gap-2 text-text-secondary'>
							<Sparkles className='size-4 text-brand' />
							<p className='text-sm font-semibold'>{suggestionsLabel}</p>
						</div>
						<div className='-mx-3 overflow-x-auto pb-1 sm:mx-0 sm:overflow-visible sm:pb-0'>
							<div className='flex min-w-max gap-2 px-3 sm:flex-wrap sm:px-0'>
								{suggestionTerms.map(term => (
									<motion.button
										type='button'
										key={term}
										onClick={() => onSuggestionClick(term)}
										whileTap={BUTTON_TAP}
										className='min-h-9 shrink-0 rounded-full border border-border-subtle bg-bg-card px-3.5 py-1.5 text-sm font-semibold text-text-primary transition-colors hover:border-brand/40 hover:bg-brand/5 focus-visible:ring-2 focus-visible:ring-brand/50 sm:min-h-10 sm:px-4 sm:py-2'
									>
										{term}
									</motion.button>
								))}
							</div>
						</div>
					</div>

					{recentSearches.length > 0 && (
						<div>
							<div className='mb-2 flex items-center gap-2 text-text-secondary'>
								<History className='size-4' />
								<p className='text-sm font-semibold'>{recentSearchesLabel}</p>
							</div>
							<div className='flex flex-wrap gap-2'>
								{recentSearches.map(term => (
									<div
										key={term}
										className='inline-flex items-center gap-1 overflow-hidden rounded-full border border-border-subtle bg-bg-elevated pr-1'
									>
										<motion.button
											type='button'
											onClick={() => onSuggestionClick(term)}
											whileTap={BUTTON_TAP}
											className='px-3 py-1.5 text-sm font-medium text-text-primary focus-visible:ring-2 focus-visible:ring-brand/50'
										>
											{term}
										</motion.button>
										<motion.button
											type='button'
											onClick={() => onRemoveRecent(term)}
											whileTap={BUTTON_TAP}
											className='flex size-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary focus-visible:ring-2 focus-visible:ring-brand/50'
											aria-label={getRemoveRecentLabel(term)}
										>
											<X className='size-3' />
										</motion.button>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				{hasTrendingTerms && (
					<div>
						<div className='mb-2 flex items-center gap-2 text-text-secondary'>
							<Flame className='size-4 text-streak' />
							<p className='text-sm font-semibold'>{trendingLabel}</p>
						</div>
						<div className='grid grid-cols-2 gap-2'>
							{trendingTerms.map(({ term, icon: Icon, iconClass }) => (
								<motion.button
									type='button'
									key={term}
									onClick={() => onSuggestionClick(term)}
									whileTap={BUTTON_TAP}
									className='group flex items-center gap-1.5 rounded-xl border border-border-subtle bg-bg-elevated px-2 py-2 text-left transition-all hover:border-brand/40 hover:bg-brand/5 focus-visible:ring-2 focus-visible:ring-brand/50 sm:gap-2 sm:p-3'
								>
									<span
										className={cn(
											'flex size-6 items-center justify-center rounded-lg sm:size-8',
											iconClass,
										)}
									>
										<Icon className='size-3 sm:size-4' />
									</span>
									<span className='text-[13px] font-semibold leading-tight text-text-primary sm:text-sm'>
										{term}
									</span>
								</motion.button>
							))}
						</div>
					</div>
				)}
			</div>
		</>
	)
}

function SearchResultsCommandDeck<TTab extends string>({
	eyebrow,
	chipLabel,
	backLabel,
	onBack,
	heading,
	summary,
	tabs,
	activeTab,
	onTabChange,
	...inputProps
}: SearchResultsCommandDeckProps<TTab>) {
	return (
		<>
			<div className='mb-3 flex flex-wrap items-start justify-between gap-2.5 sm:mb-4 sm:items-center sm:gap-3'>
				<div>
					<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-brand'>
						{eyebrow}
					</p>
				</div>
				<div className='inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/8 px-2.5 py-1 text-[11px] font-semibold text-brand'>
					<Sparkles className='size-3.5' />
					{chipLabel}
				</div>
			</div>

			<div className='mb-4 flex items-center gap-3'>
				<motion.button
					type='button'
					onClick={onBack}
					whileTap={BUTTON_TAP}
					className='flex size-10 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-bg-card text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary focus-visible:ring-2 focus-visible:ring-brand/50'
					aria-label={backLabel}
				>
					<ArrowLeft className='size-5' />
				</motion.button>
				<div className='min-w-0 flex-1'>
					<SearchInput {...inputProps} />
				</div>
			</div>

			<div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
				<div className='min-w-0'>
					<h1 className='text-2xl font-black leading-tight text-text-primary sm:text-3xl'>
						{heading}
					</h1>
					<p className='mt-1 flex items-center gap-2 tabular-nums text-sm text-text-secondary sm:text-base'>
						<Sparkles className='size-4 text-streak' />
						{summary}
					</p>
				</div>
			</div>

			<FeedTabBar<TTab>
				tabs={tabs}
				activeTab={activeTab}
				onTabChange={onTabChange}
				variant='underline'
				size='lg'
			/>
		</>
	)
}
