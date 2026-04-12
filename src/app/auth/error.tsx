'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { logDevError } from '@/lib/dev-log'
import { PATHS } from '@/constants'
import { useTranslations } from 'next-intl'

/**
 * Route-level error boundary for the auth route group.
 * Catches unhandled errors in sign-in, sign-up, verify-otp pages.
 */
export default function AuthError({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	const t = useTranslations('shared')

	useEffect(() => {
		logDevError('[AuthError] Route error caught:', error)
	}, [error])

	return (
		<div className='flex min-h-screen flex-col items-center justify-center bg-bg px-4'>
			<div className='mx-auto max-w-sm text-center'>
				<div className='mb-6 flex justify-center'>
					<div className='flex size-16 items-center justify-center rounded-full bg-brand/10'>
						<span className='text-3xl'>🔑</span>
					</div>
				</div>

				<h2 className='mb-2 text-xl font-bold text-text'>
					{t('authErrorTitle')}
				</h2>
				<p className='mb-6 text-sm leading-relaxed text-text-secondary'>
					{t('authErrorDesc')}
				</p>

				{process.env.NODE_ENV === 'development' && (
					<details className='mb-6 rounded-radius border border-border-subtle bg-bg-elevated p-3 text-left'>
						<summary className='cursor-pointer text-xs font-medium text-text-muted'>
							{t('errorDevDetails')}
						</summary>
						<pre className='mt-2 overflow-auto text-xs text-error'>
							{error.message}
						</pre>
					</details>
				)}

				<div className='flex flex-col gap-3 sm:flex-row sm:justify-center'>
					<Button onClick={reset} className='h-11 gap-2'>
						<RefreshCw className='size-4' />
						{t('tryAgain')}
					</Button>
					<Button variant='outline' asChild className='h-11 gap-2'>
						<Link href={PATHS.AUTH.SIGN_IN}>{t('backToSignIn')}</Link>
					</Button>
				</div>
			</div>
		</div>
	)
}
