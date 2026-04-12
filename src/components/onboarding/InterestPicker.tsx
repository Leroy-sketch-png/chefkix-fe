'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Portal } from '@/components/ui/portal'
import { Button } from '@/components/ui/button'
import {
	Check,
	ChevronRight,
	Sparkles,
	X,
	AlertTriangle,
	Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateProfile } from '@/services/profile'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { TRANSITION_SPRING } from '@/lib/motion'
import { useTranslations } from 'next-intl'

// ============================================
// STORAGE KEY
// ============================================

const INTEREST_PICKER_DISMISSED_KEY = 'chefkix:interest-picker-dismissed'

// ============================================
// CUISINE/INTEREST TILES - Using emoji + gradients (no external CDNs for privacy)
// ============================================

const INTEREST_TILES = [
	{
		id: 'italian',
		labelKey: 'ipItalian' as const,
		emoji: '🍝',
		gradient: 'from-error to-success',
	},
	{
		id: 'asian',
		labelKey: 'ipAsian' as const,
		emoji: '🍜',
		gradient: 'from-warning to-error',
	},
	{
		id: 'mexican',
		labelKey: 'ipMexican' as const,
		emoji: '🌮',
		gradient: 'from-success to-error',
	},
	{
		id: 'bbq',
		labelKey: 'ipBBQ' as const,
		emoji: '🔥',
		gradient: 'from-streak to-error',
	},
	{
		id: 'vegan',
		labelKey: 'ipPlantBased' as const,
		emoji: '🥗',
		gradient: 'from-success to-success',
	},
	{
		id: 'quick-meals',
		labelKey: 'ipQuickMeals' as const,
		emoji: '⚡',
		gradient: 'from-warning to-streak',
	},
	{
		id: 'baking',
		labelKey: 'ipBaking' as const,
		emoji: '🥐',
		gradient: 'from-warning to-warning',
	},
	{
		id: 'comfort-food',
		labelKey: 'ipComfortFood' as const,
		emoji: '🍲',
		gradient: 'from-streak to-warning',
	},
	{
		id: 'healthy',
		labelKey: 'ipHealthy' as const,
		emoji: '🥬',
		gradient: 'from-success to-success',
	},
	{
		id: 'indian',
		labelKey: 'ipIndian' as const,
		emoji: '🍛',
		gradient: 'from-streak to-warning',
	},
	{
		id: 'mediterranean',
		labelKey: 'ipMediterranean' as const,
		emoji: '🫒',
		gradient: 'from-info to-accent-teal',
	},
	{
		id: 'seafood',
		labelKey: 'ipSeafood' as const,
		emoji: '🦐',
		gradient: 'from-accent-teal to-info',
	},
] as const

// ============================================
// COMPONENT
// ============================================

interface InterestPickerProps {
	onComplete: () => void
	/** If true, can be dismissed permanently via X button */
	dismissible?: boolean
	/** If true, this is being shown from settings (edit mode) */
	editMode?: boolean
}

