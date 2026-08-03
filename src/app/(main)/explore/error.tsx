'use client'

import { useEffect } from 'react'
import { ErrorState } from '@/components/ui/error-state'
import { logDevError } from '@/lib/dev-log'
import { useTranslations } from 'next-intl'

export default function ExploreError({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	const t = useTranslations('explore')

	useEffect(() => {
		logDevError('[ExploreError]', error)
	}, [error])

	return (
		<div className='flex min-h-[60vh] items-center justify-center p-4'>
			<ErrorState
				title={t('failedLoadRecipes')}
				message={
					process.env.NODE_ENV === 'development'
						? error.message || t('failedLoadRecipesDescription')
						: t('failedLoadRecipesDescription')
				}
				onRetry={reset}
			/>
		</div>
	)
}
