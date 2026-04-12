'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { DURATION_S } from '@/lib/motion'

interface ImageCarouselProps {
	images: string[]
	alt?: string
	aspectRatio?: 'square' | 'video' | 'auto'
	className?: string
	showControls?: boolean
	showIndicators?: boolean
	enableSwipe?: boolean
	enableKeyboard?: boolean
	onImageError?: (index: number) => void
}

/**
 * ImageCarousel — Multi-image viewer with arrows, dots, swipe, and keyboard nav.
 *
 * Features:
 * - Left/right arrows (hidden on single image)
 * - Dot indicators
 * - Swipe gesture support (mobile)
 * - Keyboard navigation (â† →)
 * - Accessible: aria labels, focus management
 */
export function ImageCarousel({
	images,
	alt = 'Image',
	aspectRatio = 'auto',
	className,
	showControls = true,
	showIndicators = true,
	enableSwipe = true,
	enableKeyboard = true,
	onImageError,
}: ImageCarouselProps) {
	const t = useTranslations('common')
	const [currentIndex, setCurrentIndex] = useState(0)
	const [direction, setDirection] = useState(0)
	const containerRef = useRef<HTMLDivElement>(null)

	const hasMultiple = images.length > 1

	const goToNext = useCallback(() => {
		if (!hasMultiple) return
		setDirection(1)
		setCurrentIndex(prev => (prev + 1) % images.length)
	}, [hasMultiple, images.length])

	const goToPrev = useCallback(() => {
		if (!hasMultiple) return
		setDirection(-1)
		setCurrentIndex(prev => (prev - 1 + images.length) % images.length)
	}, [hasMultiple, images.length])

	const goToIndex = useCallback(
		(index: number) => {
			setDirection(index > currentIndex ? 1 : -1)
			setCurrentIndex(index)
		},
		[currentIndex],
	)

	// Keyboard navigation
	useEffect(() => {
		if (!enableKeyboard || !hasMultiple) return

		const handleKeyDown = (e: KeyboardEvent) => {
			// Only handle if carousel is focused or contains focus
			if (!containerRef.current?.contains(document.activeElement)) return

			if (e.key === 'ArrowLeft') {
				e.preventDefault()
				goToPrev()
			} else if (e.key === 'ArrowRight') {
				e.preventDefault()
				goToNext()
			}
		}

		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [enableKeyboard, hasMultiple, goToNext, goToPrev])

	// Swipe handling
	const handleDragEnd = useCallback(
		(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
			if (!enableSwipe || !hasMultiple) return

			const swipeThreshold = 50
			if (info.offset.x > swipeThreshold) {
				goToPrev()
			} else if (info.offset.x < -swipeThreshold) {
				goToNext()
			}
		},
		[enableSwipe, hasMultiple, goToNext, goToPrev],
	)

	// Animation variants
	const variants = {
		enter: (dir: number) => ({
			x: dir > 0 ? 300 : -300,
			opacity: 0,
		}),
		center: {
			x: 0,
			opacity: 1,
		},
		exit: (dir: number) => ({
			x: dir > 0 ? -300 : 300,
			opacity: 0,
		}),
	}

	const aspectClasses = {
		square: 'aspect-square',
		video: 'aspect-video',
		auto: '',
	}

	if (images.length === 0) return null

	return (
		<div
			ref={containerRef}
			className={cn(
				'group relative overflow-hidden rounded-radius bg-bg-elevated',
				aspectClasses[aspectRatio],
				className,
			)}
			tabIndex={hasMultiple ? 0 : undefined}
			role='region'
			aria-label={t('ariaImageCarousel', {
				current: currentIndex + 1,
				total: images.length,
			})}
			aria-roledescription='carousel'
		>
			{/* Image container with animation */}
			<AnimatePresence initial={false} custom={direction} mode='wait'>
				<motion.div
					key={currentIndex}
					custom={direction}
					variants={variants}
					initial='enter'
					animate='center'
					exit='exit'
					transition={{ duration: DURATION_S.smooth, ease: 'easeInOut' }}
					drag={enableSwipe && hasMultiple ? 'x' : false}
					dragConstraints={{ left: 0, right: 0 }}
					dragElastic={0.2}
					onDragEnd={handleDragEnd}
					className='relative size-full'
				>
					<Image
						src={images[currentIndex]}
						alt={`${alt} ${currentIndex + 1} of ${images.length}`}
						fill
						className='object-cover'
						sizes='(max-width: 768px) 100vw, 600px'
						onError={() => onImageError?.(currentIndex)}
						unoptimized={/^https?:\/\//.test(images[currentIndex] || '')}
					/>
				</motion.div>
			</AnimatePresence>

			{/* Navigation arrows */}
			{showControls && hasMultiple && (
				<>
					<button
						type='button'
						onClick={goToPrev}
						className={cn(
							'absolute left-2 top-1/2 z-10 -translate-y-1/2',
							'flex size-8 items-center justify-center rounded-full',
							'bg-bg-card border border-border-subtle text-text',
							'opacity-70 transition-opacity duration-200 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100',
							'hover:bg-bg-card focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
						)}
						aria-label={t('ariaPreviousImage')}
					>
						<ChevronLeft className='size-5' />
					</button>
					<button
						type='button'
						onClick={goToNext}
						className={cn(
							'absolute right-2 top-1/2 z-10 -translate-y-1/2',
							'flex size-8 items-center justify-center rounded-full',
							'bg-bg-card border border-border-subtle text-text',
							'opacity-70 transition-opacity duration-200 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100',
							'hover:bg-bg-card focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
						)}
						aria-label={t('ariaNextImage')}
					>
						<ChevronRight className='size-5' />
					</button>
				</>
			)}

			{/* Dot indicators */}
			{showIndicators && hasMultiple && (
				<div
					className={cn(
						'absolute bottom-3 left-1/2 z-10 -translate-x-1/2',
						'flex items-center gap-1.5 rounded-full bg-bg-card border border-border-subtle px-2 py-1',
					)}
					role='tablist'
					aria-label={t('ariaImageIndicators')}
				>
					{images.map((_, index) => (
						<button
							type='button'
							key={index}
							onClick={() => goToIndex(index)}
							className={cn(
								'size-2 rounded-full transition-all duration-200',
								index === currentIndex
									? 'bg-brand scale-110'
									: 'bg-text-muted/50 hover:bg-text-secondary',
							)}
							role='tab'
							aria-selected={index === currentIndex}
							aria-label={t('ariaGoToImage', { number: index + 1 })}
						/>
					))}
				</div>
			)}

			{/* Counter badge (always visible) */}
			{hasMultiple && (
				<div
					className={cn(
						'absolute right-3 top-3 z-10',
						'rounded-full bg-bg-card border border-border-subtle px-2 py-0.5 text-xs font-medium text-text',
					)}
				>
					{currentIndex + 1}/{images.length}
				</div>
			)}
		</div>
	)
}
