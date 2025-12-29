'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Star, ThumbsUp, MessageCircle, Flag, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Interactive Star Rating Component
// ============================================================================

interface StarRatingProps {
	value?: number
	onChange?: (rating: number) => void
	readonly?: boolean
	size?: 'sm' | 'md' | 'lg'
	showValue?: boolean
	className?: string
}

export const StarRating = ({
	value = 0,
	onChange,
	readonly = false,
	size = 'md',
	showValue = false,
	className,
}: StarRatingProps) => {
	const [hoverRating, setHoverRating] = useState(0)
	const [rating, setRating] = useState(value)

	const handleClick = (selectedRating: number) => {
		if (readonly) return
		setRating(selectedRating)
		onChange?.(selectedRating)
	}

	const handleMouseEnter = (selectedRating: number) => {
		if (readonly) return
		setHoverRating(selectedRating)
	}

	const handleMouseLeave = () => {
		if (readonly) return
		setHoverRating(0)
	}

	const sizeClasses = {
		sm: 'h-4 w-4',
		md: 'h-8 w-8',
		lg: 'h-10 w-10',
	}

	const displayRating = hoverRating || rating

	return (
		<div className={cn('flex flex-col items-center gap-3', className)}>
			{!readonly && (
				<div className='text-sm font-semibold leading-tight text-text-primary'>
					Rate this recipe
				</div>
			)}
			<div className='flex gap-2'>
				{[1, 2, 3, 4, 5].map(star => (
					<button
						key={star}
						type='button'
						onClick={() => handleClick(star)}
						onMouseEnter={() => handleMouseEnter(star)}
						onMouseLeave={handleMouseLeave}
						disabled={readonly}
						className={cn(
							'h-11 w-11 cursor-pointer p-1 transition-all duration-300 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]',
							readonly && 'cursor-default',
							!readonly && 'hover:scale-125 hover:rotate-[15deg]',
						)}
						aria-label={`Rate ${star} stars`}
					>
						<Star
							className={cn(
								sizeClasses[size],
								'transition-colors',
								star <= displayRating
									? 'fill-[var(--gold)] text-[var(--gold)]'
									: 'text-border-subtle',
							)}
						/>
					</button>
				))}
			</div>
			{showValue && (
				<div className='text-xs leading-normal text-text-secondary'>
					{rating.toFixed(1)} out of 5
				</div>
			)}
		</div>
	)
}

// ============================================================================
// Rating Display Component (read-only with half stars)
// ============================================================================

interface RatingDisplayProps {
	rating: number
	reviewCount?: number
	size?: 'sm' | 'md' | 'lg'
	showCount?: boolean
	className?: string
}

export const RatingDisplay = ({
	rating,
	reviewCount,
	size = 'md',
	showCount = true,
	className,
}: RatingDisplayProps) => {
	const sizeClasses = {
		sm: 'h-3.5 w-3.5',
		md: 'h-4 w-4',
		lg: 'h-5 w-5',
	}

	const renderStar = (index: number) => {
		const fillPercentage = Math.min(Math.max(rating - index, 0), 1) * 100

		return (
			<div key={index} className='relative'>
				<Star className={cn(sizeClasses[size], 'text-border-subtle')} />
				{fillPercentage > 0 && (
					<div
						className='absolute inset-0 overflow-hidden'
						style={{ width: `${fillPercentage}%` }}
					>
						<Star
							className={cn(
								sizeClasses[size],
								'fill-[var(--gold)] text-[var(--gold)]',
							)}
						/>
					</div>
				)}
			</div>
		)
	}

	return (
		<div className={cn('flex items-center gap-2', className)}>
			<div className='flex gap-0.5'>{[0, 1, 2, 3, 4].map(renderStar)}</div>
			{showCount && reviewCount !== undefined && (
				<span className='text-sm font-semibold leading-normal text-text-secondary'>
					{rating.toFixed(1)} ({reviewCount} reviews)
				</span>
			)}
		</div>
	)
}

// ============================================================================
// Review Card Component
// ============================================================================

interface ReviewCardProps {
	author: {
		name: string
		avatar: string
	}
	rating: number
	date: string
	title?: string
	content: string
	images?: string[]
	helpful: number
	isHelpful?: boolean
	onHelpful?: () => void
	onReply?: () => void
	onReport?: () => void
}

