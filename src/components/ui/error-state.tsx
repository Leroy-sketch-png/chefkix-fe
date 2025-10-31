'use client'

import { AlertCircle, Home, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ErrorStateProps {
	title?: string
	message?: string
	showHomeButton?: boolean
	onRetry?: () => void
}

export const ErrorState = ({
	title = 'Something went wrong',
	message = 'We encountered an error while loading this content. Please try again.',
	showHomeButton = true,
	onRetry,
}: ErrorStateProps) => {
	return (
		<div className='flex min-h-[60vh] flex-col items-center justify-center px-4'>
			<div className='mx-auto max-w-md text-center'>
				<div className='mb-6 flex justify-center'>
					<div className='rounded-full bg-destructive/10 p-6'>
						<AlertCircle className='h-16 w-16 text-destructive' />
					</div>
				</div>

				<h1 className='mb-2 text-2xl font-bold'>{title}</h1>
				<p className='mb-8 text-muted-foreground'>{message}</p>

				<div className='flex flex-col gap-3 sm:flex-row sm:justify-center'>
					{onRetry && (
						<Button onClick={onRetry}>
							<RefreshCw className='mr-2 h-4 w-4' />
							Try Again
						</Button>
					)}
					{showHomeButton && (
						<Button variant={onRetry ? 'outline' : 'default'} asChild>
							<Link href='/dashboard'>
								<Home className='mr-2 h-4 w-4' />
								Go to Dashboard
							</Link>
						</Button>
					)}
				</div>
			</div>
		</div>
	)
}
