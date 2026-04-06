'use client'

import { useState, useEffect, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, TrendingUp, Award, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING, CARD_FEED_HOVER, DURATION_S } from '@/lib/motion'
import { triggerAchievementConfetti } from '@/lib/confetti'
import { TasteDetector, TasteProfile } from './TasteDetector'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

// ============================================
// CONSTANTS
// ============================================

const COLD_START_STORAGE_KEY = 'chefkix:cold-start-state'
const INTERACTION_THRESHOLD = 5 // Minimum interactions to transition from curated → personalized

interface ColdStartState {
	interactionCount: number
	dismissed: boolean
	firstSeenAt: string
}

// ============================================
// TYPES
// ============================================

interface ColdStartExperienceProps {
	/** Child content to render (the normal feed/page) */
	children: ReactNode
	/** Whether the user is authenticated */
	isAuthenticated?: boolean
	/** Current taste profile from BE (if available) */
	tasteProfile?: TasteProfile
	/** Callback when cold-start phase ends */
	onColdStartComplete?: () => void
	/** Additional class names */
	className?: string
}

type ColdStartPhase = 'curated' | 'transitioning' | 'personalized'

// ============================================
// STORAGE HELPERS
// ============================================

function getColdStartState(): ColdStartState | null {
	if (typeof window === 'undefined') return null
	try {
		const stored = localStorage.getItem(COLD_START_STORAGE_KEY)
		return stored ? JSON.parse(stored) : null
	} catch {
		return null
	}
}

function setColdStartState(state: ColdStartState) {
	if (typeof window === 'undefined') return
	try {
		localStorage.setItem(COLD_START_STORAGE_KEY, JSON.stringify(state))
	} catch {
		// Storage full or blocked
	}
}

function clearColdStartState() {
	if (typeof window === 'undefined') return
	try {
		localStorage.removeItem(COLD_START_STORAGE_KEY)
	} catch {
		// Ignore
	}
}

// ============================================
// CURATED CONTENT SUGGESTIONS (fallback when BE doesn't provide)
// ============================================

const CURATED_CATEGORIES = [
	{
		id: 'beginner-friendly',
		titleKey: 'csPerfectForBeginners' as const,
		descriptionKey: 'csBeginnersDesc' as const,
		icon: Award,
		href: '/explore?filter=beginner&quality=foolproof',
		gradient: 'from-success to-accent-teal',
	},
	{
		id: 'trending',
		titleKey: 'csTrendingThisWeek' as const,
		descriptionKey: 'csTrendingDesc' as const,
		icon: TrendingUp,
		href: '/explore?sort=trending',
		gradient: 'from-streak to-error',
	},
	{
		id: 'quick-wins',
		titleKey: 'csQuickWins' as const,
		descriptionKey: 'csQuickWinsDesc' as const,
		icon: Sparkles,
		href: '/explore?filter=quick&maxTime=20',
		gradient: 'from-warning to-warning',
	},
] as const

// ============================================
// COMPONENT
// ============================================

/**
 * ColdStartExperience — First-visit wrapper for new users.
 *
 * Detects new users (0 engagement events) and:
 * 1. Shows curated content first (beginner-friendly, trending, quick wins)
 * 2. Displays TasteDetector forming as user interacts
 * 3. Transitions to personalized feed after 5+ interactions
 *
 * Uses semantic tokens per DESIGN_SYSTEM.md.
 *
 * Usage:
 * ```tsx
 * <ColdStartExperience
 *   isAuthenticated={!!user}
 *   tasteProfile={profile}
 *   onColdStartComplete={() => refetchFeed()}
 * >
 *   <FeedContent />
 * </ColdStartExperience>
 * ```
 */
