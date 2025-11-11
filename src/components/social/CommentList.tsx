'use client'

import { Comment as CommentType } from '@/lib/types'
import { Comment } from './Comment'
import { CommentSkeleton } from '@/components/ui/skeleton'
import { useState, useEffect } from 'react'

interface CommentListProps {
	postId: string
	currentUserId?: string
	isLoading?: boolean
}

// Mock comments (will be replaced with API call)
const mockComments: CommentType[] = [
	{
		userId: 'user-2',
		postId: 'post-1',
		displayName: 'Jane Smith',
		content: 'This looks absolutely delicious! 🤤',
		avatarUrl: 'https://i.pravatar.cc/150?u=jane',
		likes: 12,
		comments: 2,
		createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
		updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
	},
	{
		userId: 'user-3',
		postId: 'post-1',
		displayName: 'Mike Johnson',
		content:
			"I've tried this recipe before, it's amazing! Pro tip: add a bit more garlic 👨‍🍳",
		avatarUrl: 'https://i.pravatar.cc/150?u=mike',
		likes: 8,
		comments: 1,
		createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
		updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
	},
	{
		userId: 'user-4',
		postId: 'post-1',
		displayName: 'Sarah Wilson',
		content: 'Bookmarked for dinner tonight!',
		avatarUrl: 'https://i.pravatar.cc/150?u=sarah',
		likes: 3,
		comments: 0,
		createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
		updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
	},
]

export const CommentList = ({
	postId,
	currentUserId,
	isLoading = false,
}: CommentListProps) => {
	const [comments, setComments] = useState<CommentType[]>([])
	const [loading, setLoading] = useState(isLoading)

	useEffect(() => {
		// Simulate API fetch
		setLoading(true)
		const timer = setTimeout(() => {
			setComments(mockComments.filter(c => c.postId === postId))
			setLoading(false)
		}, 800)

		return () => clearTimeout(timer)
	}, [postId])

	const handleReply = (commentId: string) => {
		// TODO: Implement reply functionality
		console.log('Reply to comment:', commentId)
	}

	if (loading) {
		return (
			<div className='space-y-4 p-4 md:p-6'>
				<CommentSkeleton />
				<CommentSkeleton />
				<CommentSkeleton />
			</div>
		)
	}

	if (comments.length === 0) {
		return (
			<div className='p-6 text-center text-sm text-text-secondary'>
				No comments yet. Be the first to comment!
			</div>
		)
	}

	return (
		<div className='max-h-[500px] space-y-2 overflow-y-auto p-4 md:p-6'>
			{comments.map(comment => (
				<Comment
					key={`${comment.userId}-${comment.createdAt}`}
					comment={comment}
					currentUserId={currentUserId}
					onReply={handleReply}
				/>
			))}
		</div>
	)
}
