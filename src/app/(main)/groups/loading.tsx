import { PageContainer } from '@/components/layout/PageContainer'

export default function Loading() {
	return (
		<PageContainer maxWidth='xl'>
			{/* Header */}
			<div className='mb-6'>
				<div className='mb-2 flex items-center gap-3'>
					<div className='size-12 animate-pulse rounded-2xl bg-bg-elevated/40' />
					<div className='h-9 w-32 animate-pulse rounded-lg bg-bg-elevated/40' />
				</div>
				<div className='h-5 w-72 animate-pulse rounded-lg bg-bg-elevated/40' />
			</div>

			{/* Group card grid */}
			<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						key={i}
						className='rounded-xl border border-border-subtle bg-bg-card p-4'
					>
						<div className='mb-3 flex items-center gap-3'>
							<div className='size-12 animate-pulse rounded-full bg-bg-elevated/40' />
							<div className='flex-1 space-y-2'>
								<div className='h-5 w-28 animate-pulse rounded bg-bg-elevated/40' />
								<div className='h-3 w-20 animate-pulse rounded bg-bg-elevated/40' />
							</div>
						</div>
						<div className='h-4 w-full animate-pulse rounded bg-bg-elevated/40' />
						<div className='mt-2 h-4 w-3/4 animate-pulse rounded bg-bg-elevated/40' />
					</div>
				))}
			</div>
		</PageContainer>
	)
}
