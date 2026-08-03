'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
	getAppScrollTarget,
	getAppScrollTop,
	scrollAppTo,
} from '@/lib/app-scroll'

interface ScrollToTopProps {
	/** Show button after scrolling this many pixels */
	threshold?: number
	className?: string
}

export function ScrollToTop({ threshold = 400, className }: ScrollToTopProps) {
	const [visible, setVisible] = React.useState(false)
	const pathname = usePathname()

	React.useEffect(() => {
		const scrollTarget = getAppScrollTarget()
		const handleScroll = () => setVisible(getAppScrollTop() > threshold)

		handleScroll()
		scrollTarget.addEventListener('scroll', handleScroll, { passive: true })
		return () => scrollTarget.removeEventListener('scroll', handleScroll)
	}, [pathname, threshold])

	return (
		<button
			type='button'
			onClick={() => scrollAppTo(0, 'smooth')}
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
