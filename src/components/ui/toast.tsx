'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Toast Component
 *
 * A whisper, not a shout. Subtle feedback that enhances without demanding.
 * If users miss it, the experience is no less satisfactory.
 *
 * Design Philosophy:
 * - Compact single-line format
 * - Tiny colored dot instead of icons
 * - Close button hidden until hover
 * - Semi-transparent backdrop blur
 * - Feels like a status hint, not a notification
 *
 * @example
 * ```tsx
 * <Toast variant="success" title="Saved" onClose={() => {}} />
 * ```
 */

const toastVariants = cva(
	'group pointer-events-auto relative flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs shadow-sm transition-all duration-200 animate-slideInUp bg-bg-card/95 backdrop-blur-sm border border-border-subtle',
	{
		variants: {
			variant: {
				default: 'text-text-secondary',
				success: 'text-text-secondary [&>.toast-dot]:bg-success',
				error: 'text-text-secondary [&>.toast-dot]:bg-brand',
				warning: 'text-text-secondary [&>.toast-dot]:bg-warning',
				info: 'text-text-secondary [&>.toast-dot]:bg-info',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
)

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
					setTimeout(() => onClose?.(), 200) // Wait for exit animation
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
			setTimeout(() => onClose?.(), 200)
		}

		// Minimal design: just a dot indicator, no heavy icons
		const showDot = variant !== 'default'

		return (
			<div
				ref={ref}
				className={cn(
					toastVariants({ variant }),
					!isVisible && 'translate-y-2 opacity-0',
					className,
				)}
				{...props}
			>
				{/* Tiny status dot */}
				{showDot && (
					<span className='toast-dot size-1.5 flex-shrink-0 rounded-full' />
				)}

				{/* Content - single line, compact */}
				<span className='flex-1 truncate'>
					{title}
					{description && (
						<span className='ml-1 opacity-70'>{description}</span>
					)}
					{children}
				</span>

				{/* Action - inline, subtle */}
				{action && (
					<button
						onClick={action.onClick}
						className='flex-shrink-0 font-medium text-brand hover:underline'
					>
						{action.label}
					</button>
				)}

				{/* Close - tiny, appears on hover */}
				{onClose && (
					<button
						onClick={handleClose}
						className='flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-60 hover:!opacity-100'
						aria-label='Close'
					>
						<X className='size-3' />
					</button>
				)}
			</div>
		)
	},
)
Toast.displayName = 'Toast'

export { Toast, toastVariants }
