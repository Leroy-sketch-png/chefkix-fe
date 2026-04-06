'use client'

import { AlertCircle, Home, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useTranslations } from '@/i18n/hooks'

const LottieAnimation = dynamic(
	() => import('@/components/shared/LottieAnimation'),
	{ ssr: false },
)

interface ErrorStateProps {
	title?: string
	message?: string
	showHomeButton?: boolean
	onRetry?: () => void
	/** Optional Lottie animation to show instead of AlertCircle icon */
	lottieAnimation?: object
	/** Size calculator for Lottie animation */
	lottieSize?: (width: number, height: number) => number
}

export const ErrorState = ({
	title,
	message,
	showHomeButton = true,
	onRetry,
	lottieAnimation,
	lottieSize = (w, h) => Math.min(w * 0.3, h * 0.4, 300),
}: ErrorStateProps) => {
	const t = useTranslations('common')
	const displayTitle = title || t('somethingWentWrong')
	const displayMessage = message || t('defaultErrorMessage')
	return (
		<div className='flex min-h-content-tall flex-col items-center justify-center px-4'>
			<div className='mx-auto max-w-md text-center' role='alert'>
				{/* Show Lottie animation if provided, otherwise show AlertCircle icon */}
				{lottieAnimation ? (
					<div className='mb-6 flex justify-center'>
						<LottieAnimation
							lottie={lottieAnimation}
							sizeOfIllustrator={lottieSize}
							loop
							autoplay
						/>
					</div>
				) : (
					<div className='mb-6 flex justify-center'>
						<div className='rounded-full bg-destructive/10 p-6'>
							<AlertCircle className='size-16 text-destructive' />
						</div>
					</div>
				)}

				<h1 className='mb-2 text-2xl font-bold leading-tight text-text-primary'>
					{displayTitle}
				</h1>
				<p className='mb-8 leading-normal text-text-secondary'>{displayMessage}</p>

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
				</div>
			</div>
		</div>
	)
}
