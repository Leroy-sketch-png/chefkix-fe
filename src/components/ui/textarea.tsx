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
						'min-h-[100px] w-full resize-y rounded-radius border-2 border-border bg-panel-bg px-4 py-3 text-base transition-all duration-200 placeholder:text-muted focus:border-primary focus:shadow-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-bg',
						error &&
							'border-destructive bg-destructive/5 focus:border-destructive focus:shadow-sm',
						success &&
							'border-accent bg-accent/5 focus:border-accent focus:shadow-sm',
						warning &&
							'border-gold bg-gold/5 focus:border-gold focus:shadow-sm',
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
					<div className='mt-1 text-right text-xs text-muted'>
						<span className='font-semibold text-primary'>{charCount}</span> /{' '}
						<span>{charLimit}</span>
					</div>
				)}
				{error && (
					<div
						id={`${props.id}-error`}
						className='mt-1.5 flex items-center gap-1.5 text-sm text-destructive'
					>
						<AlertTriangle className='h-3.5 w-3.5' />
						{error}
					</div>
				)}
				{!error && success && (
					<div
						id={`${props.id}-success`}
						className='mt-1.5 flex items-center gap-1.5 text-sm text-accent'
					>
						<CheckCircle className='h-3.5 w-3.5' />
						{success}
					</div>
				)}
				{!error && !success && warning && (
					<div
						id={`${props.id}-warning`}
						className='mt-1.5 flex items-center gap-1.5 text-sm text-gold'
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
