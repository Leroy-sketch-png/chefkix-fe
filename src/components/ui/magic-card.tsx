'use client'

/**
 * MagicCard
 * Interactive card with two modes:
 *   - "gradient" (default): radial gradient spotlight that follows the cursor
 *   - "orb": glowing orb with spring physics that trails behind cursor
 *
 * Ported from ui_lab. Simplified for ChefKix light-first design (no next-themes dep).
 *
 * Usage:
 *   <MagicCard className="p-6 rounded-2xl">Content</MagicCard>
 *
 *   // Orb mode (stat cards)
 *   <MagicCard mode="orb" glowFrom="var(--color-brand)" glowTo="var(--color-xp)" className="p-4">
 *     Content
 *   </MagicCard>
 */

import React, { useCallback, useEffect, useRef } from 'react'
import {
	motion,
	useMotionTemplate,
	useMotionValue,
	useSpring,
	type HTMLMotionProps,
} from 'framer-motion'
import { cn } from '@/lib/utils'

interface MagicCardBaseProps extends HTMLMotionProps<'div'> {
	children?: React.ReactNode
	className?: string
	gradientSize?: number
	gradientFrom?: string
	gradientTo?: string
}

interface MagicCardGradientProps extends MagicCardBaseProps {
	mode?: 'gradient'
	gradientColor?: string
	gradientOpacity?: number
	glowFrom?: never
	glowTo?: never
	glowAngle?: never
	glowSize?: never
	glowBlur?: never
	glowOpacity?: never
}

interface MagicCardOrbProps extends MagicCardBaseProps {
	mode: 'orb'
	glowFrom?: string
	glowTo?: string
	glowAngle?: number
	glowSize?: number
	glowBlur?: number
	glowOpacity?: number
	gradientColor?: never
	gradientOpacity?: never
}

type MagicCardProps = MagicCardGradientProps | MagicCardOrbProps
type ResetReason = 'enter' | 'leave' | 'global' | 'init'

const globalResetHandlers = new Set<() => void>()
let removeGlobalResetListeners: null | (() => void) = null

function ensureGlobalResetListeners() {
	if (typeof window === 'undefined' || removeGlobalResetListeners) {
		return
	}

	const runGlobalResets = () => {
		for (const handler of globalResetHandlers) {
			handler()
		}
	}

	const handleGlobalPointerOut = (event: PointerEvent) => {
		if (!event.relatedTarget) {
			runGlobalResets()
		}
	}
	const handleBlur = () => runGlobalResets()
	const handleVisibility = () => {
		if (document.visibilityState !== 'visible') {
			runGlobalResets()
		}
	}

	window.addEventListener('pointerout', handleGlobalPointerOut)
	window.addEventListener('blur', handleBlur)
	document.addEventListener('visibilitychange', handleVisibility)

	removeGlobalResetListeners = () => {
		window.removeEventListener('pointerout', handleGlobalPointerOut)
		window.removeEventListener('blur', handleBlur)
		document.removeEventListener('visibilitychange', handleVisibility)
		removeGlobalResetListeners = null
	}
}

function subscribeToGlobalReset(handler: () => void) {
	if (typeof window === 'undefined') {
		return () => {}
	}

	globalResetHandlers.add(handler)
	ensureGlobalResetListeners()

	return () => {
		globalResetHandlers.delete(handler)
		if (globalResetHandlers.size === 0 && removeGlobalResetListeners) {
			removeGlobalResetListeners()
		}
	}
}

function isOrbMode(props: MagicCardProps): props is MagicCardOrbProps {
	return props.mode === 'orb'
}

