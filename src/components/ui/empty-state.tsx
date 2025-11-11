'use client'

import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ReactNode } from 'react'
import dynamic from 'next/dynamic'

const LottieAnimation = dynamic(
	() => import('@/components/shared/LottieAnimation'),
	{ ssr: false },
)

interface EmptyStateProps {
	icon?: LucideIcon
	title: string
	description: string
	actionLabel?: string
	actionHref?: string
	onAction?: () => void
	children?: ReactNode
	/** Optional Lottie animation to show instead of icon */
	lottieAnimation?: any
	/** Size calculator for Lottie animation */
	lottieSize?: (width: number, height: number) => number
}

export const EmptyState = ({
	icon: Icon,
	title,
	description,
	actionLabel,
	actionHref,
	onAction,
	children,
	lottieAnimation,
	lottieSize = (w, h) => Math.min(w * 0.3, h * 0.4, 300),
}: EmptyStateProps) => {
	return (
		<div className='flex min-h-content flex-col items-center justify-center px-4 py-12'>
			<div className='mx-auto max-w-md animate-fadeIn text-center'>
				{/* Show Lottie animation if provided, otherwise show icon */}
				{lottieAnimation ? (
					<div className='mb-6 flex justify-center'>
						<LottieAnimation
							lottie={lottieAnimation}
							sizeOfIllustrator={lottieSize}
							loop
							autoplay
						/>
					</div>
				) : Icon ? (
					<div className='mb-6 flex justify-center'>
						<div className='rounded-full bg-gradient-to-br from-primary/10 to-accent/10 p-8 shadow-lg'>
							<Icon className='h-16 w-16 text-primary' />
						</div>
					</div>
				) : null}

				<h3 className='mb-2 text-xl font-bold leading-tight text-text-primary'>
					{title}
				</h3>
				<p className='mb-6 leading-normal text-text-secondary'>{description}</p>

				{children ? (
					children
				) : (actionLabel && actionHref) || onAction ? (
					<Button asChild={!!actionHref} onClick={onAction} variant='gradient'>
						{actionHref ? (
							<Link href={actionHref}>{actionLabel}</Link>
						) : (
							actionLabel
						)}
					</Button>
				) : null}
			</div>
		</div>
	)
}
