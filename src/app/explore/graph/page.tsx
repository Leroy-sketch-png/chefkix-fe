import { GraphExplorer } from '@/features/graph-explorer/components/GraphExplorer'

export default function PublicGraphExplorerPage() {
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
						Follow documented swaps and other ingredient relationships. Select a
						connection for its context, or browse the full ingredient index to
						inspect an ingredient.
					</p>
				</div>
			</header>
			<GraphExplorer />
		</main>
	)
}
