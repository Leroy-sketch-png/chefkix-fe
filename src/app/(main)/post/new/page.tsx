'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
	ArrowLeft,
	Camera,
	ChefHat,
	Clock,
	Loader2,
	Sparkles,
	Trophy,
	X,
	Send,
	PenSquare,
	Star,
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
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	fadeInUp,
	BUTTON_SUBTLE_TAP,
} from '@/lib/motion'
import { logDevError } from '@/lib/dev-log'

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
	const searchParams = useSearchParams()
	const sessionId = searchParams.get('session')

	const { user } = useAuth()
	const [session, setSession] = useState<SessionInfo | null>(null)
	const [isLoadingSession, setIsLoadingSession] = useState(!!sessionId)

	const [content, setContent] = useState('')
	const [photoFiles, setPhotoFiles] = useState<File[]>([])
	const [previewUrls, setPreviewUrls] = useState<string[]>([])
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [reviewRating, setReviewRating] = useState<number>(0)

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

	// Load pending photos from sessionStorage (passed from completion modal)
	useEffect(() => {
		const pendingPhotosJson = sessionStorage.getItem('pendingPostPhotos')
		if (!pendingPhotosJson) return

		try {
			const photoData = JSON.parse(pendingPhotosJson) as Array<{
				name: string
				type: string
				data: string
			}>

			// Convert base64 back to File objects
			const files: File[] = []
			const urls: string[] = []

			photoData.forEach(photo => {
				// Extract base64 data and convert to blob
				const byteString = atob(photo.data.split(',')[1])
				const mimeString = photo.data.split(',')[0].split(':')[1].split(';')[0]
				const ab = new ArrayBuffer(byteString.length)
				const ia = new Uint8Array(ab)
				for (let i = 0; i < byteString.length; i++) {
					ia[i] = byteString.charCodeAt(i)
				}
				const blob = new Blob([ab], { type: mimeString })
				const file = new File([blob], photo.name, { type: photo.type })
				files.push(file)
				urls.push(photo.data)
			})

			setPhotoFiles(files)
			setPreviewUrls(urls)

			// Clear from sessionStorage
			sessionStorage.removeItem('pendingPostPhotos')
		} catch (error) {
			logDevError('Failed to load pending photos:', error)
			sessionStorage.removeItem('pendingPostPhotos')
			toast.info('Photos could not be restored. Please re-upload them.')
		}
	}, [])

	// Load session info if sessionId is provided
	useEffect(() => {
		if (!sessionId) return
		let cancelled = false

		const loadSession = async () => {
			try {
				const response = await getSessionById(sessionId)
				if (cancelled) return
				if (response.success && response.data) {
					const s = response.data

					// Guard: Check if session was already linked to a post
					// posted status means XP was already awarded, no point showing it again
					if (s.status === 'posted') {
						toast.error('This session was already linked to a post', {
							description: 'The XP has already been awarded.',
						})
						setIsLoadingSession(false)
						return // Don't set session - user can still make a regular post
					}

					// Guard: Check if session is not in completed status
					// Only completed sessions should be linked to posts
					if (s.status !== 'completed') {
						toast.error('Session cannot be linked', {
							description:
								'Only completed cooking sessions can earn XP from posts.',
						})
						setIsLoadingSession(false)
						return
					}

					setSession({
						id: s.sessionId,
						recipeId: s.recipeId ?? s.recipe?.id ?? '',
						recipeTitle: s.recipe?.title ?? 'Your Recipe',
						recipeImage: s.recipe?.coverImageUrl?.[0],
						pendingXp: s.pendingXp ?? 0,
						completedAt: s.completedAt ?? '',
						postDeadline: s.postDeadline ?? '',
					})
				} else {
					toast.error('Session not found')
				}
			} catch (error) {
				if (cancelled) return
				logDevError('Failed to load session:', error)
				toast.error('Failed to load session data')
			} finally {
				if (!cancelled) setIsLoadingSession(false)
			}
		}

		loadSession()
		return () => {
			cancelled = true
		}
	}, [sessionId])

	const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || [])
		if (files.length === 0) return

		const selectedFiles = files.slice(0, 5 - photoFiles.length)
		setPhotoFiles(prev => [...prev, ...selectedFiles])

		selectedFiles.forEach(file => {
			const reader = new FileReader()
			reader.onloadend = () => {
				setPreviewUrls(prev => [...prev, reader.result as string])
			}
			reader.readAsDataURL(file)
		})
	}

	const removePhoto = (index: number) => {
		setPhotoFiles(prev => prev.filter((_, i) => i !== index))
		setPreviewUrls(prev => prev.filter((_, i) => i !== index))
	}

	const handleSubmit = async () => {
		if (isSubmitting) return

		if (!content.trim() && photoFiles.length === 0) {
			toast.error('Add some content or photos to share!')
			return
		}

		setIsSubmitting(true)

		// Content safety check — non-blocking if AI is down, but blocks harmful content
		if (content.trim()) {
			const guardResult = await guardContent(content.trim(), 'post')
			if (guardResult.success && guardResult.data) {
				if (guardResult.data.action === 'block') {
					toast.error(
						'Your post contains content that violates community guidelines.',
						{
							description:
								guardResult.data.reasons?.[0] || 'Please revise and try again.',
						},
					)
					setIsSubmitting(false)
					return
				}
				if (guardResult.data.action === 'flag') {
					toast.warning(
						'Your post has been flagged for review and may be moderated.',
					)
				}
			}
			// If guardContent fails (AI down), proceed — don't block posting
		}

		try {
			const response = await createPost({
				avatarUrl: user?.avatarUrl || '',
				content: content.trim(),
				photoUrls: photoFiles,
				sessionId: session?.id, // Link to cooking session for XP
				...(session && reviewRating > 0 && {
					postType: 'RECIPE_REVIEW' as const,
					reviewRating,
				}),
			})

			if (response.success && response.data) {
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
						toast.warning('Post shared. Cooking XP is still being claimed.', {
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

				// Show success with XP if earned
				if (xpAwarded > 0) {
					toast.success(`Post shared! +${xpAwarded} XP unlocked! 🎉`, {
						description: session?.recipeTitle
							? `Your ${session.recipeTitle} post is now live`
							: undefined,
					})
				} else {
					toast.success('Post shared! 🎉')
				}

				router.push('/dashboard')
			} else {
				toast.error(response.message || 'Failed to create post')
				setIsSubmitting(false)
				return
			}
		} catch (error) {
			logDevError('Post creation error:', error)
			toast.error('Something went wrong. Please try again.')
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

		if (diff <= 0) return 'Expired'

		const days = Math.floor(diff / (1000 * 60 * 60 * 24))
		const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

		if (days > 0) return `${days}d ${hours}h left`
		return `${hours}h left`
	}

	return (
		<PageTransition>
			<PageContainer maxWidth='md'>
				<div className='py-6'>
					{/* Header with PageHeader */}
					<div className='mb-6 flex items-center gap-3'>
						<motion.button
							onClick={() => router.back()}
							whileTap={BUTTON_SUBTLE_TAP}
							className='flex size-10 items-center justify-center rounded-xl border border-border bg-bg-card text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text'
							aria-label='Go back'
						>
							<ArrowLeft className='size-5' />
						</motion.button>
						<div className='flex-1'>
							<PageHeader
								icon={session ? ChefHat : PenSquare}
								title={session ? 'Share Your Creation' : 'Create Post'}
								subtitle={
									session
										? 'Post your cooking photos to unlock XP'
										: 'Share what you made with the community'
								}
								gradient='orange'
								marginBottom='sm'
								className='mb-0'
							/>
						</div>
					</div>

					{/* Session Info Card (if linking to session) */}
					{isLoadingSession && (
						<div className='mb-6 flex items-center justify-center rounded-2xl border border-border-subtle bg-bg-card p-8'>
							<Loader2 className='size-6 animate-spin text-primary' />
							<span className='ml-3 text-text-secondary'>
								Loading session...
							</span>
						</div>
					)}

					{session && !isLoadingSession && (
						<motion.div
							variants={fadeInUp}
							initial='hidden'
							animate='visible'
							className='mb-6 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent'
						>
							<div className='flex items-center gap-4 p-4'>
								{session.recipeImage && (
									<Image
										src={session.recipeImage}
										alt={session.recipeTitle}
										width={80}
										height={80}
										className='size-20 rounded-xl object-cover'
									/>
								)}
								<div className='flex-1'>
									<div className='mb-1 flex items-center gap-2'>
										<ChefHat className='size-4 text-primary' />
										<span className='text-sm font-medium text-text-secondary'>
											Cooked
										</span>
									</div>
									<h3 className='mb-2 text-lg font-bold text-text'>
										{session.recipeTitle}
									</h3>
									<div className='flex flex-wrap items-center gap-3'>
										<span className='flex items-center gap-1.5 rounded-lg bg-success/10 px-2.5 py-1 text-sm font-bold text-success'>
											<Trophy className='size-3.5' />+
											{Math.round(session.pendingXp)} XP
										</span>
										{getTimeLeft() && (
											<span className='flex items-center gap-1.5 text-sm text-text-secondary'>
												<Clock className='size-3.5' />
												{getTimeLeft()}
											</span>
										)}
									</div>
								</div>
							</div>
							<div className='border-t border-primary/10 bg-primary/5 px-4 py-2.5'>
								<p className='flex items-center gap-2 text-sm text-primary'>
									<Sparkles className='size-4' />
									Add photos of your creation to unlock the XP bonus!
								</p>
							</div>
						</motion.div>
					)}

					{/* Recipe Review — Rate this recipe (optional, only when linking a session) */}
					{session && !isLoadingSession && (
						<motion.div
							variants={fadeInUp}
							initial='hidden'
							animate='visible'
							transition={{ delay: 0.05 }}
							className='mb-6 overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent'
						>
							<div className='flex items-center gap-3 px-4 pt-4 pb-2'>
								<Star className='size-5 text-amber-500' />
								<div>
									<h4 className='text-sm font-bold text-text'>Rate this Recipe</h4>
									<p className='text-xs text-text-muted'>
										How was {session.recipeTitle}? Your review helps other cooks.
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
										className='text-sm font-medium text-amber-600'
									>
										{reviewRating === 5 ? 'Amazing!' : reviewRating === 4 ? 'Great!' : reviewRating === 3 ? 'Good' : reviewRating === 2 ? 'Okay' : 'Poor'}
									</motion.span>
								)}
							</div>
						</motion.div>
					)}

					{/* Post Form */}
					<motion.div
						variants={fadeInUp}
						initial='hidden'
						animate='visible'
						transition={{ delay: 0.1 }}
						className='overflow-hidden rounded-2xl border border-border-subtle bg-bg-card shadow-card'
					>
						{/* Author header */}
						<div className='flex items-center gap-3 border-b border-border-subtle p-4'>
							<Avatar className='size-12 ring-2 ring-primary/10'>
								<AvatarImage
									src={user?.avatarUrl}
									alt={user?.displayName || 'You'}
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
							<div>
								<div className='font-semibold text-text'>
									{user?.displayName || user?.username || 'You'}
								</div>
								<div className='text-sm text-text-secondary'>
									{session
										? `Sharing: ${session.recipeTitle}`
										: 'Share your creation'}
								</div>
							</div>
						</div>

						{/* Content textarea */}
						<div className='px-4 pb-4'>
							<textarea
								value={content}
								onChange={e => setContent(e.target.value)}
								onKeyDown={e => {
									if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
										e.preventDefault()
										handleSubmit()
									}
								}}
								maxLength={2000}
								placeholder={
									session
										? `Tell everyone about your ${session.recipeTitle}! How did it turn out?`
										: "What's cooking? Share your culinary journey..."
								}
								className='min-h-textarea-sm w-full resize-none rounded-lg bg-transparent py-2 text-text placeholder-text-muted focus:outline-none'
								autoFocus
							/>
							<p className='mt-1 text-right text-xs text-text-muted'>
								{content.length}/2000
							</p>

							{/* Photo Previews */}
							<AnimatePresence>
								{previewUrls.length > 0 && (
									<motion.div
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: 'auto' }}
										exit={{ opacity: 0, height: 0 }}
										className='mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3'
									>
										{previewUrls.map((url, index) => (
											<motion.div
												key={url}
												initial={{ opacity: 0, scale: 0.8 }}
												animate={{ opacity: 1, scale: 1 }}
												exit={{ opacity: 0, scale: 0.8 }}
												className='group relative aspect-square overflow-hidden rounded-xl'
											>
												<Image
													src={url}
													alt={`Preview ${index + 1}`}
													fill
													className='object-cover'
												/>
												<motion.button
													onClick={() => removePhoto(index)}
													className='absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100'
													whileHover={{ scale: 1.1 }}
													whileTap={{ scale: 0.9 }}
													aria-label={`Remove photo ${index + 1}`}
												>
													<X className='size-4' />
												</motion.button>
											</motion.div>
										))}
									</motion.div>
								)}
							</AnimatePresence>
						</div>

						{/* Footer actions */}
						<div className='flex items-center justify-between border-t border-border-subtle bg-bg-hover p-3'>
							<label
								className={cn(
									'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-card hover:text-primary',
									photoFiles.length >= 5 && 'cursor-not-allowed opacity-50',
								)}
							>
								<Camera className='size-5' />
								Add Photos ({photoFiles.length}/5)
								<input
									type='file'
									accept='image/*'
									multiple
									onChange={handlePhotoSelect}
									className='hidden'
									disabled={photoFiles.length >= 5}
								/>
							</label>

							<AnimatedButton
								onClick={handleSubmit}
								disabled={
									isSubmitting || (!content.trim() && photoFiles.length === 0)
								}
								className={cn(
									'flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold',
									session
										? 'bg-gradient-hero text-white shadow-lg shadow-primary/30'
										: 'bg-primary text-white',
								)}
							>
								{isSubmitting ? (
									<>
										<Loader2 className='size-4 animate-spin' />
										Posting...
									</>
								) : (
									<>
										<Send className='size-4' />
										{session
											? `Post & Claim ${Math.round(session.pendingXp)} XP`
											: 'Post'}
										<kbd
											className='ml-1 hidden rounded bg-white/20 px-1.5 py-0.5 text-xs font-normal md:inline'
											suppressHydrationWarning
										>
											{typeof window !== 'undefined' &&
											navigator.platform?.includes('Mac')
												? '⌘↵'
												: 'Ctrl+↵'}
										</kbd>
									</>
								)}
							</AnimatedButton>
						</div>
					</motion.div>

					{/* XP Info (if session) */}
					{session && (
						<motion.p
							variants={fadeInUp}
							initial='hidden'
							animate='visible'
							transition={{ delay: 0.2 }}
							className='mt-4 text-center text-sm text-text-secondary'
						>
							💡 Photos count! 2+ photos = 100% XP. 1 photo = 50% XP.
						</motion.p>
					)}
				</div>
			</PageContainer>
		</PageTransition>
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
