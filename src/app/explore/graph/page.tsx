import { GraphExplorer } from '@/features/graph-explorer/components/GraphExplorer'

export default function PublicGraphExplorerPage() {
	const graphExplorerEnabled =
		process.env.NEXT_PUBLIC_GRAPH_EXPLORER_ENABLED === 'true'

	return (
		<main className='mx-auto w-full max-w-[1440px] space-y-6 px-4 py-8 md:px-8'>
			<header className='relative overflow-hidden rounded-3xl border border-border-subtle bg-bg-card px-6 py-6 shadow-sm md:px-8 md:py-7'>
				<div className='pointer-events-none absolute -right-12 -top-28 size-80 rounded-full bg-primary/10 blur-3xl' />
				<div className='relative'>
					<p className='text-xs font-bold uppercase tracking-[0.22em] text-primary'>
						IRON CHEF · INGREDIENT INTELLIGENCE
					</p>
					<h1 className='mt-2 max-w-3xl text-3xl font-bold tracking-tight text-text-primary md:text-4xl'>
						Explore how ingredients connect.
					</h1>
					<p className='mt-3 max-w-2xl text-sm leading-6 text-text-muted md:text-base'>
						{graphExplorerEnabled
							? 'Follow documented swaps and other ingredient relationships. Select a connection for its context, or browse the full ingredient index to inspect an ingredient.'
							: 'Verified graph data is not available yet. This view stays off until a hash-pinned graph artifact is accepted.'}
					</p>
				</div>
			</header>
			{graphExplorerEnabled ? (
				<GraphExplorer />
			) : (
				<section
					aria-label='Graph Explorer availability'
					className='rounded-2xl border border-border-subtle bg-bg-card p-5 text-sm text-text-muted'
					data-testid='graph-explorer-disabled'
					role='status'
				>
					Graph Explorer is disabled until verified graph data is configured.
				</section>
			)}
		</main>
	)
}
