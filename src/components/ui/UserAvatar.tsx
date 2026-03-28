'use client'

import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { cn } from '@/lib/utils'

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
  const activeUserId = userId || user?.id
  const isOnline = useOnlineStatus(showOnlineStatus ? activeUserId : undefined)
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
            "absolute bottom-0 right-0 rounded-full border-2 border-bg bg-green-500",
            size === 'xs' && "h-2 w-2",
            size === 'sm' && "h-2.5 w-2.5",
            size === 'md' && "h-3 w-3",
            size === 'lg' && "h-3.5 w-3.5",
            size === 'xl' && "h-4 w-4",
            size === '2xl' && "h-5 w-5"
          )} 
          title="Online"
        />
      )}
    </div>
  )
}

