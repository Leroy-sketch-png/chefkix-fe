'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface TypingEffectProps {
	text: string
	speed?: number
	delay?: number
	cursor?: boolean
	cursorChar?: string
	autoStart?: boolean
	onComplete?: () => void
	className?: string
	cursorClassName?: string
}

export function TypingEffect({
	text,
	speed = 50,
	delay = 0,
	cursor = true,
	cursorChar = '\u258A',
	autoStart = true,
	onComplete,
	className,
	cursorClassName,
}: TypingEffectProps) {
	const [displayed, setDisplayed] = React.useState('')
	const [started, setStarted] = React.useState(false)
	const [complete, setComplete] = React.useState(false)

	React.useEffect(() => {
		if (!autoStart) return
		const id = setTimeout(() => setStarted(true), delay)
		return () => clearTimeout(id)
	}, [autoStart, delay])

	React.useEffect(() => {
		if (!started) return
		if (displayed.length >= text.length) {
			setComplete(true)
			onComplete?.()
			return
		}

		const id = setTimeout(() => {
			setDisplayed(text.slice(0, displayed.length + 1))
		}, speed)

		return () => clearTimeout(id)
	}, [started, displayed, text, speed, onComplete])

	React.useEffect(() => {
		setDisplayed('')
		setComplete(false)
		setStarted(false)
		if (autoStart) {
			const id = setTimeout(() => setStarted(true), delay)
			return () => clearTimeout(id)
		}
	}, [text, autoStart, delay])

	return (
		<span className={cn(className)} aria-label={text}>
			<span aria-hidden>{displayed}</span>
			{cursor && (
				<span
					className={cn(
						'ml-0.5 inline-block',
						complete ? 'animate-pulse' : 'animate-pulse',
						cursorClassName,
					)}
					aria-hidden
				>
					{cursorChar}
				</span>
			)}
		</span>
	)
}
