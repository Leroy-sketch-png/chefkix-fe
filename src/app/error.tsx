'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { ErrorState } from '@/components/ui/error-state'
import { logDevError } from '@/lib/dev-log'

export default function RootError({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	const t = useTranslations('nav')

	useEffect(() => {
		logDevError('[RootError]', error)
	}, [error])

	return (
		<div className='min-h-[60vh]'>
			<ErrorState
				title={t('eyebrows.errorTitle')}
				message={t('eyebrows.errorBody')}
				onRetry={reset}
				showHomeButton
			/>
		</div>
	)
}
