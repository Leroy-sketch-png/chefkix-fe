'use client'

import { getInitials } from '@/lib/utils'
import { useTranslations } from 'next-intl'

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
import { Skeleton } from '@/components/ui/skeleton'
import { useState, useCallback } from 'react'
import { kickMember } from '@/services/group'
import { toast } from 'sonner'
import Link from 'next/link'
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
	const t = useTranslations('groups')
	const [kickingUserId, setKickingUserId] = useState<string | null>(null)

	const handleKickMember = useCallback(
		async (userId: string, displayName: string) => {
			setKickingUserId(userId)
			try {
				await kickMember(groupId, userId)
				toast.success(t('gmRemoved', { name: displayName }))
				onMemberRemoved?.(userId)
			} catch (error) {
				toast.error(t('gmRemoveFailed'))
			} finally {
				setKickingUserId(null)
			}
		},
		[groupId, onMemberRemoved, t],
	)

	const getRoleIcon = (role: MemberRole) => {
		switch (role) {
			case 'OWNER':
				return <Crown className='size-4 text-medal-gold' />
			case 'ADMIN':
				return <Shield className='size-4 text-info' />
			case 'MODERATOR':
				return <Shield className='size-4 text-info/70' />
			default:
				return null
		}
	}

	const getRoleLabel = (role: MemberRole) => {
		if (role === 'MEMBER') return ''
		switch (role) {
			case 'OWNER':
				return t('gmRoleOwner')
			case 'ADMIN':
				return t('gmRoleAdmin')
			case 'MODERATOR':
				return t('gmRoleModerator')
			default:
				return role
		}
	}

	if (isLoading) {
		return (
			<div className='space-y-2'>
				{Array.from({ length: 5 }).map((_, i) => (
					<div
						key={i}
						className='bg-bg-card rounded-lg p-4 border border-border flex items-center justify-between'
					>
						<div className='flex items-center gap-3'>
							<Skeleton className='size-10 rounded-full' />
							<div className='space-y-1.5'>
								<Skeleton className='h-4 w-28' />
								<Skeleton className='h-3 w-20' />
							</div>
						</div>
						<Skeleton className='size-8 rounded-md' />
					</div>
				))}
			</div>
		)
	}

	if (members.length === 0) {
		return (
			<div className='text-center py-8'>
				<p className='text-text-secondary'>{t('gmNoMembers')}</p>
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
					<Link href={`/${member.userId}`} className='flex-1'>
						<div className='flex items-center gap-3 cursor-pointer'>
							<Avatar className='size-10'>
								<AvatarImage
									src={member.avatarUrl || undefined}
									alt={member.displayName}
								/>
								<AvatarFallback className='bg-brand/10 text-brand'>
									{getInitials(member.displayName, 1)}
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
									{t('gmJoined', {
										date: new Date(member.joinedAt).toLocaleDateString(),
									})}
								</p>
							</div>
						</div>
					</Link>

					{canManageMembers &&
						member.userId !== currentUserId &&
						member.role !== 'OWNER' && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant='ghost'
										size='icon'
										aria-label={t('memberOptions')}
									>
										<MoreVertical className='size-4' />
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
											<Loader2 className='size-4 mr-2 animate-spin' />
										) : (
											<UserMinus className='size-4 mr-2' />
										)}
										{t('gmRemoveMember')}
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
				</motion.div>
			))}
		</StaggerContainer>
	)
}
