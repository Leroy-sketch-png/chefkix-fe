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
	Image as ImageIcon,
	Loader2,
	Sparkles,
	Trophy,
	X,
	Send,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AnimatedButton } from '@/components/ui/animated-button'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { createPost } from '@/services/post'
import { getSessionById } from '@/services/cookingSession'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	fadeInUp,
	BUTTON_HOVER,
	BUTTON_TAP,
	ICON_BUTTON_HOVER,
	ICON_BUTTON_TAP,
} from '@/lib/motion'

interface SessionInfo {
	id: string
	recipeId: string
	recipeTitle: string
	recipeImage?: string
	pendingXp: number
	completedAt: string
	postDeadline: string
}

function CreatePostContent() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const sessionId = searchParams.get('session')

	const { user } = useAuthStore()
	const [session, setSession] = useState<SessionInfo | null>(null)
	const [isLoadingSession, setIsLoadingSession] = useState(!!sessionId)

	const [content, setContent] = useState('')
	const [photoFiles, setPhotoFiles] = useState<File[]>([])
	const [previewUrls, setPreviewUrls] = useState<string[]>([])
	const [isSubmitting, setIsSubmitting] = useState(false)

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
			console.error('Failed to load pending photos:', error)
			sessionStorage.removeItem('pendingPostPhotos')
		}
	}, [])

	// Load session info if sessionId is provided
	useEffect(() => {
		if (!sessionId) return

		const loadSession = async () => {
			try {
				const response = await getSessionById(sessionId)
				if (response.success && response.data) {
					const s = response.data
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
				console.error('Failed to load session:', error)
				toast.error('Failed to load session data')
			} finally {
				setIsLoadingSession(false)
			}
		}

		loadSession()
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
		if (!content.trim() && photoFiles.length === 0) {
			toast.error('Add some content or photos to share!')
			return
		}

		setIsSubmitting(true)

		try {
			const response = await createPost({
				avatarUrl: user?.avatarUrl || '',
				content: content.trim(),
				photoUrls: photoFiles,
				sessionId: session?.id, // Link to cooking session for XP
			})

			if (response.success && response.data) {
				// Check if we got XP from session linking
				const data = response.data
				if ('xpAwarded' in data && data.xpAwarded > 0) {
					toast.success(`Post shared! +${data.xpAwarded} XP unlocked! 🎉`, {
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
			}
		} catch (error) {
			console.error('Post creation error:', error)
			toast.error('Something went wrong. Please try again.')
		} finally {
			setIsSubmitting(false)
		}
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
					{/* Header */}
					<div className='mb-6 flex items-center gap-4'>
						<motion.button
							onClick={() => router.back()}
							className='flex size-10 items-center justify-center rounded-xl bg-bg-hover text-text-secondary transition-colors hover:bg-bg-card hover:text-text'
							whileHover={ICON_BUTTON_HOVER}
							whileTap={ICON_BUTTON_TAP}
						>
							<ArrowLeft className='size-5' />
						</motion.button>
						<div>
							<h1 className='text-2xl font-bold text-text'>
								{session ? 'Share Your Creation' : 'Create Post'}
							</h1>
							<p className='text-sm text-text-secondary'>
								{session
									? 'Post your cooking photos to unlock XP'
									: 'Share what you made with the community'}
							</p>
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
											<Trophy className='size-3.5' />+{session.pendingXp} XP
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
						<div className='p-4'>
							<textarea
								value={content}
								onChange={e => setContent(e.target.value)}
								placeholder={
									session
										? `Tell everyone about your ${session.recipeTitle}! How did it turn out?`
										: "What's cooking? Share your culinary journey..."
								}
								className='min-h-textarea-sm w-full resize-none rounded-lg bg-transparent p-0 text-text placeholder-text-muted focus:outline-none'
								autoFocus
							/>

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
												key={index}
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
										{session ? `Post & Claim ${session.pendingXp} XP` : 'Post'}
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

export default function CreatePostPage() {
	return (
		<Suspense
			fallback={
				<PageContainer maxWidth='md'>
					<div className='flex min-h-panel-md items-center justify-center'>
						<Loader2 className='size-8 animate-spin text-primary' />
					</div>
				</PageContainer>
			}
		>
			<CreatePostContent />
		</Suspense>
	)
}
