'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/layout/PageContainer'
import CookCardRenderer from '@/components/cook-card/CookCardRenderer'

function CookCardContent() {
	const searchParams = useSearchParams()
	const router = useRouter()
	const sessionId = searchParams.get('session')

	if (!sessionId) {
		return (
			<PageContainer>
				<div className='flex flex-col items-center gap-4 py-16 text-center'>
					<p className='text-text-secondary'>No cooking session specified.</p>
					<Button variant='outline' onClick={() => router.back()}>
						<ArrowLeft className='mr-2 size-4' />
						Go Back
					</Button>
				</div>
			</PageContainer>
		)
	}

	return (
		<PageContainer>
			<div className='mb-4'>
				<button
					onClick={() => router.back()}
					className='flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text'
				>
					<ArrowLeft className='size-4' />
					Back
				</button>
			</div>
			<div className='mx-auto max-w-md'>
				<h1 className='mb-6 text-2xl font-bold text-text'>Your Cook Card</h1>
				<CookCardRenderer sessionId={sessionId} />
			</div>
		</PageContainer>
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
