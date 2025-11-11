'use client'

import { UserCardSkeleton } from './UserCardSkeleton'
import dynamic from 'next/dynamic'
import lottieLoading from '@/../../public/lottie/lottie-loading.json'

const LottieAnimation = dynamic(
	() => import('@/components/shared/LottieAnimation'),
	{ ssr: false },
)

export const DiscoverPageSkeleton = () => {
	return (
		<div className='container mx-auto max-w-3xl p-4'>
			{/* Centered Lottie loading animation */}
			<div className='mb-8 flex justify-center'>
				<LottieAnimation
					lottie={lottieLoading}
					sizeOfIllustrator={(w, h) => Math.min(w * 0.4, h * 0.5, 200)}
					loop
					autoplay
				/>
			</div>

			<div className='mb-6 space-y-2'>
				<div className='h-8 w-48 animate-pulse rounded bg-muted' />
				<div className='h-4 w-64 animate-pulse rounded bg-muted' />
			</div>

			<div className='space-y-4'>
				{[1, 2, 3, 4].map(i => (
					<UserCardSkeleton key={i} />
				))}
			</div>
		</div>
	)
}
