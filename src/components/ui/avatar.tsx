'use client'

import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn } from '@/lib/utils'

const Avatar = React.forwardRef<
	React.ElementRef<typeof AvatarPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
	}
>(({ className, size = 'sm', ...props }, ref) => {
	// Matches DESIGN_SYSTEM.md avatar token scale exactly
	const sizeClasses = {
		xs: 'size-avatar-xs',   // 32px - tiny contexts, inline mentions
		sm: 'size-avatar-sm',   // 42px - comments, chat, sidebar items
		md: 'size-avatar-md',   // 72px - cards, medium displays
		lg: 'size-avatar-lg',   // 100px - profile headers, featured
		xl: 'size-avatar-xl',   // 120px - profile hero, cover overlap
		'2xl': 'size-40',       // 160px - hero/celebration contexts
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
			'flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-brand/20 to-xp/20 font-semibold text-text',
			className,
		)}
		{...props}
	/>
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
