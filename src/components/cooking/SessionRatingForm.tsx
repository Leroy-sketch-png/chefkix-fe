'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Zap, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
	TRANSITION_BOUNCY,
	BUTTON_HOVER,
	BUTTON_TAP,
	RATING_STAR_HOVER,
	RATING_STAR_TAP,
	SPRING_BOUNCY,
	DURATION_S,
} from '@/lib/motion'
import { useTranslations } from 'next-intl'

// ============================================
// TYPES
// ============================================

interface SessionRatingFormProps {
	xpEarned: number
	recipeTitle: string
	onSubmit: (rating: number, notes?: string) => void
	onSkip?: () => void
	isSubmitting?: boolean
}

// ============================================
// STAR RATING COMPONENT
// ============================================

interface StarRatingProps {
	rating: number
	hoverRating: number
	onRate: (rating: number) => void
	onHover: (rating: number) => void
	onLeave: () => void
	recipeRatingLabel: string
	starAriaLabel: (count: number) => string
}

function StarRating({
	rating,
	hoverRating,
	onRate,
	onHover,
	onLeave,
	recipeRatingLabel,
	starAriaLabel,
}: StarRatingProps) {
	const displayRating = hoverRating || rating

	return (
		<div
			className='flex items-center justify-center gap-1'
			onMouseLeave={onLeave}
			role='radiogroup'
			aria-label={recipeRatingLabel}
		>
			{[1, 2, 3, 4, 5].map(star => {
				const isFilled = star <= displayRating
				const isHovered = hoverRating > 0 && star <= hoverRating
				const isSelected = star === rating

				return (
					<motion.button
						key={star}
						type='button'
						role='radio'
						aria-checked={isSelected}
						onClick={() => onRate(star)}
						onMouseEnter={() => onHover(star)}
						onTouchStart={() => onHover(star)}
						whileHover={RATING_STAR_HOVER}
						whileTap={RATING_STAR_TAP}
						className='relative p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 rounded-full'
						aria-label={starAriaLabel(star)}
					>
						{/* Background star (outline) */}
						<Star
							className={cn(
								'size-10 transition-colors duration-200',
								isFilled ? 'text-transparent' : 'text-border',
							)}
							strokeWidth={1.5}
						/>

						{/* Filled star (animated) */}
						<motion.div
							initial={false}
							animate={{
								scale: isFilled ? 1 : 0,
								opacity: isFilled ? 1 : 0,
							}}
							transition={SPRING_BOUNCY}
							className='absolute inset-0 flex items-center justify-center p-1'
						>
							<Star
								className={cn(
									'size-10',
									isHovered ? 'text-medal-gold' : 'text-medal-gold/80',
								)}
								fill='currentColor'
								strokeWidth={0}
							/>
						</motion.div>

						{/* Sparkle effect on hover */}
						<AnimatePresence>
							{isHovered && (
								<motion.div
									initial={{ scale: 0, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ scale: 0, opacity: 0 }}
									transition={{ duration: DURATION_S.normal }}
									className='absolute -top-1 -right-1'
								>
									<span className='text-xs'>✨</span>
								</motion.div>
							)}
						</AnimatePresence>
					</motion.button>
				)
			})}
		</div>
	)
}

// ============================================
// RATING LABELS
// ============================================

const RATING_LABEL_KEYS: Record<number, string> = {
	1: 'ratingStruggled',
	2: 'ratingOkay',
	3: 'ratingGood',
	4: 'ratingGreat',
	5: 'ratingNailed',
}

// ============================================
// MAIN COMPONENT
// ============================================

