'use client'

import { useEffect, useState } from 'react'
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

export function ProductCompositionExplorer({
	onShowLegacy,
}: {
	onShowLegacy: () => void
}) {
	const [query, setQuery] = useState('')
	const [search, setSearch] = useState<ProductFoodSearchResponse | null>(null)
	const [selectedFood, setSelectedFood] = useState<ProductFoodCandidate | null>(null)
	const [composition, setComposition] =
		useState<ProductFoodCompositionResponse | null>(null)
	const [searchError, setSearchError] = useState<string | null>(null)
	const [compositionError, setCompositionError] = useState<string | null>(null)
	const [searching, setSearching] = useState(false)
	const [loadingComposition, setLoadingComposition] = useState(false)

	useEffect(() => {
		const term = query.trim()
		setSearch(null)
		setSelectedFood(null)
		setComposition(null)
		setSearchError(null)
		setCompositionError(null)
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
				.catch(() => {
					if (active) {
						setSearchError(
							'Pinned product data is unavailable. No legacy or evaluation graph was substituted.',
						)
					}
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
			.catch(() => {
				if (active) {
					setCompositionError(
						'Could not verify this source graph. Nothing from the legacy graph is being shown instead.',
					)
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
		<section className='space-y-5' aria-label='FooDB food composition graph'>
			<div className='flex flex-wrap items-start justify-between gap-3'>
				<div>
					<p className='text-sm font-semibold text-primary'>Product source</p>
					<h2 className='mt-1 text-xl font-bold text-text-primary'>
						Food composition map
					</h2>
					<p className='mt-1 max-w-2xl text-sm text-text-secondary'>
						Explore FooDB’s recorded food–compound presence. This is a selected
						source subset—not a substitution, nutrition, allergen, or safety guide.
					</p>
				</div>
				<button
					type='button'
					onClick={onShowLegacy}
					className='rounded-xl border border-border px-3 py-2 text-sm font-medium text-text-secondary hover:bg-bg-hover'
				>
					Legacy knowledge graph
				</button>
			</div>

			<div className='rounded-2xl border border-border-subtle bg-bg-card p-4 shadow-card'>
				<label
					htmlFor='foodb-product-search'
					className='text-sm font-semibold text-text-primary'
				>
					Find a FooDB food
				</label>
				<div className='mt-2 flex flex-col gap-3 sm:flex-row'>
					<input
						id='foodb-product-search'
						value={query}
						onChange={event => setQuery(event.target.value)}
						placeholder='Search source food names…'
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
					Names locate FooDB records only. Ingredient linking is a separate,
					unresolved identity bridge.
				</p>
				{searchError && (
					<p className='mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-text-secondary' role='alert'>
						{searchError}
					</p>
				)}
				{search && (
					<div className='mt-3 space-y-2' aria-label='FooDB food results'>
						{search.foods.length ? (
							search.foods.map(food => (
								<button
									key={food.foodId}
									type='button'
									aria-pressed={selectedFood?.foodId === food.foodId}
					onClick={() => {
						setComposition(null)
						setCompositionError(null)
						setSelectedFood(food)
					}}
									className='flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-border-subtle bg-bg px-3 py-2 text-left hover:border-primary/50'
								>
									<span className='font-medium text-text-primary'>{food.name}</span>
									<span className='shrink-0 font-mono text-xs text-text-muted'>
										FooDB Food {food.foodId}
									</span>
								</button>
							))
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
				<div className='rounded-2xl border border-border-subtle bg-bg-card p-5 text-sm text-text-muted' role='status'>
					Loading pinned food relations…
				</div>
			)}
			{compositionError && (
				<div className='rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-text-secondary' role='alert'>
					{compositionError}
				</div>
			)}
			{composition && composition.food && (
				<section className='rounded-2xl border border-border-subtle bg-bg-card p-4 shadow-card' aria-label='Food compound relations'>
					<div className='flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle pb-4'>
						<div>
						<p className='text-xs font-semibold uppercase tracking-wide text-text-muted'>
							Food node
						</p>
						<h3 className='mt-1 text-lg font-bold text-text-primary'>
							{composition.food.name}
						</h3>
						<p className='mt-1 font-mono text-xs text-text-muted'>
							{composition.food.id}
						</p>
						</div>
						<span className='rounded-full bg-bg-elevated px-3 py-1 text-xs font-medium text-text-secondary'>
							FooDB 1.0 · 2020-04-07
						</span>
					</div>
					{composition.status === 'NO_ELIGIBLE_RELATION_UNKNOWN' ? (
						<p className='py-4 text-sm text-text-secondary'>
							No export-eligible relation is shown for this Food in the selected
							scope. Missing relations are unknown, not absent.
						</p>
					) : (
						<div className='py-4'>
							<h4 className='text-sm font-semibold text-text-primary'>
								Recorded compound-presence relations
							</h4>
							<ul className='mt-3 divide-y divide-border-subtle'>
								{composition.compounds.map(compound => (
									<li key={compound.id} className='grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center'>
										<div className='text-sm font-medium text-text-primary'>
											{composition.food?.name}
										</div>
										<div className='text-xs font-semibold text-primary'>
											→ compound present
										</div>
										<div>
											<div className='text-sm font-medium text-text-primary'>
												{compound.name}
											</div>
											<p className='mt-1 font-mono text-xs text-text-muted'>
												{compound.id}
											</p>
										</div>
									</li>
								))}
							</ul>
						</div>
					)}
					{composition.filteredKnownRelationCount > 0 && (
						<p className='border-t border-border-subtle pt-3 text-xs text-text-muted'>
							{composition.filteredKnownRelationCount} source-present relation(s)
								were withheld by the artifact’s export filter; they are not treated as
								absent.
						</p>
					)}
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

			<div className='rounded-xl border border-border-subtle bg-bg-elevated p-3 text-xs text-text-muted'>
				Source: FooDB 1.0 under CC BY-NC 4.0 · noncommercial use only. This view
				covers a selected top-255 profile scope, not every food or compound. A
				present edge is not a quantity, flavor, safety, allergen, nutrition, or
				substitution claim. Missing edges are unknown. Manifest:{' '}
				<code title={PRODUCT_GRAPH_MANIFEST_SHA256}>
					{PRODUCT_GRAPH_MANIFEST_SHA256.slice(0, 12)}…
				</code>
			</div>
		</section>
	)
}
