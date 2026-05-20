'use client'

import React, { useContext, useEffect, useRef, useState } from 'react'
import {
	motion,
	useAnimationFrame,
	useMotionValue,
	useScroll,
	useSpring,
	useTransform,
	useVelocity,
	type MotionValue,
} from 'framer-motion'
import { cn } from '@/lib/utils'

export const wrap = (min: number, max: number, value: number) => {
	const rangeSize = max - min
	return ((((value - min) % rangeSize) + rangeSize) % rangeSize) + min
}

const ScrollVelocityContext = React.createContext<MotionValue<number> | null>(
	null,
)

interface ScrollVelocityRowProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode
	baseVelocity?: number
	direction?: 1 | -1
	scrollReactivity?: boolean
}

export function ScrollVelocityContainer({
	children,
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	const { scrollY } = useScroll()
	const scrollVelocity = useVelocity(scrollY)
	const smoothVelocity = useSpring(scrollVelocity, {
		damping: 50,
		stiffness: 400,
	})
	const velocityFactor = useTransform(smoothVelocity, value => {
		const sign = value < 0 ? -1 : 1
		const magnitude = Math.min(5, (Math.abs(value) / 1000) * 5)
		return sign * magnitude
	})

	return (
		<ScrollVelocityContext.Provider value={velocityFactor}>
			<div className={cn('relative w-full', className)} {...props}>
				{children}
			</div>
		</ScrollVelocityContext.Provider>
	)
}

export function ScrollVelocityRow(props: ScrollVelocityRowProps) {
	const sharedVelocityFactor = useContext(ScrollVelocityContext)
	if (sharedVelocityFactor) {
		return (
			<ScrollVelocityRowImpl {...props} velocityFactor={sharedVelocityFactor} />
		)
	}
	return <ScrollVelocityRowLocal {...props} />
}

interface ScrollVelocityRowImplProps extends ScrollVelocityRowProps {
	velocityFactor: MotionValue<number>
}

function ScrollVelocityRowImpl({
	children,
	baseVelocity = 5,
	direction = 1,
	className,
	velocityFactor,
	scrollReactivity = true,
	...props
}: ScrollVelocityRowImplProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const blockRef = useRef<HTMLDivElement>(null)
	const [numCopies, setNumCopies] = useState(1)

	const baseX = useMotionValue(0)
	const baseDirectionRef = useRef<number>(direction >= 0 ? 1 : -1)
	const currentDirectionRef = useRef<number>(direction >= 0 ? 1 : -1)
	const unitWidth = useMotionValue(0)

	const isInViewRef = useRef(true)
	const isPageVisibleRef = useRef(true)
	const prefersReducedMotionRef = useRef(false)

	useEffect(() => {
		const container = containerRef.current
		const block = blockRef.current
		let resizeObserver: ResizeObserver | null = null
		let intersectionObserver: IntersectionObserver | null = null
		let mediaQuery: MediaQueryList | null = null

		const handleVisibility = () => {
			isPageVisibleRef.current = document.visibilityState === 'visible'
		}

		const handlePRM = () => {
			if (mediaQuery) prefersReducedMotionRef.current = mediaQuery.matches
		}

		if (container && block) {
			const updateSizes = () => {
				const containerWidth = container.offsetWidth || 0
				const blockWidth = block.scrollWidth || 0
				unitWidth.set(blockWidth)
				const nextCopies =
					blockWidth > 0
						? Math.max(3, Math.ceil(containerWidth / blockWidth) + 2)
						: 1
				setNumCopies(prev => (prev === nextCopies ? prev : nextCopies))
			}

			updateSizes()
			resizeObserver = new ResizeObserver(updateSizes)
			resizeObserver.observe(container)
			resizeObserver.observe(block)

			intersectionObserver = new IntersectionObserver(([entry]) => {
				isInViewRef.current = entry.isIntersecting
			})
			intersectionObserver.observe(container)

			document.addEventListener('visibilitychange', handleVisibility, {
				passive: true,
			})
			handleVisibility()

			mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
			mediaQuery.addEventListener('change', handlePRM)
			handlePRM()
		}

		return () => {
			if (resizeObserver) resizeObserver.disconnect()
			if (intersectionObserver) intersectionObserver.disconnect()
			document.removeEventListener('visibilitychange', handleVisibility)
			if (mediaQuery) mediaQuery.removeEventListener('change', handlePRM)
		}
	}, [children, unitWidth])

	const x = useTransform([baseX, unitWidth], ([value, blockWidth]) => {
		const width = Number(blockWidth) || 1
		const offset = Number(value) || 0
		return `${-wrap(0, width, offset)}px`
	})

	useAnimationFrame((_, delta) => {
		if (!isInViewRef.current || !isPageVisibleRef.current) return
		const dt = delta / 1000
		const velocity = scrollReactivity ? velocityFactor.get() : 0
		const absVelocity = Math.min(5, Math.abs(velocity))
		const speedMultiplier = prefersReducedMotionRef.current
			? 1
			: 1 + absVelocity

		if (absVelocity > 0.1) {
			const scrollDirection = velocity >= 0 ? 1 : -1
			currentDirectionRef.current = baseDirectionRef.current * scrollDirection
		}

		const blockWidth = unitWidth.get() || 0
		if (blockWidth <= 0) return
		const pixelsPerSecond = (blockWidth * baseVelocity) / 100
		const moveBy =
			currentDirectionRef.current * pixelsPerSecond * speedMultiplier * dt
		baseX.set(baseX.get() + moveBy)
	})

	return (
		<div
			ref={containerRef}
			className={cn('w-full overflow-hidden whitespace-nowrap', className)}
			{...props}
		>
			<motion.div
				className='inline-flex transform-gpu items-center will-change-transform select-none'
				style={{ x }}
			>
				{Array.from({ length: numCopies }).map((_, index) => (
					<div
						key={index}
						ref={index === 0 ? blockRef : null}
						aria-hidden={index !== 0}
						className='inline-flex shrink-0 items-center'
					>
						{children}
					</div>
				))}
			</motion.div>
		</div>
	)
}

function ScrollVelocityRowLocal(props: ScrollVelocityRowProps) {
	const { scrollY } = useScroll()
	const localVelocity = useVelocity(scrollY)
	const localSmoothVelocity = useSpring(localVelocity, {
		damping: 50,
		stiffness: 400,
	})
	const localVelocityFactor = useTransform(localSmoothVelocity, value => {
		const sign = value < 0 ? -1 : 1
		const magnitude = Math.min(5, (Math.abs(value) / 1000) * 5)
		return sign * magnitude
	})
	return (
		<ScrollVelocityRowImpl {...props} velocityFactor={localVelocityFactor} />
	)
}
