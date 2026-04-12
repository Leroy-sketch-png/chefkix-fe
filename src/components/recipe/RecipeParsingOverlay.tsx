'use client'

import { motion } from 'framer-motion'
import { CheckCircle, Circle, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Portal } from '@/components/ui/portal'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { useTranslations } from 'next-intl'

// ── Props ───────────────────────────────────────────────────────────
interface RecipeParsingOverlayProps {
	/** Index of the currently-active parsing step (0-based). */
	currentStep: number
	/** Called when user presses Escape to cancel parsing. */
	onCancel?: () => void
}

const PARSING_STEP_KEYS = [
	'parsingStepReading',
	'parsingStepExtracting',
	'parsingStepParsing',
	'parsingStepCalculating',
] as const

/**
 * Full-screen overlay shown while the AI is parsing raw recipe text.
 * Displays a 4-step progress animation with sparkles.
 */
export const RecipeParsingOverlay = ({
	currentStep,
	onCancel,
}: RecipeParsingOverlayProps) => {
	useEscapeKey(!!onCancel, () => onCancel?.())
	const t = useTranslations('recipe')

	return (
		<Portal>
			<motion.div
				role='dialog'
				aria-modal='true'
				aria-label='Processing recipe'
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className='fixed inset-0 z-modal flex items-center justify-center bg-black/80'
			>
				<motion.div
					initial={{ scale: 0.9, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					className='rounded-2xl bg-bg-card p-12 text-center'
				>
					{/* Animated Wand */}
					<div className='relative mx-auto mb-6 size-20'>
						<motion.div
							animate={{ scale: [1, 1.1, 1] }}
							transition={{ repeat: Infinity, duration: 1.5 }}
							className='flex size-20 items-center justify-center rounded-2xl bg-gradient-hero text-white shadow-lg'
						>
							<Wand2 className='size-9' />
						</motion.div>
						<motion.span
							animate={{ y: [0, -10, 0], opacity: [1, 0.5, 1] }}
							transition={{ repeat: Infinity, duration: 2, delay: 0 }}
							className='absolute -right-5 -top-5 text-2xl'
						>
							✨
						</motion.span>
						<motion.span
							animate={{ y: [0, -10, 0], opacity: [1, 0.5, 1] }}
							transition={{ repeat: Infinity, duration: 2, delay: 0.3 }}
							className='absolute -bottom-2 -left-4 text-xl'
						>
							⭐
						</motion.span>
					</div>

					<h3 className='mb-6 text-xl font-bold text-text'>
						{t('parsingYourRecipe')}
					</h3>

					<div className='space-y-4 text-left'>
						{PARSING_STEP_KEYS.map((stepKey, i) => (
							<div
								key={stepKey}
								className={cn(
									'flex items-center gap-3 text-sm',
									i < currentStep && 'text-success',
									i === currentStep && 'font-semibold text-text',
									i > currentStep && 'text-text-secondary',
								)}
							>
								{i < currentStep ? (
									<CheckCircle className='size-5' />
								) : i === currentStep ? (
									<div className='size-5 animate-spin rounded-full border-2 border-border border-t-primary' />
								) : (
									<Circle className='size-5' />
								)}
								<span>{t(stepKey)}</span>
							</div>
						))}
					</div>
				</motion.div>
			</motion.div>
		</Portal>
	)
}
