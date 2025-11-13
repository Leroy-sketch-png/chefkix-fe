'use client'

import { Profile } from '@/lib/types'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { UserMinus, MessageCircle, Loader2, Trophy, Book } from 'lucide-react'
import { useState } from 'react'
import { unfriendUser } from '@/services/social'
import { toast } from 'sonner'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { staggerItemVariants } from '@/components/ui/stagger-animation'

interface FriendCardProps {
	profile: Profile
	onUnfriend?: (userId: string) => void
}

export const FriendCard = ({ profile, onUnfriend }: FriendCardProps) => {
	const [isUnfriending, setIsUnfriending] = useState(false)
	const [showMenu, setShowMenu] = useState(false)

	const handleUnfriend = async () => {
		if (
			!window.confirm(
				`Are you sure you want to unfriend ${profile.displayName}?`,
			)
		) {
			return
		}

		setIsUnfriending(true)

		const response = await unfriendUser(profile.userId)

		if (response.success) {
			toast.success(`You are no longer friends with ${profile.displayName}`)
			onUnfriend?.(profile.userId)
		} else {
			toast.error(response.message || 'Failed to unfriend user')
		}

		setIsUnfriending(false)
		setShowMenu(false)
	}

	return (
		<motion.div
			variants={staggerItemVariants}
			whileHover={{ scale: 1.01, y: -2 }}
			transition={{ duration: 0.2 }}
			className='group relative flex items-center justify-between rounded-radius border border-border-subtle bg-bg-card p-4 shadow-sm transition-all hover:shadow-md'
		>
			<Link
				href={`/${profile.userId}`}
				className='flex flex-1 items-center gap-3'
			>
				<Avatar
					size='lg'
					className='shadow-sm transition-all group-hover:scale-105'
				>
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
				<div className='flex-1'>
					<h3 className='font-semibold text-text-primary transition-colors group-hover:text-primary'>
						{profile.displayName}
					</h3>
					<p className='text-sm text-text-secondary'>@{profile.username}</p>
					{profile.statistics && (
						<div className='mt-1 flex gap-3 text-xs text-text-secondary'>
							<span className='flex items-center gap-1'>
								<Book className='h-3 w-3' />
								{profile.statistics.recipeCount} recipes
							</span>
							{profile.statistics.currentXP !== undefined && (
								<span className='flex items-center gap-1'>
									<Trophy className='h-3 w-3' />
									{profile.statistics.currentXP} XP
								</span>
							)}
						</div>
					)}
				</div>
			</Link>

			<div className='flex gap-2'>
				<Button
					variant='ghost'
					size='sm'
					asChild
					className='hover:bg-primary/10 hover:text-primary'
				>
					<Link href={`/messages?user=${profile.userId}`}>
						<MessageCircle className='h-4 w-4' />
					</Link>
				</Button>
				<Button
					variant='ghost'
					size='sm'
					onClick={handleUnfriend}
					disabled={isUnfriending}
					className='hover:bg-destructive/10 hover:text-destructive'
				>
					{isUnfriending ? (
						<Loader2 className='h-4 w-4 animate-spin' />
					) : (
						<UserMinus className='h-4 w-4' />
					)}
				</Button>
			</div>
		</motion.div>
	)
}
