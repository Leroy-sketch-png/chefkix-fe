'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowLeft, ArrowRight, Check, Search } from 'lucide-react'
import { PATHS } from '@/constants'
import { useAuthStore } from '@/store/authStore'
import {
	getProductFoodComposition,
	searchProductFoods,
	PRODUCT_GRAPH_MANIFEST_SHA256,
	PRODUCT_GRAPH_NODES_SHA256,
	PRODUCT_GRAPH_EDGES_SHA256,
} from '../services/productGraphService'
import type {
	ProductFoodCandidate,
	ProductFoodCompositionResponse,
	ProductFoodSearchResponse,
} from '../types/productGraph'

type RequestFailure = 'unauthenticated' | 'forbidden' | 'unavailable'
type PickerSide = 'first' | 'second'

function classifyRequestFailure(error: unknown): RequestFailure {
	const status =
		typeof error === 'object' && error !== null && 'response' in error
			? (error as { response?: { status?: unknown } }).response?.status
			: undefined
	if (status === 401) return 'unauthenticated'
	if (status === 403) return 'forbidden'
	return 'unavailable'
}

function useFoodSearch(query: string) {
	const [search, setSearch] = useState<ProductFoodSearchResponse | null>(null)
	const [error, setError] = useState<RequestFailure | null>(null)
	const [searching, setSearching] = useState(false)

	useEffect(() => {
		const term = query.trim()
		setSearch(null)
		setError(null)
		if (term.length < 2) {
			setSearching(false)
			return
		}
		let active = true
		const timer = window.setTimeout(() => {
			setSearching(true)
			void searchProductFoods(term)
				.then(result => {
					if (active) setSearch(result)
				})
				.catch(failure => {
					if (active) setError(classifyRequestFailure(failure))
				})
				.finally(() => {
					if (active) setSearching(false)
				})
		}, 220)
		return () => {
			active = false
			window.clearTimeout(timer)
		}
	}, [query])

	return { search, error, searching }
}

function AccessMessage({ failure }: { failure: RequestFailure }) {
	const signInHref = `${PATHS.AUTH.SIGN_IN}?returnTo=${encodeURIComponent(PATHS.EXPLORE_GRAPH)}`
	return (
		<p
			className='mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-text-secondary'
			role='alert'
		>
			{failure === 'unauthenticated' ? (
				<>
					Sign in to search the pinned food records.{' '}
					<Link
						href={signInHref}
						className='font-semibold text-primary underline underline-offset-2'
					>
						Sign in
					</Link>
				</>
			) : failure === 'forbidden' ? (
				'Your account cannot access these pinned food records.'
			) : (
				'The pinned food records could not be reached. Try again in a moment.'
			)}
		</p>
	)
}

