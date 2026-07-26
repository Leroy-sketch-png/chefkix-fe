import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

const SKELETON_ITEMS = 4

export default function Loading() {
	return (
		<PageContainer maxWidth='2xl'>
			{/* PremiumSurface skeleton */}
			<div className='mb-4 rounded-2xl border border-border-subtle bg-bg-card p-3 shadow-card'>
				<div className='flex items-center gap-2'>
					<Skeleton className='h-4 w-16 rounded' />
					<Skeleton className='h-4 w-4 rounded' />
					<Skeleton className='h-4 w-32 rounded' />
				</div>
			</div>

			{/* Hero card skeleton */}
			<div className='mb-8 overflow-hidden rounded-2xl border-4 border-bg/80 bg-bg-card shadow-2xl'>
				<Skeleton className='h-72 w-full md:h-96' />

				<div className='px-6 pt-6 pb-6 md:px-10 md:pt-8 md:pb-8'>
					{/* Author skeleton */}
					<div className='mb-6 flex items-center gap-3'>
						<Skeleton className='size-12 rounded-full' />
						<div className='space-y-1.5'>
							<Skeleton className='h-5 w-32 rounded' />
							<Skeleton className='h-4 w-20 rounded' />
						</div>
					</div>

					{/* Stats row skeleton */}
					<div className='mb-6 flex flex-wrap items-center gap-6 border-y border-border-subtle py-5'>
						{Array.from({ length: 5 }).map((_, i) => (
							<div key={i} className='flex items-center gap-2'>
								<Skeleton className='size-5 rounded' />
								<Skeleton className='h-4 w-20 rounded' />
							</div>
						))}
					</div>

					{/* Action buttons skeleton */}
					<div className='mb-6 space-y-3'>
						<Skeleton className='h-14 w-full rounded-xl' />
						<div className='flex gap-2'>
							{Array.from({ length: SKELETON_ITEMS }).map((_, i) => (
								<Skeleton key={i} className='h-12 flex-1 rounded-xl' />
							))}
						</div>
						<div className='flex gap-2'>
							{Array.from({ length: 3 }).map((_, i) => (
								<Skeleton key={i} className='h-9 w-28 rounded-xl' />
							))}
						</div>
					</div>

					{/* Tags skeleton */}
					<div className='flex flex-wrap gap-2'>
						{Array.from({ length: 3 }).map((_, i) => (
							<Skeleton key={i} className='h-8 w-24 rounded-full' />
						))}
					</div>
				</div>
			</div>

			{/* XP section skeleton */}
			<div className='mb-8 rounded-2xl border border-xp/20 bg-bg-card p-6 shadow-card'>
				<div className='mb-4 flex items-center gap-2'>
					<Skeleton className='size-5 rounded' />
					<Skeleton className='h-6 w-40 rounded' />
				</div>
				<div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
					{Array.from({ length: SKELETON_ITEMS }).map((_, i) => (
						<div key={i} className='rounded-xl bg-bg-elevated p-4'>
							<Skeleton className='mx-auto mb-2 h-8 w-16 rounded' />
							<Skeleton className='mx-auto h-3 w-20 rounded' />
						</div>
					))}
				</div>
			</div>

			{/* Ingredients & Steps grid skeleton */}
			<div className='grid gap-8 lg:grid-cols-3'>
				<div className='lg:col-span-1'>
					<div className='rounded-2xl border border-border-subtle bg-bg-card p-6 shadow-card'>
						<div className='mb-4 flex items-center gap-2'>
							<Skeleton className='size-6 rounded' />
							<Skeleton className='h-7 w-28 rounded' />
						</div>
						<div className='space-y-2'>
							{Array.from({ length: 8 }).map((_, i) => (
								<div key={i} className='flex items-center gap-3 rounded-xl p-1'>
									<Skeleton className='size-5 rounded-full' />
									<Skeleton className='h-4 flex-1 rounded' />
								</div>
							))}
						</div>
					</div>
				</div>
				<div className='lg:col-span-2'>
					<div className='mb-6 flex items-center gap-2'>
						<Skeleton className='size-6 rounded' />
						<Skeleton className='h-7 w-28 rounded' />
					</div>
					<div className='space-y-4'>
						{Array.from({ length: 4 }).map((_, i) => (
							<div
								key={i}
								className='rounded-2xl border border-border-subtle bg-bg-card p-6 shadow-card'
							>
								<div className='mb-4 flex items-center gap-4'>
									<Skeleton className='size-12 shrink-0 rounded-xl' />
									<div className='flex-1 space-y-1.5'>
										<Skeleton className='h-5 w-48 rounded' />
										<Skeleton className='h-4 w-24 rounded' />
									</div>
								</div>
								<Skeleton className='h-4 w-full rounded' />
								<Skeleton className='mt-1.5 h-4 w-5/6 rounded' />
							</div>
						))}
					</div>
				</div>
			</div>
		</PageContainer>
	)
}
