'use client'

import { useState, useCallback } from 'react'
import { Comment as CommentType, Reply } from '@/lib/types'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { UserHoverCard } from '@/components/social/UserHoverCard'
import { formatDistanceToNow } from 'date-fns'
import {
	Heart,
	MessageSquare,
	Send,
	ChevronDown,
	ChevronUp,
	Loader2,
	Trash2,
	MoreHorizontal,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	getRepliesByCommentId,
	createReply,
	deleteComment,
	toggleLikeComment,
} from '@/services/comment'
import { toast } from 'sonner'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface CommentProps {
	comment: CommentType
	postId: string
	currentUserId?: string
	onReply?: (commentId: string) => void
	onDelete?: (commentId: string) => void
}

// ============================================
// REPLY COMPONENT (NESTED)
// ============================================

const ReplyItem = ({
	reply,
	currentUserId,
}: {
	reply: Reply
	currentUserId?: string
}) => {
	const [likes, setLikes] = useState(reply.likes)
	const [isLiked, setIsLiked] = useState(false)

	const handleLike = () => {
		setIsLiked(!isLiked)
		setLikes(prev => (isLiked ? prev - 1 : prev + 1))
	}

	const timeAgo = formatDistanceToNow(new Date(reply.createdAt), {
		addSuffix: true,
	})

	return (
		<div className='flex gap-2.5 py-2'>
			<UserHoverCard userId={reply.userId} currentUserId={currentUserId}>
				<Avatar size='xs'>
					<AvatarImage
						src={reply.avatarUrl || 'https://i.pravatar.cc/150'}
						alt={`${reply.displayName}'s avatar`}
					/>
					<AvatarFallback className='text-2xs'>
						{reply.displayName
							.split(' ')
							.map(n => n[0])
							.join('')
							.toUpperCase()
							.slice(0, 2)}
					</AvatarFallback>
				</Avatar>
			</UserHoverCard>

			<div className='flex-1 space-y-1'>
				<div className='rounded-lg bg-bg-subtle p-2'>
					<UserHoverCard userId={reply.userId} currentUserId={currentUserId}>
						<span className='text-xs font-semibold text-text-primary hover:underline'>
							{reply.displayName}
						</span>
					</UserHoverCard>
					<p className='mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-text-primary'>
						{reply.content}
					</p>
				</div>

				<div className='flex items-center gap-3 px-2 text-2xs text-text-secondary'>
					<span>{timeAgo}</span>
					<button
						onClick={handleLike}
						className='flex items-center gap-1 transition-colors hover:text-color-error'
						aria-label={isLiked ? 'Unlike reply' : 'Like reply'}
					>
						<Heart
							className={`size-2.5 ${isLiked ? 'fill-color-error text-color-error' : ''}`}
						/>
						{likes > 0 && <span>{likes}</span>}
					</button>
				</div>
			</div>
		</div>
	)
}

// ============================================
// MAIN COMMENT COMPONENT
// ============================================

