'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Home, Compass, Search } from 'lucide-react'
import Link from 'next/link'
import { logDevError } from '@/lib/dev-log'
import { useTranslations } from 'next-intl'

/**
 * Route-level error boundary for the (main) route group.
 * Catches unhandled errors in any page under (main)/ and shows a recovery UI.
 * Next.js automatically wraps this in a React Error Boundary.
 */
export default function MainError({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	const t = useTranslations('shared')

	useEffect(() => {
		logDevError('[MainError] Route error caught:', error)
	}, [error])

	return (
		<div className='flex min-h-[60vh] flex-col items-center justify-start px-4 pb-24 pt-10 md:justify-center md:pb-8 md:pt-0'>
			<div className='mx-auto max-w-md text-center'>
				{/* Icon */}
				<div className='mb-6 flex justify-center'>
					<div className='flex size-20 items-center justify-center rounded-full bg-brand/10'>
						<span className='text-4xl'>🍳</span>
					</div>
				</div>

				<h2 className='mb-2 text-xl font-bold text-text'>{t('errorTitle')}</h2>
				<p className='mb-6 text-sm leading-relaxed text-text-secondary'>
					{t('errorKitchenBump')}
				</p>

				{process.env.NODE_ENV === 'development' && (
					<details className='mb-6 rounded-radius border border-border-subtle bg-bg-elevated p-3 text-left'>
						<summary className='cursor-pointer text-xs font-medium text-text-muted'>
							{t('errorDevDetails')}
						</summary>
						<pre className='mt-2 overflow-auto text-xs text-error'>
							{error.message}
							{error.digest && `\nDigest: ${error.digest}`}
						</pre>
					</details>
				)}

				<div className='flex flex-col gap-3 sm:flex-row sm:justify-center'>
					<Button onClick={reset} className='h-11 w-full gap-2 sm:w-auto'>
						<RefreshCw className='size-4' />
						{t('tryAgain')}
					</Button>
					<Button
						variant='outline'
						asChild
						className='h-11 w-full gap-2 sm:w-auto'
					>
						<Link href='/dashboard'>
							<Home className='size-4' />
							{t('dashboard')}
						</Link>
					</Button>
				</div>

				<div className='mt-3 grid grid-cols-2 gap-2'>
					<Button
						variant='ghost'
						asChild
						className='h-10 gap-2 border border-border-subtle'
					>
						<Link href='/explore'>
							<Compass className='size-4' />
							{t('explore')}
						</Link>
					</Button>
					<Button
						variant='ghost'
						asChild
						className='h-10 gap-2 border border-border-subtle'
					>
						<Link href='/search'>
							<Search className='size-4' />
							{t('search')}
						</Link>
					</Button>
				</div>
			</div>
		</div>
	)
}
