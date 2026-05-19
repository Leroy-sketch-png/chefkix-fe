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
		<div className='relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-4 py-12'>
			<div className='pointer-events-none absolute inset-0'>
				<div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,90,54,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(234,179,8,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.45),transparent_28%)]' />
				<div className='absolute inset-0 bg-[linear-gradient(180deg,rgba(248,244,239,0.08),rgba(248,244,239,0.68))]' />
				<div className='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/35 to-transparent' />
				<div className='absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-streak/25 to-transparent' />
			</div>

			<div className='relative z-10 w-full'>
				<div className='mx-auto mb-6 flex max-w-md items-center justify-center'>
					<div className='inline-flex items-center gap-2 rounded-full border border-border-subtle/80 bg-bg-card/88 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-secondary shadow-card'>
						<span className='size-2 rounded-full bg-brand' />
						Social media for food
					</div>
				</div>
				<div className={cn('relative mx-auto w-full max-w-md', className)}>
					{children}
				</div>
			</div>
		</div>
	)
}
