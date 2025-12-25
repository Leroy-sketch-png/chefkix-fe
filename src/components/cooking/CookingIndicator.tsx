'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useCookingStore } from '@/store/cookingStore'
import { useUiStore } from '@/store/uiStore'
import { ChefHat, Timer, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING } from '@/lib/motion'

// ============================================
// TOPBAR COOKING INDICATOR
// Shows when a cooking session is active
// ============================================

export const CookingIndicator = () => {
	const { cookingMode, setCookingMode, openCookingPanel } = useUiStore()
	const { session, recipe, localTimers } = useCookingStore()

	// Only show when ACTIVE session exists (not completed/abandoned) and not in expanded mode
	const isActiveSession =
		session && session.status !== 'completed' && session.status !== 'abandoned'
	const isVisible = isActiveSession && recipe && cookingMode !== 'expanded'

	// Timer ticking is now centralized in CookingTimerProvider

	// Early return
	if (!isVisible || !session || !recipe) return null

	// Get first active timer
	const firstTimer =
		localTimers.size > 0 ? Array.from(localTimers.entries())[0] : null
	const timerSeconds = firstTimer?.[1]?.remaining ?? 0
	const timerMinutes = Math.floor(timerSeconds / 60)
	const timerSecs = timerSeconds % 60
	const hasActiveTimer = localTimers.size > 0
	const isUrgent = timerSeconds <= 30 && timerSeconds > 0

	const currentStep = session.currentStep ?? 1
	const totalSteps = recipe.steps?.length ?? 0

	const handleClick = () => {
		// Toggle between hidden/mini and docked
		if (cookingMode === 'hidden' || cookingMode === 'mini') {
			openCookingPanel()
		} else {
			setCookingMode('mini')
		}
	}

	return (
		<AnimatePresence>
			<motion.button
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.9 }}
				transition={TRANSITION_SPRING}
				onClick={handleClick}
				className={cn(
					'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all hover:scale-105',
					hasActiveTimer
						? isUrgent
							? 'animate-pulse bg-error/20 text-error'
							: 'bg-brand/20 text-brand'
						: 'bg-bg-elevated text-text-secondary hover:bg-bg-hover',
				)}
			>
				<motion.div
					animate={hasActiveTimer ? { rotate: [0, 10, -10, 0] } : {}}
					transition={{ repeat: Infinity, duration: 2 }}
				>
					<ChefHat className='size-4' />
				</motion.div>

				{/* Recipe name - hidden on small screens */}
				<span className='hidden max-w-24 truncate md:inline'>
					{recipe.title}
				</span>

				{/* Step indicator */}
				<span className='text-xs opacity-70'>
					{currentStep}/{totalSteps}
				</span>

				{/* Timer if active */}
				{hasActiveTimer && (
					<span
						className={cn(
							'flex items-center gap-1 font-mono text-xs',
							isUrgent && 'font-bold',
						)}
					>
						<Timer className='size-3' />
						{String(timerMinutes).padStart(2, '0')}:
						{String(timerSecs).padStart(2, '0')}
					</span>
				)}

				<ChevronDown
					className={cn(
						'size-3.5 transition-transform',
						cookingMode === 'docked' && 'rotate-180',
					)}
				/>
			</motion.button>
		</AnimatePresence>
	)
}
