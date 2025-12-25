'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCookingStore } from '@/store/cookingStore'
import { useUiStore } from '@/store/uiStore'
import { ChevronUp, Pause, Play, X, Timer, ChefHat } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

// ============================================
// MINI COOKING BAR (Mobile/Tablet)
// Like Spotify's mini player bar
// Shows on screens < xl (1280px) when cooking
// ============================================

export const MiniCookingBar = () => {
	const { cookingMode, setCookingMode, closeCookingPanel } = useUiStore()
	const {
		session,
		recipe,
		localTimers,
		pauseCooking,
		resumeCooking,
		abandonCooking,
	} = useCookingStore()
	const [showExitConfirm, setShowExitConfirm] = useState(false)

	// Show on non-xl screens when cooking (mini or docked mode)
	// On xl+ screens, docked mode uses CookingPanel instead
	// CSS handles the xl:hidden, so we show whenever there's an ACTIVE cooking session
	// (not completed/abandoned) and the user hasn't explicitly hidden or expanded it
	const isActiveSession =
		session && session.status !== 'completed' && session.status !== 'abandoned'
	const isVisible =
		(cookingMode === 'mini' || cookingMode === 'docked') &&
		isActiveSession &&
		recipe

	// Timer ticking is now centralized in CookingTimerProvider

	if (!isVisible) return null

	// Get first active timer for display
	const firstTimer =
		localTimers.size > 0 ? Array.from(localTimers.entries())[0] : null
	const timerSeconds = firstTimer?.[1]?.remaining ?? 0
	const timerMinutes = Math.floor(timerSeconds / 60)
	const timerSecs = timerSeconds % 60
	const hasActiveTimer = localTimers.size > 0

	const currentStep = session.currentStep ?? 1
	const totalSteps = recipe.steps?.length ?? 0
	const isPaused = session.status === 'paused'

	const handleExpand = () => {
		// Always expand to fullscreen from mini bar
		// On xl+ screens, the CookingPanel is visible and user can use that
		// Expanding gives the focused cooking experience regardless of screen size
		setCookingMode('expanded')
	}

	const handlePlayPause = async () => {
		if (isPaused) {
			await resumeCooking()
		} else {
			await pauseCooking()
		}
	}

	return (
		<AnimatePresence>
			<motion.div
				initial={{ y: 100, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				exit={{ y: 100, opacity: 0 }}
				transition={{ type: 'spring', stiffness: 300, damping: 30 }}
				className='fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-bg-card/95 backdrop-blur-md xl:hidden'
			>
				<div className='flex items-center gap-3 px-4 py-3'>
					{/* Recipe Info */}
					<button
						onClick={handleExpand}
						className='flex min-w-0 flex-1 items-center gap-3'
					>
						<div className='grid size-10 flex-shrink-0 place-items-center rounded-xl bg-gradient-hero text-white shadow-md'>
							<ChefHat className='size-5' />
						</div>
						<div className='min-w-0 flex-1 text-left'>
							<h4 className='truncate text-sm font-bold text-text'>
								{recipe.title}
							</h4>
							<p className='text-xs text-text-secondary'>
								Step {currentStep} of {totalSteps}
								{hasActiveTimer && (
									<>
										{' '}
										• <Timer className='inline size-3' />{' '}
										{String(timerMinutes).padStart(2, '0')}:
										{String(timerSecs).padStart(2, '0')}
									</>
								)}
							</p>
						</div>
					</button>

					{/* Controls */}
					<div className='flex items-center gap-2'>
						{/* Play/Pause */}
						<button
							onClick={handlePlayPause}
							title={isPaused ? 'Resume cooking' : 'Pause cooking'}
							className={cn(
								'grid size-10 place-items-center rounded-full transition-all',
								isPaused
									? 'bg-brand text-white'
									: 'bg-bg-elevated text-text-secondary hover:bg-bg-hover',
							)}
						>
							{isPaused ? (
								<Play className='size-5' />
							) : (
								<Pause className='size-5' />
							)}
						</button>

						{/* Expand */}
						<button
							onClick={handleExpand}
							title='Expand to full screen'
							className='grid size-10 place-items-center rounded-full bg-bg-elevated text-text-secondary transition-all hover:bg-bg-hover'
						>
							<ChevronUp className='size-5' />
						</button>

						{/* Close - Shows confirmation dialog */}
						<button
							onClick={() => setShowExitConfirm(true)}
							title='End cooking session'
							className='grid size-10 place-items-center rounded-full bg-bg-elevated text-text-secondary transition-all hover:bg-error/20 hover:text-error'
						>
							<X className='size-5' />
						</button>
					</div>
				</div>

				{/* Progress Bar */}
				<div className='h-1 bg-border'>
					<motion.div
						className='h-full bg-gradient-hero'
						initial={{ scaleX: 0 }}
						animate={{
							scaleX:
								totalSteps > 0
									? (session.completedSteps?.length ?? 0) / totalSteps
									: 0,
						}}
						style={{ transformOrigin: 'left' }}
					/>
				</div>
			</motion.div>

			{/* Exit Confirmation Dialog */}
			<Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
				<DialogContent className='sm:max-w-md'>
					<DialogHeader>
						<DialogTitle>Leave cooking session?</DialogTitle>
						<DialogDescription>
							You have an active cooking session for &quot;{recipe?.title}
							&quot;. What would you like to do?
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className='flex flex-col gap-2 sm:flex-row'>
						<Button
							variant='outline'
							onClick={() => {
								closeCookingPanel()
								setShowExitConfirm(false)
							}}
							className='w-full sm:w-auto'
						>
							Minimize (Keep Session)
						</Button>
						<Button
							variant='destructive'
							onClick={async () => {
								await abandonCooking()
								closeCookingPanel()
								setShowExitConfirm(false)
							}}
							className='w-full sm:w-auto'
						>
							Abandon Session
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</AnimatePresence>
	)
}
