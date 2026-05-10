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
				'sticky top-0 z-sticky w-full shrink-0 border-b border-border-subtle bg-bg-card/92 backdrop-blur-xl',
				height,
				className,
			)}
			role='banner'
		>
			<div className='mx-auto flex h-full w-full items-center justify-between gap-3 px-3 md:gap-4 md:px-6'>
				<div className='flex shrink-0 items-center gap-2'>{left}</div>
				{center && (
					<div
						className={cn(
							'min-w-0 flex-1',
							!centerOnMobile && 'hidden md:block',
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
