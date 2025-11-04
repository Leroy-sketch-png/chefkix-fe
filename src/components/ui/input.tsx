import * as React from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'

export interface InputProps extends React.ComponentProps<'input'> {
	error?: string
	success?: string
	warning?: string
	loading?: boolean
	leftIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	(
		{
			className,
			type,
			error,
			success,
			warning,
			loading,
			leftIcon,
			disabled,
			...props
		},
		ref,
	) => {
		const hasValidation = error || success || warning
		const isDisabled = disabled || loading

		return (
			<div className='w-full'>
				<div className='relative flex items-center'>
					{leftIcon && (
						<div className='pointer-events-none absolute left-3.5 text-muted'>
							{leftIcon}
						</div>
					)}
					<input
						type={type}
						className={cn(
							'h-12 w-full rounded-radius border-2 border-border-color bg-panel-bg px-4 text-[15px] transition-all duration-200 placeholder:text-muted focus:border-primary focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-bg',
							leftIcon && 'pl-11',
							hasValidation && 'pr-11',
							error &&
								'border-[#e74c3c] bg-[#e74c3c]/5 focus:border-[#e74c3c] focus:shadow-[0_0_0_3px_rgba(231,76,60,0.1)]',
							success &&
								'border-[#27ae60] bg-[#27ae60]/5 focus:border-[#27ae60] focus:shadow-[0_0_0_3px_rgba(39,174,96,0.1)]',
							warning &&
								'border-[#f39c12] bg-[#f39c12]/5 focus:border-[#f39c12] focus:shadow-[0_0_0_3px_rgba(243,156,18,0.1)]',
							className,
						)}
						ref={ref}
						disabled={isDisabled}
						aria-invalid={!!error}
						aria-describedby={
							error
								? `${props.id}-error`
								: success
									? `${props.id}-success`
									: warning
										? `${props.id}-warning`
										: undefined
						}
						{...props}
					/>
					{loading && (
						<div className='pointer-events-none absolute right-3.5'>
							<Loader2 className='h-5 w-5 animate-spin text-primary' />
						</div>
					)}
					{!loading && error && (
						<div className='pointer-events-none absolute right-3.5'>
							<AlertCircle className='h-5 w-5 text-[#e74c3c]' />
						</div>
					)}
					{!loading && success && (
						<div className='pointer-events-none absolute right-3.5'>
							<CheckCircle className='h-5 w-5 text-[#27ae60]' />
						</div>
					)}
					{!loading && warning && (
						<div className='pointer-events-none absolute right-3.5'>
							<AlertTriangle className='h-5 w-5 text-[#f39c12]' />
						</div>
					)}
				</div>
				{error && (
					<div
						id={`${props.id}-error`}
						className='mt-1.5 flex items-center gap-1.5 text-[13px] text-[#e74c3c]'
					>
						<AlertTriangle className='h-3.5 w-3.5' />
						{error}
					</div>
				)}
				{!error && success && (
					<div
						id={`${props.id}-success`}
						className='mt-1.5 flex items-center gap-1.5 text-[13px] text-[#27ae60]'
					>
						<CheckCircle className='h-3.5 w-3.5' />
						{success}
					</div>
				)}
				{!error && !success && warning && (
					<div
						id={`${props.id}-warning`}
						className='mt-1.5 flex items-center gap-1.5 text-[13px] text-[#f39c12]'
					>
						<AlertTriangle className='h-3.5 w-3.5' />
						{warning}
					</div>
				)}
			</div>
		)
	},
)

Input.displayName = 'Input'

export { Input }
