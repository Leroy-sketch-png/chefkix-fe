'use client'

import { Plus } from 'lucide-react'
import { UserStoryFeedResponse } from '@/lib/types/story'
import { cn } from '@/lib/utils'

interface StoryAvatarProps {
	user: UserStoryFeedResponse
	isAddButton?: boolean
	isCurrentUser?: boolean
}

export const StoryAvatar = ({
	user,
	isAddButton = false,
	isCurrentUser = false,
}: StoryAvatarProps) => {
	const hasUnseen = user.hasUnseenStory
	const label = isAddButton
		? 'Add Story'
		: isCurrentUser
			? 'Your Story'
			: user.displayName || 'User'

	return (
		<div className='flex w-20 flex-col items-center gap-2'>
			<div className='relative rounded-[1.25rem] bg-bg-card/80 p-1.5 shadow-card transition-transform duration-200 active:scale-95'>
				<div
					className={cn(
						'relative flex h-16 w-16 items-center justify-center rounded-full p-[3px]',
						isAddButton
							? 'border border-dashed border-neutral-400 bg-transparent'
							: hasUnseen
								? 'bg-gradient-to-br from-brand via-brand to-brand/70 shadow-[0_10px_24px_rgba(255,90,54,0.22)]'
								: 'border border-border-subtle bg-bg-elevated',
					)}
				>
					<div className='h-full w-full rounded-full bg-white p-0.5'>
						<img
							src={user.avatarUrl || '/placeholder-avatar.svg'}
							alt={user.displayName || 'Avatar'}
							className='h-full w-full rounded-full object-cover'
						/>
					</div>

					{isAddButton ? (
						<div className='absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-brand text-white shadow-sm'>
							<Plus className='h-3 w-3' strokeWidth={3} />
						</div>
					) : hasUnseen ? (
						<div className='absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-bg-card bg-brand shadow-sm' />
					) : null}
				</div>
			</div>

			<span
				className={cn(
					'w-full truncate px-1 text-center text-xs font-medium',
					isCurrentUser ? 'text-text' : 'text-text-secondary',
				)}
			>
				{label}
			</span>
		</div>
	)
}
