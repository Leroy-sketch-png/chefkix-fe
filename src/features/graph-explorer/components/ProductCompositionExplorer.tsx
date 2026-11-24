'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PATHS } from '@/constants'
import {
	getProductFoodComposition,
	searchProductFoods,
	PRODUCT_GRAPH_MANIFEST_SHA256,
} from '../services/productGraphService'
import type {
	ProductFoodCandidate,
	ProductFoodCompositionResponse,
	ProductFoodSearchResponse,
} from '../types/productGraph'

type RequestFailure = 'unauthenticated' | 'forbidden' | 'unavailable'
const INITIAL_COMPOUNDS_TO_SHOW = 12

function classifyRequestFailure(error: unknown): RequestFailure {
	const status =
		typeof error === 'object' && error !== null && 'response' in error
			? (error as { response?: { status?: unknown } }).response?.status
			: undefined
	if (status === 401) return 'unauthenticated'
	if (status === 403) return 'forbidden'
	return 'unavailable'
}

export function ProductCompositionExplorer() {
	const [query, setQuery] = useState('')
	const [search, setSearch] = useState<ProductFoodSearchResponse | null>(null)
	const [selectedFood, setSelectedFood] = useState<ProductFoodCandidate | null>(
		null,
	)
	const [composition, setComposition] =
		useState<ProductFoodCompositionResponse | null>(null)
	const [searchError, setSearchError] = useState<
		'unauthenticated' | 'forbidden' | 'unavailable' | null
	>(null)
	const [compositionError, setCompositionError] = useState<
		'unauthenticated' | 'forbidden' | 'unavailable' | null
	>(null)
	const [searching, setSearching] = useState(false)
	const [loadingComposition, setLoadingComposition] = useState(false)
	const [compoundQuery, setCompoundQuery] = useState('')
	const [visibleCompoundLimit, setVisibleCompoundLimit] = useState(
		INITIAL_COMPOUNDS_TO_SHOW,
	)
	const [showSourceIds, setShowSourceIds] = useState(false)
	const signInHref = `${PATHS.AUTH.SIGN_IN}?returnTo=${encodeURIComponent(PATHS.EXPLORE_GRAPH)}`
	const normalizedCompoundQuery = compoundQuery.trim().toLowerCase()
	const matchingCompounds = (composition?.compounds ?? []).filter(compound =>
		compound.name.toLowerCase().includes(normalizedCompoundQuery),
	)
	const visibleCompounds = matchingCompounds.slice(0, visibleCompoundLimit)

	useEffect(() => {
		const term = query.trim()
		setSearch(null)
		setSelectedFood(null)
		setComposition(null)
		setSearchError(null)
		setCompositionError(null)
		setCompoundQuery('')
		setVisibleCompoundLimit(INITIAL_COMPOUNDS_TO_SHOW)
		setShowSourceIds(false)
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
				.catch(error => {
					if (active) setSearchError(classifyRequestFailure(error))
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

	useEffect(() => {
		if (!selectedFood) return
		let active = true
		setLoadingComposition(true)
		setCompositionError(null)
		void getProductFoodComposition(selectedFood.foodId)
			.then(result => {
				if (active) setComposition(result)
			})
			.catch(error => {
				if (active) {
					setCompositionError(classifyRequestFailure(error))
				}
			})
			.finally(() => {
				if (active) setLoadingComposition(false)
			})
		return () => {
			active = false
		}
	}, [selectedFood])

	return (
		<section className='space-y-5' aria-label='FooDB food record explorer'>
			<div className='rounded-2xl border border-border-subtle bg-bg-card p-4 shadow-card'>
				<label
					htmlFor='foodb-product-search'
					className='text-sm font-semibold text-text-primary'
				>
					Search FooDB foods
				</label>
				<div className='mt-2 flex flex-col gap-3 sm:flex-row'>
					<input
						id='foodb-product-search'
						value={query}
						onChange={event => setQuery(event.target.value)}
						placeholder='Enter a food name, such as apple'
						maxLength={120}
						className='min-h-11 flex-1 rounded-xl border border-border-medium bg-bg-input px-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
					/>
					{searching && (
						<span className='self-center text-sm text-text-muted' role='status'>
							Searching source…
						</span>
					)}
				</div>
				<p className='mt-2 text-xs text-text-muted'>
					Choose the exact source record you want to inspect. This does not
					guess which ChefKix ingredient it represents.
				</p>
				{searchError && (
					<div
						className='mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-text-secondary'
						role='alert'
					>
						{searchError === 'unauthenticated' ? (
							<>
								Sign in to search the pinned FooDB product data.{' '}
								<Link
									href={signInHref}
									className='font-semibold text-primary underline underline-offset-2'
								>
									Sign in
								</Link>
							</>
						) : searchError === 'forbidden' ? (
							<>This account cannot access the pinned FooDB product data.</>
						) : (
							<>
								Pinned product data is temporarily unavailable. No substitute
								graph is shown.
							</>
						)}
					</div>
				)}
				{search && (
					<div className='mt-4 space-y-2' aria-label='FooDB food results'>
						{search.foods.length ? (
							<>
								<h3 className='text-sm font-semibold text-text-primary'>
									{search.foods.length} matching FooDB{' '}
									{search.foods.length === 1 ? 'record' : 'records'}
								</h3>
								{search.foods.map(food => (
									<button
										key={food.foodId}
										type='button'
										aria-pressed={selectedFood?.foodId === food.foodId}
										onClick={() => {
											setComposition(null)
											setCompositionError(null)
											setCompoundQuery('')
											setVisibleCompoundLimit(INITIAL_COMPOUNDS_TO_SHOW)
											setShowSourceIds(false)
											setSelectedFood(food)
										}}
										className='flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-border-subtle bg-bg px-3 py-2 text-left hover:border-primary/50 aria-pressed:border-primary aria-pressed:bg-bg-elevated'
									>
										<span className='font-medium text-text-primary'>
											{food.name}
										</span>
										<span className='shrink-0 text-xs text-text-muted'>
											{selectedFood?.foodId === food.foodId
												? 'Selected'
												: 'View record'}
										</span>
									</button>
								))}
							</>
						) : (
							<p className='text-sm text-text-secondary'>
								No matching Food records in this selected source subset. This
								does not establish absence from FooDB or ChefKix.
							</p>
						)}
					</div>
				)}
			</div>

			{loadingComposition && (
				<div
					className='rounded-2xl border border-border-subtle bg-bg-card p-5 text-sm text-text-muted'
					role='status'
				>
					Loading pinned food relations…
				</div>
			)}
			{compositionError && (
				<div
					className='rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-text-secondary'
					role='alert'
				>
					{compositionError === 'unauthenticated' ? (
						<>
							Sign in to view this food’s pinned source relations.{' '}
							<Link
								href={signInHref}
								className='font-semibold text-primary underline underline-offset-2'
							>
								Sign in
							</Link>
						</>
					) : compositionError === 'forbidden' ? (
						<>This account cannot access the pinned FooDB product data.</>
					) : (
						<>
							Could not verify this source graph. No substitute graph is shown.
						</>
					)}
				</div>
			)}
			{composition && composition.food && (
				<section
					className='rounded-2xl border border-border-subtle bg-bg-card p-4 shadow-card'
					aria-label='Selected food record details'
				>
					<div className='flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle pb-4'>
						<div>
							<p className='text-xs font-semibold uppercase tracking-wide text-text-muted'>
								Selected FooDB record
							</p>
							<h3 className='mt-1 text-lg font-bold text-text-primary'>
								{composition.food.name}
							</h3>
							{showSourceIds && (
								<p className='mt-1 font-mono text-xs text-text-muted'>
									{composition.food.id}
								</p>
							)}
						</div>
						<div className='flex flex-wrap items-center gap-2'>
							<span className='rounded-full bg-bg-elevated px-3 py-1 text-xs font-medium text-text-secondary'>
								FooDB 1.0 · 2020-04-07
							</span>
							<button
								type='button'
								aria-pressed={showSourceIds}
								onClick={() => setShowSourceIds(value => !value)}
								className='min-h-11 rounded-lg px-3 text-xs font-medium text-text-secondary underline underline-offset-2 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
							>
								{showSourceIds ? 'Hide source IDs' : 'Show source IDs'}
							</button>
						</div>
					</div>
					{composition.status === 'NO_ELIGIBLE_RELATION_UNKNOWN' ? (
						<p className='py-4 text-sm text-text-secondary'>
							No export-eligible relation is shown for this Food in the selected
							scope. Missing relations are unknown, not absent.
						</p>
					) : (
						<div className='py-4'>
							<div className='flex flex-wrap items-end justify-between gap-3'>
								<div>
									<h4 className='text-sm font-semibold text-text-primary'>
										Recorded compound links
									</h4>
									<p className='mt-1 text-xs leading-5 text-text-muted'>
										A link means this source record lists the compound as
										present. It does not tell you how much is present or what it
										means for cooking.
									</p>
								</div>
								<label className='w-full sm:w-64'>
									<span className='sr-only'>
										Filter recorded compound names
									</span>
									<input
										id='foodb-compound-filter'
										type='search'
										value={compoundQuery}
										onChange={event => {
											setCompoundQuery(event.target.value)
											setVisibleCompoundLimit(INITIAL_COMPOUNDS_TO_SHOW)
										}}
										placeholder='Filter these compounds'
										className='min-h-11 w-full rounded-xl border border-border-medium bg-bg-input px-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
									/>
								</label>
							</div>
							<p className='mt-3 text-xs text-text-muted' role='status'>
								{normalizedCompoundQuery
									? `${matchingCompounds.length} of ${composition.compounds.length} listed compounds match`
									: `${composition.compounds.length} compound links listed`}
							</p>
							{matchingCompounds.length ? (
								<ul className='mt-2 divide-y divide-border-subtle'>
									{visibleCompounds.map(compound => (
										<li
											key={compound.id}
											className='flex flex-wrap items-center justify-between gap-2 py-3'
										>
											<span className='text-sm font-medium text-text-primary'>
												{compound.name}
											</span>
											<span className='rounded-full bg-bg-elevated px-2.5 py-1 text-xs text-text-secondary'>
												Recorded present
											</span>
											{showSourceIds && (
												<span className='w-full font-mono text-xs text-text-muted'>
													{compound.id}
												</span>
											)}
										</li>
									))}
								</ul>
							) : (
								<p
									className='mt-4 rounded-xl bg-bg-elevated p-3 text-sm text-text-secondary'
									role='status'
								>
									No listed compound names match this filter. Clear it to see
									the full source-record list; this does not show absence from
									FooDB.
								</p>
							)}
							{visibleCompounds.length < matchingCompounds.length && (
								<button
									type='button'
									onClick={() =>
										setVisibleCompoundLimit(
											limit => limit + INITIAL_COMPOUNDS_TO_SHOW,
										)
									}
									className='mt-3 min-h-11 rounded-lg px-3 text-sm font-semibold text-primary underline underline-offset-2 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
								>
									Show{' '}
									{Math.min(
										INITIAL_COMPOUNDS_TO_SHOW,
										matchingCompounds.length - visibleCompounds.length,
									)}{' '}
									more
								</button>
							)}
						</div>
					)}
					<div className='mt-3 border-t border-border-subtle pt-3 text-xs leading-5 text-text-muted'>
						<p>
							Presence is not quantity, nutrition, flavor, safety, allergen, or
							substitution evidence. Missing links are unknown.
						</p>
						{composition.filteredKnownRelationCount > 0 && (
							<p className='mt-2'>
								{composition.filteredKnownRelationCount} additional
								source-present relation(s) were withheld by the artifact’s
								export filter; they are not treated as absent.
							</p>
						)}
					</div>
				</section>
			)}
			{composition && !composition.food && (
				<div
					className='rounded-xl border border-border-subtle bg-bg-card p-4 text-sm text-text-secondary'
					role='status'
				>
					This FooDB Food is outside the pinned graph scope. Its relationships
					are unknown here; this does not mean none exist.
				</div>
			)}

			<details className='rounded-xl border border-border-subtle bg-bg-elevated p-3 text-xs text-text-muted'>
				<summary className='cursor-pointer font-semibold text-text-secondary'>
					About the source and coverage
				</summary>
				<div className='mt-3 space-y-2 leading-5'>
					<p>
						FooDB 1.0 · 2020-04-07 · CC BY-NC 4.0 (non-commercial). This is a
						selected top-255 profile subset, not every food or compound.
					</p>
					<p>Artifact manifest SHA-256:</p>
					<code className='block break-all'>
						{PRODUCT_GRAPH_MANIFEST_SHA256}
					</code>
				</div>
			</details>
		</section>
	)
}
