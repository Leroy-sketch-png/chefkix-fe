'use client'

import { Profile } from '@/lib/types'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Check, X, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { acceptFriendRequest, declineFriendRequest } from '@/services/social'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { staggerItemVariants } from '@/components/ui/stagger-animation'

interface FriendRequestCardProps {
	profile: Profile
	onAccept?: (userId: string) => void
	onDecline?: (userId: string) => void
}

export const FriendRequestCard = ({
	profile,
	onAccept,
	onDecline,
}: FriendRequestCardProps) => {
	const [isAccepting, setIsAccepting] = useState(false)
	const [isDeclining, setIsDeclining] = useState(false)

	const handleAccept = async () => {
		setIsAccepting(true)

		const response = await acceptFriendRequest(profile.userId)

		if (response.success) {
			toast.success(`You are now friends with ${profile.displayName}!`)
			onAccept?.(profile.userId)
		} else {
			toast.error(response.message || 'Failed to accept friend request')
		}

		setIsAccepting(false)
	}

	const handleDecline = async () => {
		setIsDeclining(true)

		const response = await declineFriendRequest(profile.userId)

		if (response.success) {
			toast.success('Friend request declined')
			onDecline?.(profile.userId)
		} else {
			toast.error(response.message || 'Failed to decline friend request')
		}

		setIsDeclining(false)
	}

	return (
		<motion.div
			variants={staggerItemVariants}
			className='flex items-center justify-between rounded-radius border border-border-subtle bg-bg-card p-4 shadow-sm transition-all hover:shadow-md'
		>
			<div className='flex items-center gap-3'>
				<Avatar size='lg' className='shadow-sm'>
					<AvatarImage
						src={profile.avatarUrl || 'https://i.pravatar.cc/96'}
						alt={profile.displayName}
					/>
					<AvatarFallback>
						{profile.displayName
							.split(' ')
							.map(n => n[0])
							.join('')
							.toUpperCase()
							.slice(0, 2)}
					</AvatarFallback>
				</Avatar>
				<div>
					<h3 className='font-semibold text-text-primary'>
						{profile.displayName}
					</h3>
					<p className='text-sm text-text-secondary'>@{profile.username}</p>
				</div>
			</div>

			<div className='flex gap-2'>
				<Button
					variant='default'
					size='sm'
					onClick={handleAccept}
					disabled={isAccepting || isDeclining}
				>
					{isAccepting ? (
						<Loader2 className='h-4 w-4 animate-spin' />
					) : (
						<>
							<Check className='mr-1 h-4 w-4' />
							Accept
						</>
					)}
				</Button>
				<Button
					variant='ghost'
					size='sm'
					onClick={handleDecline}
					disabled={isAccepting || isDeclining}
				>
					{isDeclining ? (
						<Loader2 className='h-4 w-4 animate-spin' />
					) : (
						<>
							<X className='mr-1 h-4 w-4' />
							Decline
						</>
					)}
				</Button>
			</div>
		</motion.div>
	)
}
