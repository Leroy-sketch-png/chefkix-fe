import { GraphExplorer } from '@/features/graph-explorer/components/GraphExplorer'

export default function PublicGraphExplorerPage() {
	return (
		<main className='mx-auto w-full max-w-7xl space-y-6 px-4 py-8'>
			<div>
				<p className='text-xs font-semibold uppercase tracking-[0.2em] text-primary'>
					IRON CHEF v3 · Demo
				</p>
				<h1 className='mt-2 text-3xl font-bold text-text-primary'>
					Ingredient Knowledge Graph
				</h1>
				<p className='mt-2 max-w-2xl text-sm text-text-muted'>
					Explore ingredient substitutions, confidence signals, and allergen
					context using the showcase graph.
				</p>
			</div>
			<GraphExplorer />
		</main>
	)
}