function FoodPicker({
	side,
	query,
	selectedFood,
	otherFood,
	isBusy,
	onQueryChange,
	onSelect,
}: {
	side: PickerSide
	query: string
	selectedFood: ProductFoodCandidate | null
	otherFood: ProductFoodCandidate | null
	isBusy: boolean
	onQueryChange: (value: string) => void
	onSelect: (food: ProductFoodCandidate) => void
}) {
	const { search, error, searching } = useFoodSearch(query)
	const number = side === 'first' ? 'A' : 'B'
	const label = side === 'first' ? 'First food' : 'Second food'
	const accent = side === 'first' ? 'border-l-primary' : 'border-l-accent-teal'
	const duplicate = (food: ProductFoodCandidate) =>
		food.foodId === otherFood?.foodId

	return (
		<section
			className={`rounded-2xl border border-border-subtle border-l-4 ${accent} bg-bg-card p-4 shadow-card sm:p-5`}
			aria-label={label}
		>
			<div className='mb-3 flex items-center gap-3'>
				<span className='grid size-9 place-items-center rounded-full bg-bg-elevated text-xs font-bold tabular-nums text-text-secondary'>
					{number}
				</span>
				<div className='min-w-0 flex-1'>
					<p className='text-xs font-semibold uppercase tracking-[0.14em] text-text-muted'>
						{selectedFood ? 'Selected food' : label}
					</p>
					{selectedFood && (
						<p className='truncate text-lg font-bold text-text-primary'>
							{selectedFood.name}
						</p>
					)}
				</div>
				{selectedFood && (
					<button
						type='button'
						disabled={isBusy}
						onClick={() => onQueryChange('')}
						className='min-h-10 rounded-lg px-3 text-sm font-semibold text-primary underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
					>
						Change
					</button>
				)}
			</div>
			{!selectedFood && (
				<>
					<label className='sr-only' htmlFor={`food-search-${side}`}>
						Search {label.toLowerCase()}
					</label>
					<div className='relative'>
						<Search
							aria-hidden='true'
							className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted'
						/>
						<input
							id={`food-search-${side}`}
							value={query}
							onChange={event => onQueryChange(event.target.value)}
							placeholder={
								side === 'first'
									? 'Try apple, rice, or lentil'
									: 'Choose another food'
							}
							maxLength={120}
							className='min-h-12 w-full rounded-xl border border-border-medium bg-bg-input pl-10 pr-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20'
						/>
					</div>
				</>
			)}
			{searching && (
				<p className='mt-3 text-sm text-text-muted' role='status'>
					Finding matching records…
				</p>
			)}
			{error && <AccessMessage failure={error} />}
			{search && !selectedFood && (
				<div className='mt-3 space-y-2' aria-label={`${label} search results`}>
					{search.foods.length ? (
						search.foods.map(food => {
							const isDuplicate = duplicate(food)
							return (
								<button
									key={food.foodId}
									type='button'
									disabled={isDuplicate || isBusy}
									onClick={() => onSelect(food)}
									className='flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-border-subtle bg-bg px-3 py-2 text-left transition hover:border-primary/50 hover:bg-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50'
								>
									<span className='font-semibold text-text-primary'>
										{food.name}
									</span>
									<span className='text-xs text-text-muted'>
										{isDuplicate ? 'Already chosen' : 'Choose'}
									</span>
								</button>
							)
						})
					) : (
						<p className='rounded-xl bg-bg-elevated p-3 text-sm text-text-secondary'>
							No matching record in this selected subset. That does not mean the
							food is absent from FooDB.
						</p>
					)}
				</div>
			)}
			{!query.trim() && !selectedFood && (
				<p className='mt-3 text-sm leading-5 text-text-muted'>
					Search by the food’s source-record name.
				</p>
			)}
		</section>
	)
}

function relationMessage(response: ProductFoodCompositionResponse) {
	if (response.status === 'UNKNOWN_OR_OUT_OF_SCOPE') {
		return `${response.food?.name ?? 'This food'} is outside the selected record scope. Its links are unknown here.`
	}
	if (response.status === 'NO_ELIGIBLE_RELATION_UNKNOWN') {
		return `No export-eligible links are shown for ${response.food?.name ?? 'this food'}. That is unknown, not proof that no links exist.`
	}
	return null
}

function ComparisonCount({ label, count }: { label: string; count: number }) {
	return (
		<div className='rounded-xl border border-border-subtle bg-bg-elevated/50 p-3'>
			<p className='text-xs leading-5 text-text-secondary'>{label}</p>
			<p className='mt-1 text-2xl font-bold tabular-nums text-text-primary'>
				{count}
			</p>
		</div>
	)
}

function CompoundListDisclosure({
	summaryLabel,
	compounds,
	total,
	query,
}: {
	summaryLabel: string
	compounds: ProductFoodCompositionResponse['compounds']
	total: number
	query: string
}) {
	return (
		<details className='group rounded-xl border border-border-subtle bg-bg-elevated/40 px-4 py-3'>
			<summary className='flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-semibold text-text-primary marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden'>
				<span>{summaryLabel}</span>
				<span
					aria-hidden='true'
					className='text-primary transition-transform group-open:rotate-90'
				>
					›
				</span>
			</summary>
			<div className='mt-3 border-t border-border-subtle pt-3'>
				{query && (
					<p className='mb-3 text-xs text-text-muted' role='status'>
						Showing {compounds.length} of {total} names matching “{query}”.
					</p>
				)}
				{compounds.length ? (
					<ul className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
						{compounds.map(compound => (
							<li
								key={compound.id}
								className='flex min-h-14 items-start gap-3 rounded-xl border border-border-subtle bg-bg px-3 py-3'
							>
								<span className='grid size-7 shrink-0 place-items-center rounded-full bg-accent-teal/15 text-accent-teal'>
									<Check aria-hidden='true' className='size-4' />
								</span>
								<span className='min-w-0'>
									<span className='block text-sm font-semibold text-text-primary'>
										{compound.name}
									</span>
									<code className='mt-1 block break-all text-[11px] text-text-muted'>
										{compound.id}
									</code>
								</span>
							</li>
						))}
					</ul>
				) : (
					<p className='rounded-lg bg-bg p-3 text-sm text-text-secondary'>
						No listed compound name matches “{query}”.
					</p>
				)}
			</div>
		</details>
	)
}

