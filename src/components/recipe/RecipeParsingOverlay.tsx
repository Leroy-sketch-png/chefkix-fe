'use client'

import { motion } from 'framer-motion'
import { Loader2, Wand2 } from 'lucide-react'
import { Portal } from '@/components/ui/portal'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { useTranslations } from 'next-intl'

interface RecipeParsingOverlayProps {
	onCancel?: () => void
}

export const RecipeParsingOverlay = ({
	onCancel,
}: RecipeParsingOverlayProps) => {
	useEscapeKey(!!onCancel, () => onCancel?.())
	const t = useTranslations('recipe')

	return (
		<Portal>
			<motion.div
				role='dialog'
				aria-modal='true'
				aria-label={t('parsingYourRecipe')}
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
							className='flex size-20 items-center justify-center rounded-2xl bg-gradient-hero text-white shadow-warm'
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

					<h3 className='mb-6 text-xl font-bold text-text-primary'>
						{t('parsingYourRecipe')}
					</h3>

					<div
						role='status'
						aria-live='polite'
						className='flex items-center justify-center gap-2 text-sm text-text-secondary'
					>
						<Loader2 className='size-4 animate-spin' />
						{t('aiFlowProcessing')}
					</div>
					{onCancel && (
						<button
							type='button'
							onClick={onCancel}
							className='mt-8 rounded-md border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand'
						>
							{t('cancelButton')}
						</button>
					)}
				</motion.div>
			</motion.div>
		</Portal>
	)
}