export function MagicCard(props: MagicCardProps) {
	const {
		children,
		className,
		gradientSize = 200,
		gradientColor = 'rgb(255 90 54 / 0.14)',
		gradientOpacity = 0.6,
		gradientFrom = 'var(--color-brand)',
		gradientTo = 'var(--color-streak)',
		mode = 'gradient',
		glowFrom: glowFromProp,
		glowTo: glowToProp,
		glowAngle: glowAngleProp,
		glowSize: glowSizeProp,
		glowBlur: glowBlurProp,
		glowOpacity: glowOpacityProp,
		...restProps
	} = props

	const glowFrom = isOrbMode(props)
		? (glowFromProp ?? 'var(--color-brand)')
		: 'var(--color-brand)'
	const glowTo = isOrbMode(props)
		? (glowToProp ?? 'var(--color-streak)')
		: 'var(--color-streak)'
	const glowAngleValue = isOrbMode(props) ? (glowAngleProp ?? 90) : 90
	const glowSizeValue = isOrbMode(props) ? (glowSizeProp ?? 360) : 360
	const glowBlurValue = isOrbMode(props) ? (glowBlurProp ?? 50) : 50
	const glowOpacityValue = isOrbMode(props) ? (glowOpacityProp ?? 0.25) : 0.25

	const mouseX = useMotionValue(-gradientSize)
	const mouseY = useMotionValue(-gradientSize)
	const orbX = useSpring(mouseX, { stiffness: 250, damping: 30, mass: 0.6 })
	const orbY = useSpring(mouseY, { stiffness: 250, damping: 30, mass: 0.6 })
	const orbVisible = useSpring(0, { stiffness: 300, damping: 35 })

	const modeRef = useRef(mode)
	const glowOpacityRef = useRef(glowOpacityValue)
	const gradientSizeRef = useRef(gradientSize)

	useEffect(() => {
		modeRef.current = mode
	}, [mode])
	useEffect(() => {
		glowOpacityRef.current = glowOpacityValue
	}, [glowOpacityValue])
	useEffect(() => {
		gradientSizeRef.current = gradientSize
	}, [gradientSize])

	const reset = useCallback(
		(reason: ResetReason = 'leave') => {
			const currentMode = modeRef.current
			if (currentMode === 'orb') {
				if (reason === 'enter') orbVisible.set(glowOpacityRef.current)
				else orbVisible.set(0)
				return
			}
			const off = -gradientSizeRef.current
			mouseX.set(off)
			mouseY.set(off)
		},
		[mouseX, mouseY, orbVisible],
	)

	const handlePointerMove = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			const rect = e.currentTarget.getBoundingClientRect()
			mouseX.set(e.clientX - rect.left)
			mouseY.set(e.clientY - rect.top)
		},
		[mouseX, mouseY],
	)

	useEffect(() => {
		reset('init')
	}, [reset])

	useEffect(() => {
		return subscribeToGlobalReset(() => reset('global'))
	}, [reset])

	return (
		<motion.div
			{...restProps}
			className={cn(
				'group relative isolate overflow-hidden rounded-[inherit] border border-transparent',
				className,
			)}
			onPointerMove={handlePointerMove}
			onPointerLeave={() => reset('leave')}
			onPointerEnter={() => reset('enter')}
			style={{
				...restProps.style,
				background: useMotionTemplate`
          linear-gradient(var(--bg-card, #fdfbf8) 0 0) padding-box,
          radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px,
            ${gradientFrom},
            ${gradientTo},
            var(--border-subtle, #e8e2db) 100%
          ) border-box
        `,
			}}
		>
			<div className='absolute inset-px z-20 rounded-[inherit] bg-bg-card' />

			{mode === 'gradient' && (
				<motion.div
					suppressHydrationWarning
					className='pointer-events-none absolute inset-px z-30 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100'
					style={{
						background: useMotionTemplate`
              radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px,
                ${gradientColor},
                transparent 100%
              )
            `,
						opacity: gradientOpacity,
					}}
				/>
			)}

			{mode === 'orb' && (
				<motion.div
					suppressHydrationWarning
					aria-hidden='true'
					className='pointer-events-none absolute z-30'
					style={{
						width: glowSizeValue,
						height: glowSizeValue,
						x: orbX,
						y: orbY,
						translateX: '-50%',
						translateY: '-50%',
						borderRadius: 9999,
						filter: `blur(${glowBlurValue}px)`,
						opacity: orbVisible,
						background: `linear-gradient(${glowAngleValue}deg, ${glowFrom}, ${glowTo})`,
						willChange: 'transform, opacity',
					}}
				/>
			)}
			<div className='relative z-40'>{children}</div>
		</motion.div>
	)
}
