'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

interface HighlightOnScrollProps {
	/** The text content to progressively highlight. */
	text: string
	/** Highlighted word color. */
	highlightColor?: string
	/** Dim (unread) word color. */
	dimColor?: string
	/** HTML tag to render. */
	as?: 'p' | 'h1' | 'h2' | 'h3' | 'span'
	className?: string
}

/**
 * Apple-style text where words illuminate one-by-one as the user scrolls.
 * Each word transitions from dim → bright based on scroll progress.
 *
 * @example
 * <HighlightOnScroll
 *   text="Every recipe tells a story. Every bite is an adventure."
 *   as="h2"
 *   className="text-3xl font-bold max-w-2xl"
 * />
 */
export function HighlightOnScroll({
	text,
	highlightColor = 'var(--text)',
	dimColor = 'var(--text-muted)',
	as: Tag = 'p',
	className,
}: HighlightOnScrollProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const words = text.split(/\s+/)

	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ['start 0.8', 'end 0.3'],
	})

	return (
		<div ref={containerRef}>
			<Tag className={cn('flex flex-wrap', className)}>
				{words.map((word, i) => (
					<Word
						key={`${word}-${i}`}
						word={word}
						progress={scrollYProgress}
						range={[i / words.length, (i + 1) / words.length]}
						highlightColor={highlightColor}
						dimColor={dimColor}
					/>
				))}
			</Tag>
		</div>
	)
}

function Word({
	word,
	progress,
	range,
	highlightColor,
	dimColor,
}: {
	word: string
	progress: ReturnType<typeof useScroll>['scrollYProgress']
	range: [number, number]
	highlightColor: string
	dimColor: string
}) {
	const color = useTransform(progress, range, [dimColor, highlightColor])
	return (
		<motion.span style={{ color }} className='mr-[0.25em] inline-block'>
			{word}
		</motion.span>
	)
}
