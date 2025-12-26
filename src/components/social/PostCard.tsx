'use client'

import { useState, useRef, useCallback } from 'react'
import { Post } from '@/lib/types'
import {
	toggleLike,
	deletePost,
	updatePost,
	toggleSave,
	reportPost,
} from '@/services/post'
import { toast } from '@/components/ui/toaster'
import { POST_MESSAGES } from '@/constants/messages'
import { triggerLikeConfetti, triggerSaveConfetti } from '@/lib/confetti'
import { staggerItemVariants } from '@/components/ui/stagger-animation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Heart,
	MessageSquare,
	Send,
	Bookmark,
	MoreVertical,
	Pencil,
	Trash2,
	X,
	ChefHat,
	Zap,
	Flag,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'
import { UserHoverCard } from '@/components/social/UserHoverCard'
import { CommentList } from '@/components/social/CommentList'
import { TRANSITION_SPRING, EXIT_VARIANTS, CARD_FEED_HOVER } from '@/lib/motion'
import {
	ReportModal,
	type ReportedContent,
} from '@/components/modals/ReportModal'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

interface PostCardProps {
	post: Post
	onUpdate?: (post: Post) => void
	onDelete?: (postId: string) => void
	currentUserId?: string
}

export const PostCard = ({
	post: initialPost,
	onUpdate,
	onDelete,
	currentUserId,
}: PostCardProps) => {
	const [post, setPost] = useState<Post>(initialPost)
	const [isLiking, setIsLiking] = useState(false)
	const [showMenu, setShowMenu] = useState(false)
	const [showComments, setShowComments] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const [editContent, setEditContent] = useState(post.content)
	const [editTags, setEditTags] = useState(post.tags.join(', '))
	const [isSaved, setIsSaved] = useState(post.isSaved ?? false)
	const [isSaving, setIsSaving] = useState(false)
	const [showReportModal, setShowReportModal] = useState(false)
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
	const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false)

	// Refs
	const likeButtonRef = useRef<HTMLButtonElement>(null)
	const lastTapRef = useRef<number>(0)
	const DOUBLE_TAP_DELAY = 300 // ms

	const isOwner = currentUserId === post.userId
	const isLoggedIn = !!currentUserId
	const createdAt = new Date(post.createdAt)
	const canEdit =
		isOwner &&
		Date.now() - createdAt.getTime() < 60 * 60 * 1000 && // Within 1 hour
		!post.updatedAt

	const handleLike = async () => {
		if (isLiking) return

		setIsLiking(true)
		const wasLiked = post.isLiked
		const previousLikes = post.likes

		// Optimistic UI update
		setPost(prev => ({
			...prev,
			isLiked: !prev.isLiked,
			likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1,
		}))

		const response = await toggleLike(post.id)

		if (response.success && response.data) {
			// Update with server response - only update likes, keep rest of post
			const newLikes =
				response.data.likes ??
				(wasLiked ? previousLikes - 1 : previousLikes + 1)
			setPost(prev => ({
				...prev,
				likes: newLikes,
				isLiked: !wasLiked,
			}))
			onUpdate?.({ ...post, likes: newLikes, isLiked: !wasLiked })

			// Trigger confetti only on like (not unlike)
			if (!wasLiked) {
				triggerLikeConfetti(likeButtonRef.current || undefined)
			}
		} else {
			// Revert on error
			setPost(prev => ({
				...prev,
				isLiked: wasLiked,
				likes: previousLikes,
			}))
			toast.error(response.message || POST_MESSAGES.LIKE_FAILED)
		}

		setIsLiking(false)
	}

	const handleSave = async () => {
		if (isSaving) return

		// Optimistic update
		const previousSaved = isSaved
		setIsSaved(!isSaved)
		setIsSaving(true)

		try {
			const response = await toggleSave(post.id)

			if (response.success && response.data) {
				setIsSaved(response.data.isSaved)

				// Trigger confetti only on save (not unsave)
				if (response.data.isSaved) {
					triggerSaveConfetti()
				}

				toast.success(
					response.data.isSaved
						? POST_MESSAGES.SAVE_SUCCESS
						: POST_MESSAGES.REMOVE_SAVED,
				)
			} else {
				// Revert on error
				setIsSaved(previousSaved)
				toast.error(response.message || 'Failed to save post')
			}
		} catch (error) {
			// Revert on error
			setIsSaved(previousSaved)
			toast.error('Failed to save post')
		} finally {
			setIsSaving(false)
		}
	}

	const handleDelete = async () => {
		setShowDeleteConfirm(true)
	}

	const handleConfirmDelete = async () => {
		const response = await deletePost(post.id)
		if (response.success) {
			toast.success(POST_MESSAGES.DELETE_SUCCESS)
			onDelete?.(post.id)
		} else {
			toast.error(response.message || POST_MESSAGES.DELETE_FAILED)
		}
		setShowMenu(false)
	}

	const handleEdit = async () => {
		if (!editContent.trim()) {
			toast.error(POST_MESSAGES.CONTENT_EMPTY)
			return
		}

		const tags = editTags
			.split(',')
			.map(t => t.trim())
			.filter(t => t.length > 0)

		const response = await updatePost(post.id, {
			content: editContent,
			tags,
		})

		if (response.statusCode === 410) {
			// Post edit window expired (backend)
			toast.error(POST_MESSAGES.EDIT_TIME_LIMIT)
			return
		}

		if (response.success && response.data) {
			setPost(response.data)
			onUpdate?.(response.data)
			setIsEditing(false)
			toast.success(POST_MESSAGES.UPDATE_SUCCESS)
		} else {
			toast.error(response.message || POST_MESSAGES.UPDATE_FAILED)
		}
	}

	// Handle report submission
	const handleReportSubmit = async (reason: string, details?: string) => {
		try {
			const response = await reportPost(post.id, { reason, details })
			if (response.success) {
				toast.success(
					response.data?.reviewTriggered
						? 'Report submitted - content is under review'
						: 'Report submitted - thank you for keeping ChefKix safe',
				)
			} else {
				toast.error(response.message || 'Failed to submit report')
			}
		} catch {
			toast.error('Failed to submit report')
		}
	}

	// Handle share post
	const handleShare = async () => {
		const postUrl = `${window.location.origin}/post/${post.id}`
		const shareData = {
			title: `Post by ${post.displayName || 'ChefKix User'}`,
			text:
				post.content.slice(0, 100) + (post.content.length > 100 ? '...' : ''),
			url: postUrl,
		}

		if (navigator.share) {
			try {
				await navigator.share(shareData)
			} catch (err) {
				// User cancelled or share failed - fallback to clipboard
				if ((err as Error).name !== 'AbortError') {
					await navigator.clipboard.writeText(postUrl)
					toast.success('Link copied to clipboard!')
				}
			}
		} else {
			// Fallback: copy to clipboard
			await navigator.clipboard.writeText(postUrl)
			toast.success('Link copied to clipboard!')
		}
	}

	// Handle double-tap to like on images (Instagram pattern)
	const handleDoubleTap = useCallback(() => {
		const now = Date.now()
		if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
			// Double tap detected!
			if (!post.isLiked) {
				// Only trigger like if not already liked
				handleLike()
			}
			// Always show the heart animation
			setShowDoubleTapHeart(true)
			setTimeout(() => setShowDoubleTapHeart(false), 1000)
		}
		lastTapRef.current = now
	}, [post.isLiked])

	// Report content metadata for the modal
	const reportContent: ReportedContent = {
		type: 'post',
		preview:
			post.content.slice(0, 100) + (post.content.length > 100 ? '...' : ''),
		author: {
			username: post.displayName || 'Unknown User',
			avatarUrl: post.avatarUrl || '/placeholder-avatar.png',
		},
	}

	return (
		<>
			{/* Delete confirmation dialog */}
			<ConfirmDialog
				open={showDeleteConfirm}
				onOpenChange={setShowDeleteConfirm}
				title='Delete post?'
				description={POST_MESSAGES.DELETE_CONFIRM}
				confirmLabel='Delete'
				cancelLabel='Cancel'
				variant='destructive'
				onConfirm={handleConfirmDelete}
			/>

			<motion.article
				variants={staggerItemVariants}
				layout
				exit={EXIT_VARIANTS.scaleOut}
				className='mb-6'
			>
				<motion.div
					whileHover={{ ...CARD_FEED_HOVER, scale: 1.005 }}
					transition={TRANSITION_SPRING}
					className='group relative overflow-hidden rounded-radius border-l-3 border-l-transparent bg-bg-card shadow-card transition-all duration-300 hover:border-l-primary hover:shadow-warm'
				>
					{/* Header */}
					<div className='flex items-center justify-between p-4 md:p-6'>
						<UserHoverCard userId={post.userId} currentUserId={currentUserId}>
							<Link
								href={post.userId ? `/${post.userId}` : '/dashboard'}
								className='flex items-center gap-3 transition-opacity hover:opacity-80'
							>
								<Avatar
									size='lg'
									className='shadow-md transition-all group-hover:scale-105 group-hover:shadow-lg'
								>
									<AvatarImage
										src={post.avatarUrl || 'https://i.pravatar.cc/48'}
										alt={post.displayName || 'User'}
									/>
									<AvatarFallback>
										{post.displayName
											?.split(' ')
											.map(n => n[0])
											.join('')
											.toUpperCase()
											.slice(0, 2) || 'U'}
									</AvatarFallback>
								</Avatar>
								<div>
									<div className='text-base font-bold leading-tight text-text-primary'>
										{post.displayName || 'Unknown User'}
									</div>
									<div className='text-sm leading-normal text-text-secondary'>
										{formatDistanceToNow(new Date(post.createdAt), {
											addSuffix: true,
										})}
									</div>
								</div>
							</Link>
						</UserHoverCard>

						{/* Menu - Show for all logged in users */}
						{isLoggedIn && (
							<div className='relative'>
								<button
									onClick={() => setShowMenu(!showMenu)}
									className='h-11 w-11 rounded-full transition-colors hover:bg-bg-hover'
								>
									<MoreVertical className='mx-auto h-5 w-5 text-text-secondary' />
								</button>

								<AnimatePresence>
									{showMenu && (
										<motion.div
											initial={{ opacity: 0, scale: 0.95, y: -10 }}
											animate={{ opacity: 1, scale: 1, y: 0 }}
											exit={{ opacity: 0, scale: 0.95, y: -10 }}
											className='absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-border-subtle bg-bg-card py-1 shadow-lg'
										>
											{/* Owner actions */}
											{isOwner && (
												<>
													{canEdit && (
														<button
															onClick={() => {
																setIsEditing(true)
																setShowMenu(false)
															}}
															className='flex h-11 w-full items-center gap-2 px-4 text-left text-sm text-text-primary transition-colors hover:bg-bg-hover'
														>
															<Pencil className='h-4 w-4' />
															Edit post
														</button>
													)}
													<button
														onClick={handleDelete}
														className='flex h-11 w-full items-center gap-2 px-4 text-left text-sm text-destructive transition-colors hover:bg-destructive/10'
													>
														<Trash2 className='h-4 w-4' />
														Delete post
													</button>
												</>
											)}
											{/* Non-owner actions */}
											{!isOwner && (
												<button
													onClick={() => {
														setShowReportModal(true)
														setShowMenu(false)
													}}
													className='flex h-11 w-full items-center gap-2 px-4 text-left text-sm text-text-primary transition-colors hover:bg-bg-hover'
												>
													<Flag className='h-4 w-4' />
													Report post
												</button>
											)}
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						)}
					</div>

					{/* Content */}
					{isEditing ? (
						<div className='space-y-3 border-t border-border-subtle p-4 md:p-6'>
							<textarea
								value={editContent}
								onChange={e => setEditContent(e.target.value)}
								className='min-h-textarea w-full resize-none rounded-lg bg-bg-card p-3 text-text-primary caret-primary focus:outline-none focus:ring-1 focus:ring-primary/10'
								placeholder='Edit your post...'
							/>
							<input
								value={editTags}
								onChange={e => setEditTags(e.target.value)}
								className='w-full rounded-lg bg-bg-card px-3 py-2 text-text-primary caret-primary focus:outline-none focus:ring-1 focus:ring-primary/10'
								placeholder='Tags (comma-separated)'
							/>
							<div className='flex gap-2'>
								<button
									onClick={handleEdit}
									className='h-11 flex-1 rounded-lg bg-primary px-4 font-medium text-primary-foreground transition-colors hover:bg-primary/90'
								>
									Save
								</button>
								<button
									onClick={() => {
										setIsEditing(false)
										setEditContent(post.content)
										setEditTags(post.tags.join(', '))
									}}
									className='h-11 flex-1 rounded-lg border border-border-subtle bg-bg-card px-4 font-medium text-text-primary transition-colors hover:bg-bg-hover'
								>
									Cancel
								</button>
							</div>
						</div>
					) : (
						<>
							<div className='space-y-3 px-4 pb-3 md:px-6'>
								<p className='whitespace-pre-wrap leading-relaxed text-text-primary'>
									{post.content}
								</p>
								{post.tags.length > 0 && (
									<div className='flex flex-wrap gap-2'>
										{post.tags.map(tag => (
											<span
												key={tag}
												className='rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary'
											>
												#{tag}
											</span>
										))}
									</div>
								)}

								{/* Recipe Link Badge - Shows when post is linked to a cooking session */}
								{post.recipeId && post.recipeTitle && (
									<Link
										href={`/recipes/${post.recipeId}`}
										aria-label={`View recipe: ${post.recipeTitle}${post.xpEarned ? `, earned ${post.xpEarned} XP` : ''}`}
										className='inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand/10 to-bonus/10 px-3 py-2 text-sm font-medium text-text transition-all hover:from-brand/20 hover:to-bonus/20'
									>
										<ChefHat className='size-4 text-brand' />
										<span>
											Cooked:{' '}
											<span className='font-bold text-text-primary'>
												{post.recipeTitle}
											</span>
										</span>
										{post.xpEarned && (
											<span className='ml-1 inline-flex items-center gap-1 rounded-full bg-xp/20 px-2 py-0.5 text-xs font-bold text-xp'>
												<Zap className='size-3' />+{post.xpEarned} XP
											</span>
										)}
									</Link>
								)}
							</div>

							{/* Media - Support both photoUrl (legacy) and photoUrls (canonical) */}
							{/* Double-tap to like (Instagram pattern) */}
							{(post.photoUrl ||
								(post.photoUrls && post.photoUrls.length > 0)) && (
								<div
									className='relative aspect-video w-full cursor-pointer overflow-hidden bg-muted select-none'
									onClick={handleDoubleTap}
									onTouchEnd={handleDoubleTap}
								>
									<Image
										src={post.photoUrl || post.photoUrls?.[0] || ''}
										alt='Post media'
										fill
										className='object-cover transition-transform duration-500 group-hover:scale-105'
										draggable={false}
									/>
									{/* Show indicator if multiple photos (canonical array format) */}
									{post.photoUrls && post.photoUrls.length > 1 && (
										<div className='absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm'>
											1/{post.photoUrls.length}
										</div>
									)}

									{/* Double-tap heart animation overlay */}
									<AnimatePresence>
										{showDoubleTapHeart && (
											<motion.div
												initial={{ scale: 0, opacity: 0 }}
												animate={{ scale: 1, opacity: 1 }}
												exit={{ scale: 1.5, opacity: 0 }}
												transition={{ duration: 0.4, ease: 'easeOut' }}
												className='absolute inset-0 flex items-center justify-center pointer-events-none'
											>
												<Heart className='size-24 fill-white stroke-white drop-shadow-lg' />
											</motion.div>
										)}
									</AnimatePresence>
								</div>
							)}

							{post.videoUrl && (
								<div className='relative aspect-video w-full overflow-hidden bg-muted'>
									<video
										src={post.videoUrl}
										controls
										className='h-full w-full'
									/>
								</div>
							)}
						</>
					)}

					{/* Actions */}
					<div className='flex justify-around border-t border-border-subtle bg-bg-card p-2'>
						<button
							ref={likeButtonRef}
							onClick={handleLike}
							disabled={isLiking}
							className={`group/btn flex h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-all ${
								post.isLiked
									? 'text-primary'
									: 'text-text-secondary hover:bg-bg-hover hover:text-primary'
							}`}
						>
							<Heart
								className={`h-5 w-5 transition-all duration-300 group-hover/btn:scale-125 ${
									post.isLiked
										? 'animate-heart-beat fill-destructive stroke-destructive'
										: 'group-hover/btn:fill-destructive group-hover/btn:stroke-destructive'
								}`}
							/>
							<span>{post.likes ?? 0}</span>
						</button>{' '}
						<button
							onClick={() => setShowComments(!showComments)}
							className='group/btn flex h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-text-secondary transition-all hover:bg-bg-hover hover:text-primary'
						>
							<MessageSquare className='h-5 w-5 transition-all duration-300 group-hover/btn:scale-125 group-hover/btn:fill-primary group-hover/btn:stroke-primary' />
							<span>{post.commentCount ?? 0}</span>
						</button>
						<button
							onClick={handleShare}
							className='group/btn flex h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-text-secondary transition-all hover:bg-bg-hover hover:text-primary'
						>
							<Send className='h-5 w-5 transition-all duration-300 group-hover/btn:scale-125' />
							<span>Share</span>
						</button>
						<button
							onClick={handleSave}
							disabled={isSaving}
							className={`group/btn flex h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-all ${
								isSaved
									? 'text-primary'
									: 'text-text-secondary hover:bg-bg-hover hover:text-primary'
							}`}
						>
							<Bookmark
								className={`h-5 w-5 transition-all duration-300 group-hover/btn:scale-125 ${
									isSaved
										? 'fill-gold stroke-gold'
										: 'group-hover/btn:fill-gold group-hover/btn:stroke-gold'
								}`}
							/>
							<span>Save</span>
						</button>
					</div>

					{/* Comments Section */}
					<AnimatePresence>
						{showComments && (
							<motion.div
								initial={{ height: 0, opacity: 0 }}
								animate={{ height: 'auto', opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								className='overflow-hidden bg-bg-card'
							>
								<CommentList
									postId={post.id}
									currentUserId={currentUserId}
									onCommentCreated={() => {
										// Update local comment count
										setPost(prev => ({
											...prev,
											commentCount: (prev.commentCount ?? 0) + 1,
										}))
									}}
								/>
							</motion.div>
						)}
					</AnimatePresence>
				</motion.div>
				{/* Report Modal */}
				<ReportModal
					isOpen={showReportModal}
					onClose={() => setShowReportModal(false)}
					onSubmit={handleReportSubmit}
					content={reportContent}
				/>
			</motion.article>
		</>
	)
}
