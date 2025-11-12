'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

export const PageTransition = ({ children }: { children: React.ReactNode }) => {
	const pathname = usePathname()

	return (
		<AnimatePresence mode='wait'>
			<motion.div
				key={pathname}
				initial={{ opacity: 0, y: 20, scale: 0.98 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				exit={{ opacity: 0, y: -20, scale: 0.98 }}
				transition={{
					duration: 0.4,
					ease: [0.34, 1.56, 0.64, 1], // Spring easing
					opacity: { duration: 0.3 },
				}}
			>
				{children}
			</motion.div>
		</AnimatePresence>
	)
}
