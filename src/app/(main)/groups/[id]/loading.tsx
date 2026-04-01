export default function Loading() {
	return (
		<main className='min-h-screen py-8 pb-48'>
			<div className='mx-auto max-w-4xl px-4 pb-12 sm:px-6 lg:px-8'>
				{/* Group Header Skeleton */}
				<div className='mb-8 space-y-4'>
					<div className='h-48 w-full animate-pulse rounded-xl bg-bg-elevated/40' />
					<div className='flex items-center gap-4'>
						<div className='size-16 animate-pulse rounded-full bg-bg-elevated/40' />
						<div className='flex-1 space-y-2'>
							<div className='h-6 w-44 animate-pulse rounded bg-bg-elevated/40' />
							<div className='h-4 w-32 animate-pulse rounded bg-bg-elevated/40' />
						</div>
						<div className='h-10 w-24 animate-pulse rounded-full bg-bg-elevated/40' />
					</div>
				</div>

				{/* Tabs Skeleton */}
				<div className='mb-6'>
					<div className='grid w-full grid-cols-3 gap-1 rounded-lg bg-bg-elevated/30 p-1'>
						{['About', 'Members', 'Posts'].map(tab => (
							<div
								key={tab}
								className='h-9 animate-pulse rounded-md bg-bg-elevated/40'
							/>
						))}
					</div>
				</div>

				{/* Content Skeleton */}
				<div className='space-y-4'>
					{Array.from({ length: 3 }).map((_, i) => (
						<div
							key={i}
							className='rounded-xl border border-border-subtle bg-bg-card p-6'
						>
							<div className='mb-3 h-5 w-32 animate-pulse rounded bg-bg-elevated/40' />
							<div className='space-y-2'>
								<div className='h-4 w-full animate-pulse rounded bg-bg-elevated/40' />
								<div className='h-4 w-3/4 animate-pulse rounded bg-bg-elevated/40' />
							</div>
						</div>
					))}
				</div>
			</div>
		</main>
	)
}
