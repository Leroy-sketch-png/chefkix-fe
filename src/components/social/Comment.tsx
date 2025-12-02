'use client'

import { Comment as CommentType } from '@/lib/types'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { UserHoverCard } from '@/components/social/UserHoverCard'
import { formatDistanceToNow } from 'date-fns'
import { Heart, MessageSquare } from 'lucide-react'
import { useState } from 'react'

interface CommentProps {
	comment: CommentType
	currentUserId?: string
	onReply?: (commentId: string) => void
}

export const Comment = ({ comment, currentUserId, onReply }: CommentProps) => {
	const [likes, setLikes] = useState(comment.likes)
	const [isLiked, setIsLiked] = useState(false)

	const handleLike = () => {
		setIsLiked(!isLiked)
		setLikes(prev => (isLiked ? prev - 1 : prev + 1))
	}

	const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
		addSuffix: true,
	})

	return (
		<div className='flex gap-3 py-3'>
			<UserHoverCard userId={comment.userId} currentUserId={currentUserId}>
				<Avatar size='sm'>
					<AvatarImage
						src={comment.avatarUrl || 'https://i.pravatar.cc/150'}
						alt={`${comment.displayName}'s avatar`}
					/>
					<AvatarFallback>
						{comment.displayName
							.split(' ')
							.map(n => n[0])
							.join('')
							.toUpperCase()
							.slice(0, 2)}
					</AvatarFallback>
				</Avatar>
			</UserHoverCard>

			<div className='flex-1 space-y-1'>
				<div className='rounded-lg bg-bg-subtle p-3'>
					<UserHoverCard userId={comment.userId} currentUserId={currentUserId}>
						<span className='text-sm font-semibold text-text-primary hover:underline'>
							{comment.displayName}
						</span>
					</UserHoverCard>
					<p className='mt-1 whitespace-pre-wrap text-sm leading-relaxed text-text-primary'>
						{comment.content}
					</p>
				</div>

				<div className='flex items-center gap-4 px-2 text-xs text-text-secondary'>
					<span>{timeAgo}</span>
					<button
						onClick={handleLike}
						className='flex items-center gap-1 transition-colors hover:text-color-error'
						aria-label={isLiked ? 'Unlike comment' : 'Like comment'}
					>
						<Heart
							className={`h-3 w-3 ${isLiked ? 'fill-color-error text-color-error' : ''}`}
						/>
						{likes > 0 && <span>{likes}</span>}
					</button>
					{onReply && (
						<button
							onClick={() => onReply(comment.postId)}
							className='flex items-center gap-1 transition-colors hover:text-text-primary'
							aria-label='Reply to comment'
						>
							<MessageSquare className='h-3 w-3' />
							{comment.replyCount > 0 && <span>{comment.replyCount}</span>}
						</button>
					)}
				</div>
			</div>
		</div>
	)
}
