'use client'

import { Comment as CommentType } from '@/lib/types'
import { Comment } from './Comment'
import { CommentSkeleton } from '@/components/ui/skeleton'
import { useState, useEffect } from 'react'
import { getCommentsByPostId } from '@/services/comment'
import { toast } from 'sonner'

interface CommentListProps {
	postId: string
	currentUserId?: string
	isLoading?: boolean
}

export const CommentList = ({
	postId,
	currentUserId,
	isLoading = false,
}: CommentListProps) => {
	const [comments, setComments] = useState<CommentType[]>([])
	const [loading, setLoading] = useState(isLoading)
	const [error, setError] = useState(false)

	useEffect(() => {
		const fetchComments = async () => {
			setLoading(true)
			setError(false)

			const response = await getCommentsByPostId(postId)

			if (response.success && response.data) {
				setComments(response.data)
			} else {
				setError(true)
				toast.error(response.message || 'Failed to load comments')
			}

			setLoading(false)
		}

		fetchComments()
	}, [postId])

	const handleReply = (commentId: string) => {
		// TODO: Implement reply functionality when backend supports it
		toast.info('Reply feature coming soon!')
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

	if (error) {
		return (
			<div className='p-6 text-center text-sm text-destructive'>
				Failed to load comments. Please try refreshing.
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
		<div className='max-h-panel-lg space-y-2 overflow-y-auto p-4 md:p-6'>
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