export function SessionRatingForm({
	xpEarned,
	recipeTitle,
	onSubmit,
	onSkip,
	isSubmitting = false,
}: SessionRatingFormProps) {
	const t = useTranslations('cooking')
	const [rating, setRating] = useState(0)
	const [hoverRating, setHoverRating] = useState(0)
	const [notes, setNotes] = useState('')
	const [showNotes, setShowNotes] = useState(false)

	const handleSubmit = useCallback(() => {
		if (rating === 0) return
		onSubmit(rating, notes.trim() || undefined)
	}, [rating, notes, onSubmit])

	const displayLabelKey =
		RATING_LABEL_KEYS[hoverRating] || RATING_LABEL_KEYS[rating]
	const displayLabel = displayLabelKey ? t(displayLabelKey) : undefined

	return (
		<div className='flex flex-col items-center'>
			{/* Celebration Emoji */}
			<motion.div
				initial={{ scale: 0, rotate: -180 }}
				animate={{ scale: 1, rotate: 0 }}
				transition={TRANSITION_BOUNCY}
				className='mb-4 grid size-20 place-items-center rounded-full bg-gradient-celebration text-4xl shadow-warm'
			>
				🎉
			</motion.div>

			{/* Title */}
			<h2 className='mb-1 text-2xl font-bold text-text'>
				{t('recipeComplete')}
			</h2>
			<p className='mb-4 text-sm text-text-secondary'>{recipeTitle}</p>

			{/* XP Badge */}
			<motion.div
				initial={{ scale: 0 }}
				animate={{ scale: 1 }}
				transition={{ delay: 0.2, ...TRANSITION_BOUNCY }}
				className='mb-6 inline-flex items-center gap-2 rounded-full bg-gradient-xp px-6 py-3 text-xl font-bold text-white shadow-card'
			>
				<Zap className='size-6' /> {t('cpXp', { xp: xpEarned })}
			</motion.div>

			{/* Rating Section */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.3 }}
				className='mb-4 text-center'
			>
				<p className='mb-3 text-sm font-medium text-text-secondary'>
					{t('howDidItGo')}
				</p>

				<StarRating
					rating={rating}
					hoverRating={hoverRating}
					onRate={setRating}
					onHover={setHoverRating}
					onLeave={() => setHoverRating(0)}
					recipeRatingLabel={t('recipeRating')}
					starAriaLabel={(count: number) => t('starAria', { count })}
				/>

				{/* Rating Label */}
				<AnimatePresence mode='wait'>
					{displayLabel && (
						<motion.p
							key={displayLabel}
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 10 }}
							className='mt-2 h-6 text-sm font-medium text-brand'
						>
							{displayLabel}
						</motion.p>
					)}
				</AnimatePresence>
			</motion.div>

			{/* Notes Toggle */}
			<AnimatePresence>
				{!showNotes && rating > 0 && (
					<motion.button
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						type='button'
						onClick={() => setShowNotes(true)}
						className='mb-4 flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors focus-visible:ring-2 focus-visible:ring-brand/50'
					>
						<MessageSquare className='size-4' />
						{t('addNote')}
					</motion.button>
				)}
			</AnimatePresence>

			{/* Notes Field */}
			<AnimatePresence>
				{showNotes && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						className='mb-4 w-full'
					>
						<textarea
							value={notes}
							onChange={e => setNotes(e.target.value)}
							placeholder={t('notePlaceholder')}
							className='w-full resize-none rounded-xl border border-border-subtle bg-bg p-3 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/20'
							rows={2}
							maxLength={500}
						/>
						<p
							className={`mt-1 text-right text-xs ${notes.length > 400 ? (notes.length >= 500 ? 'text-error font-semibold' : 'text-warning') : 'text-text-muted'}`}
						>
							{notes.length}/500
						</p>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Submit Button */}
			<motion.button
				type='button'
				onClick={handleSubmit}
				disabled={rating === 0 || isSubmitting}
				whileHover={rating > 0 ? BUTTON_HOVER : undefined}
				whileTap={rating > 0 ? BUTTON_TAP : undefined}
				className={cn(
					'w-full rounded-full py-3 font-bold text-white transition-all focus-visible:ring-2 focus-visible:ring-brand/50',
					rating > 0
						? 'bg-gradient-hero shadow-card hover:shadow-warm'
						: 'cursor-not-allowed bg-border text-text-muted',
					isSubmitting && 'opacity-70',
				)}
			>
				{isSubmitting ? (
					<span className='flex items-center justify-center gap-2'>
						<motion.span
							animate={{ rotate: 360 }}
							transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
						>
							⏳
						</motion.span>
						{t('saving')}
					</span>
				) : rating > 0 ? (
					t('completeCooking')
				) : (
					t('tapToRate')
				)}
			</motion.button>

			{/* Skip option */}
			{onSkip && (
				<button
					type='button'
					onClick={onSkip}
					disabled={isSubmitting}
					className='mt-3 text-sm text-text-muted transition-colors hover:text-text-secondary disabled:opacity-50'
				>
					{t('skipRateLater')}
				</button>
			)}
		</div>
	)
}
