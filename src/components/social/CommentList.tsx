'use client'

import { Comment as CommentType } from '@/lib/types'
import { Comment } from './Comment'
import { CommentSkeleton } from '@/components/ui/skeleton'
import { useState, useEffect, useCallback, useRef } from 'react'
import { getCommentsByPostId, createComment } from '@/services/comment'
import { moderateContent } from '@/services/ai'
import { toast } from 'sonner'
import { Send, Loader2 } from 'lucide-react'
import { MentionInput, MentionInputRef } from '@/components/shared/MentionInput'

interface CommentListProps {
	postId: string
	currentUserId?: string
	isLoading?: boolean
	onCommentCreated?: () => void
}

export const CommentList = ({
	postId,
	currentUserId,
	isLoading = false,
	onCommentCreated,
}: CommentListProps) => {
	const [comments, setComments] = useState<CommentType[]>([])
	const [loading, setLoading] = useState(isLoading)
	const [error, setError] = useState(false)
	const [newComment, setNewComment] = useState('')
	const [taggedUserIds, setTaggedUserIds] = useState<string[]>([])
	const [isSubmitting, setIsSubmitting] = useState(false)
	const mentionInputRef = useRef<MentionInputRef>(null)

	const fetchComments = useCallback(async () => {
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
	}, [postId])

	useEffect(() => {
		fetchComments()
	}, [fetchComments])

	const handleSubmitComment = async () => {
		if (!newComment.trim() || isSubmitting) return

		setIsSubmitting(true)

		// AI content moderation before posting (fail-closed for safety)
		const moderationResult = await moderateContent(newComment.trim(), 'comment')

		// Fail-closed: if moderation API fails, don't allow comment
		if (!moderationResult.success) {
			toast.error('Unable to verify content. Please try again.')
			setIsSubmitting(false)
			return
		}

		if (moderationResult.data) {
			if (moderationResult.data.action === 'block') {
				toast.error(
					moderationResult.data.reason ||
						'Your comment contains content that violates our community guidelines.',
				)
				setIsSubmitting(false)
				return
			}
			if (moderationResult.data.action === 'flag') {
				toast.warning(
					moderationResult.data.reason ||
						'Your comment may contain sensitive content and will be reviewed.',
				)
			}
		}

		const response = await createComment(postId, {
			content: newComment.trim(),
			taggedUserIds: taggedUserIds.length > 0 ? taggedUserIds : undefined,
		})

		if (response.success && response.data) {
			setComments(prev => [response.data!, ...prev])
			setNewComment('')
			setTaggedUserIds([])
			mentionInputRef.current?.clear()
			toast.success('Comment posted!')
			onCommentCreated?.()
		} else {
			toast.error(response.message || 'Failed to post comment')
		}

		setIsSubmitting(false)
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

	return (
		<div className='border-t border-border-subtle'>
			{/* Comment Input with @mention support */}
			<div className='flex gap-2 border-b border-border-subtle p-4 md:p-6'>
				<MentionInput
					ref={mentionInputRef}
					value={newComment}
					onChange={setNewComment}
					onTaggedUsersChange={setTaggedUserIds}
					onSubmit={handleSubmitComment}
					placeholder='Add a comment... (use @ to mention)'
					disabled={isSubmitting}
				/>
				<button
					onClick={handleSubmitComment}
					disabled={!newComment.trim() || isSubmitting}
					className='grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50'
				>
					{isSubmitting ? (
						<Loader2 className='size-4 animate-spin' />
					) : (
						<Send className='size-4' />
					)}
				</button>
			</div>

			{/* Comments List */}
			{comments.length === 0 ? (
				<div className='p-6 text-center text-sm text-text-secondary'>
					No comments yet. Be the first to comment!
				</div>
			) : (
				<div className='max-h-panel-lg space-y-2 overflow-y-auto p-4 md:p-6'>
					{comments.map(comment => (
						<Comment
							key={comment.id || `${comment.userId}-${comment.createdAt}`}
							comment={comment}
							postId={postId}
							currentUserId={currentUserId}
							onDelete={commentId => {
								setComments(prev => prev.filter(c => c.id !== commentId))
							}}
						/>
					))}
				</div>
			)}
		</div>
	)
}
