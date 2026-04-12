'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Award, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PageHeader } from '@/components/layout/PageHeader'
import CookCardRenderer from '@/components/cook-card/CookCardRenderer'
import { BUTTON_SUBTLE_TAP } from '@/lib/motion'
import { useTranslations } from '@/i18n/hooks'

function CookCardContent() {
	const t = useTranslations('cooking')
	const searchParams = useSearchParams()
	const router = useRouter()
	const sessionId = searchParams.get('session')

	if (!sessionId) {
		return (
			<PageContainer>
				<div className='flex flex-col items-center gap-4 py-16 text-center'>
					<p className='text-text-secondary'>{t('noSessionSpecified')}</p>
					<Button variant='outline' onClick={() => router.back()}>
						<ArrowLeft className='mr-2 size-4' />
						{t('goBack')}
					</Button>
				</div>
			</PageContainer>
		)
	}

	return (
		<PageTransition>
			<PageContainer>
				{/* Header with PageHeader */}
				<div className='mb-6 flex items-center gap-3'>
					<motion.button
						type='button'
						onClick={() => router.back()}
						whileTap={BUTTON_SUBTLE_TAP}
						className='flex size-10 items-center justify-center rounded-xl border border-border bg-bg-card text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text focus-visible:ring-2 focus-visible:ring-brand/50'
						aria-label={t('ariaGoBack')}
					>
						<ArrowLeft className='size-5' />
					</motion.button>
					<div className='flex-1'>
						<PageHeader
							icon={Award}
							title={t('cookCardTitle')}
							subtitle={t('cookCardSubtitle')}
							gradient='warm'
							subtitleIcon={Sparkles}
							marginBottom='sm'
							className='mb-0'
						/>
					</div>
				</div>

				<div className='mx-auto max-w-md'>
					<CookCardRenderer sessionId={sessionId} />
				</div>

				<div className='pb-40 md:pb-8' />
			</PageContainer>
		</PageTransition>
	)
}

export default function CookCardPage() {
	return (
		<Suspense
			fallback={
				<PageContainer>
					<div className='mx-auto max-w-md space-y-4'>
						<div className='h-6 w-40 animate-pulse rounded-lg bg-bg-elevated' />
						<div className='aspect-[4/5] w-full animate-pulse rounded-xl bg-bg-elevated' />
					</div>
				</PageContainer>
			}
		>
			<CookCardContent />
		</Suspense>
	)
}
