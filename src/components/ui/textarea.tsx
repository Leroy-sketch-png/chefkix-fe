import * as React from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'

export interface TextareaProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	error?: string
	success?: string
	warning?: string
	showCharCount?: boolean
	charLimit?: number
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
	(
		{
			className,
			error,
			success,
			warning,
			showCharCount,
			charLimit,
			value,
			onChange,
			...props
		},
		ref,
	) => {
		const [charCount, setCharCount] = React.useState(0)
		const hasValidation = error || success || warning

		React.useEffect(() => {
			if (value && typeof value === 'string') {
				setCharCount(value.length)
			}
		}, [value])

		const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
			setCharCount(e.target.value.length)
			onChange?.(e)
		}

		return (
			<div className='w-full'>
				<textarea
					className={cn(
						'min-h-[100px] w-full resize-y rounded-radius border-2 border-border bg-panel-bg px-4 py-3 text-[15px] transition-all duration-200 placeholder:text-muted focus:border-primary focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-bg',
						error &&
							'border-[#e74c3c] bg-[#e74c3c]/5 focus:border-[#e74c3c] focus:shadow-[0_0_0_3px_rgba(231,76,60,0.1)]',
						success &&
							'border-[#27ae60] bg-[#27ae60]/5 focus:border-[#27ae60] focus:shadow-[0_0_0_3px_rgba(39,174,96,0.1)]',
						warning &&
							'border-[#f39c12] bg-[#f39c12]/5 focus:border-[#f39c12] focus:shadow-[0_0_0_3px_rgba(243,156,18,0.1)]',
						className,
					)}
					ref={ref}
					value={value}
					onChange={handleChange}
					maxLength={charLimit}
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
				{showCharCount && charLimit && (
					<div className='mt-1 text-right text-[12px] text-muted'>
						<span className='font-semibold text-primary'>{charCount}</span> /{' '}
						<span>{charLimit}</span>
					</div>
				)}
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
Textarea.displayName = 'Textarea'

export { Textarea }
