'use client'

import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { forwardRef } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { BUTTON_HOVER, BUTTON_TAP, TRANSITION_SPRING } from '@/lib/motion'

interface AnimatedButtonProps extends React.ComponentProps<typeof Button> {
	isLoading?: boolean
	loadingText?: string
	/**
	 * Add shine effect for premium CTAs
	 * @default false
	 */
	shine?: boolean
}

export const AnimatedButton = forwardRef<
	HTMLButtonElement,
	AnimatedButtonProps
>(
	(
		{ children, isLoading, loadingText, disabled, shine = false, ...props },
		ref,
	) => {
		const prefersReducedMotion = useReducedMotion()

		return (
			<Button ref={ref} disabled={disabled || isLoading} {...props} asChild>
				<motion.button
					whileHover={
						disabled || isLoading || prefersReducedMotion
							? undefined
							: BUTTON_HOVER
					}
					whileTap={
						disabled || isLoading || prefersReducedMotion
							? undefined
							: BUTTON_TAP
					}
					transition={TRANSITION_SPRING}
					className='relative overflow-hidden'
				>
					{isLoading ? (
						<>
							<Loader2 className='mr-2 h-4 w-4 animate-spin' />
							{loadingText || 'Loading...'}
						</>
					) : (
						<>
							{children}
							{shine && !disabled && (
								<div className='pointer-events-none absolute inset-0 -translate-x-full animate-shine bg-gradient-to-r from-transparent via-white/20 to-transparent' />
							)}
						</>
					)}
				</motion.button>
			</Button>
		)
	},
)

AnimatedButton.displayName = 'AnimatedButton'
