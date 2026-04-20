'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface TextScrambleProps {
	text: string
	chars?: string
	duration?: number
	trigger?: boolean
	playOnMount?: boolean
	as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'div'
	className?: string
}

export function TextScramble({
	text,
	chars = '!<>-_\\/[]{}=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
	duration = 1500,
	trigger = true,
	playOnMount = false,
	as: Tag = 'span',
	className,
}: TextScrambleProps) {
	const [display, setDisplay] = React.useState(playOnMount ? '' : text)
	const frameRef = React.useRef<number>(0)
	const hasPlayed = React.useRef(false)

	React.useEffect(() => {
		if (!trigger) return
		if (hasPlayed.current && !playOnMount) return
		hasPlayed.current = true

		const totalFrames = Math.ceil(duration / 30)
		let frame = 0

		const scramble = () => {
			const progress = frame / totalFrames
			const revealed = Math.floor(progress * text.length)

			const output = text
				.split('')
				.map((char, i) => {
					if (i < revealed) return char
					if (char === ' ') return ' '
					return chars[Math.floor(Math.random() * chars.length)]
				})
				.join('')

			setDisplay(output)
			frame++

			if (frame <= totalFrames) {
				frameRef.current = requestAnimationFrame(scramble)
			} else {
				setDisplay(text)
			}
		}

		frameRef.current = requestAnimationFrame(scramble)
		return () => cancelAnimationFrame(frameRef.current)
	}, [trigger, text, chars, duration, playOnMount])

	return <Tag className={cn('whitespace-pre-wrap', className)}>{display}</Tag>
}
