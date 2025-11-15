'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { PAGE_VARIANTS, DURATIONS, EASINGS } from '@/lib/motion'

export const PageTransition = ({ children }: { children: React.ReactNode }) => {
	const pathname = usePathname()
	const prefersReducedMotion = useReducedMotion()

	const variants = prefersReducedMotion
		? {
				// No animation for reduced motion users
				initial: {},
				animate: {},
				exit: {},
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
