'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import {
	Camera,
	X,
	Send,
	Image as ImageIcon,
	Loader2,
	BarChart3,
} from 'lucide-react'
import Image from 'next/image'
import { createPost } from '@/services/post'
import { moderateContent } from '@/services/ai'
import { Post } from '@/lib/types'
import { Portal } from '@/components/ui/portal'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import {
	TRANSITION_SPRING,
	BUTTON_SUBTLE_HOVER,
	BUTTON_SUBTLE_TAP,
} from '@/lib/motion'
import { cn } from '@/lib/utils'
import { MentionInput } from '@/components/shared/MentionInput'

interface QuickPostFABProps {
	onPostCreated?: (post: Post) => void
	className?: string
}

export const QuickPostFAB = ({
	onPostCreated,
	className,
}: QuickPostFABProps) => {
	const [isOpen, setIsOpen] = useState(false)
	const [mode, setMode] = useState<'post' | 'poll'>('post')
	const [caption, setCaption] = useState('')
	const [taggedUserIds, setTaggedUserIds] = useState<string[]>([])
	const [photoFiles, setPhotoFiles] = useState<File[]>([])
	const [previewUrls, setPreviewUrls] = useState<string[]>([])
	const [isSubmitting, setIsSubmitting] = useState(false)

	useEscapeKey(isOpen && !isSubmitting, () => setIsOpen(false))

	// Poll state
	const [pollQuestion, setPollQuestion] = useState('')
	const [pollOptionA, setPollOptionA] = useState('')
	const [pollOptionB, setPollOptionB] = useState('')
	const fileInputRef = useRef<HTMLInputElement>(null)
	const { user } = useAuthStore()

	const MAX_PHOTOS = 5
	const MAX_PHOTO_SIZE = 10 * 1024 * 1024

	const handleOpen = () => {
		setIsOpen(true)
		if (mode === 'post') {
			setTimeout(() => fileInputRef.current?.click(), 100)
		}
	}

	const handleClose = () => {
		if (isSubmitting) return
		setIsOpen(false)
		setMode('post')
		setCaption('')
		setTaggedUserIds([])
		setPhotoFiles([])
		setPreviewUrls([])
		setPollQuestion('')
		setPollOptionA('')
		setPollOptionB('')
	}

	const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || [])
		if (files.length === 0) return

		const invalidFile = files.find(
			file => !file.type.startsWith('image/') || file.size > MAX_PHOTO_SIZE,
		)
		if (invalidFile) {
			toast.error(
				!invalidFile.type.startsWith('image/')
					? 'Only image files allowed'
					: 'Each photo must be under 10MB',
			)
			e.currentTarget.value = ''
			return
		}

		const remainingSlots = MAX_PHOTOS - photoFiles.length
		const selectedFiles = files.slice(0, remainingSlots)
		if (selectedFiles.length < files.length) {
			toast.warning(`Only ${remainingSlots} more photos allowed`)
		}

		setPhotoFiles(prev => [...prev, ...selectedFiles])
		selectedFiles.forEach(file => {
			const reader = new FileReader()
			reader.onloadend = () => {
				setPreviewUrls(prev => [...prev, reader.result as string])
			}
			reader.readAsDataURL(file)
		})
		e.currentTarget.value = ''
	}

	const removePhoto = (index: number) => {
		setPhotoFiles(prev => prev.filter((_, i) => i !== index))
		setPreviewUrls(prev => prev.filter((_, i) => i !== index))
	}

	const handleSubmit = async () => {
		if (isSubmitting) return

		if (mode === 'poll') {
			if (!pollQuestion.trim() || !pollOptionA.trim() || !pollOptionB.trim()) {
				toast.error('Fill in the question and both options!')
				return
			}

			setIsSubmitting(true)
			try {
				const moderationResult = await moderateContent(
					pollQuestion.trim(),
					'post_caption',
				)
				if (!moderationResult.success) {
					toast.error('Unable to verify content. Please try again.')
					return
				}
				if (moderationResult.data?.action === 'block') {
					toast.error(
						moderationResult.data.reason ||
							'Content violates community guidelines.',
					)
					return
				}

				const response = await createPost({
					avatarUrl: user?.avatarUrl || '/placeholder-avatar.svg',
					content: pollQuestion.trim(),
					postType: 'POLL',
					pollQuestion: pollQuestion.trim(),
					pollOptionA: pollOptionA.trim(),
					pollOptionB: pollOptionB.trim(),
				})

				if (response.success && response.data) {
					toast.success('Poll created!')
					onPostCreated?.(response.data as Post)
					handleClose()
					return
				}
				toast.error(response.message || 'Failed to create poll')
			} catch {
				toast.error('Something went wrong. Please try again.')
			} finally {
				setIsSubmitting(false)
			}
			return
		}

		if (!caption.trim() && photoFiles.length === 0) {
			toast.error('Add a photo or write something!')
			return
		}
		if (!caption.trim()) {
			toast.error('Add a quick caption!')
			return
		}

		setIsSubmitting(true)
		try {
			// AI content moderation (fail-closed)
			const moderationResult = await moderateContent(
				caption.trim(),
				'post_caption',
			)
			if (!moderationResult.success) {
				toast.error('Unable to verify content. Please try again.')
				return
			}
			if (moderationResult.data?.action === 'block') {
				toast.error(
					moderationResult.data.reason ||
						'Content violates community guidelines.',
				)
				return
			}
			if (moderationResult.data?.action === 'flag') {
				toast.warning(
					moderationResult.data.reason ||
						'Content may be reviewed by moderation.',
				)
			}

			const response = await createPost({
				avatarUrl: user?.avatarUrl || '/placeholder-avatar.svg',
				content: caption.trim(),
				photoUrls: photoFiles.length > 0 ? photoFiles : undefined,
				postType: 'QUICK',
				taggedUserIds: taggedUserIds.length > 0 ? taggedUserIds : undefined,
			})

			if (response.success && response.data) {
				toast.success('Quick post shared!')
				onPostCreated?.(response.data as Post)
				handleClose()
				return
			}
			toast.error(response.message || 'Failed to post')
		} catch {
			toast.error('Something went wrong. Please try again.')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<>
			{/* FAB Button */}
			<motion.button
				onClick={handleOpen}
				className={cn(
					'fixed bottom-6 right-6 z-sticky flex size-14 items-center justify-center rounded-full bg-gradient-brand transition-all duration-300 hover:opacity-90',
					className,
				)}
				whileHover={BUTTON_SUBTLE_HOVER}
				whileTap={BUTTON_SUBTLE_TAP}
				transition={TRANSITION_SPRING}
				aria-label='Quick Post'
			>
				<Camera className='size-6 text-white' />
			</motion.button>

			{/* Quick Post Modal */}
			<AnimatePresence>
				{isOpen && (
					<Portal>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='fixed inset-0 z-modal flex items-end justify-center bg-black/60 sm:items-center'
							onClick={handleClose}
						>
							<motion.div
								initial={{ opacity: 0, y: 100 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 100 }}
								transition={TRANSITION_SPRING}
								className='w-full max-w-lg rounded-t-2xl border border-border-subtle bg-bg-card p-5 shadow-card sm:rounded-2xl'
								onClick={e => e.stopPropagation()}
							>
								{/* Header */}
								<div className='mb-4 flex items-center justify-between'>
									<h2 className='flex items-center gap-2 text-lg font-bold text-text'>
										{mode === 'post' ? (
											<Camera className='size-5 text-brand' />
										) : (
											<BarChart3 className='size-5 text-brand' />
										)}
										{mode === 'post' ? 'Quick Post' : 'Create Poll'}
									</h2>
									<button
										onClick={handleClose}
										disabled={isSubmitting}
										className='grid size-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-bg-elevated hover:text-text'
									>
										<X className='size-5' />
									</button>
								</div>

								{/* Mode Toggle */}
								<div className='mb-4 flex gap-1 rounded-xl bg-bg-elevated p-1'>
									<button
										onClick={() => setMode('post')}
										className={cn(
											'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all',
											mode === 'post'
												? 'bg-bg-card text-text shadow-card'
												: 'text-text-muted hover:text-text',
										)}
									>
										<Camera className='size-4' />
										Post
									</button>
									<button
										onClick={() => setMode('poll')}
										className={cn(
											'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all',
											mode === 'poll'
												? 'bg-bg-card text-text shadow-card'
												: 'text-text-muted hover:text-text',
										)}
									>
										<BarChart3 className='size-4' />
										Poll
									</button>
								</div>

								{mode === 'poll' ? (
									<>
										{/* Poll Question */}
										<div className='mb-3'>
											<input
												type='text'
												value={pollQuestion}
												onChange={e => setPollQuestion(e.target.value)}
												placeholder='Ask a food question...'
												maxLength={200}
												disabled={isSubmitting}
												className='w-full rounded-xl border border-border-subtle bg-bg-elevated p-3 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none'
											/>
										</div>

										{/* Poll Options */}
										<div className='mb-4 space-y-2'>
											<div className='flex items-center gap-2'>
												<span className='flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand'>
													A
												</span>
												<input
													type='text'
													value={pollOptionA}
													onChange={e => setPollOptionA(e.target.value)}
													placeholder='Option A'
													maxLength={100}
													disabled={isSubmitting}
													className='w-full rounded-xl border border-border-subtle bg-bg-elevated p-3 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none'
												/>
											</div>
											<div className='flex items-center gap-2'>
												<span className='flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary'>
													B
												</span>
												<input
													type='text'
													value={pollOptionB}
													onChange={e => setPollOptionB(e.target.value)}
													placeholder='Option B'
													maxLength={100}
													disabled={isSubmitting}
													className='w-full rounded-xl border border-border-subtle bg-bg-elevated p-3 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none'
												/>
											</div>
										</div>
									</>
								) : (
									<>
										{/* Photo Grid */}
										<div className='mb-4'>
											{previewUrls.length > 0 ? (
												<div className='grid grid-cols-3 gap-2'>
													{previewUrls.map((url, index) => (
														<div
															key={index}
															className='group relative aspect-square overflow-hidden rounded-xl'
														>
															<Image
																src={url}
																alt={`Photo ${index + 1}`}
																fill
																className='object-cover'
															/>
															<button
																type='button'
																onClick={() => removePhoto(index)}
																className='absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100'
															>
																<X className='size-3.5' />
															</button>
														</div>
													))}
													{photoFiles.length < MAX_PHOTOS && (
														<label className='flex aspect-square cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border-subtle transition-colors hover:border-brand/50 hover:bg-brand/5'>
															<ImageIcon className='size-6 text-text-muted' />
															<input
																type='file'
																accept='image/*'
																multiple
																onChange={handlePhotoSelect}
																className='hidden'
															/>
														</label>
													)}
												</div>
											) : (
												<label className='flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-subtle transition-colors hover:border-brand/50 hover:bg-brand/5'>
													<Camera className='size-8 text-text-muted' />
													<span className='text-sm text-text-muted'>
														Tap to add photos
													</span>
													<input
														ref={fileInputRef}
														type='file'
														accept='image/*'
														multiple
														onChange={handlePhotoSelect}
														className='hidden'
													/>
												</label>
											)}
										</div>

										{/* Caption with @mention support */}
										<div className='mb-4'>
											<MentionInput
												value={caption}
												onChange={setCaption}
												onTaggedUsersChange={setTaggedUserIds}
												placeholder='Say something... @mention someone'
												multiline
												rows={2}
												maxLength={500}
												disabled={isSubmitting}
												className='w-full rounded-xl border border-border-subtle bg-bg-elevated p-3 text-sm'
											/>
										</div>
									</>
								)}

								{/* Submit */}
								<button
									onClick={handleSubmit}
									disabled={
										isSubmitting ||
										(mode === 'post'
											? !caption.trim() && photoFiles.length === 0
											: !pollQuestion.trim() ||
												!pollOptionA.trim() ||
												!pollOptionB.trim())
									}
									className='flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3 font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50'
								>
									{isSubmitting ? (
										<>
											<Loader2 className='size-5 animate-spin' />
											{mode === 'poll' ? 'Creating Poll...' : 'Posting...'}
										</>
									) : (
										<>
											{mode === 'poll' ? (
												<BarChart3 className='size-5' />
											) : (
												<Send className='size-5' />
											)}
											{mode === 'poll' ? 'Create Poll' : 'Share Quick Post'}
										</>
									)}
								</button>
							</motion.div>
						</motion.div>
					</Portal>
				)}
			</AnimatePresence>

			{/* Hidden file input for auto-trigger on open */}
			<input
				ref={fileInputRef}
				type='file'
				accept='image/*'
				multiple
				onChange={handlePhotoSelect}
				className='hidden'
			/>
		</>
	)
}
