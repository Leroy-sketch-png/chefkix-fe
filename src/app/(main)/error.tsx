'use client'

import { useEffect } from 'react'
import { ErrorState } from '@/components/ui/error-state'
import { logDevError } from '@/lib/dev-log'
import { useTranslations } from '@/i18n/hooks'

export default function MainAppError({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	const t = useTranslations('common')

	useEffect(() => {
		logDevError('[MainAppError]', error)
	}, [error])

	return (
		<div className='flex min-h-[60vh] items-center justify-center px-4 py-8'>
			<ErrorState
				title={t('somethingWentWrong')}
				message={
					process.env.NODE_ENV === 'development'
						? error.message || t('unexpectedError')
						: t('defaultErrorMessage')
				}
				onRetry={reset}
			/>
		</div>
	)
}
