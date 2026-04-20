'use client'

import { useState, useCallback } from 'react'
import Image, { ImageProps } from 'next/image'
import { cn } from '@/lib/utils'
import { ImageOff, ChefHat, User } from 'lucide-react'

const KNOWN_BROKEN_IMAGE_PATTERNS = [
	'photo-1482049016530-d79f7d5e8c6e',
	'photo-1596097635121-14b63a7a7e7b',
]

/**
 * Fallback types for different content
 * Since physical placeholder images don't exist, we use icon-based fallbacks
 */
type FallbackType = 'recipe' | 'avatar' | 'post' | 'generic'

interface ImageWithFallbackProps extends Omit<ImageProps, 'onError'> {
	/** Type of fallback to use */
	fallbackType?: FallbackType
	/** Custom fallback component */
	fallbackComponent?: React.ReactNode
	/** Container className for the fallback */
	fallbackClassName?: string
}

/**
 * ImageWithFallback - Next/Image wrapper with standardized error handling
 *
 * IMAGE.6: Standardized image error fallbacks across the app
 * - Graceful degradation to icon-based fallbacks
 * - Consistent styling and behavior
 * - No dependency on physical placeholder images
 *
 * @example
 * // Recipe image with automatic fallback
 * <ImageWithFallback
 *   src={recipe.coverImageUrl}
 *   fallbackType="recipe"
 *   alt={recipe.title}
 *   fill
 * />
 *
 * @example
 * // Avatar with user icon fallback
 * <ImageWithFallback
 *   src={user.avatarUrl}
 *   fallbackType="avatar"
 *   alt={user.displayName}
 *   width={40}
 *   height={40}
 * />
 */
export const ImageWithFallback = ({
	src,
	alt,
	fallbackType = 'generic',
	fallbackComponent,
	fallbackClassName,
	className,
	width,
	height,
	fill,
	...props
}: ImageWithFallbackProps) => {
	const [hasError, setHasError] = useState(false)
	const [isLoading, setIsLoading] = useState(true)

	// Handle error - switch to fallback
	const handleError = useCallback(() => {
		setHasError(true)
		setIsLoading(false)
	}, [])

	// Handle load complete
	const handleLoad = useCallback(() => {
		setIsLoading(false)
	}, [])

	// Get the appropriate icon for fallback type
	const getFallbackIcon = () => {
		switch (fallbackType) {
			case 'recipe':
				return <ChefHat className='size-1/3 text-text-muted' />
			case 'avatar':
				return <User className='size-1/2 text-text-muted' />
			case 'post':
			case 'generic':
			default:
				return <ImageOff className='size-1/3 text-text-muted' />
		}
	}

	// Get gradient background for fallback type
	const getFallbackBackground = () => {
		switch (fallbackType) {
			case 'recipe':
				return 'bg-gradient-to-br from-brand/10 to-bg-elevated'
			case 'avatar':
				return 'bg-gradient-to-br from-xp/10 to-bg-elevated'
			case 'post':
				return 'bg-gradient-to-br from-accent-purple/10 to-bg-elevated'
			default:
				return 'bg-bg-elevated'
		}
	}

	// Render custom fallback if provided
	const isKnownBrokenSrc =
		typeof src === 'string' &&
		KNOWN_BROKEN_IMAGE_PATTERNS.some(pattern => src.includes(pattern))

	if ((hasError || !src || isKnownBrokenSrc) && fallbackComponent) {
		return <>{fallbackComponent}</>
	}

	// Render icon-based fallback when no image or error
	if (hasError || !src || isKnownBrokenSrc) {
		const sizeStyle = fill
			? { position: 'absolute' as const, inset: 0 }
			: { width, height }

		return (
			<div
				className={cn(
					'flex items-center justify-center',
					getFallbackBackground(),
					fallbackClassName || className,
				)}
				style={sizeStyle}
				role='img'
				aria-label={alt}
			>
				{getFallbackIcon()}
			</div>
		)
	}

	// Check if URL is external (needs unoptimized)
	const isExternalUrl = typeof src === 'string' && /^https?:\/\//.test(src)

	return (
		<Image
			src={src}
			alt={alt}
			width={width}
			height={height}
			fill={fill}
			className={cn(isLoading && 'animate-pulse bg-bg-elevated', className)}
			onError={handleError}
			onLoad={handleLoad}
			unoptimized={isExternalUrl}
			{...props}
		/>
	)
}

/**
 * Hook for managing image error state
 * Use when you need more control over the fallback behavior
 *
 * @example
 * const { hasError, handleError } = useImageFallback()
 * <Image src={url} onError={handleError} />
 * {hasError && <ChefHat />}
 */
export const useImageFallback = () => {
	const [hasError, setHasError] = useState(false)

	const handleError = useCallback(() => setHasError(true), [])
	const reset = useCallback(() => setHasError(false), [])

	return {
		hasError,
		handleError,
		reset,
	}
}
