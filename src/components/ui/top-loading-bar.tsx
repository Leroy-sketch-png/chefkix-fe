'use client'

import { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'

interface TopLoadingBarProps {
	isLoading: boolean
	className?: string
	estimatedDuration?: number
}

/**
 * NProgress-style thin loading bar at top of viewport.
 * Use with route changes for polished navigation feel.
 */
export function TopLoadingBar({
	isLoading,
	className,
	estimatedDuration = 8000,
}: TopLoadingBarProps) {
	const [progress, setProgress] = useState(0)
	const [visible, setVisible] = useState(false)
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

	useEffect(() => {
		if (isLoading) {
			setVisible(true)
			setProgress(0)

			let current = 0
			intervalRef.current = setInterval(() => {
				current +=
					current < 20 ? 5 : current < 50 ? 2 : current < 80 ? 0.5 : 0.1
				if (current >= 90) {
					current = 90
					if (intervalRef.current) clearInterval(intervalRef.current)
				}
				setProgress(current)
			}, estimatedDuration / 100)
		} else if (visible) {
			if (intervalRef.current) clearInterval(intervalRef.current)
			setProgress(100)
			const timeout = setTimeout(() => {
				setVisible(false)
				setProgress(0)
			}, 300)
			return () => clearTimeout(timeout)
		}

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current)
		}
	}, [isLoading, estimatedDuration, visible])

	if (!visible) return null

	return (
		<div
			className='fixed left-0 right-0 top-0 z-notification h-0.5'
			role='progressbar'
			aria-valuenow={Math.round(progress)}
		>
			<div
				className={cn(
					'h-full bg-brand transition-all duration-300 ease-out',
					progress === 100 && 'opacity-0 transition-opacity duration-300',
					className,
				)}
				style={{ width: `${progress}%` }}
			/>
		</div>
	)
}
