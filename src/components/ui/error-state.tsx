'use client'

import type { ReactNode } from 'react'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useTranslations } from '@/i18n/hooks'
import { cn } from '@/lib/utils'

const LottieAnimation = dynamic(
	() => import('@/components/shared/LottieAnimation'),
	{ ssr: false },
)

interface ErrorStateProps {
	title?: string
	message?: string
	showHomeButton?: boolean
	compactOnMobile?: boolean
	onRetry?: () => void
	actions?: ReactNode
	/** Optional Lottie animation to show instead of AlertCircle icon */
	lottieAnimation?: object
	/** Size calculator for Lottie animation */
	lottieSize?: (width: number, height: number) => number
}

export const ErrorState = ({
	title,
	message,
	showHomeButton = true,
	compactOnMobile = false,
	onRetry,
	actions,
	lottieAnimation,
	lottieSize = (w, h) => Math.min(w * 0.3, h * 0.4, 300),
}: ErrorStateProps) => {
	const t = useTranslations('common')
	const displayTitle = title || t('somethingWentWrong')
	const displayMessage = message || t('defaultErrorMessage')
	return (
		<div
			className={cn(
				'flex flex-col items-center justify-center px-4',
				compactOnMobile
					? 'min-h-0 py-4 sm:min-h-content-tall'
					: 'min-h-content-tall',
			)}
		>
			<div className='mx-auto max-w-md text-center' role='alert'>
				{/* Show Lottie animation if provided, otherwise show AlertCircle icon */}
				{lottieAnimation ? (
					<div className={cn('mb-6 flex justify-center', compactOnMobile && 'mb-3 sm:mb-6')}>
						<LottieAnimation
							lottie={lottieAnimation}
							sizeOfIllustrator={lottieSize}
							loop
							autoplay
						/>
					</div>
				) : (
					<div className='mb-6 flex justify-center'>
						<div className={cn('rounded-full bg-destructive/10 p-6', compactOnMobile && 'p-3 sm:p-6')}>
							<AlertCircle className={cn('size-16 text-destructive', compactOnMobile && 'size-10 sm:size-16')} />
						</div>
					</div>
				)}

				<h1 className={cn('mb-2 text-2xl font-bold leading-tight text-text-primary', compactOnMobile && 'text-lg sm:text-2xl')}>
					{displayTitle}
				</h1>
				<p className={cn('mb-8 leading-normal text-text-secondary', compactOnMobile && 'mb-4 text-sm sm:mb-8 sm:text-base')}>
					{displayMessage}
				</p>

				<div className='flex flex-col gap-3 sm:flex-row sm:justify-center'>
					{onRetry && (
						<Button onClick={onRetry} className='h-11'>
							<RefreshCw className='size-4' />
						{t('tryAgain')}
						</Button>
					)}
					{showHomeButton && (
						<Button
							variant={onRetry ? 'outline' : 'default'}
							asChild
							className='h-11'
						>
							<Link href='/dashboard'>
								<Home className='size-4' />
								{t('goToDashboard')}
							</Link>
						</Button>
					)}
					{actions}
				</div>
			</div>
		</div>
	)
}
