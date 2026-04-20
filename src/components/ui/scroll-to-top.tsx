'use client'

import * as React from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScrollToTopProps {
	/** Show button after scrolling this many pixels */
	threshold?: number
	className?: string
}

export function ScrollToTop({ threshold = 400, className }: ScrollToTopProps) {
	const [visible, setVisible] = React.useState(false)

	React.useEffect(() => {
		const handleScroll = () => setVisible(window.scrollY > threshold)
		window.addEventListener('scroll', handleScroll, { passive: true })
		return () => window.removeEventListener('scroll', handleScroll)
	}, [threshold])

	return (
		<button
			type='button'
			onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
			className={cn(
				'fixed bottom-6 right-6 z-notification flex size-10 items-center justify-center rounded-full border border-border-subtle bg-bg-card shadow-warm transition-all duration-300',
				'hover:bg-bg-elevated hover:shadow-glow',
				visible
					? 'translate-y-0 opacity-100'
					: 'pointer-events-none translate-y-4 opacity-0',
				className,
			)}
			aria-label='Scroll to top'
		>
			<ArrowUp className='size-4 text-text-secondary' />
		</button>
	)
}
