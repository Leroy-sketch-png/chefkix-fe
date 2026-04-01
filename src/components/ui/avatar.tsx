'use client'

import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn } from '@/lib/utils'

const Avatar = React.forwardRef<
	React.ElementRef<typeof AvatarPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
	}
>(({ className, size = 'md', ...props }, ref) => {
	const sizeClasses = {
		xs: 'size-6',
		sm: 'size-8',
		md: 'size-10',
		lg: 'size-12',
		xl: 'size-16',
		'2xl': 'size-24',
	}

	return (
		<AvatarPrimitive.Root
			ref={ref}
			className={cn(
				'relative flex shrink-0 overflow-hidden rounded-full',
				sizeClasses[size],
				className,
			)}
			{...props}
		/>
	)
})
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
	React.ElementRef<typeof AvatarPrimitive.Image>,
	React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
	<AvatarPrimitive.Image
		ref={ref}
		className={cn('aspect-square h-full w-full object-cover', className)}
		{...props}
	/>
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
	React.ElementRef<typeof AvatarPrimitive.Fallback>,
	React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
	<AvatarPrimitive.Fallback
		ref={ref}
		className={cn(
			'flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 text-text-primary font-semibold',
			className,
		)}
		{...props}
	/>
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
