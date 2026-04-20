'use client'

import { useTranslations } from 'next-intl'

import { Group } from '@/lib/types/group'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { DURATION_S } from '@/lib/motion'
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
	const t = useTranslations('groups')
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
			toast.success(t('ghLeftGroup'))
			onLeaveGroup?.()
		} catch (error) {
			toast.error(t('ghLeaveFailed'))
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
			transition={{ duration: DURATION_S.smooth }}
		>
			{/* Cover Image */}
			<div className='relative w-full h-64 bg-gradient-to-br from-brand/10 to-brand/5 overflow-hidden'>
				{group.coverImageUrl ? (
					<Image
						src={group.coverImageUrl}
						alt={group.name}
						fill
						sizes='100vw'
						className='object-cover'
						priority
					/>
				) : (
					<div className='w-full h-full flex items-center justify-center'>
						<Users className='size-24 text-brand/20' />
					</div>
				)}

				{/* Overlay gradient */}
				<div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent' />

				{/* Privacy + Menu in top right */}
				<div className='absolute top-4 right-4 flex items-center gap-2'>
					<div className='bg-bg/90 backdrop-blur-sm rounded-full p-2 flex items-center gap-1'>
						{group.privacyType === 'PRIVATE' ? (
							<>
								<Lock className='size-4 text-text-secondary' />
								<span className='text-xs font-medium text-text-secondary'>
									{t('gcPrivate')}
								</span>
							</>
						) : (
							<>
								<Globe className='size-4 text-text-secondary' />
								<span className='text-xs font-medium text-text-secondary'>
									{t('gcPublic')}
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
									aria-label={t('groupOptionsMenu')}
								>
									<MoreVertical className='size-4' />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end'>
								{(isOwner || isAdmin) && (
									<DropdownMenuItem onClick={onSettingsClick}>
										<Settings className='size-4 mr-2' />
										{t('ghGroupSettings')}
									</DropdownMenuItem>
								)}
								<DropdownMenuItem>
									<Share2 className='size-4 mr-2' />
									{t('ghShareGroup')}
								</DropdownMenuItem>
								{!isOwner && (
									<DropdownMenuItem
										onClick={() => setShowLeaveConfirm(true)}
										className='text-error focus:text-error'
									>
										<LogOut className='size-4 mr-2' />
										{t('ghLeaveGroup')}
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
								<Users className='size-4' />
								<span className='text-sm'>
									{t('ghMembersCount', { count: group.memberCount })}
								</span>
							</div>

							{group.privacyType === 'PRIVATE' && (
								<div className='text-xs text-text-muted px-2 py-1 bg-bg rounded-full'>
									{t('ghPrivateGroup')}
								</div>
							)}

							{isOwner && (
								<div className='text-xs text-brand px-2 py-1 bg-brand/10 rounded-full'>
									{t('ghOwner')}
								</div>
							)}

							{isAdmin && !isOwner && (
								<div className='text-xs text-brand px-2 py-1 bg-brand/10 rounded-full'>
									{t('ghAdmin')}
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
				title={t('ghLeaveTitle')}
				description={t('ghLeaveDesc', { name: group.name })}
				confirmLabel={t('ghLeave')}
				variant='destructive'
				onConfirm={handleLeaveGroup}
				onCancel={() => setShowLeaveConfirm(false)}
			/>
		</motion.div>
	)
}
