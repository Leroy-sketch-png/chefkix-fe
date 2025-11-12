'use client'

import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { forwardRef } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface AnimatedButtonProps extends React.ComponentProps<typeof Button> {
	isLoading?: boolean
	loadingText?: string
}

export const AnimatedButton = forwardRef<
	HTMLButtonElement,
	AnimatedButtonProps
>(({ children, isLoading, loadingText, disabled, ...props }, ref) => {
	const prefersReducedMotion = useReducedMotion()

	return (
		<Button ref={ref} disabled={disabled || isLoading} {...props} asChild>
			<motion.button
				whileHover={
					disabled || isLoading || prefersReducedMotion
						? undefined
						: { scale: 1.02 }
				}
				whileTap={
					disabled || isLoading || prefersReducedMotion
						? undefined
						: { scale: 0.98 }
				}
				transition={{ duration: 0.2 }}
			>
				{isLoading ? (
					<>
						<Loader2 className='mr-2 h-4 w-4 animate-spin' />
						{loadingText || 'Loading...'}
					</>
				) : (
					children
				)}
			</motion.button>
		</Button>
	)
})

AnimatedButton.displayName = 'AnimatedButton'
