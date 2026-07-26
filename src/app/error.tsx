'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { logDevError } from '@/lib/dev-log'

export default function RootError({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	const t = useTranslations('common')
	useEffect(() => {
		logDevError('[RootError]', error)
	}, [error])

	return (
		<div className='flex min-h-[60vh] items-center justify-center p-8'>
			<div className='max-w-xs text-center'>
				<div className='mb-4 text-5xl'>🍳</div>
				<h2 className='mb-2 text-xl font-bold text-text-primary'>
					{t('eyebrows.errorTitle')}
				</h2>
				<p className='mb-6 text-sm text-text-muted'>
					{t('eyebrows.errorBody')}
				</p>
				{process.env.NODE_ENV === 'development' && (
					<pre className='mb-4 overflow-auto rounded-lg bg-error/10 p-3 text-left text-xs text-error'>
						{error.message}
					</pre>
				)}
				<button
					onClick={reset}
					className='cursor-pointer rounded-lg bg-brand px-6 py-2 font-semibold text-white'
				>
					{t('eyebrows.errorTryAgain')}
				</button>
			</div>
		</div>
	)
}
