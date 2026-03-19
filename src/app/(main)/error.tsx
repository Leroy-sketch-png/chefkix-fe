'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import { logDevError } from '@/lib/dev-log'

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
	useEffect(() => {
		logDevError('[MainError] Route error caught:', error)
	}, [error])

	return (
		<div className='flex min-h-[60vh] flex-col items-center justify-center px-4'>
			<div className='mx-auto max-w-md text-center'>
				{/* Icon */}
				<div className='mb-6 flex justify-center'>
					<div className='flex size-20 items-center justify-center rounded-full bg-brand/10'>
						<span className='text-4xl'>🍳</span>
					</div>
				</div>

				<h2 className='mb-2 text-xl font-bold text-text'>
					Something went wrong
				</h2>
				<p className='mb-6 text-sm leading-relaxed text-text-secondary'>
					We hit a bump in the kitchen. This error has been noted — you can try
					again or head back to the dashboard.
				</p>

				{process.env.NODE_ENV === 'development' && (
					<details className='mb-6 rounded-radius border border-border-subtle bg-bg-elevated p-3 text-left'>
						<summary className='cursor-pointer text-xs font-medium text-text-muted'>
							Error details (dev only)
						</summary>
						<pre className='mt-2 overflow-auto text-xs text-error'>
							{error.message}
							{error.digest && `\nDigest: ${error.digest}`}
						</pre>
					</details>
				)}

				<div className='flex flex-col gap-3 sm:flex-row sm:justify-center'>
					<Button onClick={reset} className='h-11 gap-2'>
						<RefreshCw className='size-4' />
						Try Again
					</Button>
					<Button variant='outline' asChild className='h-11 gap-2'>
						<Link href='/dashboard'>
							<Home className='size-4' />
							Dashboard
						</Link>
					</Button>
				</div>
			</div>
		</div>
	)
}
