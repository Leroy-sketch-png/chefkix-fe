import type { GraphEdge, GraphNode } from '../types'

function formatDelta(value: number | undefined) {
	if (value === undefined) return 'Pending'
	return `${value > 0 ? '+' : ''}${value.toFixed(1)} g`
}

function compoundLabel(
	compound: NonNullable<GraphNode['compoundData']>['primaryCompounds'][number],
) {
	if (typeof compound === 'string') return compound
	return compound.concentration === undefined
		? compound.name
		: `${compound.name} · ${compound.concentration}${compound.unit ?? ''}`
}

export function GraphNodeDetailPanel({
	node,
	connectionCount,
}: {
	node: GraphNode
	connectionCount: number
}) {
	const compounds = node.compoundData?.primaryCompounds.slice(0, 5) ?? []
	return (
		<section
			className='border-t border-border-subtle p-4 text-sm'
			aria-label='Ingredient details'
		>
			<div className='flex flex-wrap items-start justify-between gap-2'>
				<div>
					<div className='font-semibold text-text-primary'>{node.name}</div>
					<div className='mt-1 text-xs text-text-muted'>
						Category: {node.category} · Connections: {connectionCount}
					</div>
				</div>
				<span className='rounded-full border border-border-subtle bg-bg-elevated px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted'>
					{node.detailStatus === 'complete'
						? 'Loaded detail'
						: 'Detail pending'}
				</span>
			</div>

			<div className='mt-3 rounded-xl bg-bg-elevated p-3'>
				<div className='font-medium text-text-primary'>Allergen flags</div>
				<div className='mt-1 text-text-muted'>
					{node.allergenFlags.length
						? node.allergenFlags.join(', ')
						: 'None recorded'}
				</div>
			</div>

			<div className='mt-3 rounded-xl bg-bg-elevated p-3'>
				<div className='font-medium text-text-primary'>
					Top flavor molecules
				</div>
				{compounds.length ? (
					<ul className='mt-2 space-y-1 text-text-muted'>
						{compounds.map((compound, index) => (
							<li key={`${compoundLabel(compound)}-${index}`}>
								{index + 1}. {compoundLabel(compound)}
							</li>
						))}
					</ul>
				) : (
					<p className='mt-1 text-text-muted'>Pending FooDB compound profile</p>
				)}
				{node.compoundData?.flavorProfile && (
					<p className='mt-2 text-text-muted'>
						Flavor profile: {node.compoundData.flavorProfile}
					</p>
				)}
			</div>

			<div className='mt-3 rounded-xl bg-bg-elevated p-3'>
				<div className='font-medium text-text-primary'>
					USDA nutrition snapshot
				</div>
				{node.nutrition ? (
					<div className='mt-2 grid grid-cols-2 gap-2 text-xs text-text-muted'>
						<div>Calories: {node.nutrition.calories ?? 'Pending'}</div>
						<div>Protein: {node.nutrition.proteinGrams ?? 'Pending'} g</div>
						<div>Carbs: {node.nutrition.carbohydratesGrams ?? 'Pending'} g</div>
						<div>Fat: {node.nutrition.fatGrams ?? 'Pending'} g</div>
					</div>
				) : (
					<p className='mt-1 text-text-muted'>
						Pending USDA nutrition snapshot
					</p>
				)}
			</div>
		</section>
	)
}

export function GraphEdgeDetailPanel({
	edge,
	sourceName,
	targetName,
}: {
	edge: GraphEdge
	sourceName?: string
	targetName?: string
}) {
	const technique = edge.techniqueContext
	const comparison = edge.nutritionalComparison
	return (
		<section
			className='border-t border-border-subtle p-4 text-sm'
			aria-label='Relationship details'
		>
			<div className='font-semibold text-text-primary'>
				{edge.type.replace('_', ' ')} relationship
			</div>
			<div className='mt-1 text-text-muted'>
				{sourceName ?? edge.source} → {targetName ?? edge.target}
			</div>
			<div className='mt-1 text-text-muted'>
				Confidence: {(edge.confidence * 100).toFixed(0)}% · Context:{' '}
				{edge.context || 'Pending'}
			</div>

			<div className='mt-3 grid gap-3 sm:grid-cols-2'>
				<div className='rounded-xl bg-bg-elevated p-3'>
					<div className='font-medium text-text-primary'>Compound overlap</div>
					<div className='mt-1 text-text-muted'>
						{edge.compoundOverlap === undefined
							? 'Pending FooDB comparison'
							: `${(edge.compoundOverlap * 100).toFixed(0)}% shared compounds`}
					</div>
				</div>
				<div className='rounded-xl bg-bg-elevated p-3'>
					<div className='font-medium text-text-primary'>Cook validation</div>
					<div className='mt-1 text-text-muted'>
						{edge.cookValidationCount === undefined
							? 'Pending validation events'
							: `${edge.cookValidationCount} validated cooks`}
					</div>
				</div>
			</div>

			<div className='mt-3 rounded-xl bg-bg-elevated p-3'>
				<div className='font-medium text-text-primary'>
					Nutritional comparison
				</div>
				{comparison ? (
					<div className='mt-2 space-y-1 text-xs text-text-muted'>
						{comparison.summary && <p>{comparison.summary}</p>}
						<p>Calories: {comparison.caloriesDelta ?? 'Pending'}</p>
						<p>Protein: {formatDelta(comparison.proteinGramsDelta)}</p>
						<p>Carbs: {formatDelta(comparison.carbohydratesGramsDelta)}</p>
						<p>Fat: {formatDelta(comparison.fatGramsDelta)}</p>
					</div>
				) : (
					<p className='mt-1 text-text-muted'>Pending USDA comparison</p>
				)}
			</div>

			<div className='mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3'>
				<div className='font-medium text-text-primary'>Technique context</div>
				{technique ? (
					<div className='mt-2 space-y-1 text-xs text-text-muted'>
						<p>Works for: {technique.worksFor?.join(', ') || 'Pending'}</p>
						<p>
							Not recommended for:{' '}
							{technique.notRecommendedFor?.join(', ') || 'Pending'}
						</p>
						{technique.note && <p>{technique.note}</p>}
					</div>
				) : (
					<p className='mt-1 text-text-muted'>
						Pending technique validation, for example baking versus frying.
					</p>
				)}
			</div>
		</section>
	)
}
