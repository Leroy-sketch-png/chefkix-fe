'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Post } from '@/lib/types'
import {
	toggleLike,
	deletePost,
	updatePost,
	toggleSave,
	reportPost,
	ratePlate,
	voteBattle,
} from '@/services/post'
import { toast } from 'sonner'
import {
	trackEvent,
	startDwellTracking,
	stopDwellTracking,
} from '@/lib/eventTracker'
import { triggerLikeConfetti, triggerSaveConfetti } from '@/lib/confetti'
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
	Users,
	BarChart3,
	FolderPlus,
	Star,
	Lightbulb,
	Swords,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'
import { UserHoverCard } from '@/components/social/UserHoverCard'
import { CommentList } from '@/components/social/CommentList'
import {
	TRANSITION_SPRING,
	EXIT_VARIANTS,
	CARD_FEED_HOVER,
	BUTTON_HOVER,
	BUTTON_TAP,
	BUTTON_SUBTLE_TAP,
	HEART_POP,
	BOOKMARK_SLIDE,
	SEND_WHOOSH,
	DURATION_S,
} from '@/lib/motion'
import { ImageCarousel } from '@/components/ui/image-carousel'
import {
	ReportModal,
	type ReportedContent,
} from '@/components/modals/ReportModal'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Portal } from '@/components/ui/portal'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { useAuthGate } from '@/hooks/useAuthGate'
import { useTranslations } from 'next-intl'
import { SharePostModal } from '@/components/social/SharePostModal'
import { logDevError } from '@/lib/dev-log'
import { VerifiedBadge } from '@/components/shared/VerifiedBadge'
import { SaveToCollectionPicker } from '@/components/social/SaveToCollectionPicker'
import { StarRating } from '@/components/ui/star-rating'
import { AnimatedNumber } from '@/components/ui/animated-number'

const EDIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

function EditCountdown({ createdAt }: { createdAt: Date }) {
	const [minutesLeft, setMinutesLeft] = useState(() =>
		Math.max(
			0,
			Math.ceil((createdAt.getTime() + EDIT_WINDOW_MS - Date.now()) / 60000),
		),
	)

	useEffect(() => {
		const interval = setInterval(() => {
			const remaining = Math.max(
				0,
				Math.ceil((createdAt.getTime() + EDIT_WINDOW_MS - Date.now()) / 60000),
			)
			setMinutesLeft(remaining)
			if (remaining <= 0) clearInterval(interval)
		}, 30000) // update every 30s
		return () => clearInterval(interval)
	}, [createdAt])

	const t = useTranslations('post')

	if (minutesLeft <= 0) return null

	return (
		<span className='inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand'>
			<Pencil className='size-3' />
			{t('minutesLeftToEdit', { minutes: minutesLeft })}
		</span>
	)
}

interface PostCardProps {
	post: Post
	onUpdate?: (post: Post) => void
	onDelete?: (postId: string) => void
	currentUserId?: string
}

const POST_TYPE_BADGE_STYLES: Record<string, string> = {
	QUICK: 'bg-warning/15 text-warning-deep',
	POLL: 'bg-info/15 text-info',
	RECENT_COOK: 'bg-brand/15 text-brand',
	GROUP: 'bg-accent-purple/15 text-accent-purple',
	RECIPE_REVIEW: 'bg-warning/20 text-warning-deep',
	QUICK_TIP: 'bg-success/15 text-success-deep',
	RECIPE_BATTLE: 'bg-error/15 text-error',
}

