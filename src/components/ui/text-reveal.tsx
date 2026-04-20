'use client'

import * as React from 'react'
import { motion, useInView, type TargetAndTransition } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'

type AnimationPreset =
	| 'blurIn'
	| 'slideUp'
	| 'slideDown'
	| 'slideLeft'
	| 'slideRight'
	| 'scaleUp'
	| 'fadeIn'

type TextRevealTag = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div'

interface TextRevealProps {
	text: string
	splitBy?: 'word' | 'character'
	preset?: AnimationPreset
	stagger?: number
	delay?: number
	duration?: number
	once?: boolean
	as?: TextRevealTag
	className?: string
}

const presets: Record<
	AnimationPreset,
	{ hidden: TargetAndTransition; visible: TargetAndTransition }
> = {
	blurIn: {
		hidden: { opacity: 0, filter: 'blur(12px)', y: 8 },
		visible: { opacity: 1, filter: 'blur(0px)', y: 0 },
	},
	slideUp: {
		hidden: { opacity: 0, y: 20 },
		visible: { opacity: 1, y: 0 },
	},
	slideDown: {
		hidden: { opacity: 0, y: -20 },
		visible: { opacity: 1, y: 0 },
	},
	slideLeft: {
		hidden: { opacity: 0, x: 20 },
		visible: { opacity: 1, x: 0 },
	},
	slideRight: {
		hidden: { opacity: 0, x: -20 },
		visible: { opacity: 1, x: 0 },
	},
	scaleUp: {
		hidden: { opacity: 0, scale: 0.8 },
		visible: { opacity: 1, scale: 1 },
	},
	fadeIn: {
		hidden: { opacity: 0 },
		visible: { opacity: 1 },
	},
}

export function TextReveal({
	text,
	splitBy = 'word',
	preset = 'blurIn',
	stagger = 0.05,
	delay = 0,
	duration = 0.4,
	once = true,
	as,
	className,
}: TextRevealProps) {
	const Component = (as ?? 'p') as TextRevealTag
	const ref = React.useRef<HTMLElement>(null)
	const inView = useInView(ref, { once, margin: '0px 0px -40px 0px' })
	const prefersReduced = useReducedMotion()

	const elements = React.useMemo(() => {
		if (splitBy === 'character') {
			return text.split('').map((char, i) => ({
				key: `${char}-${i}`,
				content: char === ' ' ? '\u00A0' : char,
			}))
		}
		return text.split(' ').map((word, i) => ({
			key: `${word}-${i}`,
			content: word,
		}))
	}, [text, splitBy])

	const { hidden, visible } = presets[preset]
	const containerClassName = cn('flex flex-wrap', className)
	const animatedChildren = elements.map((el, i) => (
		<motion.span
			key={el.key}
			initial={hidden}
			animate={inView ? visible : hidden}
			transition={{
				duration,
				delay: delay + i * stagger,
				ease: [0.21, 0.47, 0.32, 0.98],
			}}
			className={cn(splitBy === 'word' && 'mr-[0.25em]')}
			aria-hidden
		>
			{el.content}
		</motion.span>
	))

	if (prefersReduced) {
		return React.createElement(Component, { className }, text)
	}

	return React.createElement(
		Component,
		{
			ref: ref as React.Ref<HTMLElement>,
			className: containerClassName,
			'aria-label': text,
		},
		animatedChildren,
	)
}
