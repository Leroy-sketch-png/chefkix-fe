'use client'

import { useState, useCallback, useRef } from 'react'
import { Comment as CommentType, Reply } from '@/lib/types'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { UserHoverCard } from '@/components/social/UserHoverCard'
import { MentionInput, MentionInputRef } from '@/components/shared/MentionInput'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
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
	toggleLikeReply,
} from '@/services/comment'
import { moderateContent } from '@/services/ai'
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
// HELPER: Render @mentions as styled links
// ============================================

const renderContentWithMentions = (
	content: string,
	taggedUsers?: { userId: string; displayName: string }[],
) => {
	if (!taggedUsers || taggedUsers.length === 0) {
		return content
	}

	// Build a map of displayName -> userId
	const mentionMap = new Map(
		taggedUsers.map(u => [u.displayName.toLowerCase(), u.userId]),
	)

	// Split content by @mentions
	const mentionRegex = /@(\w+(?:\s\w+)?)/g
	const parts: (string | React.ReactNode)[] = []
	let lastIndex = 0
	let match

	while ((match = mentionRegex.exec(content)) !== null) {
		// Add text before mention
		if (match.index > lastIndex) {
			parts.push(content.slice(lastIndex, match.index))
		}

		const mentionName = match[1]
		const userId = mentionMap.get(mentionName.toLowerCase())

		if (userId) {
			// Styled mention link
			parts.push(
				<a
					key={match.index}
					href={`/profile/${userId}`}
					className='font-medium text-primary hover:underline'
					onClick={e => e.stopPropagation()}
				>
					@{mentionName}
				</a>,
			)
		} else {
			// No matching user, keep as plain text
			parts.push(`@${mentionName}`)
		}

		lastIndex = match.index + match[0].length
	}

	// Add remaining text
	if (lastIndex < content.length) {
		parts.push(content.slice(lastIndex))
	}

	return parts.length > 0 ? parts : content
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
	const [isLikeLoading, setIsLikeLoading] = useState(false)

	const handleLike = async () => {
		if (isLikeLoading) return

		// Optimistic update
		const previousLiked = isLiked
		const previousLikes = likes
		setIsLiked(!isLiked)
		setLikes(prev => (isLiked ? prev - 1 : prev + 1))
		setIsLikeLoading(true)

		try {
			const response = await toggleLikeReply(reply.parentCommentId, reply.id)
			if (response.success && response.data) {
				setIsLiked(response.data.isLiked)
				setLikes(response.data.likeCount)
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
							? reply.displayName
									.split(' ')
									.map(n => n[0])
									.join('')
									.toUpperCase()
									.slice(0, 2)
							: '??'}
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
						{renderContentWithMentions(reply.content, reply.taggedUsers)}
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
	const [taggedUserIds, setTaggedUserIds] = useState<string[]>([])
	const [isSubmittingReply, setIsSubmittingReply] = useState(false)
	const [isLoadingReplies, setIsLoadingReplies] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
	const [replies, setReplies] = useState<Reply[]>([])
	const [replyCount, setReplyCount] = useState(comment.replyCount)
	const mentionInputRef = useRef<MentionInputRef>(null)

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

	const handleDeleteClick = () => {
		setShowDeleteConfirm(true)
	}

	const handleConfirmDelete = async () => {
		if (isDeleting) return
		setIsDeleting(true)
		setShowDeleteConfirm(false)

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

		// AI content moderation before posting
		const moderationResult = await moderateContent(
			replyContent.trim(),
			'comment',
		)
		if (moderationResult.success && moderationResult.data) {
			if (moderationResult.data.action === 'block') {
				toast.error(
					moderationResult.data.reason ||
						'Your reply contains content that violates our community guidelines.',
				)
				setIsSubmittingReply(false)
				return
			}
			if (moderationResult.data.action === 'flag') {
				toast.warning(
					moderationResult.data.reason ||
						'Your reply may contain sensitive content and will be reviewed.',
				)
			}
		}

		const response = await createReply(comment.id, {
			content: replyContent.trim(),
			parentCommentId: comment.id,
			taggedUserIds: taggedUserIds.length > 0 ? taggedUserIds : undefined,
		})

		if (response.success && response.data) {
			setReplies(prev => [...prev, response.data!])
			setReplyCount(prev => prev + 1)
			setReplyContent('')
			setTaggedUserIds([])
			mentionInputRef.current?.clear()
			setShowReplyInput(false)
			setShowReplies(true)
			toast.success('Reply posted!')
		} else {
			toast.error(response.message || 'Failed to post reply')
		}

		setIsSubmittingReply(false)
	}

	return (
		<>
			{/* Delete confirmation dialog */}
			<ConfirmDialog
				open={showDeleteConfirm}
				onOpenChange={setShowDeleteConfirm}
				title='Delete comment?'
				description='This action cannot be undone. Your comment will be permanently removed.'
				confirmLabel='Delete'
				cancelLabel='Cancel'
				variant='destructive'
				onConfirm={handleConfirmDelete}
			/>

			<div className='flex gap-3 py-3'>
				<UserHoverCard userId={comment.userId} currentUserId={currentUserId}>
					<Avatar size='sm'>
						<AvatarImage
							src={comment.avatarUrl || 'https://i.pravatar.cc/150'}
							alt={`${comment.displayName}'s avatar`}
						/>
						<AvatarFallback>
							{comment.displayName
								? comment.displayName
										.split(' ')
										.map(n => n[0])
										.join('')
										.toUpperCase()
										.slice(0, 2)
								: '??'}
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
									{renderContentWithMentions(
										comment.content,
										comment.taggedUsers,
									)}
								</p>
							</div>
							{/* Delete Menu (own comments only) */}
							{isOwnComment && (
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<button
											className='flex size-10 items-center justify-center rounded-full text-text-muted opacity-0 transition-opacity hover:bg-bg-hover hover:text-text-secondary group-hover:opacity-100'
											aria-label='Comment options'
										>
											<MoreHorizontal className='size-4' />
										</button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align='end' className='w-32'>
										<DropdownMenuItem
											onClick={handleDeleteClick}
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

					{/* Reply Input with @mention support */}
					<AnimatePresence>
						{showReplyInput && (
							<motion.div
								initial={{ height: 0, opacity: 0 }}
								animate={{ height: 'auto', opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								className='mt-2 overflow-visible'
							>
								<div className='flex gap-2'>
									<MentionInput
										ref={mentionInputRef}
										value={replyContent}
										onChange={setReplyContent}
										onTaggedUsersChange={setTaggedUserIds}
										onSubmit={handleSubmitReply}
										placeholder='Write a reply... (use @ to mention)'
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
		</>
	)
}