export const PostCard = ({
	post: initialPost,
	onUpdate,
	onDelete,
	currentUserId,
}: PostCardProps) => {
	const [post, setPost] = useState<Post>(initialPost)
	const [isLiking, setIsLiking] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [isUpdating, setIsUpdating] = useState(false)
	const [showMenu, setShowMenu] = useState(false)
	const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
	const [showComments, setShowComments] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const [editContent, setEditContent] = useState(post.content)
	const [editTags, setEditTags] = useState((post.tags ?? []).join(', '))
	const [isSaved, setIsSaved] = useState(post.isSaved ?? false)
	const [isSaving, setIsSaving] = useState(false)
	const [showReportModal, setShowReportModal] = useState(false)
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
	const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false)
	const [showShareModal, setShowShareModal] = useState(false)
	const [showShareMenu, setShowShareMenu] = useState(false)
	const [shareMenuPosition, setShareMenuPosition] = useState({
		top: 0,
		right: 0,
	})
	const [isRatingPlate, setIsRatingPlate] = useState(false)
	const [showCollectionPicker, setShowCollectionPicker] = useState(false)
	const [collectionPickerPos, setCollectionPickerPos] = useState({
		top: 0,
		right: 0,
	})
	const [isVotingBattle, setIsVotingBattle] = useState(false)

	// Refs
	const likeButtonRef = useRef<HTMLButtonElement>(null)
	const saveButtonRef = useRef<HTMLButtonElement>(null)
	const menuButtonRef = useRef<HTMLButtonElement>(null)
	const shareButtonRef = useRef<HTMLButtonElement>(null)
	const cardRef = useRef<HTMLDivElement>(null)
	const lastTapRef = useRef<number>(0)
	const DOUBLE_TAP_DELAY = 300 // ms

	const isOwner = currentUserId === post.userId
	const hasPhotos = !!(post.photoUrls?.length || post.photoUrl)
	const requireAuth = useAuthGate()
	const t = useTranslations('post')

	// Dwell tracking — fire POST_DWELLED when card is visible for 2+ seconds
	useEffect(() => {
		const element = cardRef.current
		if (!element || !post.id) return

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					startDwellTracking(post.id, 'post')
				} else {
					stopDwellTracking(post.id)
				}
			},
			{ threshold: 0.5 }, // 50% visible
		)

		observer.observe(element)
		return () => {
			observer.disconnect()
			stopDwellTracking(post.id)
		}
	}, [post.id])

	useEscapeKey(showMenu, () => setShowMenu(false))
	useEscapeKey(showShareMenu, () => setShowShareMenu(false))
	const isLoggedIn = !!currentUserId
	const createdAt = new Date(post.createdAt)

	// Sync local state when parent updates the post prop
	useEffect(() => {
		setPost(initialPost)
		setIsSaved(initialPost.isSaved ?? false)
	}, [initialPost])

	const canEdit = isOwner && Date.now() - createdAt.getTime() < 60 * 60 * 1000 // Within 1 hour

	const handleMenuToggle = useCallback(() => {
		if (!showMenu && menuButtonRef.current) {
			const rect = menuButtonRef.current.getBoundingClientRect()
			setMenuPosition({
				top: rect.bottom + 4,
				right: window.innerWidth - rect.right,
			})
		}
		setShowMenu(prev => !prev)
	}, [showMenu])

	const handleShareMenuToggle = useCallback(() => {
		if (!showShareMenu && shareButtonRef.current) {
			const rect = shareButtonRef.current.getBoundingClientRect()
			setShareMenuPosition({
				top: rect.top - 4, // Above button
				right: window.innerWidth - rect.right,
			})
		}
		setShowShareMenu(prev => !prev)
	}, [showShareMenu])

	const handleLike = useCallback(async () => {
		if (isLiking) return
		if (!requireAuth(t('authActionLike'))) return

		setIsLiking(true)
		const wasLiked = post.isLiked
		const previousLikes = post.likes

		// Optimistic UI update
		setPost(prev => ({
			...prev,
			isLiked: !prev.isLiked,
			likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1,
		}))

		// Trigger confetti IMMEDIATELY on like (optimistic, not after API)
		// Confetti celebrates user's action, not server's confirmation
		if (!wasLiked) {
			triggerLikeConfetti(likeButtonRef.current || undefined)
		}

		try {
			const response = await toggleLike(post.id)

			if (response.success && response.data) {
				// Update with server response - use likeCount (BE field name)
				const newLikes =
					response.data.likeCount ??
					(wasLiked ? previousLikes - 1 : previousLikes + 1)
				const newIsLiked = response.data.isLiked ?? !wasLiked

				trackEvent('POST_LIKED', post.id, 'post', { liked: newIsLiked })
				setPost(prev => ({
					...prev,
					likes: newLikes,
					isLiked: newIsLiked,
				}))
				onUpdate?.({ ...post, likes: newLikes, isLiked: newIsLiked })
			} else {
				// Revert on error
				setPost(prev => ({
					...prev,
					isLiked: wasLiked,
					likes: previousLikes,
				}))
				toast.error(t('toastLikeFailed'))
			}
		} catch {
			// Revert on network/unexpected error
			setPost(prev => ({
				...prev,
				isLiked: wasLiked,
				likes: previousLikes,
			}))
			toast.error(t('toastLikeFailed'))
		} finally {
			setIsLiking(false)
		}
	}, [isLiking, onUpdate, post, requireAuth, t])

	const handleSave = async () => {
		if (isSaving) return
		if (!requireAuth(t('authActionSave'))) return

		// Optimistic update
		const previousSaved = isSaved
		setIsSaved(!isSaved)
		setIsSaving(true)

		// Trigger confetti IMMEDIATELY on save (optimistic, not after API)
		// Confetti celebrates user's action, not server's confirmation
		if (!previousSaved) {
			triggerSaveConfetti(saveButtonRef.current || undefined)
		}

		try {
			const response = await toggleSave(post.id)

			if (response.success && response.data) {
				setIsSaved(response.data.isSaved)

				toast.success(
					response.data.isSaved ? t('toastSaved') : t('toastUnsaved'),
				)
			} else {
				// Revert on error
				setIsSaved(previousSaved)
				toast.error(
					response.message ||
						(previousSaved ? t('unsavePostFailed') : t('savePostFailed')),
				)
			}
		} catch (error) {
			// Revert on error
			setIsSaved(previousSaved)
			logDevError('Failed to save post:', error)
			toast.error(previousSaved ? t('unsavePostFailed') : t('savePostFailed'))
		} finally {
			setIsSaving(false)
		}
	}

	const handleRatePlate = async (rating: 'FIRE' | 'CRINGE') => {
		if (!requireAuth(t('authActionRate'))) return
		if (isRatingPlate) return
		setIsRatingPlate(true)

		// Optimistic update
		const prevRating = post.userPlateRating
		const prevFire = post.fireCount ?? 0
		const prevCringe = post.cringeCount ?? 0

		let newRating: typeof prevRating
		let newFire = prevFire
		let newCringe = prevCringe

		if (prevRating === rating) {
			// Toggle off
			newRating = null
			if (rating === 'FIRE') newFire--
			else newCringe--
		} else {
			if (prevRating) {
				// Switch
				if (prevRating === 'FIRE') newFire--
				else newCringe--
			}
			newRating = rating
			if (rating === 'FIRE') newFire++
			else newCringe++
		}

		setPost(prev => ({
			...prev,
			userPlateRating: newRating,
			fireCount: Math.max(0, newFire),
			cringeCount: Math.max(0, newCringe),
		}))

		try {
			const response = await ratePlate(post.id, rating)
			if (response.success && response.data) {
				setPost(prev => ({
					...prev,
					userPlateRating: response.data.userRating,
					fireCount: response.data.fireCount,
					cringeCount: response.data.cringeCount,
				}))
			} else {
				setPost(prev => ({
					...prev,
					userPlateRating: prevRating,
					fireCount: prevFire,
					cringeCount: prevCringe,
				}))
				toast.error(t('failedRate'))
			}
		} catch {
			setPost(prev => ({
				...prev,
				userPlateRating: prevRating,
				fireCount: prevFire,
				cringeCount: prevCringe,
			}))
			toast.error(t('failedRate'))
		} finally {
			setIsRatingPlate(false)
		}
	}

	const handleDelete = async () => {
		setShowDeleteConfirm(true)
	}

	const handleConfirmDelete = async () => {
		if (isDeleting) return
		setIsDeleting(true)
		try {
			const response = await deletePost(post.id)
			if (response.success) {
				toast.success(t('toastDeleteSuccess'))
				onDelete?.(post.id)
			} else {
				toast.error(t('toastDeleteFailed'))
			}
		} catch {
			logDevError('Failed to delete post:', post.id)
			toast.error(t('toastDeleteFailed'))
		} finally {
			setIsDeleting(false)
			setShowMenu(false)
		}
	}

	const handleEdit = async () => {
		if (isUpdating) return
		if (!editContent.trim()) {
			toast.error(t('toastContentEmpty'))
			return
		}
		setIsUpdating(true)

		const tags = editTags
			.split(',')
			.map(t => t.trim())
			.filter(t => t.length > 0)

		try {
			const response = await updatePost(post.id, {
				content: editContent,
				tags,
			})

			if (response.statusCode === 410) {
				// Post edit window expired (backend)
				toast.error(t('toastEditTimeLimit'))
				return
			}

			if (response.success && response.data) {
				setPost(response.data)
				onUpdate?.(response.data)
				setIsEditing(false)
				toast.success(t('toastUpdateSuccess'))
			} else {
				toast.error(t('toastUpdateFailed'))
			}
		} catch {
			logDevError('Failed to update post:', post.id)
			toast.error(t('toastUpdateFailed'))
		} finally {
			setIsUpdating(false)
		}
	}

	// Handle report submission
	const handleReportSubmit = async (reason: string, details?: string) => {
		if (!requireAuth(t('authActionReport'))) return
		try {
			const response = await reportPost(post.id, { reason, details })
			if (response.success) {
				toast.success(
					response.data?.reviewTriggered
						? t('reportUnderReview')
						: t('reportThankYou'),
				)
			} else {
				toast.error(t('failedReport'))
			}
		} catch {
			logDevError('Failed to submit post report:', post.id)
			toast.error(t('failedReport'))
		}
	}

	const handleNativeShare = async () => {
		setShowShareMenu(false)
		const postUrl = `${window.location.origin}/post/${post.id}`
		const shareData = {
			title: t('nativeShareTitle', {
				name: post.displayName || t('chefkixUser'),
			}),
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
					logDevError('Native share failed, falling back to clipboard:', err)
					try {
						await navigator.clipboard.writeText(postUrl)
						toast.success(t('linkCopied'))
					} catch {
						toast.error(t('failedCopyLink'))
					}
				}
			}
		} else {
			// Fallback: copy to clipboard
			try {
				await navigator.clipboard.writeText(postUrl)
				toast.success(t('linkCopied'))
			} catch {
				toast.error(t('failedCopyLink'))
			}
		}
	}

	const handleShareToChat = () => {
		if (!requireAuth(t('authActionShareChat'))) return
		setShowShareMenu(false)
		setShowShareModal(true)
	}

	// Handle battle voting
	const handleBattleVote = async (choice: 'A' | 'B') => {
		if (!requireAuth(t('authActionVoteBattle'))) return
		if (isVotingBattle) return
		// Don't allow voting on ended battles
		if (post.battleEndsAt && new Date(post.battleEndsAt) <= new Date()) return

		setIsVotingBattle(true)
		try {
			const response = await voteBattle(post.id, choice)
			if (response.success && response.data) {
				setPost(prev => ({
					...prev,
					userBattleVote: response.data!.userVote,
					battleVotesA: response.data!.votesA,
					battleVotesB: response.data!.votesB,
				}))
				trackEvent('BATTLE_VOTE', post.id, 'post', {
					choice,
					toggled: response.data.userVote === null,
				})
			} else {
				toast.error(t('battleVoteFailed'))
			}
		} catch {
			toast.error(t('battleVoteFailed'))
		} finally {
			setIsVotingBattle(false)
		}
	}

	// Handle double-tap to like on images (Instagram pattern)
	// Instagram's pattern: Double-tap ALWAYS likes. It NEVER unlikes.
	// Double-tap = "I like this" regardless of previous state.
	const handleDoubleTap = useCallback(() => {
		const now = Date.now()
		if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
			// Double tap detected!
			// Always show the heart animation for visual feedback
			setShowDoubleTapHeart(true)
			setTimeout(() => setShowDoubleTapHeart(false), 1000)

			// Only trigger like if not already liked (Instagram pattern)
			if (!post.isLiked) {
				handleLike()
			}
		}
		lastTapRef.current = now
	}, [post.isLiked, handleLike])

	// Report content metadata for the modal
	const reportContent: ReportedContent = {
		type: 'post',
		preview:
			post.content.slice(0, 100) + (post.content.length > 100 ? '...' : ''),
		author: {
			username: post.displayName || t('unknownUser'),
			avatarUrl: post.avatarUrl || '/placeholder-avatar.svg',
		},
	}

	return (
		<>
			{/* Delete confirmation dialog */}
			<ConfirmDialog
				open={showDeleteConfirm}
				onOpenChange={setShowDeleteConfirm}
				title={t('deleteTitle')}
				description={t('deleteConfirmDesc')}
				confirmLabel={t('delete')}
				cancelLabel={t('cancel')}
				variant='destructive'
				onConfirm={handleConfirmDelete}
			/>

			{/* Share Post Modal */}
			<SharePostModal
				isOpen={showShareModal}
				onClose={() => setShowShareModal(false)}
				postId={post.id}
				postTitle={post.recipeTitle || undefined}
				postImage={post.photoUrls?.[0] || post.photoUrl || undefined}
				postContent={post.content}
			/>

			<motion.article
				ref={cardRef}
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				layout
				exit={EXIT_VARIANTS.scaleOut}
				transition={TRANSITION_SPRING}
				className='mb-6'
			>
				<motion.div
					whileHover={CARD_FEED_HOVER}
					className='group relative overflow-hidden -mx-4 sm:mx-0 sm:rounded-radius border-y sm:border border-border-medium bg-bg-card transition-all duration-300'
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
									className='transition-all group-hover:opacity-90'
								>
									<AvatarImage
										src={post.avatarUrl || '/placeholder-avatar.svg'}
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
									<div className='flex items-center gap-1 text-base font-bold leading-tight text-text-primary'>
										<span className='truncate'>
											{post.displayName || t('unknownUser')}
										</span>
										{post.isVerified && <VerifiedBadge size='sm' />}
									</div>
									<div className='flex items-center gap-2 text-sm leading-normal text-text-secondary'>
										{post.postType && post.postType !== 'PERSONAL' && (
											<span
												className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium ${POST_TYPE_BADGE_STYLES[post.postType] || 'bg-bg-elevated text-text-muted'}`}
											>
												{post.postType === 'QUICK' && (
													<>
														<Zap className='size-3' />
														{t('typeQuickShort')}
													</>
												)}
												{post.postType === 'POLL' && (
													<>
														<BarChart3 className='size-3' />
														{t('typePollShort')}
													</>
												)}
												{post.postType === 'RECENT_COOK' && (
													<>
														<ChefHat className='size-3' />
														{t('typeCookShort')}
													</>
												)}
												{post.postType === 'GROUP' && (
													<>
														<Users className='size-3' />
														{t('typeGroupShort')}
													</>
												)}
												{post.postType === 'RECIPE_REVIEW' && (
													<>
														<Star className='size-3' />
														{t('typeReviewShort')}
													</>
												)}
												{post.postType === 'QUICK_TIP' && (
													<>
														<Lightbulb className='size-3' />
														{t('typeTipShort')}
													</>
												)}
												{post.postType === 'RECIPE_BATTLE' && (
													<>
														<Swords className='size-3' />
														{t('typeBattleShort')}
													</>
												)}
											</span>
										)}
										{formatDistanceToNow(new Date(post.createdAt), {
											addSuffix: true,
										})}
										{canEdit && <EditCountdown createdAt={createdAt} />}
									</div>
								</div>
							</Link>
						</UserHoverCard>

						{/* Menu - Show for all logged in users */}
						{isLoggedIn && (
							<div className='relative'>
								<motion.button
									type='button'
									ref={menuButtonRef}
									onClick={handleMenuToggle}
									whileTap={BUTTON_SUBTLE_TAP}
									aria-label={t('openActions')}
									className='size-11 rounded-full transition-colors hover:bg-bg-hover focus-visible:ring-2 focus-visible:ring-brand/50'
								>
									<MoreVertical className='mx-auto size-5 text-text-secondary' />
								</motion.button>

								{/* Portaled dropdown to escape overflow:hidden clipping */}
								<AnimatePresence>
									{showMenu && (
										<Portal>
											{/* Click outside to close */}
											<div
												className='fixed inset-0 z-dropdown'
												onClick={() => setShowMenu(false)}
											/>
											<motion.div
												role='menu'
												initial={{ opacity: 0, scale: 0.95, y: -10 }}
												animate={{ opacity: 1, scale: 1, y: 0 }}
												exit={{ opacity: 0, scale: 0.95, y: -10 }}
												className='fixed z-dropdown w-48 rounded-radius border border-border-subtle bg-bg-card py-1 shadow-card'
												style={{
													top: `${menuPosition.top}px`,
													right: `${menuPosition.right}px`,
												}}
											>
												{/* Owner actions */}
												{isOwner && (
													<>
														{canEdit && (
															<motion.button
																type='button'
																role='menuitem'
																whileTap={BUTTON_SUBTLE_TAP}
																onClick={() => {
																	setIsEditing(true)
																	setShowMenu(false)
																}}
																className='flex h-11 w-full items-center gap-2 px-4 text-left text-sm text-text-primary transition-colors hover:bg-bg-hover focus-visible:ring-2 focus-visible:ring-brand/50'
															>
																<Pencil className='size-4' />
																{t('editPost')}
															</motion.button>
														)}
														<motion.button
															type='button'
															role='menuitem'
															whileTap={BUTTON_SUBTLE_TAP}
															onClick={handleDelete}
															className='flex h-11 w-full items-center gap-2 px-4 text-left text-sm text-destructive transition-colors hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-brand/50'
														>
															<Trash2 className='size-4' />
															{t('deletePost')}
														</motion.button>
													</>
												)}
												{/* Non-owner actions */}
												{!isOwner && (
													<motion.button
														type='button'
														role='menuitem'
														whileTap={BUTTON_SUBTLE_TAP}
														onClick={() => {
															setShowReportModal(true)
															setShowMenu(false)
														}}
														className='flex h-11 w-full items-center gap-2 px-4 text-left text-sm text-text-primary transition-colors hover:bg-bg-hover focus-visible:ring-2 focus-visible:ring-brand/50'
													>
														<Flag className='size-4' />
														{t('reportPost')}
													</motion.button>
												)}
											</motion.div>
										</Portal>
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
								className='min-h-textarea w-full resize-none rounded-lg bg-bg-card p-3 text-text-primary caret-brand focus:outline-none focus-visible:ring-1 focus-visible:ring-brand/10'
								placeholder={t('editPostPlaceholder')}
								aria-label={t('editPostPlaceholder')}
								maxLength={2000}
							/>
							{editContent.length > 0 && (
								<p
									className={`text-right text-xs ${editContent.length > 1600 ? (editContent.length >= 2000 ? 'text-error font-semibold' : 'text-warning') : 'text-text-muted'}`}
								>
									{editContent.length}/2000
								</p>
							)}
							<input
								value={editTags}
								onChange={e => setEditTags(e.target.value)}
								className='w-full rounded-lg bg-bg-card px-3 py-2 text-text-primary caret-brand focus:outline-none focus-visible:ring-1 focus-visible:ring-brand/10'
								placeholder={t('tagsPlaceholder')}
								aria-label={t('tagsPlaceholder')}
								maxLength={200}
							/>
							<div className='flex gap-2'>
								<motion.button
									type='button'
									onClick={handleEdit}
									whileTap={BUTTON_SUBTLE_TAP}
									className='h-11 flex-1 rounded-lg bg-brand px-4 font-medium text-white transition-colors hover:bg-brand/90 focus-visible:ring-2 focus-visible:ring-brand/50'
								>
									{t('save')}
								</motion.button>
								<motion.button
									type='button'
									onClick={() => {
										setIsEditing(false)
										setEditContent(post.content)
										setEditTags((post.tags ?? []).join(', '))
									}}
									whileTap={BUTTON_SUBTLE_TAP}
									className='h-11 flex-1 rounded-lg border border-border-subtle bg-bg-card px-4 font-medium text-text-primary transition-colors hover:bg-bg-hover focus-visible:ring-2 focus-visible:ring-brand/50'
								>
									{t('cancel')}
								</motion.button>
							</div>
						</div>
					) : (
						<>
							<div className='space-y-3 px-4 pb-3 md:px-6'>
								<p className='whitespace-pre-wrap leading-relaxed text-text-primary'>
									{post.content}
								</p>
								{(post.tags ?? []).length > 0 && (
									<div className='flex flex-wrap gap-2'>
										{post.tags.map(tag => (
											<span
												key={tag}
												className='rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand'
											>
												#{tag}
											</span>
										))}
									</div>
								)}

								{/* Recipe Review — Star rating inline */}
								{post.postType === 'RECIPE_REVIEW' &&
									post.reviewRating != null && (
										<div className='flex items-center gap-3 rounded-xl bg-gradient-to-r from-warning/10 to-streak/10 px-3 py-2'>
											<StarRating
												value={post.reviewRating}
												readOnly
												size='sm'
											/>
											<span className='text-sm font-medium text-text-secondary'>
												{post.reviewRating}/5
											</span>
										</div>
									)}

								{/* Recipe Battle — VS card with voting */}
								{post.postType === 'RECIPE_BATTLE' &&
									post.battleRecipeIdA &&
									post.battleRecipeIdB &&
									(() => {
										const battleActive =
											!post.battleEndsAt ||
											new Date(post.battleEndsAt) > new Date()
										const totalVotes =
											(post.battleVotesA ?? 0) + (post.battleVotesB ?? 0)
										const userVote = post.userBattleVote

										return (
											<div className='rounded-xl border border-border-subtle bg-bg-elevated/50 p-3'>
												<div className='grid grid-cols-[1fr_auto_1fr] items-center gap-3'>
													{/* Recipe A */}
													<div className='flex flex-col items-center gap-2'>
														<Link
															href={`/recipes/${post.battleRecipeIdA}`}
															className='group/recipe flex flex-col items-center gap-2 rounded-lg p-2 transition-colors hover:bg-bg-hover'
														>
															{post.battleRecipeImageA && (
																<div className='relative size-16 overflow-hidden rounded-lg'>
																	<Image
																		src={post.battleRecipeImageA}
																		alt={
																			post.battleRecipeTitleA ??
																			t('recipeAFallback')
																		}
																		fill
																		sizes='64px'
																		unoptimized
																		onError={e => {
																			;(
																				e.target as HTMLImageElement
																			).style.display = 'none'
																		}}
																		className='object-cover transition-transform group-hover/recipe:scale-110'
																	/>
																</div>
															)}
															<span
																className='line-clamp-2 text-center text-xs font-semibold text-text-primary'
																title={
																	post.battleRecipeTitleA ??
																	t('recipeAFallback')
																}
															>
																{post.battleRecipeTitleA ??
																	t('recipeAFallback')}
															</span>
														</Link>
														<span className='text-xs font-bold tabular-nums text-brand'>
															{t('votesCount', {
																count: post.battleVotesA ?? 0,
															})}
														</span>
														{battleActive && (
															<motion.button
																type='button'
																whileHover={BUTTON_HOVER}
																whileTap={BUTTON_TAP}
																onClick={() => handleBattleVote('A')}
																disabled={isVotingBattle}
																className={`rounded-lg px-4 py-2.5 text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:ring-brand/50 ${isVotingBattle ? 'animate-pulse opacity-60' : ''} ${
																	userVote === 'A'
																		? 'bg-brand text-white shadow-glow'
																		: 'border border-border-subtle bg-bg-card text-text-secondary hover:border-brand hover:text-brand'
																}`}
															>
																{isVotingBattle
																	? t('battleVoting')
																	: userVote === 'A'
																		? t('battleVoted')
																		: t('battleVoteA')}
															</motion.button>
														)}
													</div>

													{/* VS Badge */}
													<div className='flex flex-col items-center gap-1'>
														<span className='rounded-full bg-gradient-to-br from-brand to-destructive px-3 py-1 text-xs font-black text-white shadow-glow'>
															VS
														</span>
														{post.battleEndsAt && (
															<span className='text-2xs text-text-muted'>
																{battleActive
																	? t('battleActive')
																	: t('battleEnded')}
															</span>
														)}
													</div>

													{/* Recipe B */}
													<div className='flex flex-col items-center gap-2'>
														<Link
															href={`/recipes/${post.battleRecipeIdB}`}
															className='group/recipe flex flex-col items-center gap-2 rounded-lg p-2 transition-colors hover:bg-bg-hover'
														>
															{post.battleRecipeImageB && (
																<div className='relative size-16 overflow-hidden rounded-lg'>
																	<Image
																		src={post.battleRecipeImageB}
																		alt={
																			post.battleRecipeTitleB ??
																			t('recipeBFallback')
																		}
																		fill
																		sizes='64px'
																		unoptimized
																		onError={e => {
																			;(
																				e.target as HTMLImageElement
																			).style.display = 'none'
																		}}
																		className='object-cover transition-transform group-hover/recipe:scale-110'
																	/>
																</div>
															)}
															<span
																className='line-clamp-2 text-center text-xs font-semibold text-text-primary'
																title={
																	post.battleRecipeTitleB ??
																	t('recipeBFallback')
																}
															>
																{post.battleRecipeTitleB ??
																	t('recipeBFallback')}
															</span>
														</Link>
														<span className='text-xs font-bold tabular-nums text-brand'>
															{t('votesCount', {
																count: post.battleVotesB ?? 0,
															})}
														</span>
														{battleActive && (
															<motion.button
																type='button'
																whileHover={BUTTON_HOVER}
																whileTap={BUTTON_TAP}
																onClick={() => handleBattleVote('B')}
																disabled={isVotingBattle}
																className={`rounded-lg px-4 py-2.5 text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:ring-brand/50 ${isVotingBattle ? 'animate-pulse opacity-60' : ''} ${
																	userVote === 'B'
																		? 'bg-brand text-white shadow-glow'
																		: 'border border-border-subtle bg-bg-card text-text-secondary hover:border-brand hover:text-brand'
																}`}
															>
																{isVotingBattle
																	? t('battleVoting')
																	: userVote === 'B'
																		? t('battleVoted')
																		: t('battleVoteB')}
															</motion.button>
														)}
													</div>
												</div>

												{/* Vote progress bar */}
												{totalVotes > 0 && (
													<div className='mt-3 h-2 overflow-hidden rounded-full bg-bg'>
														<div
															className='h-full rounded-full bg-gradient-to-r from-brand to-streak transition-all duration-500'
															style={{
																width: `${((post.battleVotesA ?? 0) / totalVotes) * 100}%`,
															}}
														/>
													</div>
												)}
											</div>
										)
									})()}

								{/* Quick Tip — Highlighted tip block */}
								{post.postType === 'QUICK_TIP' && (
									<div className='flex items-start gap-3 rounded-xl border border-warning/20 bg-gradient-to-r from-warning/5 to-level/5 px-4 py-3'>
										<Lightbulb className='mt-0.5 size-5 flex-shrink-0 text-warning' />
										<span className='text-sm font-medium leading-relaxed text-text-primary'>
											{t('quickTipLabel')}
										</span>
									</div>
								)}

								{/* Recipe Link Badge - Shows when post is linked to a cooking session */}
								{post.recipeId && post.recipeTitle && (
									<Link
										href={`/recipes/${post.recipeId}`}
										aria-label={
											post.xpEarned
												? t('ariaViewRecipeXp', {
														title: post.recipeTitle,
														xp: post.xpEarned,
													})
												: t('ariaViewRecipe', { title: post.recipeTitle })
										}
										className='inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand/10 to-bonus/10 px-3 py-2 text-sm font-medium text-text transition-all hover:from-brand/20 hover:to-bonus/20'
									>
										<ChefHat className='size-4 text-brand' />
										<span>
											{t('cookedLabel')}{' '}
											<span className='font-bold text-text-primary'>
												{post.recipeTitle}
											</span>
										</span>
										{post.xpEarned != null && post.xpEarned > 0 && (
											<span className='ml-1 inline-flex items-center gap-1 rounded-full bg-xp/20 px-2 py-0.5 text-xs font-bold text-xp'>
												<Zap className='size-3' />
												{t('xpBadge', { xp: post.xpEarned })}
											</span>
										)}
									</Link>
								)}

								{/* Co-Chef Attribution - Shows co-cooking participants */}
								{post.coChefs && post.coChefs.length > 0 && (
									<div className='flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand/5 to-accent-purple/5 px-3 py-2'>
										<Users className='size-4 flex-shrink-0 text-brand' />
										<span className='text-sm text-text-secondary'>
											{t('cookedWith')}{' '}
										</span>
										<div className='flex flex-wrap items-center gap-1'>
											{post.coChefs.map((chef, i) => (
												<span key={chef.userId}>
													<Link
														href={`/${chef.userId}`}
														className='inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline'
													>
														{chef.avatarUrl && (
															<Image
																src={chef.avatarUrl}
																alt={chef.displayName}
																width={16}
																height={16}
																unoptimized
																onError={e => {
																	;(
																		e.target as HTMLImageElement
																	).style.display = 'none'
																}}
																className='size-4 rounded-full object-cover'
															/>
														)}
														@{chef.displayName}
													</Link>
													{i < (post.coChefs?.length ?? 0) - 1 && (
														<span className='text-text-muted'>, </span>
													)}
												</span>
											))}
										</div>
									</div>
								)}
							</div>

							{/* Media - Support both photoUrl (legacy) and photoUrls (canonical) */}
							{/* Double-tap to like (Instagram pattern) */}
							{(post.photoUrl ||
								(post.photoUrls && post.photoUrls.length > 0)) && (
								<div
									className='relative w-full cursor-pointer select-none'
									onClick={handleDoubleTap}
									role='button'
									tabIndex={0}
									onKeyDown={e => {
										if (e.key === 'Enter') handleDoubleTap()
									}}
									aria-label={t('postByUser', { name: post.displayName })}
								>
									{/* Use ImageCarousel for multi-image support */}
									<ImageCarousel
										images={
											post.photoUrls && post.photoUrls.length > 0
												? post.photoUrls
												: post.photoUrl
													? [post.photoUrl]
													: []
										}
										alt={t('postByUser', { name: post.displayName })}
										aspectRatio='video'
										showControls={true}
										showIndicators={true}
										enableSwipe={true}
										enableKeyboard={true}
									/>

									{/* Double-tap heart animation overlay */}
									<AnimatePresence>
										{showDoubleTapHeart && (
											<motion.div
												initial={{ scale: 0, opacity: 0 }}
												animate={{ scale: 1, opacity: 1 }}
												exit={{ scale: 1.5, opacity: 0 }}
												transition={{
													duration: DURATION_S.smooth,
													ease: 'easeOut',
												}}
												className='absolute inset-0 flex items-center justify-center pointer-events-none'
												role='status'
												aria-live='polite'
												aria-label={t('postLiked')}
											>
												<Heart className='size-24 fill-white stroke-white drop-shadow-lg' />
											</motion.div>
										)}
									</AnimatePresence>
								</div>
							)}

							{post.videoUrl && (
								<div className='relative aspect-video w-full overflow-hidden bg-bg-elevated'>
									<video
										src={post.videoUrl}
										controls
										className='h-full w-full'
										aria-label={t('postByUser', { name: post.displayName })}
									/>
								</div>
							)}
						</>
					)}

					{/* Rate This Plate — zero-effort engagement for posts with photos */}
					{hasPhotos &&
						post.postType !== 'POLL' &&
						post.postType !== 'RECENT_COOK' &&
						post.postType !== 'RECIPE_BATTLE' &&
						post.postType !== 'RECIPE_REVIEW' &&
						post.userId !== currentUserId && (
							<div className='flex items-center justify-between border-t border-border-subtle bg-bg-elevated/50 px-4 py-2'>
								<span className='text-xs font-medium text-text-muted'>
									{t('rateThisPlate')}
								</span>
								<div className='flex items-center gap-2'>
									<motion.button
										type='button'
										onClick={() => handleRatePlate('FIRE')}
										whileTap={BUTTON_SUBTLE_TAP}
										disabled={isRatingPlate}
										aria-label={t('rateFireLabel')}
										className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm transition-all focus-visible:ring-2 focus-visible:ring-brand/50 ${isRatingPlate ? 'animate-pulse opacity-60' : ''} ${
											post.userPlateRating === 'FIRE'
												? 'bg-streak/100/15 text-streak ring-1 ring-orange-500/30'
												: 'text-text-muted hover:bg-streak/100/10 hover:text-streak'
										}`}
									>
										<span>🔥</span>
										{(post.fireCount ?? 0) > 0 && (
											<AnimatedNumber
												value={post.fireCount!}
												className='text-xs font-semibold tabular-nums'
											/>
										)}
									</motion.button>
									<motion.button
										type='button'
										onClick={() => handleRatePlate('CRINGE')}
										whileTap={BUTTON_SUBTLE_TAP}
										disabled={isRatingPlate}
										aria-label={t('rateCringeLabel')}
										className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm transition-all focus-visible:ring-2 focus-visible:ring-brand/50 ${isRatingPlate ? 'animate-pulse opacity-60' : ''} ${
											post.userPlateRating === 'CRINGE'
												? 'bg-accent-purple/15 text-accent-purple ring-1 ring-accent-purple/30'
												: 'text-text-muted hover:bg-accent-purple/10 hover:text-accent-purple'
										}`}
									>
										<span>😬</span>
										{(post.cringeCount ?? 0) > 0 && (
											<AnimatedNumber
												value={post.cringeCount!}
												className='text-xs font-semibold tabular-nums'
											/>
										)}
									</motion.button>
								</div>
							</div>
						)}

					{/* Actions */}
					<div className='flex gap-1.5 border-t border-border-subtle bg-bg-card px-3 py-2'>
						<motion.button
							type='button'
							ref={likeButtonRef}
							onClick={handleLike}
							disabled={isLiking}
							whileTap={BUTTON_SUBTLE_TAP}
							aria-label={
								post.isLiked ? t('unlikePostLabel') : t('likePostLabel')
							}
							className={`group/btn flex h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-brand/50 ${
								post.isLiked
									? 'text-brand'
									: 'text-text-secondary hover:bg-bg-hover hover:text-brand'
							}`}
						>
							<motion.div
								variants={HEART_POP}
								animate={post.isLiked ? 'liked' : 'unliked'}
								initial={false}
							>
								<Heart
									className={`size-5 transition-all duration-300 group-hover/btn:scale-125 ${
										post.isLiked
											? 'fill-destructive stroke-destructive'
											: 'group-hover/btn:fill-destructive group-hover/btn:stroke-destructive'
									}`}
								/>
							</motion.div>
							<AnimatedNumber
								value={post.likes ?? 0}
								className='tabular-nums'
							/>
						</motion.button>

						<motion.button
							type='button'
							onClick={() => setShowComments(!showComments)}
							whileTap={BUTTON_SUBTLE_TAP}
							aria-label={
								showComments ? t('hideCommentsLabel') : t('showCommentsLabel')
							}
							className='group/btn flex h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-text-secondary transition-all hover:bg-bg-hover hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/50'
						>
							<MessageSquare className='size-5 transition-all duration-300 group-hover/btn:scale-125 group-hover/btn:fill-brand group-hover/btn:stroke-brand' />
							<AnimatedNumber
								value={post.commentCount ?? 0}
								className='tabular-nums'
							/>
						</motion.button>

						{/* Share button with dropdown menu */}
						<div className='relative flex-1'>
							<motion.button
								type='button'
								ref={shareButtonRef}
								onClick={handleShareMenuToggle}
								whileTap={BUTTON_SUBTLE_TAP}
								aria-label={t('sharePost')}
								className='group/btn flex h-11 w-full items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-text-secondary transition-all hover:bg-bg-hover hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/50'
							>
								<motion.div
									variants={SEND_WHOOSH}
									animate={showShareMenu ? 'sending' : 'initial'}
									initial={false}
								>
									<Send className='size-5' />
								</motion.div>
								<span>{t('share')}</span>
							</motion.button>

							{/* Share options menu */}
							<AnimatePresence>
								{showShareMenu && (
									<Portal>
										{/* Click outside to close */}
										<div
											className='fixed inset-0 z-dropdown'
											onClick={() => setShowShareMenu(false)}
										/>
										<motion.div
											role='menu'
											initial={{ opacity: 0, scale: 0.95, y: 10 }}
											animate={{ opacity: 1, scale: 1, y: 0 }}
											exit={{ opacity: 0, scale: 0.95, y: 10 }}
											className='fixed z-dropdown w-48 rounded-radius border border-border-subtle bg-bg-card py-1 shadow-card'
											style={{
												bottom: `${window.innerHeight - shareMenuPosition.top}px`,
												right: `${shareMenuPosition.right}px`,
											}}
										>
											<motion.button
												type='button'
												role='menuitem'
												onClick={handleShareToChat}
												whileTap={BUTTON_SUBTLE_TAP}
												className='flex h-11 w-full items-center gap-2 px-4 text-left text-sm text-text-primary transition-colors hover:bg-bg-hover focus-visible:ring-2 focus-visible:ring-brand/50'
											>
												<MessageSquare className='size-4' />
												{t('sendInChat')}
											</motion.button>
											<motion.button
												type='button'
												role='menuitem'
												onClick={handleNativeShare}
												whileTap={BUTTON_SUBTLE_TAP}
												className='flex h-11 w-full items-center gap-2 px-4 text-left text-sm text-text-primary transition-colors hover:bg-bg-hover focus-visible:ring-2 focus-visible:ring-brand/50'
											>
												<Send className='size-4' />
												{t('shareExternally')}
											</motion.button>
										</motion.div>
									</Portal>
								)}
							</AnimatePresence>
						</div>

						<motion.button
							type='button'
							ref={saveButtonRef}
							onClick={handleSave}
							disabled={isSaving}
							whileTap={BUTTON_SUBTLE_TAP}
							aria-label={
								isSaved ? t('removeSavedPostLabel') : t('savePostLabel')
							}
							className={`group/btn flex h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-brand/50 ${
								isSaved
									? 'flex-1 text-brand'
									: 'flex-1 text-text-secondary hover:bg-bg-hover hover:text-brand'
							}`}
						>
							<motion.div
								variants={BOOKMARK_SLIDE}
								animate={isSaved ? 'saved' : 'unsaved'}
								initial={false}
							>
								<Bookmark
									className={`size-5 transition-all duration-300 group-hover/btn:scale-125 ${
										isSaved
											? 'fill-gold stroke-gold'
											: 'group-hover/btn:fill-gold group-hover/btn:stroke-gold'
									}`}
								/>
							</motion.div>
						</motion.button>
						{/* Add to Collection button — appears when post is saved */}
						<AnimatePresence>
							{isSaved && (
								<motion.button
									type='button'
									initial={{ width: 0, opacity: 0 }}
									animate={{ width: 'auto', opacity: 1 }}
									exit={{ width: 0, opacity: 0 }}
									transition={{ duration: DURATION_S.normal }}
									onClick={() => {
										const rect = saveButtonRef.current?.getBoundingClientRect()
										if (rect) {
											setCollectionPickerPos({
												top: rect.top,
												right: window.innerWidth - rect.right,
											})
										}
										setShowCollectionPicker(true)
									}}
									whileTap={BUTTON_SUBTLE_TAP}
									aria-label={t('addToCollection')}
									className='flex h-11 items-center justify-center overflow-hidden rounded-lg px-2 text-text-muted transition-colors hover:bg-bg-hover hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/50'
								>
									<FolderPlus className='size-4' />
								</motion.button>
							)}
						</AnimatePresence>
						<SaveToCollectionPicker
							postId={post.id}
							isOpen={showCollectionPicker}
							onClose={() => setShowCollectionPicker(false)}
							anchorPosition={collectionPickerPos}
						/>
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
									onCommentDeleted={() => {
										setPost(prev => ({
											...prev,
											commentCount: Math.max((prev.commentCount ?? 1) - 1, 0),
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