export const ReviewCard = ({
	author,
	rating,
	date,
	title,
	content,
	images = [],
	helpful,
	isHelpful = false,
	onHelpful,
	onReply,
	onReport,
}: ReviewCardProps) => {
	return (
		<div className='rounded-[var(--radius)] border border-border-subtle bg-bg-card p-5 transition-shadow duration-200 hover:shadow-md'>
			{/* Header */}
			<div className='mb-4 flex items-start gap-3'>
				<div className='relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full'>
					<Image
						src={author.avatar}
						alt={author.name}
						fill
						sizes='48px'
						className='object-cover'
					/>
				</div>
				<div className='min-w-0 flex-1'>
					<div className='mb-1 text-sm font-bold leading-tight text-text-primary'>
						{author.name}
					</div>
					<div className='flex items-center gap-2'>
						<RatingDisplay rating={rating} showCount={false} size='sm' />
						<span className='text-xs leading-normal text-text-secondary'>
							{date}
						</span>
					</div>
				</div>
				<button className='h-11 w-11 rounded-md p-1 text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary'>
					<MoreVertical className='h-5 w-5' />
				</button>
			</div>

			{/* Content */}
			<div className='mb-4'>
				{title && (
					<h4 className='mb-2 text-base font-bold leading-tight text-text-primary'>
						{title}
					</h4>
				)}
				<p className='text-sm leading-relaxed text-text-primary'>{content}</p>
			</div>

			{/* Images */}
			{images.length > 0 && (
				<div className='mb-4 flex gap-2 overflow-x-auto'>
					{images.map((image, index) => (
						<div
							key={index}
							className='relative h-30 w-30 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg transition-transform duration-200 hover:scale-105'
						>
							<Image
								src={image}
								alt={`Review image ${index + 1}`}
								fill
								className='object-cover'
							/>
						</div>
					))}
				</div>
			)}

			{/* Footer */}
			<div className='flex gap-4 border-t border-border-subtle pt-4'>
				<button
					onClick={onHelpful}
					className={cn(
						'flex h-11 items-center gap-1.5 rounded-lg px-3 text-xs transition-all',
						isHelpful
							? 'bg-primary/10 text-primary'
							: 'text-text-secondary hover:bg-bg-hover hover:text-primary',
					)}
				>
					<ThumbsUp className={cn('h-4 w-4', isHelpful && 'fill-primary')} />
					<span>Helpful ({helpful})</span>
				</button>
				<button
					onClick={onReply}
					className='flex h-11 items-center gap-1.5 rounded-lg px-3 text-xs text-text-secondary transition-all hover:bg-bg-hover hover:text-primary'
				>
					<MessageCircle className='h-4 w-4' />
					<span>Reply</span>
				</button>
				<button
					onClick={onReport}
					className='flex h-11 items-center gap-1.5 rounded-lg px-3 text-xs text-text-secondary transition-all hover:bg-bg-hover hover:text-primary'
				>
					<Flag className='h-4 w-4' />
					<span>Report</span>
				</button>
			</div>
		</div>
	)
}

// ============================================================================
// Rating Breakdown Component
// ============================================================================

interface RatingBreakdownProps {
	rating: number
	totalReviews: number
	breakdown: {
		5: number
		4: number
		3: number
		2: number
		1: number
	}
	className?: string
}

export const RatingBreakdown = ({
	rating,
	totalReviews,
	breakdown,
	className,
}: RatingBreakdownProps) => {
	const getPercentage = (count: number) => {
		if (totalReviews === 0) return 0
		return (count / totalReviews) * 100
	}

	return (
		<div
			className={cn(
				'rounded-[var(--radius)] border border-border bg-card p-6',
				className,
			)}
		>
			{/* Header */}
			<div className='mb-6 border-b border-border pb-6 text-center'>
				<div className='mb-2 text-5xl font-extrabold text-foreground'>
					{rating.toFixed(1)}
				</div>
				<RatingDisplay
					rating={rating}
					showCount={false}
					size='lg'
					className='mb-2 justify-center'
				/>
				<div className='text-xs text-muted-foreground'>
					Based on {totalReviews.toLocaleString()} reviews
				</div>
			</div>

			{/* Breakdown Bars */}
			<div className='flex flex-col gap-3'>
				{[5, 4, 3, 2, 1].map(star => (
					<div key={star} className='flex items-center gap-3'>
						<span className='min-w-15 text-xs text-muted-foreground'>
							{star} stars
						</span>
						<div className='h-2 flex-1 overflow-hidden rounded-full bg-muted/20'>
							<div
								className='h-full bg-gradient-gold transition-all duration-500'
								style={{
									width: `${getPercentage(breakdown[star as keyof typeof breakdown])}%`,
								}}
							/>
						</div>
						<span className='min-w-10 text-right text-xs text-muted-foreground'>
							{breakdown[star as keyof typeof breakdown]}
						</span>
					</div>
				))}
			</div>
		</div>
	)
}
