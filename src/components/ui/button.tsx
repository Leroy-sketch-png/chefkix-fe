import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
	'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-bg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
	{
		variants: {
			variant: {
				default:
					'bg-brand text-white shadow-glow hover:bg-brand/90 hover:shadow-glow',
				destructive: 'bg-error text-white hover:bg-error/90',
				outline:
					'border border-border-medium bg-bg-card hover:bg-bg-elevated hover:text-text-primary',
				secondary: 'bg-bg-elevated text-text-primary hover:bg-bg-hover',
				ghost: 'hover:bg-bg-elevated hover:text-text-primary',
				link: 'text-brand underline-offset-4 hover:underline',
				// Brand button - primary CTA, coral tones
				brand:
					'bg-brand text-white shadow-glow hover:bg-brand/90 hover:shadow-glow',
				// Gaming/XP button - purple tones for gamification actions
				gaming:
					'bg-xp text-white shadow-md hover:bg-xp/90 hover:shadow-lg',
				// Success button - green tones for confirmations
				success: 'bg-success text-white hover:bg-success/90',
			},
			size: {
				default: 'h-10 px-4 py-2',
				sm: 'h-9 px-3',
				lg: 'h-11 px-8',
				xl: 'h-12 px-10 text-base',
				icon: 'size-10',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
)

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : 'button'
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		)
	},
)
Button.displayName = 'Button'

export { Button, buttonVariants }
