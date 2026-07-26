'use client'

import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/layout/PageContainer'
import { ErrorState } from '@/components/ui/error-state'
import { logDevError } from '@/lib/dev-log'
import { useTranslations } from '@/i18n/hooks'

export default function RecipeDetailError({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	const t = useTranslations('common')

	useEffect(() => {
		logDevError('[RecipeDetailError]', error)
	}, [error])

	return (
		<PageContainer maxWidth='2xl'>
			<div className='flex min-h-[60vh] items-center justify-center px-4 py-8'>
				<ErrorState
					title={t('somethingWentWrong')}
					message={
						process.env.NODE_ENV === 'development'
							? error.message || t('defaultErrorMessage')
							: t('defaultErrorMessage')
					}
					onRetry={reset}
					showHomeButton
					actions={
						<Button
							variant='outline'
							onClick={() => window.history.back()}
							className='gap-2'
						>
							<ArrowLeft className='size-4' />
							{t('goBack')}
						</Button>
					}
				/>
			</div>
		</PageContainer>
	)
}