export function InterestPicker({
	onComplete,
	dismissible = true,
	editMode = false,
}: InterestPickerProps) {
	const [selected, setSelected] = useState<Set<string>>(new Set())
	const [isSaving, setIsSaving] = useState(false)
	const [showSkipConfirm, setShowSkipConfirm] = useState(false)
	const setUser = useAuthStore(s => s.setUser)
	const user = useAuthStore(s => s.user)
	const t = useTranslations('onboarding')

	// Escape key handling for the whole modal
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key !== 'Escape') return
			if (showSkipConfirm) {
				setShowSkipConfirm(false)
				return
			}
			if (dismissible) {
				// Same behavior as clicking the X button
				if (editMode) {
					onComplete()
				} else if (selected.size === 0) {
					setShowSkipConfirm(true)
				} else {
					localStorage.setItem(INTEREST_PICKER_DISMISSED_KEY, 'true')
					onComplete()
				}
			}
		}
		window.addEventListener('keydown', handleEscape)
		return () => window.removeEventListener('keydown', handleEscape)
	}, [showSkipConfirm, dismissible, editMode, onComplete, selected.size])

	// Pre-select user's existing preferences if any
	useEffect(() => {
		if (user?.preferences && user.preferences.length > 0) {
			setSelected(new Set(user.preferences))
		}
	}, [user?.preferences])

	const toggleInterest = useCallback((id: string) => {
		setSelected(prev => {
			const next = new Set(prev)
			if (next.has(id)) {
				next.delete(id)
			} else {
				next.add(id)
			}
			return next
		})
	}, [])

	const handleDismiss = useCallback(() => {
		// In edit mode, just close without persisting dismissal
		if (editMode) {
			onComplete()
			return
		}
		// If no selections and user hits X, show skip confirmation
		if (selected.size === 0 && dismissible) {
			setShowSkipConfirm(true)
			return
		}
		// If has selections or already confirmed, proceed
		if (dismissible) {
			localStorage.setItem(INTEREST_PICKER_DISMISSED_KEY, 'true')
		}
		onComplete()
	}, [dismissible, onComplete, editMode, selected.size])

	const handleConfirmSkip = useCallback(() => {
		if (dismissible) {
			localStorage.setItem(INTEREST_PICKER_DISMISSED_KEY, 'true')
		}
		onComplete()
	}, [dismissible, onComplete])

	const handleContinue = useCallback(async () => {
		const preferences = Array.from(selected)

		// If skipping (0 selected) and not in edit mode, show skip confirmation
		if (preferences.length === 0 && !editMode) {
			setShowSkipConfirm(true)
			return
		}

		// In edit mode with 0 selections, just close
		if (preferences.length === 0 && editMode) {
			onComplete()
			return
		}

		setIsSaving(true)
		try {
			const response = await updateProfile({ preferences })
			if (response.success && response.data) {
				setUser(response.data)
				// Persist dismissal after successful save (only if not in edit mode)
				if (dismissible && !editMode) {
					localStorage.setItem(INTEREST_PICKER_DISMISSED_KEY, 'true')
				}
				toast.success(editMode ? t('ipToastUpdated') : t('ipToastPersonalize'))
				onComplete()
			} else {
				// API returned but unsuccessful — keep picker open for retry
				toast.error(response.message || t('ipToastSaveError'))
			}
		} catch {
			// Network/unexpected error — keep picker open for retry
			toast.error(t('ipToastConnectionError'))
		} finally {
			setIsSaving(false)
		}
	}, [selected, onComplete, setUser, dismissible, editMode, t])

	return (
		<Portal>
			{/* Skip Confirmation Modal */}
			<AnimatePresence>
				{showSkipConfirm && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed inset-0 z-modal flex items-center justify-center bg-black/60 p-4'
					>
						<motion.div
							initial={{ scale: 0.9, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.9, opacity: 0 }}
							className='w-full max-w-sm rounded-2xl bg-bg-card p-6 shadow-warm'
							role='alertdialog'
							aria-modal='true'
							aria-label={t('ipSkipConfirmTitle')}
						>
							<div className='mb-4 flex items-center gap-3'>
								<div className='flex size-10 items-center justify-center rounded-full bg-warning/10'>
									<AlertTriangle className='size-5 text-warning' />
								</div>
								<h3 className='text-lg font-semibold text-text'>
									{t('ipSkipConfirmTitle')}
								</h3>
							</div>
							<p className='mb-6 text-sm text-text-secondary'>
								{t.rich('ipSkipConfirmDesc', {
									settingsPath: () => (
										<strong>Settings &rarr; Cooking Preferences</strong>
									),
								})}
							</p>
							<div className='flex gap-3'>
								<button
									type='button'
									onClick={() => setShowSkipConfirm(false)}
									className='flex-1 rounded-xl border border-border-subtle px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-bg-elevated focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2'
								>
									{t('ipGoBack')}
								</button>
								<button
									type='button'
									onClick={handleConfirmSkip}
									className='flex-1 rounded-xl bg-warning/10 px-4 py-2.5 text-sm font-medium text-warning transition-colors hover:bg-warning/20 focus-visible:ring-2 focus-visible:ring-warning focus-visible:ring-offset-2'
								>
									{t('ipSkipAnyway')}
								</button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className='fixed inset-0 z-modal flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'
			>
				<motion.div
					initial={{ opacity: 0, scale: 0.9, y: 30 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					transition={TRANSITION_SPRING}
					className='relative w-full max-w-2xl overflow-hidden rounded-3xl bg-bg-card shadow-warm'
					role='dialog'
					aria-modal='true'
					aria-label={t('ipTitle')}
				>
					{/* Dismiss X button */}
					{dismissible && (
						<button
							type='button'
							onClick={handleDismiss}
							className='absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full bg-bg-elevated/80 text-text-muted backdrop-blur-sm transition-colors hover:bg-bg-hover hover:text-text focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2'
							aria-label={t('ipDismiss')}
						>
							<X className='size-4' />
						</button>
					)}

					{/* Header */}
					<div className='bg-gradient-to-br from-brand/10 to-streak/10 px-6 py-8 text-center'>
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 0.2, ...TRANSITION_SPRING }}
							className='mx-auto mb-3 flex size-16 items-center justify-center rounded-2xl bg-brand/15'
						>
							<Sparkles className='size-8 text-brand' />
						</motion.div>
						<h2 className='text-2xl font-bold text-text'>
							{editMode ? t('ipTitleEdit') : t('ipTitleNew')}
						</h2>
						<p className='mt-2 text-sm text-text-secondary'>
							{editMode ? t('ipSubtitleEdit') : t('ipSubtitleNew')}
						</p>
					</div>

					{/* Cuisine Tiles Grid */}
					<div className='max-h-[50vh] overflow-y-auto px-4 py-4'>
						<div className='grid grid-cols-3 gap-3 sm:grid-cols-4'>
							{INTEREST_TILES.map((tile, i) => {
								const isSelected = selected.has(tile.id)

								return (
									<motion.button
										type='button'
										key={tile.id}
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.03 * i }}
										onClick={() => toggleInterest(tile.id)}
										className={cn(
											'group relative aspect-[4/3] overflow-hidden rounded-xl border-2 transition-all focus-visible:ring-2 focus-visible:ring-brand/50',
											isSelected
												? 'border-brand shadow-card shadow-brand/20'
												: 'border-transparent hover:border-border-medium',
										)}
									>
										{/* Gradient background with emoji */}
										<div
											className={cn(
												'absolute inset-0 bg-gradient-to-br transition-all duration-300',
												tile.gradient,
												isSelected
													? 'opacity-100'
													: 'opacity-80 group-hover:opacity-90',
											)}
										/>

										{/* Large emoji */}
										<div className='absolute inset-0 flex items-center justify-center'>
											<span
												className={cn(
													'text-4xl transition-transform duration-200 sm:text-5xl',
													isSelected ? 'scale-110' : 'group-hover:scale-105',
												)}
												role='img'
												aria-hidden='true'
											>
												{tile.emoji}
											</span>
										</div>

										{/* Gradient overlay for text readability */}
										<div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent' />

										{/* Selection checkmark */}
										{isSelected && (
											<motion.div
												initial={{ scale: 0 }}
												animate={{ scale: 1 }}
												className='absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-brand text-white shadow-lg'
											>
												<Check className='size-3.5' strokeWidth={3} />
											</motion.div>
										)}

										{/* Label */}
										<div className='absolute inset-x-0 bottom-0 p-2'>
											<span className='text-xs font-semibold text-white drop-shadow-md sm:text-sm'>
												{t(tile.labelKey)}
											</span>
										</div>
									</motion.button>
								)
							})}
						</div>
					</div>

					{/* Footer */}
					<div className='flex items-center justify-between border-t border-border-subtle px-6 py-4'>
						<button
							type='button'
							onClick={handleDismiss}
							className='text-sm font-medium text-text-muted transition-colors hover:text-text-secondary'
						>
							{editMode ? t('ipCancel') : t('ipSkipForNow')}
						</button>
						<Button
							type='button'
							onClick={handleContinue}
							disabled={isSaving}
							variant={selected.size > 0 ? 'brand' : 'secondary'}
							className='gap-2'
						>
							{isSaving ? (
								<>
									<Loader2 className='size-4 animate-spin' />
									{t('ipSaving')}
								</>
							) : (
								<>
									{editMode
										? selected.size > 0
											? t('ipSaveCount', { count: selected.size })
											: t('ipSave')
										: selected.size > 0
											? t('ipContinueCount', { count: selected.size })
											: t('ipContinue')}
									<ChevronRight className='size-4' />
								</>
							)}
						</Button>
					</div>
				</motion.div>
			</motion.div>
		</Portal>
	)
}

/**
 * Check if the interest picker has been dismissed before.
 * Use this to conditionally show the picker.
 */
export function hasInterestPickerBeenDismissed(): boolean {
	if (typeof window === 'undefined') return false
	return localStorage.getItem(INTEREST_PICKER_DISMISSED_KEY) === 'true'
}

/**
 * Reset the interest picker dismissal state.
 * Useful for testing or when user wants to re-select preferences.
 */
export function resetInterestPickerDismissal(): void {
	if (typeof window === 'undefined') return
	localStorage.removeItem(INTEREST_PICKER_DISMISSED_KEY)
}
