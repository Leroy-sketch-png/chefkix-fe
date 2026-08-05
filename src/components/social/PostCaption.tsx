'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

export type PostCaptionMode = 'preview' | 'full'

interface PostCaptionProps {
	content: string
	mode?: PostCaptionMode
}

export function PostCaption({ content, mode = 'preview' }: PostCaptionProps) {
	const t = useTranslations('post')
	const captionId = useId()
	const captionRef = useRef<HTMLParagraphElement>(null)
	const [isExpanded, setIsExpanded] = useState(false)
	const [hasOverflow, setHasOverflow] = useState(false)

	useEffect(() => {
		setIsExpanded(false)
		setHasOverflow(false)
	}, [content, mode])

	useEffect(() => {
		if (mode !== 'preview' || isExpanded) return

		const caption = captionRef.current
		if (!caption) return

		const measure = () => {
			setHasOverflow(caption.scrollHeight > caption.clientHeight + 1)
		}
		const frame = window.requestAnimationFrame(measure)

		if (typeof ResizeObserver === 'undefined') {
			window.addEventListener('resize', measure)
			return () => {
				window.cancelAnimationFrame(frame)
				window.removeEventListener('resize', measure)
			}
		}

		const observer = new ResizeObserver(measure)
		observer.observe(caption)
		return () => {
			window.cancelAnimationFrame(frame)
			observer.disconnect()
		}
	}, [content, isExpanded, mode])

	const isPreview = mode === 'preview' && !isExpanded

	return (
		<div>
			<p
				id={captionId}
				ref={captionRef}
				data-testid='post-caption'
				className={cn(
					'whitespace-pre-wrap text-label leading-[1.65] tracking-normal text-text-primary',
					isPreview && 'line-clamp-2',
				)}
			>
				{content}
			</p>
			{isPreview && hasOverflow && (
				<button
					type='button'
					aria-controls={captionId}
					aria-expanded='false'
					onClick={() => setIsExpanded(true)}
					className='mt-1 min-h-11 rounded-md text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50'
				>
					{t('showFullCaption')}
				</button>
			)}
		</div>
	)
}
