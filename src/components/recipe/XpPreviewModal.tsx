'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Edit3, Loader2, Rocket, Send, Shield, X } from 'lucide-react'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	BUTTON_SUBTLE_HOVER,
} from '@/lib/motion'
import { modKey } from '@/lib/recipeCreateUtils'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { AnimatedNumber } from '@/components/ui/animated-number'
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Portal } from '@/components/ui/portal'
import type { ParsedRecipe, XpBreakdown } from '@/lib/types/recipeCreate'

// XP Preview Modal

// -- Props -----------------------------------------------------------
interface XpPreviewModalProps {
	recipe: ParsedRecipe
	xpBreakdown: XpBreakdown
	onBack: () => void
	/** CRITICAL: Pass recipe to avoid stale closure — ensures publish uses current data. */
	onPublish: (recipe: ParsedRecipe) => void
	isPublishing?: boolean
}

/**
 * Full-screen modal showing the XP breakdown before publish.
 *
 * Includes recipe summary, animated XP counter, badge preview,
 * creator incentive callout, and a publish confirmation dialog.
 */
export const XpPreviewModal = ({
	recipe,
	xpBreakdown,
	onBack,
	onPublish,
	isPublishing = false,
}: XpPreviewModalProps) => {
	const t = useTranslations('recipe')
	const [showConfirm, setShowConfirm] = useState(false)

	useEscapeKey(!showConfirm && !isPublishing, onBack)

	return (
		<Portal>
			<motion.div
				role='dialog'
				aria-modal='true'
				aria-label={t('xpPreview')}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className='fixed inset-0 z-modal flex items-center justify-center bg-black/80 p-4'
			>
				<motion.div
					initial={{ scale: 0.9, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					className='w-full max-w-md max-h-modal overflow-y-auto rounded-2xl bg-bg-card p-7'
				>
					{/* Header */}
					<div className='mb-5 flex items-center justify-between'>
						<h2 className='text-xl font-display font-extrabold text-text'>
							{t('xpPreview')}
						</h2>
						<button
							type='button'
							onClick={onBack}
							aria-label={t('ariaClose')}
							className='flex size-9 items-center justify-center rounded-lg bg-bg text-text-secondary'
						>
							<X className='size-5' />
						</button>
					</div>

					{/* Recipe Summary */}
					<div className='mb-5 flex items-center gap-4 rounded-2xl bg-bg p-4'>
						{recipe.coverImageUrl ? (
							<Image
								src={recipe.coverImageUrl}
								alt={recipe.title}
								width={80}
								height={80}
								className='size-20 rounded-xl object-cover'
							/>
						) : (
							<div className='flex size-20 items-center justify-center rounded-xl bg-bg-elevated text-3xl'>
								??
							</div>
						)}
						<div className='flex-1'>
							<h3 className='text-lg font-bold text-text'>{recipe.title}</h3>
							<p className='text-xs text-text-secondary'>
								{recipe.cookTime} • {recipe.difficulty} •{' '}
								{t('servingsLabel', { count: recipe.servings })}
							</p>
						</div>
					</div>

					{/* XP Breakdown */}
					<div className='mb-5 rounded-2xl bg-bg p-5'>
						<div className='mb-4 flex items-center justify-between border-b border-border pb-4'>
							<span className='text-sm text-text-secondary'>
								{t('totalRecipeXp')}
							</span>
							<AnimatedNumber
								value={xpBreakdown.total}
								duration={1.2}
								className='text-4xl font-black tabular-nums text-brand'
							/>
						</div>

						<div className='mb-4 space-y-3'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-2.5 text-sm text-text'>
									<span className='text-lg'>??</span>
									{t('baseDifficulty', { difficulty: recipe.difficulty })}
								</div>
								<span className='font-bold text-success'>
									+{xpBreakdown.base}
								</span>
							</div>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-2.5 text-sm text-text'>
									<span className='text-lg'>??</span>
									{t('stepsCount', { count: recipe.steps.length })}
								</div>
								<span className='font-bold text-success'>
									+{xpBreakdown.steps}
								</span>
							</div>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-2.5 text-sm text-text'>
									<span className='text-lg'>??</span>
									{t('timeCookTime', { cookTime: recipe.cookTime })}
								</div>
								<span className='font-bold text-success'>
									+{xpBreakdown.time}
								</span>
							</div>
							{(xpBreakdown.techniques || []).map((tech, i) => (
								<div
									key={i}
									className='flex items-center justify-between rounded-lg bg-streak/10 px-3.5 py-2.5'
								>
									<div className='flex items-center gap-2.5 text-sm text-text'>
										<span className='text-lg'>??</span>
										{t('technique', { name: tech.name })}
									</div>
									<span className='font-bold text-success'>+{tech.xp}</span>
								</div>
							))}
						</div>

						{/* Validation */}
						<div className='flex items-center gap-3 rounded-xl bg-success/10 px-4 py-3.5 text-success'>
							<Shield className='size-6' />
							<div className='flex-1'>
								<strong className='text-sm'>{t('xpValidated')}</strong>
								<span className='block text-xs opacity-80'>
									{t('xpValidatedDesc')}
								</span>
							</div>
							<span className='text-xs font-semibold text-text-secondary'>
								{t('xpConfident', { confidence: xpBreakdown.confidence })}
							</span>
						</div>
					</div>

					{/* Badges Preview */}
					<div className='mb-4'>
						<span className='mb-2.5 block text-xs text-text-secondary'>
							{t('cooksCanEarn')}
						</span>
						<div className='flex gap-2.5'>
							{(recipe.detectedBadges || []).map((badge, i) => (
								<motion.div
									key={i}
									initial={{ opacity: 0, scale: 0.8 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ delay: i * 0.1, ...TRANSITION_SPRING }}
									whileHover={BUTTON_SUBTLE_HOVER}
									className='flex items-center gap-2 rounded-xl bg-bg px-4 py-2.5'
								>
									<span className='text-xl'>{badge.emoji}</span>
									<span className='text-xs font-semibold text-text'>
										{badge.name}
									</span>
								</motion.div>
							))}
						</div>
					</div>

					{/* Creator Incentive */}
					<div className='mb-5 flex items-center gap-3.5 rounded-2xl border border-xp/20 bg-xp/10 px-5 py-4'>
						<span className='text-3xl'>?</span>
						<div>
							<strong className='text-sm text-xp'>{t('creatorXpEarn')}</strong>{' '}
							<span className='text-sm text-text'>
								{t('creatorXpWhenOthersCook')}
							</span>
							<span className='block text-xs text-text-secondary'>
								{t('creatorXpProjection', {
									xp: Math.round(xpBreakdown.total * 0.04 * 100),
								})}
							</span>
						</div>
					</div>

					{/* Actions */}
					<div className='flex gap-3'>
						<motion.button
							type='button'
							onClick={onBack}
							whileHover={BUTTON_HOVER}
							whileTap={BUTTON_TAP}
							className='flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-bg py-3.5 text-sm font-semibold text-text-secondary focus-visible:ring-2 focus-visible:ring-brand/50'
						>
							<Edit3 className='size-4' />
							{t('editRecipe')}
						</motion.button>
						<motion.button
							type='button'
							onClick={() => setShowConfirm(true)}
							whileHover={BUTTON_HOVER}
							whileTap={BUTTON_TAP}
							className='flex flex-[2] items-center justify-center gap-2 rounded-xl bg-gradient-hero py-3.5 text-sm font-bold text-white shadow-warm focus-visible:ring-2 focus-visible:ring-brand/50'
						>
							<Send className='size-4' />
							{t('publishRecipe')}
							<kbd className='hidden rounded bg-white/20 px-1.5 py-0.5 text-xs font-normal md:inline-block'>
								{modKey}+?
							</kbd>
						</motion.button>
					</div>

					{/* Publish Confirmation Dialog */}
					<AlertDialog
						open={showConfirm}
						onOpenChange={open => !isPublishing && setShowConfirm(open)}
					>
						<AlertDialogContent className='max-w-sm rounded-2xl border-border bg-bg-card'>
							<AlertDialogHeader className='text-center'>
								<div className='mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-gradient-hero'>
									<Rocket className='size-7 text-white' />
								</div>
								<AlertDialogTitle className='text-lg font-bold text-text'>
									{t('readyToGoLive')}
								</AlertDialogTitle>
								<AlertDialogDescription className='text-sm text-text-secondary'>
									{t.rich('publishConfirmDesc', {
										title: recipe.title,
										xp: xpBreakdown.total,
									})}
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter className='flex-row gap-3 sm:justify-center'>
								<AlertDialogCancel
									disabled={isPublishing}
									className='flex-1 rounded-xl border-border bg-bg text-text-secondary hover:bg-bg-hover disabled:opacity-50'
								>
									{t('waitGoBack')}
								</AlertDialogCancel>
								<button
									type='button'
									onClick={() => onPublish(recipe)}
									disabled={isPublishing}
									className='flex-1 inline-flex items-center justify-center rounded-xl bg-gradient-hero px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none'
								>
									{isPublishing ? (
										<>
											<Loader2 className='mr-2 size-4 animate-spin' />
											{t('publishing')}
										</>
									) : (
										<>
											<Rocket className='mr-2 size-4' />
											{t('publishBang')}
										</>
									)}
								</button>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</motion.div>
			</motion.div>
		</Portal>
	)
}
