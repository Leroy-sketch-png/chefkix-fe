'use client'

import { Comment as CommentType } from '@/lib/types'
import { useTranslations } from 'next-intl'
import { Comment } from './Comment'
import { CommentSkeleton } from '@/components/ui/skeleton'
import { useState, useEffect, useCallback, useRef } from 'react'
import { getCommentsByPostId, createComment } from '@/services/comment'
import { moderateContent } from '@/services/ai'
import { toast } from 'sonner'
import { Send, Loader2, MessageSquare, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { DURATION_S } from '@/lib/motion'
import { MentionInput, MentionInputRef } from '@/components/shared/MentionInput'
import { useAuthGate } from '@/hooks/useAuthGate'
import { diag } from '@/lib/diagnostics'

interface CommentListProps {
	postId: string
	currentUserId?: string
	isLoading?: boolean
	onCommentCreated?: () => void
	onCommentDeleted?: () => void
}

export const CommentList = ({
	postId,
	currentUserId,
	isLoading = false,
	onCommentCreated,
	onCommentDeleted,
}: CommentListProps) => {
	const t = useTranslations('social')
	const [comments, setComments] = useState<CommentType[]>([])
	const [loading, setLoading] = useState(isLoading)
	const [error, setError] = useState(false)
	const [newComment, setNewComment] = useState('')
	const [taggedUserIds, setTaggedUserIds] = useState<string[]>([])
	const [isSubmitting, setIsSubmitting] = useState(false)
	const mentionInputRef = useRef<MentionInputRef>(null)
	const requireAuth = useAuthGate()

	const fetchComments = useCallback(async () => {
		setLoading(true)
		setError(false)

		const response = await getCommentsByPostId(postId)

		if (response.success && response.data) {
			setComments(response.data)
		} else {
			setError(true)
			toast.error(t('failedLoadComments'))
		}

		setLoading(false)
	}, [postId, t])

	useEffect(() => {
		fetchComments()
	}, [fetchComments])

	const handleSubmitComment = async () => {
		if (!requireAuth(t('commentOnPostAuth'))) return
		if (!newComment.trim() || isSubmitting) return

		diag.action('social', 'COMMENT_SUBMIT', {
			postId,
			contentLength: newComment.trim().length,
			taggedUserCount: taggedUserIds.length,
		})

		setIsSubmitting(true)

		try {
			// AI content moderation before posting (fail-closed for safety)
			diag.request('social', '/api/v1/moderate', {
				contentType: 'comment',
				contentPreview: newComment.trim().slice(0, 100),
			})

			const moderationResult = await moderateContent(
				newComment.trim(),
				'comment',
			)

			diag.response(
				'social',
				'/api/v1/moderate',
				{
					success: moderationResult.success,
					action: moderationResult.data?.action,
					reason: moderationResult.data?.reason,
				},
				moderationResult.success,
			)

			// Fail-closed: if moderation API fails, don't allow comment
			if (!moderationResult.success) {
				diag.warn('social', 'COMMENT_MODERATION_API_FAILED', {
					message: 'API failure - fail-closed blocking comment',
				})
				toast.error(t('moderationVerifyFailed'))
				setIsSubmitting(false)
				return
			}

			if (moderationResult.data) {
				if (moderationResult.data.action === 'block') {
					diag.warn('social', 'COMMENT_BLOCKED_BY_MODERATION', {
						reason: moderationResult.data.reason,
					})
					toast.error(
						moderationResult.data.reason || t('moderationBlockComment'),
					)
					setIsSubmitting(false)
					return
				}
				if (moderationResult.data.action === 'flag') {
					diag.warn('social', 'COMMENT_FLAGGED_BY_MODERATION', {
						reason: moderationResult.data.reason,
					})
					toast.warning(
						moderationResult.data.reason || t('moderationFlagComment'),
					)
				}
			}

			diag.request('social', 'createComment', {
				postId,
				contentLength: newComment.trim().length,
				taggedUserIds,
			})

			const response = await createComment(postId, {
				content: newComment.trim(),
				taggedUserIds: taggedUserIds.length > 0 ? taggedUserIds : undefined,
			})

			if (response.success && response.data) {
				diag.response(
					'social',
					'createComment',
					{
						commentId: response.data.id,
						success: true,
					},
					true,
				)
				setComments(prev => [response.data!, ...prev])
				setNewComment('')
				setTaggedUserIds([])
				mentionInputRef.current?.clear()
				toast.success(t('commentPosted'))
				onCommentCreated?.()
			} else {
				diag.error('social', 'COMMENT_CREATE_FAILED', {
					message: response.message,
				})
				toast.error(t('failedPostComment'))
			}
		} catch {
			toast.error(t('failedPostComment'))
		} finally {
			setIsSubmitting(false)
		}
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
			<div className='flex flex-col items-center gap-3 p-6 text-center'>
				<p className='text-sm text-destructive'>
					{t('failedLoadCommentsRefresh')}
				</p>
				<button
					type='button'
					onClick={fetchComments}
					className='inline-flex items-center gap-1.5 rounded-lg bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text'
				>
					<RefreshCw className='size-3.5' />
					{t('retryComments')}
				</button>
			</div>
		)
	}

	return (
		<div className='border-t border-border-subtle'>
			{/* Comment Input with @mention support */}
			<div className='border-b border-border-subtle p-4 md:p-6'>
				<div className='flex gap-2'>
					<MentionInput
						ref={mentionInputRef}
						value={newComment}
						onChange={setNewComment}
						onTaggedUsersChange={setTaggedUserIds}
						onSubmit={handleSubmitComment}
						placeholder={t('commentPlaceholder')}
						disabled={isSubmitting}
						maxLength={500}
					/>
					<button
						type='button'
						onClick={handleSubmitComment}
						disabled={!newComment.trim() || isSubmitting}
						className='grid size-10 place-items-center rounded-lg bg-brand text-white transition-colors hover:bg-brand/90 disabled:opacity-50'
						aria-label={t('commentSubmitAriaLabel')}
					>
						{isSubmitting ? (
							<Loader2 className='size-4 animate-spin' />
						) : (
							<Send className='size-4' />
						)}
					</button>
				</div>
				{newComment.length > 0 && (
					<p
						className={`mt-1 text-right text-xs ${newComment.length > 400 ? (newComment.length >= 500 ? 'text-error font-semibold' : 'text-warning') : 'text-text-muted'}`}
					>
						{newComment.length}/500
					</p>
				)}
			</div>

			{/* Comments List */}
			{comments.length === 0 ? (
				<div className='flex flex-col items-center gap-2 p-6 text-center text-sm text-text-secondary'>
					<MessageSquare className='size-8 text-text-muted/50' />
					<p>{t('noCommentsYet')}</p>
				</div>
			) : (
				<ul className='max-h-panel-lg space-y-2 overflow-y-auto p-4 md:p-6'>
					<AnimatePresence initial={false}>
						{comments.map(comment => (
							<motion.li
								key={comment.id || `${comment.userId}-${comment.createdAt}`}
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, height: 0 }}
								transition={{ duration: DURATION_S.normal }}
							>
								<Comment
									comment={comment}
									postId={postId}
									currentUserId={currentUserId}
									onDelete={commentId => {
										setComments(prev => prev.filter(c => c.id !== commentId))
										onCommentDeleted?.()
									}}
								/>
							</motion.li>
						))}
					</AnimatePresence>
				</ul>
			)}
		</div>
	)
}
