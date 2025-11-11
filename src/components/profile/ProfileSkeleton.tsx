'use client'

import { Skeleton } from '@/components/ui/skeleton'
import dynamic from 'next/dynamic'
import lottieLoading from '@/../public/lottie/lottie-loading.json'

const LottieAnimation = dynamic(
	() => import('@/components/shared/LottieAnimation'),
	{ ssr: false },
)

export const ProfileSkeleton = () => {
	return (
		<div className='mx-auto my-8 max-w-4xl'>
			{/* Centered Lottie loading animation */}
			<div className='mb-8 flex justify-center'>
				<LottieAnimation
					lottie={lottieLoading}
					sizeOfIllustrator={(w, h) => Math.min(w * 0.4, h * 0.5, 200)}
					loop
					autoplay
				/>
			</div>

			<div className='overflow-hidden rounded-lg border bg-card shadow-sm'>
				{/* Cover Photo Skeleton */}
				<Skeleton className='h-40 w-full rounded-none' />

				<div className='p-6'>
					<div className='relative -mt-20 flex items-end justify-between'>
						{/* Avatar Skeleton */}
						<Skeleton className='h-32 w-32 rounded-full border-4 border-card' />

						{/* Action Buttons Skeleton */}
						<div className='flex gap-2'>
							<Skeleton className='h-10 w-24' />
							<Skeleton className='h-10 w-32' />
							<Skeleton className='h-10 w-28' />
						</div>
					</div>

					{/* Name & Bio Skeleton */}
					<div className='mt-4 space-y-2'>
						<Skeleton className='h-8 w-48' />
						<Skeleton className='h-5 w-32' />
						<Skeleton className='mt-2 h-4 w-full max-w-md' />
						<Skeleton className='h-4 w-3/4' />
					</div>

					{/* Stats Skeleton */}
					<div className='mt-6 flex justify-around border-t border-b py-4'>
						{[1, 2, 3].map(i => (
							<div key={i} className='text-center'>
								<Skeleton className='mx-auto mb-2 h-6 w-16' />
								<Skeleton className='mx-auto h-4 w-20' />
							</div>
						))}
					</div>

					{/* Tabs Skeleton */}
					<div className='mt-6 flex justify-around'>
						{[1, 2, 3].map(i => (
							<Skeleton key={i} className='h-6 w-24' />
						))}
					</div>
				</div>
			</div>

			{/* Recipe Cards Skeleton */}
			<div className='mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
				{[1, 2, 3].map(i => (
					<div
						key={i}
						className='overflow-hidden rounded-lg border bg-card shadow-sm'
					>
						<Skeleton className='h-48 w-full rounded-none' />
						<div className='p-4 space-y-3'>
							<Skeleton className='h-6 w-3/4' />
							<div className='flex gap-4'>
								<Skeleton className='h-4 w-16' />
								<Skeleton className='h-4 w-16' />
							</div>
							<Skeleton className='h-10 w-full' />
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
