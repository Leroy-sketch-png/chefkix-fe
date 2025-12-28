'use client'

import { useState } from 'react'
import { createPost } from '@/services/post'
import { Post } from '@/lib/types'
import { POST_MESSAGES } from '@/constants/messages'
import { motion, AnimatePresence } from 'framer-motion'
import { Image as ImageIcon, Video, X, Tag, Send } from 'lucide-react'
import Image from 'next/image'
import { toast } from '@/components/ui/toaster'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { AnimatedButton } from '@/components/ui/animated-button'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { moderateContent } from '@/services/ai'

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
	const [content, setContent] = useState('')
	const [videoUrl, setVideoUrl] = useState('')
	const [tags, setTags] = useState('')
	const [photoFiles, setPhotoFiles] = useState<File[]>([])
	const [previewUrls, setPreviewUrls] = useState<string[]>([])
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [showAdvanced, setShowAdvanced] = useState(false)

	const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || [])
		if (files.length === 0) return

		// Limit to 5 images
		const selectedFiles = files.slice(0, 5 - photoFiles.length)
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

		if (!content.trim()) {
			toast.error(POST_MESSAGES.CREATE_EMPTY)
			return
		}

		setIsSubmitting(true)

		// AI content moderation before posting
		const moderationResult = await moderateContent(
			content.trim(),
			'post_caption',
		)
		if (moderationResult.success && moderationResult.data) {
			if (moderationResult.data.action === 'block') {
				toast.error(
					moderationResult.data.reason ||
						'Your post contains content that violates our community guidelines.',
				)
				setIsSubmitting(false)
				return
			}
			if (moderationResult.data.action === 'flag') {
				toast.warning(
					moderationResult.data.reason ||
						'Your post may contain sensitive content and will be reviewed.',
				)
			}
		}

		const tagList = tags
			.split(',')
			.map(t => t.trim())
			.filter(t => t.length > 0)

		const response = await createPost({
			avatarUrl: currentUser?.avatarUrl || 'https://i.pravatar.cc/48',
			content: content.trim(),
			photoUrls: photoFiles,
			videoUrl: videoUrl.trim() || undefined,
			tags: tagList.length > 0 ? tagList : undefined,
		})

		if (response.success && response.data) {
			toast.success(POST_MESSAGES.CREATE_SUCCESS)
			setContent('')
			setVideoUrl('')
			setTags('')
			setPhotoFiles([])
			setPreviewUrls([])
			setShowAdvanced(false)
			onPostCreated?.(response.data)
		} else {
			toast.error(response.message || 'Failed to create post')
		}

		setIsSubmitting(false)
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			className='overflow-hidden rounded-lg border border-border-subtle bg-bg-card shadow-md'
		>
			<form onSubmit={handleSubmit}>
				{/* Header */}
				<div className='flex items-center gap-3 border-b border-border-subtle p-4 md:p-6'>
					<Avatar size='lg' className='ring-2 ring-primary/10'>
						<AvatarImage
							src={currentUser?.avatarUrl || 'https://i.pravatar.cc/48'}
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
							Share what you&apos;re cooking!
						</div>
					</div>
				</div>

				{/* Content Input */}
				<div className='p-4 md:p-6'>
					<textarea
						value={content}
						onChange={e => setContent(e.target.value.slice(0, 500))}
						onKeyDown={e => {
							if (
								(e.ctrlKey || e.metaKey) &&
								e.key === 'Enter' &&
								content.trim()
							) {
								e.preventDefault()
								handleSubmit(e as unknown as React.FormEvent)
							}
						}}
						placeholder="What's cooking? Share your culinary journey..."
						className='w-full resize-none rounded-lg bg-bg-card p-3 leading-relaxed text-text-primary caret-primary placeholder-text-secondary focus:outline-none focus:ring-1 focus:ring-primary/10'
						rows={4}
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
											className='object-cover'
										/>
										<button
											type='button'
											onClick={() => removePhoto(index)}
											className='absolute right-1 top-1 h-8 w-8 rounded-full bg-text-primary/60 text-bg-card opacity-0 transition-opacity group-hover:opacity-100'
										>
											<X className='mx-auto h-4 w-4' />
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
									<label className='mb-1 block text-sm font-medium leading-normal text-text-primary'>
										Video URL (optional)
									</label>
									<input
										type='url'
										value={videoUrl}
										onChange={e => setVideoUrl(e.target.value)}
										placeholder='https://...'
										className='h-11 w-full rounded-lg bg-bg-card px-3 text-sm text-text-primary caret-primary focus:outline-none focus:ring-1 focus:ring-primary/10'
									/>
								</div>
								<div>
									<label className='mb-1 block text-sm font-medium leading-normal text-text-primary'>
										Tags (comma-separated)
									</label>
									<input
										type='text'
										value={tags}
										onChange={e => setTags(e.target.value)}
										placeholder='baking, bread, sourdough'
										className='h-11 w-full rounded-lg bg-bg-card px-3 text-sm text-text-primary caret-primary focus:outline-none focus:ring-1 focus:ring-primary/10'
									/>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* Footer Actions */}
				<div className='flex items-center justify-between border-t border-border-subtle bg-bg-hover p-3'>
					<div className='flex gap-2'>
						<label className='group h-11 w-11 cursor-pointer rounded-lg transition-colors hover:bg-bg-card'>
							<ImageIcon className='mx-auto mt-2.5 h-5 w-5 text-text-secondary transition-colors group-hover:text-primary' />
							<input
								type='file'
								accept='image/*'
								multiple
								onChange={handlePhotoSelect}
								className='hidden'
								disabled={photoFiles.length >= 5}
							/>
						</label>

						<button
							type='button'
							onClick={() => setShowAdvanced(!showAdvanced)}
							className={`h-11 w-11 rounded-lg transition-colors hover:bg-bg-card ${
								showAdvanced
									? 'bg-primary/10 text-primary'
									: 'text-text-secondary'
							}`}
						>
							<Video className='mx-auto h-5 w-5' />
						</button>

						<button
							type='button'
							onClick={() => setShowAdvanced(!showAdvanced)}
							className={`h-11 w-11 rounded-lg transition-colors hover:bg-bg-card ${
								showAdvanced
									? 'bg-primary/10 text-primary'
									: 'text-text-secondary'
							}`}
						>
							<Tag className='mx-auto h-5 w-5' />
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
										loadingText='Posting...'
										className='shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40'
										shine
									>
										<Send className='mr-2 h-4 w-4' />
										Post
									</AnimatedButton>
								</span>
							</TooltipTrigger>
							{!content.trim() && (
								<TooltipContent>
									<p>Write something to post</p>
								</TooltipContent>
							)}
						</Tooltip>
					</TooltipProvider>
				</div>
			</form>
		</motion.div>
	)
}
