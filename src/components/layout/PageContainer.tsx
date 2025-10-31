import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface PageContainerProps {
	children: ReactNode
	maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
	className?: string
}

const maxWidthClasses = {
	sm: 'max-w-2xl',
	md: 'max-w-4xl',
	lg: 'max-w-5xl',
	xl: 'max-w-6xl',
	'2xl': 'max-w-7xl',
	full: 'max-w-full',
}

export const PageContainer = ({
	children,
	maxWidth = 'xl',
	className,
}: PageContainerProps) => {
	return (
		<div className={cn('mx-auto w-full', maxWidthClasses[maxWidth], className)}>
			{children}
		</div>
	)
}
