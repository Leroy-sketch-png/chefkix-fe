'use client'

import { useEffect, useState, useRef, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { useTranslations } from '@/i18n/hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
	ArrowLeft,
	Camera,
	ChefHat,
	Clock,
	ImageOff,
	Loader2,
	Sparkles,
	Trophy,
	X,
	Send,
	PenSquare,
	Star,
	Check,
	CloudOff,
	RefreshCw,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AnimatedButton } from '@/components/ui/animated-button'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PageHeader } from '@/components/layout/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { StarRating } from '@/components/ui/star-rating'
import { createPost } from '@/services/post'
import { getSessionById, linkPostToSession } from '@/services/cookingSession'
import { guardContent } from '@/services/ml'
import { trackEvent } from '@/lib/eventTracker'
import { PATHS } from '@/constants/paths'
import { navigateBackOrFallback } from '@/lib/safe-navigation'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { hasClaimablePostXp } from '@/lib/cookingXp'
import {
	exceedsPostDraftPhotoLimit,
	MAX_POST_DRAFT_PHOTOS,
} from '@/lib/post-draft-photos'
import {
	TRANSITION_SPRING,
	fadeInUp,
	BUTTON_SUBTLE_TAP,
	ICON_BUTTON_HOVER,
	ICON_BUTTON_TAP,
} from '@/lib/motion'
import { logDevError } from '@/lib/dev-log'
import { PremiumSurface } from '@/components/layout/PremiumSurface'
import { useCelebration } from '@/components/providers/CelebrationProvider'
import { postDraftRepository } from '@/lib/post-draft-storage'
import {
	usePostDraftAutosave,
	type PostDraftSaveState,
} from '@/hooks/usePostDraftAutosave'
import { useBeforeUnloadWarning } from '@/hooks/useBeforeUnloadWarning'
import {
	createLocalImagePreviewUrlRegistry,
	removeLocalImagePreview,
	failLocalImagePreview,
	markLocalImagePreviewReady,
	type LocalImagePreview,
} from '@/lib/local-image-previews'
import {
	formatShortcutLabel,
	useModifierSymbol,
} from '@/hooks/useKeyboardShortcuts'

interface SessionInfo {
	id: string
	recipeId: string
	recipeTitle: string
	recipeImage?: string
	pendingXp: number
	completedAt: string
	postDeadline: string
}

interface PendingPostLink {
	sessionId: string
	postId: string
	createdAt: string
}

const PENDING_POST_LINK_KEY = 'pendingPostLink'

