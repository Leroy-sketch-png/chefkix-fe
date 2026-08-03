'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

const THRESHOLD = 68
const MAX_PULL = 110

interface PullToRefreshProps {
	onRefresh: () => void | Promise<void>
	className?: string
	children: ReactNode
}

/**
 * PullToRefresh — Instagram/TikTok standard gesture for touch devices.
 *
 * Fires only when the window is scrolled to the top and the user drags
 * down more vertically than horizontally (so story rails and image
 * carousels keep horizontal swipes). The indicator is inert on desktop
 * because touch events never fire there.
 *
 * Uses native listeners with `{ passive: false }` for touchmove so
 * preventDefault() actually stops the browser's native overscroll.
 */
export function PullToRefresh({ onRefresh, className, children }: PullToRefreshProps) {
	const [pullDistance, setPullDistance] = useState(0)
	const [isRefreshing, setIsRefreshing] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)
	const startYRef = useRef<number | null>(null)
	const startXRef = useRef<number | null>(null)
	const pullingRef = useRef(false)
	const onRefreshRef = useRef(onRefresh)
	onRefreshRef.current = onRefresh

	const handleTouchMove = useCallback((e: TouchEvent) => {
		if (startYRef.current === null || startXRef.current === null) return
		if (window.scrollY > 0) return
		const touch = e.touches[0]
		const deltaY = touch.clientY - startYRef.current
		const deltaX = Math.abs(touch.clientX - startXRef.current)
		// Only engage when the drag is meaningfully vertical.
		if (deltaY > 0 && deltaY > deltaX) {
			pullingRef.current = true
			const dampened = Math.min(MAX_PULL, deltaY * 0.45)
			setPullDistance(dampened)
			if (dampened > 0 && e.cancelable) e.preventDefault()
		}
	}, [])

	const endPull = useCallback(() => {
		const wasPulling = pullingRef.current
		const distance = pullDistance
		startYRef.current = null
		startXRef.current = null
		pullingRef.current = false
		setPullDistance(0)
		if (wasPulling && distance >= THRESHOLD) {
			setIsRefreshing(true)
			void Promise.resolve(onRefreshRef.current()).finally(() =>
				setIsRefreshing(false),
			)
		}
	}, [pullDistance])

	useEffect(() => {
		const el = containerRef.current
		if (!el) return

		const handleTouchStart = (e: TouchEvent) => {
			if (window.scrollY > 0) return
			startYRef.current = e.touches[0].clientY
			startXRef.current = e.touches[0].clientX
			pullingRef.current = false
		}

		el.addEventListener('touchstart', handleTouchStart, { passive: true })
		el.addEventListener('touchmove', handleTouchMove, { passive: false })
		el.addEventListener('touchend', endPull, { passive: true })
		el.addEventListener('touchcancel', endPull, { passive: true })
		return () => {
			el.removeEventListener('touchstart', handleTouchStart)
			el.removeEventListener('touchmove', handleTouchMove)
			el.removeEventListener('touchend', endPull)
			el.removeEventListener('touchcancel', endPull)
		}
	}, [handleTouchMove, endPull])

	return (
		<div ref={containerRef} className={cn('relative', className)}>
			<AnimatePresence>
				{(pullDistance > 0 || isRefreshing) && (
					<motion.div
						initial={{ opacity: 0, y: -12 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -12 }}
						transition={{ duration: 0.15 }}
						className='pointer-events-none absolute inset-x-0 top-0 z-50 flex justify-center'
						style={{
							transform: `translateY(${isRefreshing ? 12 : pullDistance - 24}px)`,
						}}
						aria-live='polite'
					>
						<div className='flex size-10 items-center justify-center rounded-full border border-border-subtle bg-bg-card shadow-card'>
							<RefreshCw
								className={cn(
									'size-5 text-brand',
									(isRefreshing || pullDistance >= THRESHOLD) && 'animate-spin',
								)}
							/>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
			{children}
		</div>
	)
}
