'use client'

import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ReactNode } from 'react'

interface EmptyStateProps {
	icon: LucideIcon
	title: string
	description: string
	actionLabel?: string
	actionHref?: string
	onAction?: () => void
	children?: ReactNode
}

export const EmptyState = ({
	icon: Icon,
	title,
	description,
	actionLabel,
	actionHref,
	onAction,
	children,
}: EmptyStateProps) => {
	return (
		<div className='flex min-h-content flex-col items-center justify-center px-4 py-12'>
			<div className='mx-auto max-w-md animate-fadeIn text-center'>
				<div className='mb-6 flex justify-center'>
					<div className='rounded-full bg-gradient-to-br from-primary/10 to-accent/10 p-8 shadow-lg'>
						<Icon className='h-16 w-16 text-primary' />
					</div>
				</div>

				<h3 className='mb-2 text-xl font-bold text-text'>{title}</h3>
				<p className='mb-6 text-muted-foreground'>{description}</p>

				{children ? (
					children
				) : (actionLabel && actionHref) || onAction ? (
					<Button asChild={!!actionHref} onClick={onAction} variant='gradient'>
						{actionHref ? (
							<Link href={actionHref}>{actionLabel}</Link>
						) : (
							actionLabel
						)}
					</Button>
				) : null}
			</div>
		</div>
	)
}
