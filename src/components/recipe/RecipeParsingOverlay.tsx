'use client'

import { motion } from 'framer-motion'
import { CheckCircle, Circle, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Portal } from '@/components/ui/portal'

// ── Props ───────────────────────────────────────────────────────────
interface RecipeParsingOverlayProps {
	/** Index of the currently-active parsing step (0-based). */
	currentStep: number
}

const PARSING_STEPS = [
	'Reading text',
	'Extracting ingredients',
	'Parsing steps',
	'Calculating XP',
] as const

/**
 * Full-screen overlay shown while the AI is parsing raw recipe text.
 * Displays a 4-step progress animation with sparkles.
 */
export const RecipeParsingOverlay = ({
	currentStep,
}: RecipeParsingOverlayProps) => (
	<Portal>
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className='fixed inset-0 z-modal flex items-center justify-center bg-black/80'
		>
			<motion.div
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				className='rounded-2xl bg-panel-bg p-12 text-center'
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
					Parsing your recipe...
				</h3>

				<div className='space-y-4 text-left'>
					{PARSING_STEPS.map((step, i) => (
						<div
							key={step}
							className={cn(
								'flex items-center gap-3 text-sm',
								i < currentStep && 'text-success',
								i === currentStep && 'font-semibold text-text',
								i > currentStep && 'text-muted-foreground',
							)}
						>
							{i < currentStep ? (
								<CheckCircle className='size-5' />
							) : i === currentStep ? (
								<div className='size-5 animate-spin rounded-full border-2 border-border border-t-primary' />
							) : (
								<Circle className='size-5' />
							)}
							<span>{step}</span>
						</div>
					))}
				</div>
			</motion.div>
		</motion.div>
	</Portal>
)
