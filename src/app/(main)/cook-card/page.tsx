'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Award, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import CookCardRenderer from '@/components/cook-card/CookCardRenderer'
import { TRANSITION_SPRING } from '@/lib/motion'

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
		<PageTransition>
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

				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={TRANSITION_SPRING}
					className='mb-6'
				>
					<div className='mb-2 flex items-center gap-3'>
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 0.2, ...TRANSITION_SPRING }}
							className='flex size-12 items-center justify-center rounded-2xl bg-gradient-gold shadow-card shadow-level/25'
						>
							<Award className='size-6 text-white' />
						</motion.div>
						<h1 className='text-3xl font-bold text-text'>Your Cook Card</h1>
					</div>
					<p className='flex items-center gap-2 text-text-secondary'>
						<Sparkles className='size-4 text-streak' />A keepsake from your
						cooking session
					</p>
				</motion.div>

				<div className='mx-auto max-w-md'>
					<CookCardRenderer sessionId={sessionId} />
				</div>
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
