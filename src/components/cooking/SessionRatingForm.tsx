'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Zap, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
	TRANSITION_BOUNCY,
	BUTTON_HOVER,
	BUTTON_TAP,
	SPRING_BOUNCY,
} from '@/lib/motion'

// ============================================
// TYPES
// ============================================

interface SessionRatingFormProps {
	xpEarned: number
	recipeTitle: string
	onSubmit: (rating: number, notes?: string) => void
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
}

function StarRating({
	rating,
	hoverRating,
	onRate,
	onHover,
	onLeave,
}: StarRatingProps) {
	const displayRating = hoverRating || rating

	return (
		<div
			className='flex items-center justify-center gap-1'
			onMouseLeave={onLeave}
			role='radiogroup'
			aria-label='Recipe rating'
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
						whileHover={{ scale: 1.2 }}
						whileTap={{ scale: 0.9 }}
						className='relative p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 rounded-full'
						aria-label={`${star} star${star > 1 ? 's' : ''}`}
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
									isHovered ? 'text-yellow-400' : 'text-yellow-500',
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
									transition={{ duration: 0.2 }}
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

const RATING_LABELS: Record<number, string> = {
	1: 'Struggled a bit',
	2: 'It was okay',
	3: 'Good cook!',
	4: 'Great success!',
	5: 'Nailed it! 🔥',
}

// ============================================
// MAIN COMPONENT
// ============================================

export function SessionRatingForm({
	xpEarned,
	recipeTitle,
	onSubmit,
	isSubmitting = false,
}: SessionRatingFormProps) {
	const [rating, setRating] = useState(0)
	const [hoverRating, setHoverRating] = useState(0)
	const [notes, setNotes] = useState('')
	const [showNotes, setShowNotes] = useState(false)

	const handleSubmit = useCallback(() => {
		if (rating === 0) return
		onSubmit(rating, notes.trim() || undefined)
	}, [rating, notes, onSubmit])

	const displayLabel = RATING_LABELS[hoverRating] || RATING_LABELS[rating]

	return (
		<div className='flex flex-col items-center'>
			{/* Celebration Emoji */}
			<motion.div
				initial={{ scale: 0, rotate: -180 }}
				animate={{ scale: 1, rotate: 0 }}
				transition={TRANSITION_BOUNCY}
				className='mb-4 grid size-20 place-items-center rounded-full bg-gradient-celebration text-4xl shadow-lg'
			>
				🎉
			</motion.div>

			{/* Title */}
			<h2 className='mb-1 text-2xl font-bold text-text'>Recipe Complete!</h2>
			<p className='mb-4 text-sm text-text-secondary'>{recipeTitle}</p>

			{/* XP Badge */}
			<motion.div
				initial={{ scale: 0 }}
				animate={{ scale: 1 }}
				transition={{ delay: 0.2, ...TRANSITION_BOUNCY }}
				className='mb-6 inline-flex items-center gap-2 rounded-full bg-gradient-xp px-6 py-3 text-xl font-bold text-white shadow-md'
			>
				<Zap className='size-6' /> +{xpEarned} XP
			</motion.div>

			{/* Rating Section */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.3 }}
				className='mb-4 text-center'
			>
				<p className='mb-3 text-sm font-medium text-text-secondary'>
					How did it go?
				</p>

				<StarRating
					rating={rating}
					hoverRating={hoverRating}
					onRate={setRating}
					onHover={setHoverRating}
					onLeave={() => setHoverRating(0)}
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
						className='mb-4 flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors'
					>
						<MessageSquare className='size-4' />
						Add a note (optional)
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
							placeholder='Any thoughts on this cook?'
							className='w-full resize-none rounded-xl border border-border-subtle bg-bg p-3 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20'
							rows={2}
							maxLength={500}
						/>
						<p className='mt-1 text-right text-xs text-text-muted'>
							{notes.length}/500
						</p>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Submit Button */}
			<motion.button
				onClick={handleSubmit}
				disabled={rating === 0 || isSubmitting}
				whileHover={rating > 0 ? BUTTON_HOVER : undefined}
				whileTap={rating > 0 ? BUTTON_TAP : undefined}
				className={cn(
					'w-full rounded-full py-3 font-bold text-white transition-all',
					rating > 0
						? 'bg-gradient-hero shadow-md hover:shadow-lg'
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
						Saving...
					</span>
				) : rating > 0 ? (
					'Share Your Cook! 📸'
				) : (
					'Tap a star to rate ⭐'
				)}
			</motion.button>
		</div>
	)
}
