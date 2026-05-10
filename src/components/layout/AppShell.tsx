'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

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
	return (
		<div
			className={cn(
				'flex h-screen w-full flex-col overflow-hidden bg-background',
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