export function ProductCompositionExplorer() {
	const isAuthenticated = useAuthStore(state => state.isAuthenticated)
	const isAuthHydrated = useAuthStore(state => state.isHydrated)
	const [firstQuery, setFirstQuery] = useState('')
	const [secondQuery, setSecondQuery] = useState('')
	const [firstFood, setFirstFood] = useState<ProductFoodCandidate | null>(null)
	const [secondFood, setSecondFood] = useState<ProductFoodCandidate | null>(
		null,
	)
	const [comparison, setComparison] = useState<{
		first: ProductFoodCompositionResponse
		second: ProductFoodCompositionResponse
	} | null>(null)
	const [compoundQuery, setCompoundQuery] = useState('')
	const [loading, setLoading] = useState(false)
	const [failure, setFailure] = useState<RequestFailure | null>(null)
	useEffect(() => {
		if (!isAuthHydrated || isAuthenticated) return
		setFirstQuery('')
		setSecondQuery('')
		setFirstFood(null)
		setSecondFood(null)
		setComparison(null)
		setFailure(null)
	}, [isAuthHydrated, isAuthenticated])
	const firstProblem = comparison ? relationMessage(comparison.first) : null
	const secondProblem = comparison ? relationMessage(comparison.second) : null
	const sharedCompounds = useMemo(() => {
		if (!comparison || firstProblem || secondProblem) return []
		const secondIds = new Set(
			comparison.second.compounds.map(compound => compound.id),
		)
		return comparison.first.compounds.filter(compound =>
			secondIds.has(compound.id),
		)
	}, [comparison, firstProblem, secondProblem])
	const oneSidedCompounds = useMemo(() => {
		if (!comparison || firstProblem || secondProblem)
			return { first: [], second: [] }
		const firstIds = new Set(
			comparison.first.compounds.map(compound => compound.id),
		)
		const secondIds = new Set(
			comparison.second.compounds.map(compound => compound.id),
		)
		return {
			first: comparison.first.compounds.filter(
				compound => !secondIds.has(compound.id),
			),
			second: comparison.second.compounds.filter(
				compound => !firstIds.has(compound.id),
			),
		}
	}, [comparison, firstProblem, secondProblem])
	const normalizedCompoundQuery = compoundQuery.trim().toLowerCase()
	const matchingNames = (
		compounds: ProductFoodCompositionResponse['compounds'],
	) =>
		compounds.filter(compound =>
			compound.name.toLowerCase().includes(normalizedCompoundQuery),
		)
	const canCompare = Boolean(
		firstFood && secondFood && firstFood.foodId !== secondFood.foodId,
	)

	const chooseFood = (side: PickerSide, food: ProductFoodCandidate) => {
		if (side === 'first') {
			setFirstFood(food)
			setFirstQuery('')
		} else {
			setSecondFood(food)
			setSecondQuery('')
		}
		setComparison(null)
		setCompoundQuery('')
		setFailure(null)
	}

	const changeQuery = (side: PickerSide, value: string) => {
		if (side === 'first') {
			setFirstQuery(value)
			setFirstFood(null)
		} else {
			setSecondQuery(value)
			setSecondFood(null)
		}
		setComparison(null)
		setCompoundQuery('')
		setFailure(null)
	}

	const compareFoods = async () => {
		if (!firstFood || !secondFood || firstFood.foodId === secondFood.foodId)
			return
		setLoading(true)
		setComparison(null)
		setCompoundQuery('')
		setFailure(null)
		try {
			const [first, second] = await Promise.all([
				getProductFoodComposition(firstFood.foodId),
				getProductFoodComposition(secondFood.foodId),
			])
			setComparison({ first, second })
		} catch (error) {
			setFailure(classifyRequestFailure(error))
		} finally {
			setLoading(false)
		}
	}

	const hasUnknownLinks = Boolean(
		comparison &&
			(comparison.first.filteredKnownRelationCount > 0 ||
				comparison.second.filteredKnownRelationCount > 0),
	)

	return (
		<section className='space-y-6' aria-label='Compare food records'>
			<header className='relative isolate overflow-hidden rounded-[2rem] border border-border-subtle bg-gradient-to-br from-bg-card via-bg-card to-bg-elevated px-5 py-6 shadow-card sm:px-8 sm:py-8'>
				<svg
					aria-hidden='true'
					viewBox='0 0 240 120'
					className='pointer-events-none absolute right-8 top-1/2 hidden h-32 w-64 -translate-y-1/2 text-text-primary lg:block'
				>
					<defs>
						<clipPath id='food-comparison-left'>
							<circle cx='91' cy='60' r='48' />
						</clipPath>
					</defs>
					<circle
						cx='91'
						cy='60'
						r='48'
						fill='var(--color-brand)'
						fillOpacity='.14'
						stroke='var(--color-brand)'
						strokeOpacity='.55'
						strokeWidth='2'
					/>
					<circle
						cx='149'
						cy='60'
						r='48'
						fill='var(--color-accent-teal)'
						fillOpacity='.16'
						stroke='var(--color-accent-teal)'
						strokeOpacity='.65'
						strokeWidth='2'
					/>
					<circle
						cx='149'
						cy='60'
						r='48'
						fill='var(--color-accent-purple)'
						fillOpacity='.26'
						clipPath='url(#food-comparison-left)'
					/>
					<text
						x='62'
						y='64'
						textAnchor='middle'
						fill='currentColor'
						fontSize='12'
						fontWeight='700'
					>
						A
					</text>
					<text
						x='120'
						y='64'
						textAnchor='middle'
						fill='currentColor'
						fontSize='10'
						fontWeight='700'
					>
						BOTH
					</text>
					<text
						x='178'
						y='64'
						textAnchor='middle'
						fill='currentColor'
						fontSize='12'
						fontWeight='700'
					>
						B
					</text>
				</svg>
				<div className='relative max-w-2xl'>
					<Link
						href={PATHS.EXPLORE}
						className='mb-5 inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
					>
						<ArrowLeft aria-hidden='true' className='size-4' /> Back to Explore
					</Link>
					<p className='inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-primary'>
						FooDB · Food comparison
					</p>
					<h1 className='mt-2 max-w-xl text-3xl font-bold leading-tight tracking-tight text-text-primary sm:text-4xl'>
						What do two foods have in common?
					</h1>
					<p className='mt-3 max-w-xl text-sm leading-6 text-text-secondary sm:text-base'>
						Pick two foods to see which compound links appear in both source
						records.
					</p>
				</div>
			</header>

			{!isAuthHydrated ? (
				<section
					aria-label='Checking access'
					className='rounded-2xl border border-border-subtle bg-bg-card p-5 text-sm text-text-secondary shadow-card'
					role='status'
				>
					Checking whether food-record search is available…
				</section>
			) : !isAuthenticated ? (
				<section
					aria-labelledby='food-comparison-sign-in-title'
					className='flex flex-col gap-4 rounded-2xl border border-border-subtle bg-bg-card p-5 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-6'
				>
					<div className='max-w-xl'>
						<h2
							id='food-comparison-sign-in-title'
							className='text-lg font-bold text-text-primary'
						>
							Sign in to compare two foods
						</h2>
						<p className='mt-2 text-sm leading-6 text-text-secondary'>
							Search the pinned FooDB records and compare their listed compound
							links. This shows source-record overlap only—not taste, nutrition,
							safety, or substitution advice.
						</p>
					</div>
					<Link
						href={`${PATHS.AUTH.SIGN_IN}?returnTo=${encodeURIComponent(PATHS.EXPLORE_GRAPH)}`}
						className='inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-card transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
					>
						Sign in to compare
					</Link>
				</section>
			) : (
				<>
					<div className='grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center'>
						<FoodPicker
							side='first'
							query={firstQuery}
							selectedFood={firstFood}
							otherFood={secondFood}
							isBusy={loading}
							onQueryChange={value => changeQuery('first', value)}
							onSelect={food => chooseFood('first', food)}
						/>
						<div
							aria-hidden='true'
							className='mx-auto grid size-11 place-items-center rounded-full border border-border-subtle bg-bg-elevated text-text-muted max-md:-my-1'
						>
							<ArrowRight className='hidden size-5 md:block' />
							<ArrowDown className='size-5 md:hidden' />
						</div>
						<FoodPicker
							side='second'
							query={secondQuery}
							selectedFood={secondFood}
							otherFood={firstFood}
							isBusy={loading}
							onQueryChange={value => changeQuery('second', value)}
							onSelect={food => chooseFood('second', food)}
						/>
					</div>

					<div className='flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-border-subtle bg-bg-elevated/60 p-4 sm:flex-row sm:items-center sm:px-5'>
						<p className='text-sm leading-5 text-text-secondary'>
							We match the same source compound IDs—not similar-sounding names.
						</p>
						<button
							type='button'
							disabled={!canCompare || loading}
							onClick={compareFoods}
							className='inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-text-muted disabled:text-bg'
						>
							{loading ? 'Comparing records…' : 'Show what they share'}
							{!loading && <ArrowRight aria-hidden='true' className='size-4' />}
						</button>
					</div>

					{failure && <AccessMessage failure={failure} />}

					{comparison && (
						<section
							className='overflow-hidden rounded-[1.75rem] border border-border-subtle bg-bg-card shadow-card'
							aria-label='Food comparison results'
						>
							<div className='grid gap-4 bg-bg-elevated/70 p-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:px-7 sm:py-6'>
								<div>
									<p className='text-xs font-semibold uppercase tracking-[0.15em] text-text-muted'>
										First food
									</p>
									<h2 className='mt-1 text-xl font-bold text-text-primary'>
										{comparison.first.food?.name ?? firstFood?.name}
									</h2>
									<code className='mt-1 block break-all text-xs text-text-muted'>
										{comparison.first.food?.id ??
											`foodb:1.0:food-id:${firstFood?.foodId}`}
									</code>
								</div>
								<div className='mx-auto grid size-12 place-items-center rounded-full bg-bg-card text-primary shadow-sm'>
									<ArrowRight aria-hidden='true' className='size-5' />
								</div>
								<div className='sm:text-right'>
									<p className='text-xs font-semibold uppercase tracking-[0.15em] text-text-muted'>
										Second food
									</p>
									<h2 className='mt-1 text-xl font-bold text-text-primary'>
										{comparison.second.food?.name ?? secondFood?.name}
									</h2>
									<code className='mt-1 block break-all text-xs text-text-muted'>
										{comparison.second.food?.id ??
											`foodb:1.0:food-id:${secondFood?.foodId}`}
									</code>
								</div>
							</div>
							{firstProblem || secondProblem ? (
								<div className='p-5 sm:p-7' role='status'>
									<p className='font-semibold text-text-primary'>
										We can’t make this comparison from the available records.
									</p>
									<p className='mt-2 text-sm leading-6 text-text-secondary'>
										{firstProblem}
										{firstProblem && secondProblem ? ' ' : ''}
										{secondProblem}
									</p>
								</div>
							) : (
								<div className='p-5 sm:p-7'>
									<div className='flex flex-wrap items-end justify-between gap-3'>
										<div>
											<p className='text-sm font-semibold text-text-secondary'>
												Listed in both records
											</p>
											<p className='mt-1 text-4xl font-bold tabular-nums tracking-tight text-text-primary'>
												{sharedCompounds.length}
												<span className='ml-2 text-base font-medium tracking-normal text-text-muted'>
													{sharedCompounds.length === 1
														? 'matching compound'
														: 'matching compounds'}
												</span>
											</p>
										</div>
										<p className='sr-only' role='status'>
											{sharedCompounds.length} shared listed compounds found.
										</p>
									</div>
									{hasUnknownLinks && (
										<p className='mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm leading-5 text-text-secondary'>
											The source export withheld additional known links for one
											or both foods. This overlap may be incomplete.
										</p>
									)}
									<div className='mt-5 grid gap-2 sm:grid-cols-2'>
										<ComparisonCount
											label={`In ${comparison.first.food?.name ?? firstFood?.name}’s returned list, not ${comparison.second.food?.name ?? secondFood?.name}’s`}
											count={oneSidedCompounds.first.length}
										/>
										<ComparisonCount
											label={`In ${comparison.second.food?.name ?? secondFood?.name}’s returned list, not ${comparison.first.food?.name ?? firstFood?.name}’s`}
											count={oneSidedCompounds.second.length}
										/>
									</div>
									{sharedCompounds.length +
										oneSidedCompounds.first.length +
										oneSidedCompounds.second.length >
										0 && (
										<div className='mt-5 space-y-3'>
											<label
												className='block text-sm font-semibold text-text-primary'
												htmlFor='compound-name-filter'
											>
												Find a listed compound
											</label>
											<input
												id='compound-name-filter'
												type='search'
												value={compoundQuery}
												onChange={event => setCompoundQuery(event.target.value)}
												placeholder='Try malic acid'
												className='min-h-11 w-full rounded-xl border border-border-medium bg-bg-input px-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20'
											/>
											<p className='text-xs leading-5 text-text-muted'>
												Filters names in these returned lists; it does not add
												meaning beyond the source records.
											</p>
										</div>
									)}
									{sharedCompounds.length ? (
										<CompoundListDisclosure
											summaryLabel={`Browse ${sharedCompounds.length} matching compound names`}
											compounds={matchingNames(sharedCompounds)}
											total={sharedCompounds.length}
											query={normalizedCompoundQuery}
										/>
									) : (
										<p className='mt-5 rounded-xl border border-border-subtle bg-bg-elevated/70 p-4 text-sm leading-6 text-text-secondary'>
											No compound appears in both displayed records. The source
											subset may omit links, so this is not proof the foods have
											nothing in common.
										</p>
									)}
									{oneSidedCompounds.first.length > 0 && (
										<CompoundListDisclosure
											summaryLabel={`Browse ${oneSidedCompounds.first.length} ${oneSidedCompounds.first.length === 1 ? 'compound' : 'compounds'} listed for ${comparison.first.food?.name ?? firstFood?.name}, not ${comparison.second.food?.name ?? secondFood?.name}`}
											compounds={matchingNames(oneSidedCompounds.first)}
											total={oneSidedCompounds.first.length}
											query={normalizedCompoundQuery}
										/>
									)}
									{oneSidedCompounds.second.length > 0 && (
										<CompoundListDisclosure
											summaryLabel={`Browse ${oneSidedCompounds.second.length} ${oneSidedCompounds.second.length === 1 ? 'compound' : 'compounds'} listed for ${comparison.second.food?.name ?? secondFood?.name}, not ${comparison.first.food?.name ?? firstFood?.name}`}
											compounds={matchingNames(oneSidedCompounds.second)}
											total={oneSidedCompounds.second.length}
											query={normalizedCompoundQuery}
										/>
									)}
									<p className='mt-5 border-t border-border-subtle pt-4 text-xs leading-5 text-text-muted'>
										This comparison covers listed compound presence in a
										selected FooDB subset only. It does not describe amounts,
										nutrition, flavor, safety, allergens, or whether one food
										can replace another.
									</p>
								</div>
							)}
						</section>
					)}
				</>
			)}

			<details className='group rounded-2xl border border-border-subtle bg-bg-card px-4 py-3 text-sm text-text-muted'>
				<summary className='cursor-pointer list-none font-semibold text-text-secondary marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden'>
					<span className='inline-flex items-center gap-2'>
						<span
							aria-hidden='true'
							className='text-primary transition-transform group-open:rotate-90'
						>
							›
						</span>
						Where these records come from
					</span>
				</summary>
				<div className='mt-3 space-y-2 border-t border-border-subtle pt-3 text-xs leading-5'>
					<p>
						FooDB 1.0, released 2020-04-07 · selected top-255 profile subset ·
						CC BY-NC 4.0.
					</p>
					<p>
						Only source-listed, export-eligible compound links are compared.
						Missing links are unknown.
					</p>
					<p>
						Source manifest:{' '}
						<code className='break-all'>{PRODUCT_GRAPH_MANIFEST_SHA256}</code>
					</p>
					<p>
						Node file SHA-256:{' '}
						<code className='break-all'>{PRODUCT_GRAPH_NODES_SHA256}</code>
					</p>
					<p>
						Edge file SHA-256:{' '}
						<code className='break-all'>{PRODUCT_GRAPH_EDGES_SHA256}</code>
					</p>
				</div>
			</details>
		</section>
	)
}
