'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StickyHeaderProps {
	left?: ReactNode
	center?: ReactNode
	right?: ReactNode
	centerOnMobile?: boolean
	height?: string
	className?: string
}

export function StickyHeader({
	left,
	center,
	right,
	centerOnMobile = false,
	height = 'h-16',
	className,
}: StickyHeaderProps) {
	return (
		<header
			className={cn(
				'sticky top-0 z-sticky w-full shrink-0 border-b border-border-subtle/60 bg-bg/90 dark:bg-bg-card/75 backdrop-blur-sm shadow-sm transition-colors',
				height,
				className,
			)}
			role='banner'
		>
			<a
				href='#main'
				className='sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 z-50 rounded-md bg-brand text-white px-3 py-2 text-sm'
			>
				Skip to content
			</a>

			<div className='mx-auto flex h-full w-full items-center justify-between gap-3 px-3 md:gap-4 md:px-6'>
				<div className='flex shrink-0 items-center gap-2'>{left}</div>
				{center && (
					<div
						className={cn(
							'min-w-0 flex-1',
							!centerOnMobile && 'hidden md:flex',
						)}
					>
						{center}
					</div>
				)}
				<div className='ml-auto flex shrink-0 items-center gap-1.5 md:gap-2'>
					{right}
				</div>
			</div>
		</header>
	)
}
