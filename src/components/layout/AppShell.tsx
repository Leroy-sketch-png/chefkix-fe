'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
	clearPendingFeedScrollPosition,
	getPendingFeedScrollPosition,
	scrollAppTo,
} from '@/lib/app-scroll'

interface AppShellProps {
	children: ReactNode
	header?: ReactNode
	sidebar?: ReactNode
	rightPanel?: ReactNode
	overlays?: ReactNode
	className?: string
	mainClassName?: string
}

export function AppShell({
	children,
	header,
	sidebar,
	rightPanel,
	overlays,
	className,
	mainClassName,
}: AppShellProps) {
	const pathname = usePathname()

	useEffect(() => {
		if (pathname !== '/feed') {
			if (!pathname.startsWith('/recipes/')) {
				clearPendingFeedScrollPosition()
			}
			return
		}

		const savedTop = getPendingFeedScrollPosition()
		if (savedTop == null) return

		let cancelled = false
		let frames = 0
		const restoreWhenFeedIsReady = () => {
			if (cancelled) return

			const feed = document.querySelector('[data-testid="feed-page"]')
			const feedReady = feed?.getAttribute('data-feed-ready') === 'true'
			if (feedReady || frames >= 120) {
				scrollAppTo(savedTop)
				clearPendingFeedScrollPosition()
				return
			}

			frames += 1
			requestAnimationFrame(restoreWhenFeedIsReady)
		}

		requestAnimationFrame(restoreWhenFeedIsReady)
		return () => {
			cancelled = true
		}
	}, [pathname])

	return (
		<div
			className={cn(
				'flex h-screen w-full flex-col overflow-hidden bg-bg',
				className,
			)}
		>
			{header}

			<div className='flex flex-1 overflow-hidden'>
				{sidebar}

				<main
					id='main-content'
					className={cn(
						'flex flex-1 flex-col gap-4 overflow-y-auto scroll-smooth p-4 pb-[calc(var(--h-mobile-nav)+var(--space-8)+env(safe-area-inset-bottom))] md:pb-4 lg:gap-6 lg:p-6 lg:pb-6',
						mainClassName,
					)}
				>
					{children}
				</main>

				{rightPanel}
			</div>

			{overlays}
		</div>
	)
}
