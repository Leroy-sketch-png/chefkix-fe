'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCookingStore } from '@/store/cookingStore'
import { useUiStore } from '@/store/uiStore'
import { getCurrentSession, CookingSession } from '@/services/cookingSession'
import { getRecipeById } from '@/services/recipe'
import { Button } from '@/components/ui/button'
import { Play, X, ChefHat, Clock, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	fadeInUp,
	BUTTON_HOVER,
	BUTTON_TAP,
} from '@/lib/motion'
import Image from 'next/image'

interface ResumeCookingBannerProps {
	className?: string
}

/**
 * ResumeCookingBanner - Shows when user has an interrupted/paused cooking session
 *
 * RECOVERY.3: Critical UX for session recovery on return visit.
 * - Checks for active sessions on mount
 * - Shows prominent CTA to resume cooking
 * - Displays session progress and recipe info
 */
export const ResumeCookingBanner = ({
	className,
}: ResumeCookingBannerProps) => {
	const [pendingSession, setPendingSession] = useState<CookingSession | null>(
		null,
	)
	const [recipeName, setRecipeName] = useState<string>('')
	const [recipeImage, setRecipeImage] = useState<string>('')
	const [isDismissed, setIsDismissed] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [isResuming, setIsResuming] = useState(false)

	const { session: activeStoreSession, resumeExistingSession } =
		useCookingStore()
	const { expandCookingPanel, cookingMode } = useUiStore()

	// Check for pending session on mount
	useEffect(() => {
		const checkForPendingSession = async () => {
			// Skip if already have an active session in store or cooking UI is open
			if (activeStoreSession || cookingMode !== 'hidden') {
				setIsLoading(false)
				return
			}

			try {
				const response = await getCurrentSession()
				if (
					response.success &&
					response.data &&
					response.data.recipeId && // Guard: ensure recipeId exists
					(response.data.status === 'in_progress' ||
						response.data.status === 'paused')
				) {
					setPendingSession(response.data)

					// Fetch recipe details for display
					const recipeResponse = await getRecipeById(response.data.recipeId)
					if (recipeResponse.success && recipeResponse.data) {
						setRecipeName(recipeResponse.data.title)
						setRecipeImage(
							recipeResponse.data.coverImageUrl?.[0] ||
								'/placeholder-recipe.jpg',
						)
					}
				}
			} catch {
				// Silently fail - no pending session
			} finally {
				setIsLoading(false)
			}
		}

		checkForPendingSession()
	}, [activeStoreSession, cookingMode])

	const handleResume = async () => {
		if (!pendingSession) return

		setIsResuming(true)
		try {
			const success = await resumeExistingSession()
			if (success) {
				expandCookingPanel()
				setPendingSession(null) // Clear banner
			}
		} finally {
			setIsResuming(false)
		}
	}

	const handleDismiss = () => {
		setIsDismissed(true)
	}

	// Calculate progress
	const completedSteps = pendingSession?.completedSteps?.length ?? 0
	const totalSteps = pendingSession?.completedSteps
		? Math.max(completedSteps + 1, pendingSession.currentStep ?? 1)
		: 1
	const progressPercent =
		totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

	// Don't show if loading, dismissed, no pending session, or already cooking
	if (
		isLoading ||
		isDismissed ||
		!pendingSession ||
		activeStoreSession ||
		cookingMode !== 'hidden'
	) {
		return null
	}

	const isPaused = pendingSession.status === 'paused'

	return (
		<AnimatePresence>
			<motion.div
				className={cn(
					'relative overflow-hidden rounded-2xl border',
					'bg-gradient-to-r from-brand/10 via-brand/5 to-transparent',
					'border-brand/20 shadow-warm',
					className,
				)}
				variants={fadeInUp}
				initial='hidden'
				animate='visible'
				exit='hidden'
				transition={TRANSITION_SPRING}
			>
				{/* Dismiss button */}
				<button
					onClick={handleDismiss}
					className='absolute right-3 top-3 z-10 rounded-full p-1.5 text-text-muted hover:bg-bg-elevated hover:text-text transition-colors'
					aria-label='Dismiss'
				>
					<X className='size-4' />
				</button>

				<div className='flex flex-col gap-4 p-4 md:flex-row md:items-center md:gap-6 md:p-5'>
					{/* Recipe image */}
					{recipeImage && (
						<div className='relative size-16 shrink-0 overflow-hidden rounded-xl md:size-20'>
							<Image
								src={recipeImage}
								alt={recipeName}
								fill
								className='object-cover'
							/>
							{/* Progress ring overlay */}
							<div className='absolute inset-0 flex items-center justify-center bg-black/30'>
								<div className='flex size-10 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-brand'>
									{progressPercent}%
								</div>
							</div>
						</div>
					)}

					{/* Content */}
					<div className='flex-1 space-y-1'>
						<div className='flex items-center gap-2'>
							{isPaused ? (
								<AlertTriangle className='size-4 text-warning' />
							) : (
								<ChefHat className='size-4 text-brand' />
							)}
							<h3 className='text-base font-semibold text-text'>
								{isPaused ? 'Paused Session' : 'Resume Cooking'}
							</h3>
						</div>
						<p className='text-sm text-text-secondary'>
							{recipeName || 'Your recipe'} — Step {pendingSession.currentStep}{' '}
							of {totalSteps}
						</p>
						<div className='flex items-center gap-3 text-xs text-text-muted'>
							<span className='flex items-center gap-1'>
								<Clock className='size-3' />
								{completedSteps} steps completed
							</span>
						</div>
					</div>

					{/* CTA */}
					<motion.div
						whileHover={BUTTON_HOVER}
						whileTap={BUTTON_TAP}
						className='shrink-0'
					>
						<Button
							onClick={handleResume}
							disabled={isResuming}
							className='w-full gap-2 bg-brand text-white hover:bg-brand/90 md:w-auto'
						>
							{isResuming ? (
								<>
									<span className='size-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
									Resuming...
								</>
							) : (
								<>
									<Play className='size-4' />
									Resume Cooking
								</>
							)}
						</Button>
					</motion.div>
				</div>

				{/* Progress bar */}
				<div className='h-1 w-full bg-brand/10'>
					<motion.div
						className='h-full bg-brand'
						initial={{ width: 0 }}
						animate={{ width: `${progressPercent}%` }}
						transition={{ duration: 0.5, ease: 'easeOut' }}
					/>
				</div>
			</motion.div>
		</AnimatePresence>
	)
}
