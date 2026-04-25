'use client'

import {
	useEffect,
	useRef,
	useState,
	type ReactNode,
	startTransition,
} from 'react'

interface LazySectionProps {
	children: ReactNode
	/** Minimum height for the placeholder (prevents layout shift) */
	placeholderHeight?: string
	/** IntersectionObserver root margin (load earlier) */
	rootMargin?: string
	/** Custom skeleton to show while waiting */
	skeleton?: ReactNode
	/** Skip lazy loading and render immediately */
	eager?: boolean
}

/**
 * Defers rendering of below-the-fold content until it enters the viewport.
 * Reduces initial JS and render cost for heavy pages.
 */
export function LazySection({
	children,
	placeholderHeight = '200px',
	rootMargin = '100px',
	skeleton,
	eager = false,
}: LazySectionProps) {
	const [visible, setVisible] = useState(eager)
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (eager || visible) return

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					startTransition(() => setVisible(true))
					observer.disconnect()
				}
			},
			{ rootMargin },
		)

		if (ref.current) observer.observe(ref.current)
		return () => observer.disconnect()
	}, [rootMargin, eager, visible])

	if (visible) return <>{children}</>

	return (
		<div ref={ref} style={{ minHeight: placeholderHeight }}>
			{skeleton ?? (
				<div className='space-y-4 animate-pulse'>
					<div className='h-6 w-48 rounded bg-bg-elevated' />
					<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i} className='h-48 rounded-lg bg-bg-elevated' />
						))}
					</div>
				</div>
			)}
		</div>
	)
}
