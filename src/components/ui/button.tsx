import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
	'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-semibold transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none overflow-hidden',
	{
		variants: {
			variant: {
				default:
					'bg-primary text-white shadow-[0_4px_15px_0_rgba(102,126,234,0.4)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_0_rgba(102,126,234,0.6)] active:translate-y-0 active:scale-[0.98] before:absolute before:left-[-100%] before:top-0 before:h-full before:w-full before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:transition-[left] before:duration-500 hover:before:left-[100%]',
				gradient:
					'bg-gradient-primary text-white shadow-[0_4px_15px_0_rgba(102,126,234,0.4)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_0_rgba(102,126,234,0.6)] active:translate-y-0 active:scale-[0.98] before:absolute before:left-[-100%] before:top-0 before:h-full before:w-full before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:transition-[left] before:duration-500 hover:before:left-[100%]',
				destructive:
					'bg-destructive text-white shadow-[0_4px_15px_0_rgba(231,76,60,0.4)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_0_rgba(231,76,60,0.6)] active:translate-y-0 active:scale-[0.98]',
				outline:
					'border-2 border-border-color bg-transparent text-text shadow-sm hover:bg-bg hover:border-primary hover:text-primary active:scale-[0.98]',
				secondary:
					'bg-muted text-text hover:bg-muted-strong active:scale-[0.98]',
				ghost: 'hover:bg-accent/10 hover:text-primary active:scale-[0.98]',
				link: 'text-primary underline-offset-4 hover:underline',
			},
			size: {
				default: 'h-11 px-5 py-2.5',
				sm: 'h-9 px-3.5 py-2 text-[13px]',
				lg: 'h-12 px-6 py-3 text-[15px]',
				icon: 'size-11',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
)

function Button({
	className,
	variant,
	size,
	asChild = false,
	onClick,
	...props
}: React.ComponentProps<'button'> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean
	}) {
	const Comp = asChild ? Slot : 'button'
	const rippleRef = React.useRef<HTMLSpanElement>(null)

	const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		// Create ripple effect
		if (rippleRef.current) {
			const ripple = document.createElement('span')
			const rect = e.currentTarget.getBoundingClientRect()
			const size = Math.max(rect.width, rect.height)
			const x = e.clientX - rect.left - size / 2
			const y = e.clientY - rect.top - size / 2

			ripple.style.cssText = `
				position: absolute;
				width: ${size}px;
				height: ${size}px;
				left: ${x}px;
				top: ${y}px;
				background: rgba(255, 255, 255, 0.6);
				border-radius: 50%;
				pointer-events: none;
				animation: ripple 0.6s ease-out;
			`

			rippleRef.current.appendChild(ripple)

			setTimeout(() => {
				ripple.remove()
			}, 600)
		}

		onClick?.(e)
	}

	return (
		<Comp
			data-slot='button'
			className={cn(buttonVariants({ variant, size }), className)}
			onClick={handleClick}
			{...props}
		>
			{props.children}
			<span ref={rippleRef} className='pointer-events-none absolute inset-0' />
		</Comp>
	)
}

export { Button, buttonVariants }
