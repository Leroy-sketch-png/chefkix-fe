'use client'

import { Group, MemberRole } from '@/lib/types/group'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
	Users,
	Lock,
	Globe,
	MoreVertical,
	Settings,
	UserMinus,
	LogOut,
	Share2,
	Loader2,
} from 'lucide-react'
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { leaveGroup } from '@/services/group'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useEscapeKey } from '@/hooks/useEscapeKey'

interface GroupHeaderProps {
	group: Group
	currentUserId?: string
	onSettingsClick?: () => void
	onLeaveGroup?: () => void
}

/**
 * Header component for group detail pages
 * Shows cover image, group name, description, member count, and action buttons
 * Styled like Facebook group headers but with ChefKix brand
 */
export const GroupHeader = ({
	group,
	currentUserId,
	onSettingsClick,
	onLeaveGroup,
}: GroupHeaderProps) => {
	const [isLeaving, setIsLeaving] = useState(false)
	const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
	const menuTriggerRef = useRef<HTMLButtonElement>(null)

	useEscapeKey(showLeaveConfirm, () => setShowLeaveConfirm(false))

	// Check if current user is admin based on myRole
	const isAdmin = group.myRole === 'ADMIN' || group.myRole === 'OWNER'
	const isOwner = group.myRole === 'OWNER'
	const isMember = group.myStatus === 'ACTIVE'

	const handleLeaveGroup = async () => {
		setIsLeaving(true)
		try {
			await leaveGroup(group.id)
			toast.success('You left the group')
			onLeaveGroup?.()
		} catch (error) {
			toast.error('Failed to leave group')
		} finally {
			setIsLeaving(false)
			setShowLeaveConfirm(false)
		}
	}

	return (
		<motion.div
			className='bg-bg-card rounded-xl border border-border overflow-hidden'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
		>
			{/* Cover Image */}
			<div className='relative w-full h-64 bg-gradient-to-br from-brand/10 to-brand/5 overflow-hidden'>
				{group.coverImageUrl ? (
					<Image
						src={group.coverImageUrl}
						alt={group.name}
						fill
						className='object-cover'
						priority
					/>
				) : (
					<div className='w-full h-full flex items-center justify-center'>
						<Users className='w-24 h-24 text-brand/20' />
					</div>
				)}

				{/* Overlay gradient */}
				<div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent' />

				{/* Privacy + Menu in top right */}
				<div className='absolute top-4 right-4 flex items-center gap-2'>
					<div className='bg-bg/90 backdrop-blur-sm rounded-full p-2 flex items-center gap-1'>
						{group.privacyType === 'PRIVATE' ? (
							<>
								<Lock className='w-4 h-4 text-text-secondary' />
								<span className='text-xs font-medium text-text-secondary'>
									Private
								</span>
							</>
						) : (
							<>
								<Globe className='w-4 h-4 text-text-secondary' />
								<span className='text-xs font-medium text-text-secondary'>
									Public
								</span>
							</>
						)}
					</div>

					{isMember && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									ref={menuTriggerRef}
									variant='outline'
									size='icon'
									className='bg-bg/90 backdrop-blur-sm border-0'
								>
									<MoreVertical className='w-4 h-4' />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end'>
								{(isOwner || isAdmin) && (
									<DropdownMenuItem onClick={onSettingsClick}>
										<Settings className='w-4 h-4 mr-2' />
										Group Settings
									</DropdownMenuItem>
								)}
								<DropdownMenuItem>
									<Share2 className='w-4 h-4 mr-2' />
									Share Group
								</DropdownMenuItem>
								{!isOwner && (
									<DropdownMenuItem
										onClick={() => setShowLeaveConfirm(true)}
										className='text-error focus:text-error'
									>
										<LogOut className='w-4 h-4 mr-2' />
										Leave Group
									</DropdownMenuItem>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</div>

			{/* Content */}
			<div className='p-6'>
				<div className='flex items-start justify-between gap-4'>
					<div className='flex-1'>
						<h1 className='text-3xl font-bold text-text'>{group.name}</h1>

						<div className='flex items-center gap-4 mt-3 flex-wrap'>
							<div className='flex items-center gap-1 text-text-secondary'>
								<Users className='w-4 h-4' />
								<span className='text-sm'>{group.memberCount} members</span>
							</div>

							{group.privacyType === 'PRIVATE' && (
								<div className='text-xs text-text-muted px-2 py-1 bg-bg rounded-full'>
									Private Group
								</div>
							)}

							{isOwner && (
								<div className='text-xs text-brand px-2 py-1 bg-brand/10 rounded-full'>
									You&apos;re the owner
								</div>
							)}

							{isAdmin && !isOwner && (
								<div className='text-xs text-brand px-2 py-1 bg-brand/10 rounded-full'>
									Admin
								</div>
							)}
						</div>

						{group.description && (
							<p className='text-text-secondary mt-4'>{group.description}</p>
						)}
					</div>
				</div>

				{/* Tags */}
				{group.tags && group.tags.length > 0 && (
					<div className='flex gap-2 mt-4 flex-wrap'>
						{group.tags.map(tag => (
							<span
								key={tag}
								className='text-xs bg-brand/10 text-brand px-3 py-1 rounded-full'
							>
								#{tag}
							</span>
						))}
					</div>
				)}
			</div>

			{/* Leave Group Confirm Dialog */}
			<ConfirmDialog
				open={showLeaveConfirm}
				onOpenChange={setShowLeaveConfirm}
				title='Leave Group?'
				description={`You will leave "${group.name}". If it's a private group, you may need to request to join again.`}
				confirmLabel='Leave'
				cancelLabel='Cancel'
				variant='destructive'
				onConfirm={handleLeaveGroup}
				onCancel={() => setShowLeaveConfirm(false)}
			/>
		</motion.div>
	)
}
