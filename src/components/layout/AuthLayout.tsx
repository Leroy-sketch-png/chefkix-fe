'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AuthLayoutProps {
	children: ReactNode
	variant?: 'centered' | 'split'
	decorative?: ReactNode
	formSide?: 'left' | 'right'
	className?: string
}

export function AuthLayout({
	children,
	variant = 'centered',
	decorative,
	formSide = 'left',
	className,
}: AuthLayoutProps) {
	if (variant === 'split') {
		return (
			<div className={cn('flex min-h-screen', className)}>
				<div
					className={cn(
						'flex w-full items-center justify-center px-6 py-12 lg:w-1/2',
						formSide === 'right' && 'order-2',
					)}
				>
					<div className='w-full max-w-md space-y-8'>{children}</div>
				</div>

				<div
					className={cn(
						'hidden lg:block lg:w-1/2',
						formSide === 'right' && 'order-1',
					)}
				>
					{decorative ?? (
						<div className='flex h-full items-center justify-center bg-gradient-to-br from-brand/10 via-brand/5 to-bg'>
							<div className='text-center'>
								<div className='mx-auto mb-4 size-24 rounded-2xl bg-brand/20' />
							</div>
						</div>
					)}
				</div>
			</div>
		)
	}

	return (
		<div
			className={cn(
				'flex min-h-screen items-center justify-center bg-gradient-to-b from-bg to-bg-elevated/40 px-4 py-12',
				className,
			)}
		>
			<div
				className='pointer-events-none fixed inset-0 overflow-hidden'
				aria-hidden='true'
			>
				<div className='absolute -right-40 -top-40 size-80 rounded-full bg-brand/10 blur-3xl' />
				<div className='absolute -bottom-40 -left-40 size-80 rounded-full bg-xp/8 blur-3xl' />
			</div>

			<div className='relative w-full max-w-md'>{children}</div>
		</div>
	)
}
