'use client'

import * as React from 'react'
import { OTPInput, OTPInputContext } from 'input-otp'
import { MinusIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function InputOTP({
	className,
	containerClassName,
	...props
}: React.ComponentProps<typeof OTPInput> & {
	containerClassName?: string
}) {
	return (
		<OTPInput
			data-slot='input-otp'
			containerClassName={cn(
				'flex items-center gap-2 has-disabled:opacity-50',
				containerClassName,
			)}
			className={cn('disabled:cursor-not-allowed', className)}
			{...props}
		/>
	)
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot='input-otp-group'
			className={cn('flex items-center', className)}
			{...props}
		/>
	)
}

function InputOTPSlot({
	index,
	className,
	...props
}: React.ComponentProps<'div'> & {
	index: number
}) {
	const inputOTPContext = React.useContext(OTPInputContext)
	const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}

	return (
		<div
			data-slot='input-otp-slot'
			data-active={isActive}
			className={cn(
				'data-[active=true]:border-primary data-[active=true]:ring-primary/30 data-[active=true]:aria-invalid:ring-error/20 aria-invalid:border-error data-[active=true]:aria-invalid:border-error bg-bg-input border-border-medium relative flex h-12 w-12 items-center justify-center border-y border-r text-sm shadow-sm transition-all outline-none first:rounded-l-md first:border-l last:rounded-r-md data-[active=true]:z-10 data-[active=true]:ring-3',
				className,
			)}
			{...props}
		>
			{char}
			{hasFakeCaret && (
				<div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
					<div className='animate-caret-blink bg-text-primary h-4 w-px duration-1000' />
				</div>
			)}
		</div>
	)
}

function InputOTPSeparator({ ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot='input-otp-separator'
			role='separator'
			className='text-text-muted'
			{...props}
		>
			<MinusIcon />
		</div>
	)
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
