'use client'

import * as React from 'react'
import { Toast, type ToastProps } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

/**
 * Toaster Component
 *
 * Container for managing multiple toast notifications.
 * Handles stacking, positioning, and queue management.
 *
 * Position options:
 * - top-right (default)
 * - top-left
 * - bottom-right
 * - bottom-left
 * - top-center
 * - bottom-center
 *
 * @example
 * ```tsx
 * // In app/layout.tsx
 * <Toaster position="top-right" />
 * ```
 */

export interface ToastConfig extends ToastProps {
	id: string
}

interface ToasterProps {
	/** Position of toast stack */
	position?:
		| 'top-right'
		| 'top-left'
		| 'bottom-right'
		| 'bottom-left'
		| 'top-center'
		| 'bottom-center'
	/** Maximum number of toasts to show */
	maxToasts?: number
}

// Global toast state
let toastCounter = 0
const toastListeners = new Set<(toasts: ToastConfig[]) => void>()
let toasts: ToastConfig[] = []

const notify = () => {
	toastListeners.forEach(listener => listener([...toasts]))
}

export const toast = {
	/** Show a success toast */
	success: (
		title: string,
		description?: string,
		options?: Partial<ToastConfig>,
	) => {
		const id = `toast-${++toastCounter}`
		toasts.push({
			id,
			variant: 'success',
			title,
			description,
			...options,
		})
		notify()
		return id
	},

	/** Show an error toast */
	error: (
		title: string,
		description?: string,
		options?: Partial<ToastConfig>,
	) => {
		const id = `toast-${++toastCounter}`
		toasts.push({
			id,
			variant: 'error',
			title,
			description,
			duration: 7000, // Errors stay longer
			...options,
		})
		notify()
		return id
	},

	/** Show a warning toast */
	warning: (
		title: string,
		description?: string,
		options?: Partial<ToastConfig>,
	) => {
		const id = `toast-${++toastCounter}`
		toasts.push({
			id,
			variant: 'warning',
			title,
			description,
			...options,
		})
		notify()
		return id
	},

	/** Show an info toast */
	info: (
		title: string,
		description?: string,
		options?: Partial<ToastConfig>,
	) => {
		const id = `toast-${++toastCounter}`
		toasts.push({
			id,
			variant: 'info',
			title,
			description,
			...options,
		})
		notify()
		return id
	},

	/** Show a custom toast */
	custom: (config: Omit<ToastConfig, 'id'>) => {
		const id = `toast-${++toastCounter}`
		toasts.push({ id, ...config })
		notify()
		return id
	},

	/** Show a promise toast (loading → success/error) */
	promise: async <T,>(
		promise: Promise<T>,
		messages: {
			loading: string
			success: string | ((data: T) => string)
			error: string | ((error: any) => string)
		},
	) => {
		const id = `toast-${++toastCounter}`

		// Show loading
		toasts.push({
			id,
			variant: 'info',
			title: messages.loading,
			duration: 0, // Don't auto-dismiss
		})
		notify()

		try {
			const data = await promise
			// Update to success
			const index = toasts.findIndex(t => t.id === id)
			if (index !== -1) {
				toasts[index] = {
					id,
					variant: 'success',
					title:
						typeof messages.success === 'function'
							? messages.success(data)
							: messages.success,
					duration: 5000,
				}
				notify()
			}
			return data
		} catch (error) {
			// Update to error
			const index = toasts.findIndex(t => t.id === id)
			if (index !== -1) {
				toasts[index] = {
					id,
					variant: 'error',
					title:
						typeof messages.error === 'function'
							? messages.error(error)
							: messages.error,
					duration: 7000,
				}
				notify()
			}
			throw error
		}
	},

	/** Dismiss a toast by ID */
	dismiss: (id: string) => {
		toasts = toasts.filter(t => t.id !== id)
		notify()
	},

	/** Dismiss all toasts */
	dismissAll: () => {
		toasts = []
		notify()
	},
}

export const Toaster = ({
	position = 'top-right',
	maxToasts = 5,
}: ToasterProps) => {
	const [currentToasts, setCurrentToasts] = React.useState<ToastConfig[]>([])

	React.useEffect(() => {
		toastListeners.add(setCurrentToasts)
		return () => {
			toastListeners.delete(setCurrentToasts)
		}
	}, [])

	// Limit number of toasts
	const visibleToasts = currentToasts.slice(-maxToasts)

	const positionClasses = {
		'top-right': 'top-0 right-0 flex-col',
		'top-left': 'top-0 left-0 flex-col',
		'bottom-right': 'bottom-0 right-0 flex-col-reverse',
		'bottom-left': 'bottom-0 left-0 flex-col-reverse',
		'top-center': 'top-0 left-1/2 -translate-x-1/2 flex-col items-center',
		'bottom-center':
			'bottom-0 left-1/2 -translate-x-1/2 flex-col-reverse items-center',
	}

	if (visibleToasts.length === 0) return null

	return (
		<div
			className={cn(
				'pointer-events-none fixed z-sticky flex max-h-screen w-full gap-2 p-4 md:max-w-modal-md',
				positionClasses[position],
			)}
		>
			{visibleToasts.map(toastConfig => (
				<Toast
					key={toastConfig.id}
					{...toastConfig}
					onClose={() => toast.dismiss(toastConfig.id)}
				/>
			))}
		</div>
	)
}
