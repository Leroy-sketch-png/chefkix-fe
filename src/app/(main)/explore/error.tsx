'use client'

import { ErrorState } from '@/components/ui/error-state'
import { useTranslations } from 'next-intl'

export default function ExploreError({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	const t = useTranslations('explore')

	return (
		<div className='flex min-h-[60vh] items-center justify-center p-4'>
			<ErrorState
				title={t('failedLoadRecipes')}
				message={error.message || t('failedLoadRecipesDescription')}
				onRetry={reset}
			/>
		</div>
	)
}
