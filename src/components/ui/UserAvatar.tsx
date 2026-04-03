'use client'

import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useUserOnlineStatus } from '@/hooks/useUserOnlineStatus'
import { useAuth } from '@/hooks/useAuth'

interface UserAvatarProps extends React.ComponentProps<typeof Avatar> {
	user?: {
		id?: string
		name?: string
		avatarUrl?: string
	} | null
	userId?: string
	name?: string
	src?: string
	size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
	showOnlineStatus?: boolean
}

export function UserAvatar({
	user,
	userId,
	name,
	src,
	size = 'md',
	showOnlineStatus = true,
	className,
	...props
}: UserAvatarProps) {
	const { user: currentUser } = useAuth()
	const activeUserId = userId || user?.id

	// Don't fetch presence for current user (they're always "online" to themselves)
	// and don't fetch if showOnlineStatus is disabled
	const shouldFetchPresence =
		showOnlineStatus && !!activeUserId && activeUserId !== currentUser?.userId

	const { isOnline } = useUserOnlineStatus(activeUserId, shouldFetchPresence)

	const displayName = name || user?.name || 'User'
	const initials = displayName.substring(0, 2).toUpperCase()
	const avatarSrc = src || user?.avatarUrl

	return (
		<div className="relative inline-block">
			<Avatar size={size} className={className} {...props}>
				<AvatarImage src={avatarSrc} alt={displayName} />
				<AvatarFallback>{initials}</AvatarFallback>
			</Avatar>

			{showOnlineStatus && isOnline && (
				<span
					className={cn(
						'absolute bottom-0 right-0 rounded-full border-2 border-bg bg-success',
						size === 'xs' && 'size-2',
						size === 'sm' && 'size-2.5',
						size === 'md' && 'size-3',
						size === 'lg' && 'size-3.5',
						size === 'xl' && 'size-4',
						size === '2xl' && 'size-5',
					)}
					title="Online"
				/>
			)}
		</div>
	)
}
