import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface PageContainerProps {
	children: ReactNode
	maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'form' | 'full'
	className?: string
}

const maxWidthClasses = {
	sm: 'max-w-sm',
	md: 'max-w-md',
	lg: 'max-w-lg',
	xl: 'max-w-xl',
	'2xl': 'max-w-7xl',
	form: 'max-w-form',
	full: 'max-w-full',
}

export const PageContainer = ({
	children,
	maxWidth = 'lg', // Default to 800px social-media-style center
	className,
}: PageContainerProps) => {
	return (
		<div className={cn('mx-auto w-full', maxWidthClasses[maxWidth], className)}>
			{children}
		</div>
	)
}