export const ColdStartExperience = ({
	children,
	isAuthenticated = false,
	tasteProfile,
	onColdStartComplete,
	className,
}: ColdStartExperienceProps) => {
	const t = useTranslations('onboarding')
	const [phase, setPhase] = useState<ColdStartPhase>(() => {
		if (typeof window === 'undefined') return 'personalized'
		const state = getColdStartState()
		if (!state) return 'curated'
		if (state.dismissed || state.interactionCount >= INTERACTION_THRESHOLD) return 'personalized'
		return 'curated'
	})
	const [interactionCount, setInteractionCount] = useState(() => {
		if (typeof window === 'undefined') return 0
		return getColdStartState()?.interactionCount ?? 0
	})
	const [showTransitionMessage, setShowTransitionMessage] = useState(false)

	// Initialize storage for brand new users
	useEffect(() => {
		const state = getColdStartState()

		if (!state) {
			// Brand new user — create storage entry
			const newState: ColdStartState = {
				interactionCount: 0,
				dismissed: false,
				firstSeenAt: new Date().toISOString(),
			}
			setColdStartState(newState)
		}
	}, [])

	// Track interactions (call this from parent when user interacts)
	const recordInteraction = useCallback(() => {
		setInteractionCount((prev) => {
			const newCount = prev + 1
			const state = getColdStartState()
			setColdStartState({
				...state!,
				interactionCount: newCount,
			})

			// Check for phase transition
			if (newCount >= INTERACTION_THRESHOLD && phase === 'curated') {
				setPhase('transitioning')
				setShowTransitionMessage(true)
				triggerAchievementConfetti()

				// Auto-transition to personalized after showing message
				setTimeout(() => {
					setPhase('personalized')
					setShowTransitionMessage(false)
					setColdStartState({
						...getColdStartState()!,
						dismissed: true,
					})
					onColdStartComplete?.()
				}, 3000)
			}

			return newCount
		})
	}, [phase, onColdStartComplete])

	// Expose interaction tracker via context or callback
	// For now, we'll listen to global events
	useEffect(() => {
		const handleInteraction = () => {
			if (phase === 'curated') {
				recordInteraction()
			}
		}

		// Listen for custom tracking events
		window.addEventListener('chefkix:interaction', handleInteraction)
		return () => {
			window.removeEventListener('chefkix:interaction', handleInteraction)
		}
	}, [phase, recordInteraction])

	// Skip cold-start for returning users or if already past it
	if (phase === 'personalized' && !showTransitionMessage) {
		return <>{children}</>
	}

	return (
		<div className={cn('relative', className)}>
			{/* Transition overlay */}
			<AnimatePresence>
				{showTransitionMessage && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed inset-0 z-modal flex items-center justify-center bg-bg/80 backdrop-blur-sm'
					>
						<motion.div
							initial={{ scale: 0.9, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.9, opacity: 0 }}
							transition={TRANSITION_SPRING}
							className='mx-4 max-w-sm rounded-2xl border border-brand/20 bg-bg-card p-6 text-center shadow-card'
						>
							<motion.div
								initial={{ scale: 0 }}
								animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
								transition={{ delay: 0.2, duration: DURATION_S.slow }}
								className='mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-brand/10'
							>
								<Sparkles className='size-8 text-brand' />
							</motion.div>
							<h3 className='mb-2 text-lg font-bold text-text'>
							{t('csTasteProfileReady')}
						</h3>
						<p className='text-sm text-text-secondary'>
							{t('csFeedPersonalized')}
							</p>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Cold-start header */}
			{phase === 'curated' && (
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={TRANSITION_SPRING}
					className='mb-6'
				>
					{/* Taste detector (compact inline) */}
					<div className='mb-4 flex items-center justify-between'>
						<TasteDetector
							profile={tasteProfile}
							isDetecting
							eventCount={interactionCount}
							minEvents={INTERACTION_THRESHOLD}
							compact
						/>
						<span className='text-xs text-text-muted'>
							{t('csBrowseToPersonalize')}
						</span>
					</div>

					{/* Curated categories */}
					<div className='space-y-3'>
						<h3 className='flex items-center gap-2 text-sm font-bold text-text'>
							<Sparkles className='size-4 text-brand' />
						{t('csStartHere')}
						</h3>
						<div className='grid gap-3 sm:grid-cols-3'>
							{CURATED_CATEGORIES.map((category) => (
								<motion.div
									key={category.id}
									whileHover={CARD_FEED_HOVER}
									transition={TRANSITION_SPRING}
								>
									<Link
										href={category.href}
										className='group block rounded-xl border border-border-subtle bg-bg-card p-4 transition-shadow hover:shadow-warm'
									>
										<div
											className={cn(
												'mb-2 flex size-10 items-center justify-center rounded-full bg-gradient-to-br text-white',
												category.gradient,
											)}
										>
											<category.icon className='size-5' />
										</div>
										<h4 className='mb-1 font-bold text-text transition-colors group-hover:text-brand'>
										{t(category.titleKey)}
									</h4>
									<p className='text-xs text-text-secondary'>
										{t(category.descriptionKey)}
										</p>
										<div className='mt-2 flex items-center gap-1 text-xs font-medium text-brand opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100'>
											{t('csExplore')} <ChevronRight className='size-3' />
										</div>
									</Link>
								</motion.div>
							))}
						</div>
					</div>
				</motion.div>
			)}

			{/* Regular content */}
			<div
				className={cn(
					phase === 'curated' && 'opacity-90',
					phase === 'transitioning' && 'pointer-events-none opacity-50',
				)}
			>
				{children}
			</div>
		</div>
	)
}

// ============================================
// EXPORTS
// ============================================

export { clearColdStartState }
export type { ColdStartPhase, ColdStartState }
