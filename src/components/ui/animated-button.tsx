'use client'

import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { forwardRef } from 'react'

interface AnimatedButtonProps extends React.ComponentProps<typeof Button> {
	isLoading?: boolean
	loadingText?: string
}

export const AnimatedButton = forwardRef<
	HTMLButtonElement,
	AnimatedButtonProps
>(({ children, isLoading, loadingText, disabled, ...props }, ref) => {
	return (
		<Button ref={ref} disabled={disabled || isLoading} {...props} asChild>
			<motion.button
				whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
				whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
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
