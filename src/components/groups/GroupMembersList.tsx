'use client'

import { GroupMember, MemberRole } from '@/lib/types/group'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { motion } from 'framer-motion'
import { MoreVertical, Crown, Shield, Loader2, UserMinus } from 'lucide-react'
import { useState, useCallback } from 'react'
import { kickMember } from '@/services/group'
import { toast } from 'sonner'
import Link from 'next/link'
import { TRANSITION_SPRING } from '@/lib/motion'
import {
	StaggerContainer,
	staggerItemVariants,
} from '@/components/ui/stagger-animation'

interface GroupMembersListProps {
	members: GroupMember[]
	groupId: string
	currentUserId?: string
	canManageMembers?: boolean
	isLoading?: boolean
	onMemberRemoved?: (userId: string) => void
}

/**
 * Displays a list of group members with role indicators
 * Shows options to kick members if current user is admin/owner
 */
export const GroupMembersList = ({
	members,
	groupId,
	currentUserId,
	canManageMembers = false,
	isLoading = false,
	onMemberRemoved,
}: GroupMembersListProps) => {
	const [kickingUserId, setKickingUserId] = useState<string | null>(null)

	const handleKickMember = useCallback(
		async (userId: string, displayName: string) => {
			setKickingUserId(userId)
			try {
				await kickMember(groupId, userId)
				toast.success(`${displayName} has been removed from the group`)
				onMemberRemoved?.(userId)
			} catch (error) {
				toast.error('Failed to remove member')
			} finally {
				setKickingUserId(null)
			}
		},
		[groupId, onMemberRemoved],
	)

	const getRoleIcon = (role: MemberRole) => {
		switch (role) {
			case 'OWNER':
				return <Crown className='w-4 h-4 text-medal-gold' />
			case 'ADMIN':
				return <Shield className='w-4 h-4 text-info' />
			case 'MODERATOR':
				return <Shield className='w-4 h-4 text-info/70' />
			default:
				return null
		}
	}

	const getRoleLabel = (role: MemberRole) => {
		return role === 'MEMBER' ? '' : role
	}

	if (isLoading) {
		return (
			<div className='flex justify-center py-8'>
				<Loader2 className='w-6 h-6 animate-spin text-brand' />
			</div>
		)
	}

	if (members.length === 0) {
		return (
			<div className='text-center py-8'>
				<p className='text-text-secondary'>No members yet</p>
			</div>
		)
	}

	return (
		<StaggerContainer className='space-y-2'>
			{members.map(member => (
				<motion.div
					key={member.userId}
					variants={staggerItemVariants}
					className='bg-bg-card rounded-lg p-4 border border-border hover:border-brand/50 transition-colors flex items-center justify-between'
				>
					<Link href={`/profile/${member.userId}`} className='flex-1'>
						<div className='flex items-center gap-3 cursor-pointer'>
							<Avatar className='h-10 w-10'>
								<AvatarImage
									src={member.avatarUrl || undefined}
									alt={member.displayName}
								/>
								<AvatarFallback className='bg-brand/10 text-brand'>
									{member.displayName.charAt(0).toUpperCase()}
								</AvatarFallback>
							</Avatar>

							<div className='flex-1 min-w-0'>
								<div className='flex items-center gap-2'>
									<p className='font-medium text-text truncate'>
										{member.displayName}
									</p>
									{member.role !== 'MEMBER' && (
										<>
											{getRoleIcon(member.role)}
											<span className='text-xs font-semibold text-text-secondary'>
												{getRoleLabel(member.role)}
											</span>
										</>
									)}
								</div>
								<p className='text-xs text-text-muted'>
									Joined {new Date(member.joinedAt).toLocaleDateString()}
								</p>
							</div>
						</div>
					</Link>

					{canManageMembers &&
						member.userId !== currentUserId &&
						member.role !== 'OWNER' && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant='ghost' size='icon'>
										<MoreVertical className='w-4 h-4' />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align='end'>
									<DropdownMenuItem
										onClick={() =>
											handleKickMember(member.userId, member.displayName)
										}
										disabled={kickingUserId === member.userId}
										className='text-error focus:text-error'
									>
										{kickingUserId === member.userId ? (
											<Loader2 className='w-4 h-4 mr-2 animate-spin' />
										) : (
											<UserMinus className='w-4 h-4 mr-2' />
										)}
										Remove Member
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
				</motion.div>
			))}
		</StaggerContainer>
	)
}
