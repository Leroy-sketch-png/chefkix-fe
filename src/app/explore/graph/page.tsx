import { GraphExplorer } from '@/features/graph-explorer/components/GraphExplorer'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PATHS } from '@/constants'

export default function PublicGraphExplorerPage() {
	const graphExplorerEnabled =
		process.env.NEXT_PUBLIC_GRAPH_EXPLORER_ENABLED === 'true'

	return (
		<main className='mx-auto w-full max-w-[1440px] space-y-6 px-4 py-8 md:px-8'>
			<Link
				href={PATHS.EXPLORE}
				className='inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
			>
				<ArrowLeft aria-hidden='true' className='size-4' />
				Back to Explore
			</Link>
			<header>
				<div>
					<h1 className='max-w-3xl text-3xl font-bold tracking-tight text-text-primary md:text-4xl'>
						Explore food records
					</h1>
					<p className='mt-3 max-w-2xl text-sm leading-6 text-text-muted md:text-base'>
						{graphExplorerEnabled
							? 'Search the pinned FooDB subset, choose a food record, and inspect the compounds it links to.'
							: 'The pinned product graph is not available right now.'}
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
