'use client'

import * as React from 'react'
import { Slot, Slottable } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

// ── Variants ───────────────────────────────────────────────────────────
const shinyButtonVariants = cva(
	'group relative inline-flex items-center justify-center overflow-hidden rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
	{
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground hover:bg-primary/90',
				secondary:
					'bg-secondary text-secondary-foreground hover:bg-secondary/80',
				outline:
					'border border-border bg-background text-foreground hover:bg-accent',
			},
			size: {
				sm: 'h-9 px-4 text-sm',
				md: 'h-11 px-6 text-base',
				lg: 'h-13 px-8 text-lg',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'md',
		},
	},
)

// ── Props ──────────────────────────────────────────────────────────────
interface ShinyButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof shinyButtonVariants> {
	asChild?: boolean
	/** Shine sweep speed in seconds */
	shineDuration?: number
	/** Shine color (auto-detected from variant if not set) */
	shineColor?: string
}

// ── Component ──────────────────────────────────────────────────────────
/**
 * Button with a sweeping shine/shimmer effect on hover.
 * The classic "premium" CTA button from SaaS landing pages.
 *
 * @example
 * <ShinyButton>Get Started</ShinyButton>
 * <ShinyButton variant="outline" size="lg">Learn More</ShinyButton>
 */
export const ShinyButton = React.forwardRef<
	HTMLButtonElement,
	ShinyButtonProps
>(
	(
		{
			className,
			variant,
			size,
			asChild = false,
			shineDuration = 1.5,
			shineColor,
			children,
			type = 'button',
			...props
		},
		ref,
	) => {
		const Comp = asChild ? Slot : 'button'
		const defaultShineColor =
			variant === 'outline'
				? 'oklch(from var(--foreground) l c h / 8%)'
				: 'oklch(1 0 0 / 15%)'

		return (
			<Comp
				ref={ref}
				type='button'
				className={cn(shinyButtonVariants({ variant, size }), className)}
				{...(!asChild ? { type } : {})}
				{...props}
			>
				<Slottable>{children}</Slottable>
				{/* Shine sweep overlay */}
				<span
					className='absolute inset-0 -translate-x-full skew-x-[-20deg] group-hover:animate-shine-sweep'
					style={{
						background: `linear-gradient(90deg, transparent, ${shineColor ?? defaultShineColor}, transparent)`,
						animationDuration: `${shineDuration}s`,
					}}
					aria-hidden
				/>
			</Comp>
		)
	},
)
ShinyButton.displayName = 'ShinyButton'