export const Comment = ({
	comment,
	postId,
	currentUserId,
	onReply,
	onDelete,
}: CommentProps) => {
	const [likes, setLikes] = useState(comment.likes)
	const [isLiked, setIsLiked] = useState(false)
	const [isLikeLoading, setIsLikeLoading] = useState(false)
	const [showReplies, setShowReplies] = useState(false)
	const [showReplyInput, setShowReplyInput] = useState(false)
	const [replyContent, setReplyContent] = useState('')
	const [isSubmittingReply, setIsSubmittingReply] = useState(false)
	const [isLoadingReplies, setIsLoadingReplies] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [replies, setReplies] = useState<Reply[]>([])
	const [replyCount, setReplyCount] = useState(comment.replyCount)

	const isOwnComment = currentUserId === comment.userId

	const handleLike = async () => {
		if (isLikeLoading) return

		// Optimistic update
		const previousLiked = isLiked
		const previousLikes = likes
		setIsLiked(!isLiked)
		setLikes(prev => (isLiked ? prev - 1 : prev + 1))
		setIsLikeLoading(true)

		try {
			const response = await toggleLikeComment(postId, comment.id)
			if (response.success && response.data) {
				setIsLiked(response.data.isLiked)
				setLikes(response.data.likes)
			} else {
				// Revert on failure
				setIsLiked(previousLiked)
				setLikes(previousLikes)
			}
		} catch {
			// Revert on error
			setIsLiked(previousLiked)
			setLikes(previousLikes)
		} finally {
			setIsLikeLoading(false)
		}
	}

	const handleDelete = async () => {
		if (isDeleting) return
		setIsDeleting(true)

		const response = await deleteComment(postId, comment.id)
		if (response.success) {
			toast.success('Comment deleted')
			onDelete?.(comment.id)
		} else {
			toast.error(response.message || 'Failed to delete comment')
		}

		setIsDeleting(false)
	}

	const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
		addSuffix: true,
	})

	// Load replies
	const loadReplies = useCallback(async () => {
		if (isLoadingReplies) return
		setIsLoadingReplies(true)

		const response = await getRepliesByCommentId(comment.id)
		if (response.success && response.data) {
			setReplies(response.data)
		} else {
			toast.error('Failed to load replies')
		}

		setIsLoadingReplies(false)
	}, [comment.id, isLoadingReplies])

	// Toggle replies view
	const handleToggleReplies = async () => {
		if (!showReplies && replies.length === 0 && replyCount > 0) {
			await loadReplies()
		}
		setShowReplies(!showReplies)
	}

	// Submit reply
	const handleSubmitReply = async () => {
		if (!replyContent.trim() || isSubmittingReply) return

		setIsSubmittingReply(true)

		const response = await createReply(comment.id, {
			content: replyContent.trim(),
			parentCommentId: comment.id,
		})

		if (response.success && response.data) {
			setReplies(prev => [...prev, response.data!])
			setReplyCount(prev => prev + 1)
			setReplyContent('')
			setShowReplyInput(false)
			setShowReplies(true)
			toast.success('Reply posted!')
		} else {
			toast.error(response.message || 'Failed to post reply')
		}

		setIsSubmittingReply(false)
	}

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
				<div className='group relative rounded-lg bg-bg-subtle p-3'>
					<div className='flex items-start justify-between'>
						<div>
							<UserHoverCard
								userId={comment.userId}
								currentUserId={currentUserId}
							>
								<span className='text-sm font-semibold text-text-primary hover:underline'>
									{comment.displayName}
								</span>
							</UserHoverCard>
							<p className='mt-1 whitespace-pre-wrap text-sm leading-relaxed text-text-primary'>
								{comment.content}
							</p>
						</div>
						{/* Delete Menu (own comments only) */}
						{isOwnComment && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button
										className='flex size-6 items-center justify-center rounded-full text-text-muted opacity-0 transition-opacity hover:bg-bg-hover hover:text-text-secondary group-hover:opacity-100'
										aria-label='Comment options'
									>
										<MoreHorizontal className='size-4' />
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align='end' className='w-32'>
									<DropdownMenuItem
										onClick={handleDelete}
										disabled={isDeleting}
										className='text-color-error focus:text-color-error'
									>
										{isDeleting ? (
											<Loader2 className='mr-2 size-4 animate-spin' />
										) : (
											<Trash2 className='mr-2 size-4' />
										)}
										Delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
				</div>

				{/* Comment Actions */}
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
					<button
						onClick={() => setShowReplyInput(!showReplyInput)}
						className='flex items-center gap-1 transition-colors hover:text-primary'
						aria-label='Reply to comment'
					>
						<MessageSquare className='h-3 w-3' />
						<span>Reply</span>
					</button>
				</div>

				{/* Reply Input */}
				<AnimatePresence>
					{showReplyInput && (
						<motion.div
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: 'auto', opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							className='mt-2 overflow-hidden'
						>
							<div className='flex gap-2'>
								<input
									type='text'
									value={replyContent}
									onChange={e => setReplyContent(e.target.value)}
									onKeyDown={e => e.key === 'Enter' && handleSubmitReply()}
									placeholder='Write a reply...'
									className='flex-1 rounded-lg bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/30'
									disabled={isSubmittingReply}
								/>
								<button
									onClick={handleSubmitReply}
									disabled={!replyContent.trim() || isSubmittingReply}
									className='grid size-9 place-items-center rounded-lg bg-primary text-white transition-colors hover:bg-primary/90 disabled:opacity-50'
								>
									{isSubmittingReply ? (
										<Loader2 className='size-4 animate-spin' />
									) : (
										<Send className='size-4' />
									)}
								</button>
							</div>
						</motion.div>
					)}
				</AnimatePresence>

				{/* View Replies Toggle */}
				{replyCount > 0 && (
					<button
						onClick={handleToggleReplies}
						className='mt-1 flex items-center gap-1 px-2 text-xs font-medium text-primary hover:underline'
					>
						{isLoadingReplies ? (
							<Loader2 className='size-3 animate-spin' />
						) : showReplies ? (
							<ChevronUp className='size-3' />
						) : (
							<ChevronDown className='size-3' />
						)}
						<span>
							{showReplies ? 'Hide' : 'View'} {replyCount}{' '}
							{replyCount === 1 ? 'reply' : 'replies'}
						</span>
					</button>
				)}

				{/* Nested Replies */}
				<AnimatePresence>
					{showReplies && replies.length > 0 && (
						<motion.div
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: 'auto', opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							className='ml-4 mt-2 overflow-hidden border-l-2 border-border-subtle pl-3'
						>
							{replies.map(reply => (
								<ReplyItem
									key={reply.id}
									reply={reply}
									currentUserId={currentUserId}
								/>
							))}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	)
}
