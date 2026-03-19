import * as React from 'react'

import { cn } from '@/lib/utils'

const Textarea = React.forwardRef<
	HTMLTextAreaElement,
	React.ComponentProps<'textarea'>
>(({ className, ...props }, ref) => {
	return (
		<textarea
			className={cn(
				'flex min-h-textarea w-full rounded-md border-2 border-border-medium bg-bg-input px-3 py-2 text-sm leading-relaxed text-text-primary ring-offset-bg placeholder:text-text-muted transition-all duration-300 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-2 focus-visible:border-brand focus-visible:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 resize-none',
				className,
			)}
			ref={ref}
			{...props}
		/>
	)
})
Textarea.displayName = 'Textarea'

export { Textarea }
