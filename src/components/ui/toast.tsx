'use client'

import * as React from 'react'
import { X, CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/**
 * Toast Component
 *
 * A notification toast with multiple variants (success, error, warning, info)
 * Supports action buttons, auto-dismiss, and manual close.
 *
 * Design Token Compliant:
 * - Uses semantic colors: success, error, warning, info
 * - Spacing: gap-sm, gap-md
 * - Radius: rounded-radius
 * - Shadows: shadow-lg
 *
 * @example
 * ```tsx
 * <Toast variant="success" title="Recipe saved!" onClose={() => {}}>
 *   Your recipe has been successfully saved to your collection.
 * </Toast>
 * ```
 */

const toastVariants = cva(
	'group pointer-events-auto relative flex w-full items-start gap-sm overflow-hidden rounded-radius border bg-panel-bg p-4 shadow-lg transition-all animate-slideInUp',
	{
		variants: {
			variant: {
				default: 'border-border',
				success:
					'border-success/30 bg-success/5 [&>svg]:text-success animate-confetti-pop',
				error: 'border-error/30 bg-error/5 [&>svg]:text-error',
				warning: 'border-warning/30 bg-warning/5 [&>svg]:text-warning',
				info: 'border-info/30 bg-info/5 [&>svg]:text-info',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
)

const iconMap = {
	success: CheckCircle2,
	error: XCircle,
	warning: AlertCircle,
	info: Info,
	default: Info,
}

export interface ToastProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof toastVariants> {
	/** Toast title */
	title?: string
	/** Toast description/body */
	description?: string
	/** Action button configuration */
	action?: {
		label: string
		onClick: () => void
	}
	/** Close button handler */
	onClose?: () => void
	/** Duration in milliseconds before auto-dismiss (0 = no auto-dismiss) */
	duration?: number
	/** Show/hide icon */
	showIcon?: boolean
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
	(
		{
			className,
			variant = 'default',
			title,
			description,
			children,
			action,
			onClose,
			duration = 5000,
			showIcon = true,
			...props
		},
		ref,
	) => {
		const [isVisible, setIsVisible] = React.useState(true)
		const timerRef = React.useRef<NodeJS.Timeout | null>(null)

		React.useEffect(() => {
			if (duration > 0) {
				timerRef.current = setTimeout(() => {
					setIsVisible(false)
					setTimeout(() => onClose?.(), 300) // Wait for exit animation
				}, duration)
			}

			return () => {
				if (timerRef.current) {
					clearTimeout(timerRef.current)
				}
			}
		}, [duration, onClose])

		const handleClose = () => {
			setIsVisible(false)
			setTimeout(() => onClose?.(), 300)
		}

		const Icon = iconMap[variant || 'default']

		return (
			<div
				ref={ref}
				className={cn(
					toastVariants({ variant }),
					!isVisible && 'translate-x-[120%] opacity-0',
					'transition-all duration-300',
					className,
				)}
				{...props}
			>
				{/* Icon */}
				{showIcon && <Icon className='mt-0.5 h-5 w-5 flex-shrink-0' />}

				{/* Content */}
				<div className='flex-1 space-y-1'>
					{title && (
						<div className='text-sm font-semibold text-text-primary'>
							{title}
						</div>
					)}
					{(description || children) && (
						<div className='text-sm text-text-secondary'>
							{description || children}
						</div>
					)}
					{action && (
						<div className='mt-2'>
							<Button
								variant='outline'
								size='sm'
								onClick={action.onClick}
								className='h-8 text-xs'
							>
								{action.label}
							</Button>
						</div>
					)}
				</div>

				{/* Close button */}
				{onClose && (
					<button
						onClick={handleClose}
						className='flex-shrink-0 rounded-sm opacity-70 ring-offset-bg transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
						aria-label='Close'
					>
						<X className='h-4 w-4' />
					</button>
				)}
			</div>
		)
	},
)
Toast.displayName = 'Toast'

export { Toast, toastVariants }
