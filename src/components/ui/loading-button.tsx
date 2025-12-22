'use client'

import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingButtonProps
	extends React.ComponentPropsWithoutRef<typeof Button> {
	loading?: boolean
	loadingText?: string
}

/**
 * Enhanced button with loading state
 * Automatically disables and shows spinner when loading
 *
 * @example
 * ```tsx
 * <LoadingButton loading={isSubmitting} loadingText="Submitting...">
 *   Submit
 * </LoadingButton>
 * ```
 */
export function LoadingButton({
	loading = false,
	loadingText,
	children,
	disabled,
	className,
	...props
}: LoadingButtonProps) {
	return (
		<Button disabled={loading || disabled} className={cn(className)} {...props}>
			{loading && <Loader2 className='mr-2 size-4 animate-spin' />}
			{loading && loadingText ? loadingText : children}
		</Button>
	)
}
