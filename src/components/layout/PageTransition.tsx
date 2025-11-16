'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { PAGE_VARIANTS, DURATIONS, EASINGS } from '@/lib/motion'
import { useRef, useEffect } from 'react'

export const PageTransition = ({ children }: { children: React.ReactNode }) => {
	const pathname = usePathname()
	const prefersReducedMotion = useReducedMotion()
	const isFirstMount = useRef(true)

	// Track first mount to skip initial animation
	useEffect(() => {
		isFirstMount.current = false
	}, [])

	const variants = prefersReducedMotion
		? {
				// No animation for reduced motion users
				initial: {},
				animate: {},
				exit: {},
			}
		: isFirstMount.current
			? {
					// No animation on first mount - content should appear immediately
					initial: { opacity: 1, y: 0 },
					animate: { opacity: 1, y: 0 },
					exit: { opacity: 0, y: -10 },
				}
			: PAGE_VARIANTS

	return (
		<AnimatePresence mode='wait'>
			<motion.div
				key={pathname}
				initial={variants.initial}
				animate={variants.animate}
				exit={variants.exit}
				transition={{
					duration: DURATIONS.smooth / 1000,
					ease: EASINGS.smooth,
					opacity: { duration: DURATIONS.fast / 1000 },
				}}
			>
				{children}
			</motion.div>
		</AnimatePresence>
	)
}