function CreatePostContent() {
	const router = useRouter()
	const t = useTranslations('post')
	const tc = useTranslations('common')
	const modifierSymbol = useModifierSymbol()
	const submitShortcut = formatShortcutLabel(
		{ key: 'Enter', ctrl: true },
		modifierSymbol,
	)
	const searchParams = useSearchParams()
	const requestedSessionId = searchParams.get('session')
	const [draftSessionId, setDraftSessionId] = useState<string | null>(null)
	const sessionId = requestedSessionId ?? draftSessionId

	const {
		user,
		isAuthenticated,
		isLoading: isAuthLoading,
		isHydrated,
	} = useAuth()
	const { showPostSuccess } = useCelebration()
	const [session, setSession] = useState<SessionInfo | null>(null)
	const [isLoadingSession, setIsLoadingSession] = useState(!!sessionId)

	const [content, setContent] = useState('')
	const [photos, setPhotos] = useState<LocalImagePreview[]>([])
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [reviewRating, setReviewRating] = useState<number>(0)
	const [isDraftHydrated, setIsDraftHydrated] = useState(false)
	const [recoveredDraftExists, setRecoveredDraftExists] = useState(false)

	const nextPhotoId = useRef(0)
	const previewUrlRegistry = useRef(createLocalImagePreviewUrlRegistry())
	const photoFiles = useMemo(() => photos.map(photo => photo.file), [photos])
	useEffect(() => {
		const registry = previewUrlRegistry.current
		return () => registry.releaseAll()
	}, [])

	const createPhotoPreview = (file: File): LocalImagePreview => {
		const id = nextPhotoId.current++
		try {
			return {
				id,
				file,
				previewStatus: 'loading',
				previewUrl: previewUrlRegistry.current.create(id, file),
			}
		} catch (error) {
			logDevError('Failed to create post photo preview:', error)
			return { id, file, previewStatus: 'error', previewUrl: null }
		}
	}

	const claimPendingXp = async (currentSessionId: string, postId: string) => {
		let lastResponse: Awaited<ReturnType<typeof linkPostToSession>> | null =
			null

		for (let attempt = 1; attempt <= 3; attempt++) {
			lastResponse = await linkPostToSession(currentSessionId, postId)
			if (lastResponse.success && lastResponse.data) {
				return lastResponse
			}

			if (attempt < 3) {
				await new Promise(resolve => setTimeout(resolve, attempt * 1000))
			}
		}

		return lastResponse
	}

	// Load session info if sessionId is provided
	useEffect(() => {
		if (!sessionId) return
		let cancelled = false
		setIsLoadingSession(true)

		const loadSession = async () => {
			try {
				const response = await getSessionById(sessionId)
				if (cancelled) return
				if (response.success && response.data) {
					const s = response.data

					// Guard: Once the post XP was claimed, the session can no longer be linked again
					if (s.status === 'posted' || s.status === 'post_deleted') {
						toast.error(t('toastSessionAlreadyLinked'), {
							description: t('xpAlreadyAwarded'),
						})
						setIsLoadingSession(false)
						return // Don't set session - user can still make a regular post
					}

					// Guard: Check if session is not in completed status
					// Only completed sessions should be linked to posts
					if (s.status !== 'completed') {
						toast.error(t('toastSessionCannotLink'), {
							description: t('sessionMustBeCompleted'),
						})
						setIsLoadingSession(false)
						return
					}

					setSession({
						id: s.sessionId,
						recipeId: s.recipeId ?? s.recipe?.id ?? '',
						recipeTitle: s.recipe?.title ?? t('defaultRecipeTitle'),
						recipeImage: s.recipe?.coverImageUrl?.[0],
						pendingXp: s.pendingXp ?? 0,
						completedAt: s.completedAt ?? '',
						postDeadline: s.postDeadline ?? '',
					})
				} else {
					toast.error(t('toastSessionNotFound'))
				}
			} catch (error) {
				if (cancelled) return
				logDevError('Failed to load session:', error)
				toast.error(t('toastSessionLoadFailed'))
			} finally {
				if (!cancelled) setIsLoadingSession(false)
			}
		}

		loadSession()
		return () => {
			cancelled = true
		}
	}, [sessionId, t])

	// ── Guest authentication redirect ────────────────────────────────
	useEffect(() => {
		if (isHydrated && !isAuthLoading && !isAuthenticated) {
			const redirectUrl = requestedSessionId
				? `${PATHS.AUTH.SIGN_IN}?redirect=${encodeURIComponent(`/post/new?session=${requestedSessionId}`)}`
				: `${PATHS.AUTH.SIGN_IN}?redirect=${encodeURIComponent('/post/new')}`
			router.replace(redirectUrl)
		}
	}, [isHydrated, isAuthLoading, isAuthenticated, requestedSessionId, router])

	// ── Durable draft recovery ────────────────────────────────────────
	useEffect(() => {
		const ownerId = user?.userId
		if (!isHydrated) return
		if (!ownerId) {
			setIsDraftHydrated(true)
			return
		}
		const key = `${ownerId}:${requestedSessionId ?? 'latest'}`
		let cancelled = false
		setIsDraftHydrated(false)
		setRecoveredDraftExists(false)

		const recoverDraft = async () => {
			try {
				const draft = await postDraftRepository.load(
					ownerId,
					requestedSessionId,
				)
				if (cancelled || !draft) return
				setContent(draft.content)
				setPhotos(draft.photos.map(createPhotoPreview))
				setDraftSessionId(draft.sessionId)
				setRecoveredDraftExists(true)
			} catch (error) {
				if (!cancelled) {
					logDevError('Failed to restore post draft:', error)
					toast.info(t('toastPhotosNotRestored'))
				}
			} finally {
				if (!cancelled) setIsDraftHydrated(true)
			}
		}

		void recoverDraft()
		return () => {
			cancelled = true
		}
	}, [isHydrated, requestedSessionId, t, user?.userId])

	const draftAutosave = usePostDraftAutosave({
		ownerId: user?.userId,
		sessionId,
		content,
		photos: photoFiles,
		enabled: isDraftHydrated,
		initiallyPersisted: recoveredDraftExists,
	})
	useBeforeUnloadWarning(
		draftAutosave.hasUnresolvedChanges && !isSubmitting,
		t('draftLeaveWarning'),
	)

	const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || [])
		if (files.length === 0) return

		const MAX_PHOTO_SIZE = 10 * 1024 * 1024 // 10MB
		const validFiles = files.filter(f => f.size <= MAX_PHOTO_SIZE)
		const selectedFiles = validFiles.slice(
			0,
			Math.max(0, MAX_POST_DRAFT_PHOTOS - photoFiles.length),
		)
		if (selectedFiles.length === 0) return

		const selectedPhotos = selectedFiles.map(createPhotoPreview)
		setPhotos(prev => [...prev, ...selectedPhotos])
	}

	const removePhoto = (photoId: number) => {
		previewUrlRegistry.current.release(photoId)
		setPhotos(prev => removeLocalImagePreview(prev, photoId))
	}

	const handleSubmit = async () => {
		if (isSubmitting) return

		if (!content.trim() && photoFiles.length === 0) {
			toast.error(t('toastAddContent'))
			return
		}
		if (exceedsPostDraftPhotoLimit(photoFiles.length)) {
			toast.error(t('photoLimit'))
			return
		}

		setIsSubmitting(true)

		// Require an explicit approval before publishing a cook post.
		if (content.trim()) {
			const guardResult = await guardContent(content.trim(), 'post').catch(
				() => null,
			)
			if (!guardResult?.success || guardResult.data?.action !== 'approve') {
				if (guardResult?.data?.action === 'block') {
					toast.error(t('contentGuardBlocked'), {
						description:
							guardResult.data.reasons?.[0] || t('contentGuardRevise'),
					})
				} else if (guardResult?.data?.action === 'flag') {
					toast.warning(t('contentGuardFlagged'))
				} else {
					toast.error(t('moderationVerifyFailedPost'))
				}
				setIsSubmitting(false)
				return
			}
		}

		try {
			const response = await createPost({
				avatarUrl: user?.avatarUrl || '',
				content: content.trim(),
				photoUrls: photoFiles,
				sessionId: session?.id, // Link to cooking session for XP
				...(session && {
					postType:
						reviewRating > 0
							? ('RECIPE_REVIEW' as const)
							: ('RECENT_COOK' as const),
					...(reviewRating > 0 && { reviewRating }),
				}),
			})

			if (response.success && response.data) {
				if (user?.userId) {
					await postDraftRepository
						.clear(user.userId, sessionId)
						.catch(error =>
							logDevError('Failed to clear published post draft:', error),
						)
				}
				const createdPost = response.data
				const postId = createdPost.id
				trackEvent('POST_CREATED', postId, 'post', {
					hasSession: !!session?.id,
				})

				// CRITICAL: Social module only stores the reference, XP is awarded
				// by culinary module via the link-post endpoint.
				// See PostService.java: "XP is awarded when FE calls
				// culinary module's POST /{sessionId}/link-post endpoint."
				let xpAwarded = 0
				let badgesEarned: string[] = []
				if (session?.id && postId) {
					const linkResponse = await claimPendingXp(session.id, postId)

					if (linkResponse?.success && linkResponse.data) {
						xpAwarded = linkResponse.data.xpAwarded ?? 0
						badgesEarned = linkResponse.data.badgesEarned ?? []

						// OPTIMISTIC UPDATE: Store the post with XP in sessionStorage
						// so dashboard can display it immediately without waiting for
						// the Kafka consumer to update the Post entity in social module.
						// This solves the "Two Truths" problem where FE has the XP but
						// the DB hasn't been updated yet by the async Kafka consumer.
						const postWithXp = {
							...createdPost,
							xpEarned: xpAwarded,
							badgesEarned: badgesEarned,
						}
						sessionStorage.setItem('newPost', JSON.stringify(postWithXp))
					} else {
						const pendingLink: PendingPostLink = {
							sessionId: session.id,
							postId,
							createdAt: new Date().toISOString(),
						}
						sessionStorage.setItem(
							PENDING_POST_LINK_KEY,
							JSON.stringify(pendingLink),
						)
						sessionStorage.setItem('newPost', JSON.stringify(createdPost))

						// Post succeeded but XP claim still needs recovery
						logDevError('Failed to claim XP:', linkResponse?.message)
						toast.warning(t('toastPostXpClaiming'), {
							description:
								linkResponse?.message ||
								'We will retry the XP award on the dashboard.',
						})
						router.push('/dashboard')
						return
					}
				} else {
					// No session - just store the post without XP
					sessionStorage.setItem('newPost', JSON.stringify(createdPost))
				}

				// Show celebration modal with XP breakdown
				if (xpAwarded > 0) {
					const level = user?.statistics?.currentLevel ?? 1
					const xpGoal = user?.statistics?.currentXPGoal ?? 1000
					const currentXp = user?.statistics?.currentXP ?? 0
					showPostSuccess({
						recipeName: session?.recipeTitle || 'Your creation',
						recipeImageUrl: session?.recipeImage || '',
						postId,
						// The link endpoint returns an authoritative total, not an attribution breakdown.
						xpRows: [],
						totalXp: xpAwarded,
						currentLevel: level,
						xpToNextLevel: xpGoal,
						levelProgressPercent: Math.round((currentXp / xpGoal) * 100),
						levelGainedPercent: Math.round((xpAwarded / xpGoal) * 100),
					})
				} else {
					toast.success(t('toastPostShared'))
					router.push('/dashboard')
				}
			} else {
				toast.error(t('toastPostFailed'))
				setIsSubmitting(false)
				return
			}
		} catch (error) {
			logDevError('Post creation error:', error)
			toast.error(t('toastPostFailed'))
			setIsSubmitting(false)
		}
		// NOTE: Do NOT reset isSubmitting on success — router.push() is async.
		// Re-enabling the button before navigation completes allows double-submit.
		// Component unmount on navigation handles cleanup.
	}

	const getTimeLeft = () => {
		if (!session?.postDeadline) return null
		const deadline = new Date(session.postDeadline)
		const now = new Date()
		const diff = deadline.getTime() - now.getTime()

		if (diff <= 0) return { text: t('deadlineExpired'), urgent: true }

		const days = Math.floor(diff / (1000 * 60 * 60 * 24))
		const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
		const urgent = days < 2
		const warning = days < 5

		if (days > 0)
			return { text: t('deadlineDaysHours', { days, hours }), urgent, warning }
		return { text: t('deadlineHours', { hours }), urgent: true, warning: true }
	}

	const hasPendingSessionXp = session
		? hasClaimablePostXp(session.pendingXp)
		: false

	// Guest guard — show skeleton while loading, hide on unauthenticated (redirect effect handles navigation)
	if (!isHydrated || isAuthLoading || !isDraftHydrated)
		return <CreatePostSkeleton />
	if (!isAuthenticated) return null

	return (
		<PageTransition>
			<PageContainer maxWidth='md'>
				<div className='py-6'>
					<PremiumSurface
						eyebrow={tc('eyebrows.postComposer')}
						chipText={
							session ? tc('eyebrows.sessionLinked') : tc('eyebrows.quickPost')
						}
						className='mb-6 p-3 md:p-4'
						tone='brand'
					>
						<div className='flex items-center gap-3'>
							<motion.button
								type='button'
								onClick={() => navigateBackOrFallback(router, PATHS.FEED)}
								whileTap={BUTTON_SUBTLE_TAP}
								className='flex size-10 items-center justify-center rounded-xl border border-border bg-bg-card text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary focus-visible:ring-2 focus-visible:ring-brand/50'
								aria-label={t('ariaGoBack')}
							>
								<ArrowLeft className='size-5' />
							</motion.button>
							<div className='flex-1'>
								<PageHeader
									icon={session ? ChefHat : PenSquare}
									title={session ? t('shareYourCreation') : t('createPost')}
									subtitle={
										session
											? t('subtitleSharePhotos')
											: t('subtitleShareCommunity')
									}
									gradient='pink'
									marginBottom='sm'
									className='mb-0'
								/>
							</div>
						</div>
					</PremiumSurface>

					{/* Session Info Card (if linking to session) */}
					{isLoadingSession && (
						<PremiumSurface
							className='mb-6 p-6 md:p-8'
							eyebrow={tc('eyebrows.sessionContext')}
						>
							<div className='flex items-center justify-center'>
								<Loader2 className='size-6 animate-spin text-brand' />
								<span className='ml-3 text-text-secondary'>
									{t('loadingSession')}
								</span>
							</div>
						</PremiumSurface>
					)}

					{session && !isLoadingSession && (
						<PremiumSurface
							eyebrow={tc('eyebrows.cookSession')}
							chipText={
								hasPendingSessionXp ? t('xpClaimAvailable') : t('noBonusXp')
							}
							tone='success'
							className='mb-6 p-0'
							eyebrowClassName='px-3 pt-3'
						>
							<motion.div
								variants={fadeInUp}
								initial='hidden'
								animate='visible'
								className='overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/5 to-transparent'
							>
								<div className='flex items-center gap-4 p-4'>
									{session.recipeImage && (
										<Image
											src={session.recipeImage}
											alt={session.recipeTitle}
											width={80}
											height={80}
											className='size-20 rounded-xl object-cover'
											onError={e => {
												;(e.target as HTMLImageElement).src =
													'/placeholder-recipe.svg'
											}}
										/>
									)}
									<div className='flex-1'>
										<div className='mb-1 flex items-center gap-2'>
											<ChefHat className='size-4 text-brand' />
											<span className='text-sm font-medium text-text-secondary'>
												{t('cookedLabel')}
											</span>
										</div>
										<h3 className='mb-2 text-lg font-bold text-text-primary'>
											{session.recipeTitle}
										</h3>
										<div className='flex flex-wrap items-center gap-3'>
											{hasPendingSessionXp ? (
												<span className='flex items-center gap-1.5 rounded-xl bg-success/10 px-2.5 py-1 text-sm font-bold text-success'>
													<Trophy className='size-3.5' />+
													{Math.round(session.pendingXp)} XP
												</span>
											) : (
												<span className='flex items-center gap-1.5 rounded-xl bg-warning/10 px-2.5 py-1 text-sm font-semibold text-warning'>
													<Sparkles className='size-3.5' />
													{t('sessionXpExhaustedBadge')}
												</span>
											)}
											{getTimeLeft() && (
												<span
													className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-sm font-semibold ${
														getTimeLeft()!.urgent
															? 'bg-error/10 text-error'
															: getTimeLeft()!.warning
																? 'bg-warning/10 text-warning'
																: 'text-text-secondary'
													}`}
												>
													<Clock className='size-3.5' />
													{getTimeLeft()!.text}
												</span>
											)}
										</div>
									</div>
								</div>
								<div className='border-t border-brand/10 bg-brand/5 px-4 py-2.5'>
									<p className='flex items-center gap-2 text-sm text-brand'>
										<Sparkles className='size-4' />
										{hasPendingSessionXp
											? t('addPhotosForXp')
											: t('sessionXpExhaustedHint')}
									</p>
								</div>
							</motion.div>
						</PremiumSurface>
					)}

					{/* Recipe Review — Rate this recipe (optional, only when linking a session) */}
					{session && !isLoadingSession && (
						<PremiumSurface
							eyebrow={tc('eyebrows.recipeReview')}
							chipText={
								reviewRating > 0 ? `${reviewRating}/5` : tc('eyebrows.optional')
							}
							tone='streak'
							className='mb-6 p-0'
							eyebrowClassName='px-3 pt-3'
						>
							<motion.div
								variants={fadeInUp}
								initial='hidden'
								animate='visible'
								transition={{ delay: 0.05 }}
								className='overflow-hidden rounded-2xl border border-warning/30 bg-gradient-to-br from-warning/5 to-transparent'
							>
								<div className='flex items-center gap-3 px-4 pt-4 pb-2'>
									<Star className='size-5 text-warning' />
									<div>
										<h4 className='text-sm font-bold text-text-primary'>
											{t('rateRecipe')}
										</h4>
										<p className='text-xs text-text-muted'>
											{t('rateRecipeSubtext', {
												recipeName: session.recipeTitle,
											})}
										</p>
									</div>
								</div>
								<div className='flex items-center gap-3 px-4 pb-4'>
									<StarRating
										value={reviewRating}
										onChange={setReviewRating}
										size='md'
									/>
									{reviewRating > 0 && (
										<motion.span
											initial={{ opacity: 0, x: -10 }}
											animate={{ opacity: 1, x: 0 }}
											className='text-sm font-medium text-warning'
										>
											{reviewRating === 5
												? t('ratingAmazing')
												: reviewRating === 4
													? t('ratingGreat')
													: reviewRating === 3
														? t('ratingGood')
														: reviewRating === 2
															? t('ratingOkay')
															: t('ratingPoor')}
										</motion.span>
									)}
								</div>
							</motion.div>
						</PremiumSurface>
					)}

					{/* Post Form */}
					<PremiumSurface
						eyebrow={tc('eyebrows.publishDraft')}
						className='p-0'
						eyebrowClassName='px-3 pt-3'
					>
						<motion.div
							variants={fadeInUp}
							initial='hidden'
							animate='visible'
							transition={{ delay: 0.1 }}
							className='overflow-hidden rounded-2xl border border-border-subtle bg-bg-card shadow-card'
						>
							{/* Author header */}
							<div className='flex flex-wrap items-center gap-3 border-b border-border-subtle p-4'>
								<Avatar className='size-12 ring-2 ring-brand/10'>
									<AvatarImage
										src={user?.avatarUrl}
										alt={user?.displayName || tc('user')}
									/>
									<AvatarFallback>
										{user?.displayName
											?.split(' ')
											.map(n => n[0])
											.join('')
											.toUpperCase()
											.slice(0, 2) || 'YO'}
									</AvatarFallback>
								</Avatar>
								<div className='min-w-0 flex-1'>
									<div className='font-semibold text-text-primary'>
										{user?.displayName || user?.username || tc('user')}
									</div>
									<div className='text-sm text-text-secondary'>
										{session
											? t('sharingRecipe', { title: session.recipeTitle })
											: t('shareYourCreationShort')}
									</div>
								</div>
								<DraftSaveIndicator
									state={draftAutosave.state}
									onRetry={() => void draftAutosave.retry()}
									labels={{
										unsaved: t('draftUnsaved'),
										saving: t('draftSaving'),
										saved: t('draftSaved'),
										error: t('draftSaveFailed'),
										retry: t('draftRetry'),
									}}
								/>
							</div>

							{/* Content textarea */}
							<div className='px-4 pb-4'>
								<textarea
									data-testid='post-composer-caption'
									value={content}
									onChange={e => setContent(e.target.value)}
									onKeyDown={e => {
										if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
											e.preventDefault()
											handleSubmit()
										}
									}}
									aria-label={t('postContentLabel')}
									maxLength={2000}
									placeholder={
										session
											? t('placeholderWithSession', {
													title: session.recipeTitle,
												})
											: t('placeholderGeneric')
									}
									className='min-h-textarea-sm w-full resize-none rounded-xl bg-transparent py-2 text-text-primary placeholder-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50'
									autoFocus
								/>
								<p
									aria-live='polite'
									aria-atomic='true'
									className={`mt-1 text-right text-xs ${content.length > 1600 ? (content.length >= 2000 ? 'text-error font-semibold' : 'text-warning') : 'text-text-muted'}`}
								>
									{content.length}/2000
								</p>

								{/* Photo Previews */}
								<AnimatePresence>
									{photos.length > 0 && (
										<motion.div
											initial={{ opacity: 0, height: 0 }}
											animate={{ opacity: 1, height: 'auto' }}
											exit={{ opacity: 0, height: 0 }}
											className='mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3'
										>
											{photos.map((photo, index) => (
												<motion.div
													key={photo.id}
													initial={{ opacity: 0, scale: 0.8 }}
													animate={{ opacity: 1, scale: 1 }}
													exit={{ opacity: 0, scale: 0.8 }}
													className='group relative aspect-square overflow-hidden rounded-xl'
												>
													{photo.previewUrl &&
														photo.previewStatus !== 'error' && (
															<Image
																src={photo.previewUrl}
																alt={`Preview ${index + 1}`}
																fill
																sizes='120px'
																className={cn(
																	'object-cover',
																	photo.previewStatus === 'loading' &&
																		'opacity-0',
																)}
																onLoad={() =>
																	setPhotos(prev =>
																		markLocalImagePreviewReady(prev, photo.id),
																	)
																}
																onError={() => {
																	previewUrlRegistry.current.release(photo.id)
																	setPhotos(prev =>
																		failLocalImagePreview(prev, photo.id),
																	)
																}}
															/>
														)}
													{photo.previewStatus !== 'ready' && (
														<div className='flex size-full items-center justify-center bg-bg-hover'>
															{photo.previewStatus === 'loading' ? (
																<Loader2
																	className='size-5 animate-spin text-text-muted'
																	aria-hidden='true'
																/>
															) : (
																<ImageOff
																	className='size-5 text-text-muted'
																	aria-hidden='true'
																/>
															)}
														</div>
													)}
													<motion.button
														type='button'
														onClick={() => removePhoto(photo.id)}
														className='absolute right-1 top-1 flex size-9 items-center justify-center rounded-full bg-black/60 text-white opacity-70 transition-opacity hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100'
														whileHover={ICON_BUTTON_HOVER}
														whileTap={ICON_BUTTON_TAP}
														aria-label={`Remove photo ${index + 1}`}
													>
														<X className='size-4' />
													</motion.button>
												</motion.div>
											))}
										</motion.div>
									)}
								</AnimatePresence>
								{exceedsPostDraftPhotoLimit(photoFiles.length) && (
									<p role='alert' className='mt-2 text-sm text-danger'>
										{t('photoLimit')}
									</p>
								)}
							</div>

							{/* Footer actions */}
							<div className='flex items-center justify-between border-t border-border-subtle bg-bg-hover p-3'>
								<label
									className={cn(
										'flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-card hover:text-brand',
										photoFiles.length >= MAX_POST_DRAFT_PHOTOS &&
											'cursor-not-allowed opacity-50',
									)}
								>
									<Camera className='size-5' />
									{t('addPhotosCount', { count: photoFiles.length })}
									<input
										data-testid='post-composer-upload'
										type='file'
										accept='image/*'
										multiple
										onChange={handlePhotoSelect}
										aria-label={t('addPhotosCount', {
											count: photoFiles.length,
										})}
										className='hidden'
										disabled={photoFiles.length >= MAX_POST_DRAFT_PHOTOS}
									/>
								</label>

								<AnimatedButton
									data-testid='post-composer-submit'
									onClick={handleSubmit}
									disabled={
										isSubmitting ||
										exceedsPostDraftPhotoLimit(photoFiles.length) ||
										(!content.trim() && photoFiles.length === 0)
									}
									className={cn(
										'flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold',
										session
											? 'bg-brand text-white shadow-warm transition-all hover:bg-brand/90 hover:shadow-glow'
											: 'bg-brand text-white',
									)}
								>
									{isSubmitting ? (
										<>
											<Loader2 className='size-4 animate-spin' />
											{t('posting')}
										</>
									) : (
										<>
											<Send className='size-4' />
											{session
												? hasPendingSessionXp
													? t('postAndClaimXp', {
															xp: Math.round(session.pendingXp),
														})
													: t('postButton')
												: t('postButton')}
											<kbd className='ml-1 hidden rounded bg-white/20 px-1.5 py-0.5 text-xs font-normal md:inline'>
												{submitShortcut}
											</kbd>
										</>
									)}
								</AnimatedButton>
							</div>
						</motion.div>
					</PremiumSurface>

					{/* XP Info (if session) */}
					{session && (
						<motion.p
							variants={fadeInUp}
							initial='hidden'
							animate='visible'
							transition={{ delay: 0.2 }}
							className='mt-4 text-center text-sm text-text-secondary'
						>
							💡{' '}
							{hasPendingSessionXp ? t('xpPhotoHint') : t('xpPhotoHintNoBonus')}
						</motion.p>
					)}
				</div>

				<div className='pb-[calc(var(--h-mobile-nav)+var(--space-16))] md:pb-8' />
			</PageContainer>
		</PageTransition>
	)
}

function DraftSaveIndicator({
	state,
	onRetry,
	labels,
}: {
	state: PostDraftSaveState
	onRetry: () => void
	labels: Record<'unsaved' | 'saving' | 'saved' | 'error' | 'retry', string>
}) {
	if (state === 'idle') return null

	if (state === 'error') {
		return (
			<button
				type='button'
				onClick={onRetry}
				className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-3 text-sm font-semibold text-error transition-colors hover:bg-error/15 focus-visible:ring-2 focus-visible:ring-error/50'
				aria-label={`${labels.error}. ${labels.retry}`}
				data-testid='post-draft-status'
			>
				<CloudOff className='size-4' aria-hidden='true' />
				<span>{labels.error}</span>
				<RefreshCw className='size-3.5' aria-hidden='true' />
			</button>
		)
	}

	return (
		<div
			className={cn(
				'inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium',
				state === 'saved'
					? 'border-success/25 bg-success/10 text-success'
					: 'border-border bg-bg-elevated text-text-secondary',
			)}
			role='status'
			aria-live='polite'
			data-testid='post-draft-status'
		>
			{state === 'saving' ? (
				<Loader2 className='size-4 animate-spin' aria-hidden='true' />
			) : state === 'saved' ? (
				<Check className='size-4' aria-hidden='true' />
			) : (
				<Clock className='size-4' aria-hidden='true' />
			)}
			<span>
				{state === 'saving'
					? labels.saving
					: state === 'saved'
						? labels.saved
						: labels.unsaved}
			</span>
		</div>
	)
}

function CreatePostSkeleton() {
	return (
		<PageContainer maxWidth='md'>
			<div className='space-y-6'>
				{/* Header */}
				<div className='flex items-center gap-3'>
					<Skeleton className='size-10 rounded-full' />
					<div className='space-y-1'>
						<Skeleton className='h-6 w-40' />
						<Skeleton className='h-4 w-56' />
					</div>
				</div>
				{/* Photo upload area */}
				<Skeleton className='h-48 w-full rounded-2xl' />
				{/* Caption area */}
				<Skeleton className='h-24 w-full rounded-2xl' />
				{/* Submit button */}
				<Skeleton className='h-12 w-full rounded-xl' />
			</div>
		</PageContainer>
	)
}

export default function CreatePostPage() {
	return (
		<Suspense fallback={<CreatePostSkeleton />}>
			<CreatePostContent />
		</Suspense>
	)
}
