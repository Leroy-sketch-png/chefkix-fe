'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { createPost } from '@/services/post'
import { Post } from '@/lib/types'
import { POST_MESSAGES } from '@/constants/messages'
import { motion, AnimatePresence } from 'framer-motion'
import { Image as ImageIcon, Video, X, Tag, Send } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { triggerSuccessConfetti } from '@/lib/confetti'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { AnimatedButton } from '@/components/ui/animated-button'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { moderateContent } from '@/services/ai'
import { diag } from '@/lib/diagnostics'
import {
	MentionInput,
	type MentionInputRef,
} from '@/components/shared/MentionInput'

interface CreatePostFormProps {
	onPostCreated?: (post: Post) => void
	currentUser?: {
		userId: string
		displayName: string
		avatarUrl?: string
	}
}

export const CreatePostForm = ({
	onPostCreated,
	currentUser,
}: CreatePostFormProps) => {
	const MAX_PHOTO_COUNT = 5
	const MAX_PHOTO_SIZE = 10 * 1024 * 1024
	const t = useTranslations('social')
	const [content, setContent] = useState('')
	const [videoUrl, setVideoUrl] = useState('')
	const [tags, setTags] = useState('')
	const [photoFiles, setPhotoFiles] = useState<File[]>([])
	const [previewUrls, setPreviewUrls] = useState<string[]>([])
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [showAdvanced, setShowAdvanced] = useState(false)
	const [taggedUserIds, setTaggedUserIds] = useState<string[]>([])
	const mentionRef = useRef<MentionInputRef>(null)

	const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || [])
		if (files.length === 0) return

		const invalidFile = files.find(
			file => !file.type.startsWith('image/') || file.size > MAX_PHOTO_SIZE,
		)
		if (invalidFile) {
			toast.error(
				!invalidFile.type.startsWith('image/')
					? t('createPostInvalidFileType')
					: t('createPostFileTooLarge'),
			)
			e.currentTarget.value = ''
			return
		}

		if (photoFiles.length >= MAX_PHOTO_COUNT) {
			toast.error(t('createPostMaxPhotos'))
			e.currentTarget.value = ''
			return
		}

		// Limit to 5 images
		const remainingSlots = MAX_PHOTO_COUNT - photoFiles.length
		const selectedFiles = files.slice(0, remainingSlots)
		if (selectedFiles.length < files.length) {
			toast.warning(t('createPostPhotosLimited'))
		}
		setPhotoFiles(prev => [...prev, ...selectedFiles])

		// Create preview URLs
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (isSubmitting) return

		if (!content.trim()) {
			toast.error(POST_MESSAGES.CREATE_EMPTY)
			return
		}

		diag.action('social', 'POST_SUBMIT', {
			contentLength: content.trim().length,
			photoCount: photoFiles.length,
			hasVideo: !!videoUrl.trim(),
			hasTags: !!tags.trim(),
		})

		setIsSubmitting(true)

		// AI content moderation before posting (fail-closed for safety)
		diag.request('social', '/api/v1/moderate', {
			contentType: 'post_caption',
			contentPreview: content.trim().slice(0, 100),
		})

		const moderationResult = await moderateContent(
			content.trim(),
			'post_caption',
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

		// Fail-closed: if moderation API fails, don't allow post
		if (!moderationResult.success) {
			diag.warn('social', 'MODERATION_API_FAILED', {
				message: 'API failure - fail-closed blocking post',
			})
			toast.error(t('createPostModerationFailed'))
			setIsSubmitting(false)
			return
		}

		if (moderationResult.data) {
			if (moderationResult.data.action === 'block') {
				diag.warn('social', 'POST_BLOCKED_BY_MODERATION', {
					reason: moderationResult.data.reason,
				})
				toast.error(
					moderationResult.data.reason ||
						t('createPostBlocked'),
				)
				setIsSubmitting(false)
				return
			}
			if (moderationResult.data.action === 'flag') {
				diag.warn('social', 'POST_FLAGGED_BY_MODERATION', {
					reason: moderationResult.data.reason,
				})
				toast.warning(
					moderationResult.data.reason ||
						t('createPostFlagged'),
				)
			}
		}

		const tagList = tags
			.split(',')
			.map(t => t.trim())
			.filter(t => t.length > 0)

		diag.request('social', '/api/v1/post', {
			contentLength: content.trim().length,
			photoCount: photoFiles.length,
			tags: tagList,
		})

		const response = await createPost({
			avatarUrl: currentUser?.avatarUrl || '/placeholder-avatar.svg',
			content: content.trim(),
			photoUrls: photoFiles,
			videoUrl: videoUrl.trim() || undefined,
			tags: tagList.length > 0 ? tagList : undefined,
			taggedUserIds: taggedUserIds.length > 0 ? taggedUserIds : undefined,
		})

		if (response.success && response.data) {
			diag.response(
				'social',
				'/api/v1/post',
				{
					postId: response.data.id,
					success: true,
				},
				true,
			)
			toast.success(POST_MESSAGES.CREATE_SUCCESS)
			triggerSuccessConfetti()
			setContent('')
			setVideoUrl('')
			setTags('')
			setPhotoFiles([])
			setPreviewUrls([])
			setShowAdvanced(false)
			setTaggedUserIds([])
			mentionRef.current?.clear()
			onPostCreated?.(response.data)
		} else {
			diag.error('social', 'POST_CREATE_FAILED', {
				message: response.message,
			})
			toast.error(response.message || t('createPostFailed'))
		}

		setIsSubmitting(false)
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			className='overflow-hidden rounded-lg border border-border-subtle bg-bg-card shadow-card'
		>
			<form onSubmit={handleSubmit} data-post-form>
				{/* Header */}
				<div className='flex items-center gap-3 border-b border-border-subtle p-4 md:p-6'>
					<Avatar size='lg' className='ring-2 ring-brand/10'>
						<AvatarImage
							src={currentUser?.avatarUrl || '/placeholder-avatar.svg'}
							alt={currentUser?.displayName || 'You'}
						/>
						<AvatarFallback>
							{currentUser?.displayName
								?.split(' ')
								.map(n => n[0])
								.join('')
								.toUpperCase()
								.slice(0, 2) || 'YO'}
						</AvatarFallback>
					</Avatar>
					<div>
						<div className='font-semibold leading-tight text-text-primary'>
							{currentUser?.displayName || 'You'}
						</div>
						<div className='text-sm leading-normal text-text-secondary'>
						{t('createPostSubtitle')}
						</div>
					</div>
				</div>

				{/* Content Input */}
				<div className='p-4 md:p-6'>
					<MentionInput
						ref={mentionRef}
						value={content}
						onChange={setContent}
						onTaggedUsersChange={setTaggedUserIds}
						multiline
						rows={4}
						maxLength={500}
						placeholder={t('createPostPlaceholder')}
						disabled={isSubmitting}
						className='bg-bg-card p-3 caret-brand placeholder-text-secondary focus:ring-brand/10'
						onSubmit={() => {
							if (content.trim()) {
								const form =
									document.querySelector<HTMLFormElement>('[data-post-form]')
								form?.requestSubmit()
							}
						}}
					/>
					{/* Character count */}
					<div className='mt-1 flex justify-end'>
						<span
							className={`text-xs ${content.length > 450 ? (content.length >= 500 ? 'text-error' : 'text-warning') : 'text-text-muted'}`}
						>
							{content.length}/500
						</span>
					</div>

					{/* Photo Previews */}
					<AnimatePresence>
						{previewUrls.length > 0 && (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
								className='mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4'
							>
								{previewUrls.map((url, index) => (
									<motion.div
										key={index}
										initial={{ opacity: 0, scale: 0.8 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.8 }}
										className='group relative aspect-square overflow-hidden rounded-lg'
									>
										<Image
											src={url}
											alt={`Preview ${index + 1}`}
											fill
											sizes='120px'
											className='object-cover'
										/>
										<button
											type='button'
											onClick={() => removePhoto(index)}
											aria-label={`Remove photo ${index + 1}`}
											className='absolute right-1 top-1 size-8 rounded-full bg-text-brand/60 text-bg-card opacity-70 transition-opacity hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100'
										>
											<X className='mx-auto size-4' />
										</button>
									</motion.div>
								))}
							</motion.div>
						)}
					</AnimatePresence>

					{/* Advanced Options */}
					<AnimatePresence>
						{showAdvanced && (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
								className='mt-3 space-y-3'
							>
								<div>
									<label
										htmlFor='post-video-url'
										className='mb-1 block text-sm font-medium leading-normal text-text-primary'
									>
										{t('createPostVideoUrlLabel')}
									</label>
									<input
										id='post-video-url'
										type='url'
										value={videoUrl}
										onChange={e => setVideoUrl(e.target.value)}
										placeholder='https://...'
										className='h-11 w-full rounded-lg bg-bg-card px-3 text-sm text-text-primary caret-brand focus:outline-none focus:ring-1 focus:ring-brand/10'
									/>
								</div>
								<div>
									<label
										htmlFor='post-tags'
										className='mb-1 block text-sm font-medium leading-normal text-text-primary'
									>
										{t('createPostTagsLabel')}
									</label>
									<input
										id='post-tags'
										type='text'
										value={tags}
										onChange={e => setTags(e.target.value)}
										placeholder='baking, bread, sourdough'
										className='h-11 w-full rounded-lg bg-bg-card px-3 text-sm text-text-primary caret-brand focus:outline-none focus:ring-1 focus:ring-brand/10'
									/>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* Footer Actions */}
				<div className='flex items-center justify-between border-t border-border-subtle bg-bg-hover p-3'>
					<div className='flex gap-2'>
						<label className='group relative size-11 cursor-pointer rounded-lg transition-colors hover:bg-bg-card'>
							<span className='sr-only'>{t('createPostAddPhotos')}</span>
							<ImageIcon className='mx-auto mt-2.5 size-5 text-text-secondary transition-colors group-hover:text-brand' />
							{photoFiles.length > 0 && (
								<span
									className={`absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${
										photoFiles.length >= MAX_PHOTO_COUNT
											? 'bg-error'
											: 'bg-brand'
									}`}
								>
									{photoFiles.length}
								</span>
							)}
							<input
								type='file'
								accept='image/*'
								multiple
								onChange={handlePhotoSelect}
								className='hidden'
								disabled={photoFiles.length >= MAX_PHOTO_COUNT}
							/>
						</label>

						<button
							type='button'
							onClick={() => setShowAdvanced(!showAdvanced)}
							aria-label={t('createPostToggleVideo')}
							className={`size-11 rounded-lg transition-colors hover:bg-bg-card ${
								showAdvanced
									? 'bg-brand/10 text-brand'
									: 'text-text-secondary'
							}`}
						>
							<Video className='mx-auto size-5' />
						</button>

						<button
							type='button'
							onClick={() => setShowAdvanced(!showAdvanced)}
							aria-label={t('createPostToggleTags')}
							className={`size-11 rounded-lg transition-colors hover:bg-bg-card ${
								showAdvanced
									? 'bg-brand/10 text-brand'
									: 'text-text-secondary'
							}`}
						>
							<Tag className='mx-auto size-5' />
						</button>
					</div>

					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<span className='inline-block'>
									<AnimatedButton
										type='submit'
										disabled={!content.trim()}
										isLoading={isSubmitting}
										loadingText={t('createPostPosting')}
										className='shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40'
										shine
									>
										<Send className='mr-2 size-4' />
										{t('createPostSubmit')}
									</AnimatedButton>
								</span>
							</TooltipTrigger>
							{!content.trim() && (
								<TooltipContent>
								<p>{t('createPostWriteSomething')}</p>
								</TooltipContent>
							)}
						</Tooltip>
					</TooltipProvider>
				</div>
			</form>
		</motion.div>
	)
}
