import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface DividerOrProps {
	children?: ReactNode
	className?: string
}

export function DividerOr({ children = 'Or', className }: DividerOrProps) {
	return (
		<div className={cn('flex items-center', className)}>
			<div className='h-px flex-1 bg-border-subtle' />
			<span className='mx-3 py-0.5 text-sm font-medium text-text-muted'>
				{children}
			</span>
			<div className='h-px flex-1 bg-border-subtle' />
		</div>
	)
}
