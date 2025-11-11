'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Switch Component
 *
 * A toggle switch for boolean settings.
 * Design token compliant.
 *
 * @example
 * ```tsx
 * const [enabled, setEnabled] = useState(false)
 * <Switch checked={enabled} onCheckedChange={setEnabled} />
 * ```
 */

export interface SwitchProps {
	checked?: boolean
	onCheckedChange?: (checked: boolean) => void
	disabled?: boolean
	className?: string
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
	({ checked = false, onCheckedChange, disabled = false, className }, ref) => {
		return (
			<button
				ref={ref}
				role='switch'
				type='button'
				aria-checked={checked}
				disabled={disabled}
				onClick={() => onCheckedChange?.(!checked)}
				className={cn(
					'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
					checked ? 'bg-primary' : 'bg-muted',
					className,
				)}
			>
				<span
					className={cn(
						'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
						checked ? 'translate-x-5' : 'translate-x-0.5',
					)}
				/>
			</button>
		)
	},
)
Switch.displayName = 'Switch'
