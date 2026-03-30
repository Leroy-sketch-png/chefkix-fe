'use client'

import { Group } from '@/lib/types/group'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
	Users,
	Lock,
	Globe,
	ChevronRight,
	Loader2,
	Check,
	Clock,
} from 'lucide-react'
import { useState, useCallback } from 'react'
import { joinGroup } from '@/services/group'
import { toast } from 'sonner'
import { TRANSITION_SPRING, CARD_HOVER } from '@/lib/motion'
import { PATHS } from '@/constants/paths'

interface GroupCardProps {
	group: Group
	variant?: 'default' | 'compact' | 'horizontal'
	onJoinSuccess?: (group: Group) => void
	currentUserId?: string
	isJoinable?: boolean
}

/**
 * Card component for displaying a group with like Facebook styling
 * but with ChefKix brand colors (coral #FF5A36, warm parchment backgrounds)
 *
 * Variants:
 * - default: Large card with cover image, good for explore/discover
 * - compact: Smaller card, good for lists/sidebars
 * - horizontal: Compact horizontal layout, good for search results
 */
export const GroupCard = ({
	group,
	variant = 'default',
	onJoinSuccess,
	currentUserId,
	isJoinable = true,
}: GroupCardProps) => {
	const [isJoining, setIsJoining] = useState(false)
	const [hasJoined, setHasJoined] = useState(group.isJoined ?? false)
	const [requestPending, setRequestPending] = useState(
		group.hasPendingRequest ?? false,
	)

	const handleJoin = useCallback(async () => {
		if (!isJoinable || !currentUserId) return

		setIsJoining(true)
		try {
			const response = await joinGroup(group.id)
			setHasJoined(true)

			if (response.status === 'PENDING') {
				setRequestPending(true)
				toast.info('Your request to join has been sent to group admins')
			} else {
				toast.success('Successfully joined group!')
				onJoinSuccess?.(group)
			}
		} catch (error) {
			toast.error('Failed to join group')
		} finally {
			setIsJoining(false)
		}
	}, [group, isJoinable, currentUserId, onJoinSuccess])

	if (variant === 'compact') {
		return (
			<motion.div
				className='bg-bg-card rounded-lg p-4 border border-border hover:border-brand transition-colors'
				whileHover={{ scale: 1.02 }}
				transition={TRANSITION_SPRING}
			>
				<Link href={PATHS.GROUPS.DETAIL(group.id)}>
					<div className='flex items-center gap-3'>
						{group.coverImageUrl ? (
							<Image
								src={group.coverImageUrl}
								alt={group.name}
								width={60}
								height={60}
								className='w-12 h-12 rounded-md object-cover'
							/>
						) : (
							<div className='w-12 h-12 rounded-md bg-brand/10 flex items-center justify-center'>
								<Users className='size-6 text-brand' />
							</div>
						)}
						<div className='flex-1 min-w-0'>
							<h3 className='font-semibold text-sm text-text truncate'>
								{group.name}
							</h3>
							<p className='text-xs text-text-secondary'>
								{group.memberCount} members
							</p>
						</div>
						<ChevronRight className='size-4 text-text-muted flex-shrink-0' />
					</div>
				</Link>
			</motion.div>
		)
	}

	if (variant === 'horizontal') {
		return (
			<motion.div
				className='bg-bg-card rounded-lg p-3 border border-border flex items-center gap-3'
				whileHover={{ scale: 1.02 }}
				transition={TRANSITION_SPRING}
			>
				{group.coverImageUrl ? (
					<Image
						src={group.coverImageUrl}
						alt={group.name}
						width={48}
						height={48}
						className='w-12 h-12 rounded object-cover flex-shrink-0'
					/>
				) : (
					<div className='w-12 h-12 rounded bg-brand/10 flex items-center justify-center flex-shrink-0'>
						<Users className='size-5 text-brand' />
					</div>
				)}

				<div className='flex-1 min-w-0'>
					<h3 className='font-semibold text-text truncate'>{group.name}</h3>
					<div className='flex items-center gap-2 mt-1'>
						{group.privacyType === 'PRIVATE' ? (
							<Lock className='size-3 text-text-muted' />
						) : (
							<Globe className='size-3 text-text-muted' />
						)}
						<span className='text-xs text-text-secondary'>
							{group.memberCount} members
						</span>
					</div>
				</div>

				{hasJoined && (
					<div className='text-xs font-medium text-brand flex items-center gap-1'>
						<Check className='size-3' />
						Joined
					</div>
				)}

				{requestPending && (
					<div className='text-xs font-medium text-warning flex items-center gap-1'>
						<Clock className='size-3' />
						Pending
					</div>
				)}

				{!hasJoined && !requestPending && isJoinable && currentUserId && (
					<Button
						size='sm'
						variant='outline'
						onClick={handleJoin}
						disabled={isJoining}
						className='flex-shrink-0'
					>
						{isJoining ? <Loader2 className='size-3 animate-spin' /> : 'Join'}
					</Button>
				)}
			</motion.div>
		)
	}

	// Default variant
	return (
		<motion.div
			className='bg-bg-card rounded-xl border border-border overflow-hidden hover:border-brand transition-colors h-full flex flex-col pb-8'
			whileHover={{ scale: 1.02 }}
			transition={TRANSITION_SPRING}
		>
			{/* Cover Image */}
			<div className='relative w-full h-40 bg-gradient-to-br from-brand/10 to-brand/5 overflow-hidden'>
				{group.coverImageUrl ? (
					<Image
						src={group.coverImageUrl}
						alt={group.name}
						fill
						className='object-cover'
					/>
				) : (
					<div className='w-full h-full flex items-center justify-center'>
						<Users className='w-16 h-16 text-brand/30' />
					</div>
				)}

				{/* Privacy Badge */}
				<div className='absolute top-3 right-3'>
					<div className='bg-bg/95 backdrop-blur-sm rounded-full p-2 flex items-center gap-1'>
						{group.privacyType === 'PRIVATE' ? (
							<>
								<Lock className='size-3 text-text-secondary' />
								<span className='text-xs font-medium text-text-secondary'>
									Private
								</span>
							</>
						) : (
							<>
								<Globe className='size-3 text-text-secondary' />
								<span className='text-xs font-medium text-text-secondary'>
									Public
								</span>
							</>
						)}
					</div>
				</div>
			</div>

			{/* Content */}
			<div className='flex-1 p-4 flex flex-col'>
				<Link
					href={PATHS.GROUPS.DETAIL(group.id)}
					className='hover:no-underline'
				>
					<h3 className='font-bold text-lg text-text line-clamp-2 hover:text-brand transition-colors'>
						{group.name}
					</h3>
				</Link>

				<p className='text-sm text-text-secondary mt-2 line-clamp-2 flex-1'>
					{group.description || 'No description provided'}
				</p>

				{/* Tags */}
				{group.tags && group.tags.length > 0 && (
					<div className='flex gap-2 mt-3 flex-wrap'>
						{group.tags.slice(0, 2).map(tag => (
							<span
								key={tag}
								className='text-xs bg-brand/10 text-brand px-2 py-1 rounded-full'
							>
								#{tag}
							</span>
						))}
						{group.tags.length > 2 && (
							<span className='text-xs text-text-muted px-2 py-1'>
								+{group.tags.length - 2}
							</span>
						)}
					</div>
				)}

				{/* Member Count */}
				<div className='flex items-center gap-2 mt-3 text-sm text-text-secondary'>
					<Users className='size-4' />
					<span>{group.memberCount} members</span>
				</div>
			</div>

			{/* Footer / Actions */}
			<div className='border-t border-border p-4'>
				{hasJoined ? (
					<Link href={PATHS.GROUPS.DETAIL(group.id)} className='block'>
						<Button className='w-full bg-brand hover:bg-brand/90 text-white'>
							View Group
						</Button>
					</Link>
				) : requestPending ? (
					<div className='text-center py-2'>
						<p className='text-xs text-warning font-medium'>
							Request pending approval
						</p>
					</div>
				) : isJoinable && currentUserId ? (
					<Button
						className='w-full bg-brand hover:bg-brand/90 text-white'
						onClick={handleJoin}
						disabled={isJoining}
					>
						{isJoining ? (
							<>
								<Loader2 className='size-4 mr-2 animate-spin' />
								Joining...
							</>
						) : (
							'Join Group'
						)}
					</Button>
				) : (
					<Link href={PATHS.AUTH.SIGN_IN} className='block'>
						<Button variant='outline' className='w-full'>
							Sign in to Join
						</Button>
					</Link>
				)}
			</div>
		</motion.div>
	)
}
