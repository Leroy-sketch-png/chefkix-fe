'use client'

import { useState } from 'react'
import { createPost } from '@/services/post'
import { Post } from '@/lib/types'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Image as ImageIcon, Video, X, Tag, Send } from 'lucide-react'
import Image from 'next/image'

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
			toast.error('Please write something!')
			return
		}

		setIsSubmitting(true)

		const tagList = tags
			.split(',')
			.map(t => t.trim())
			.filter(t => t.length > 0)

		const response = await createPost({
			content: content.trim(),
			photoUrls: photoFiles,
			videoUrl: videoUrl.trim() || undefined,
			tags: tagList.length > 0 ? tagList : undefined,
		})

		if (response.success && response.data) {
			toast.success('Post created successfully!')
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
			className='overflow-hidden rounded-lg border border-border bg-card shadow-md'
		>
			<form onSubmit={handleSubmit}>
				{/* Header */}
				<div className='flex items-center gap-3 border-b border-border p-4'>
					<div className='relative h-12 w-12'>
						<Image
							src={currentUser?.avatarUrl || 'https://i.pravatar.cc/48'}
							alt={currentUser?.displayName || 'You'}
							fill
							className='rounded-full object-cover ring-2 ring-primary/10'
						/>
					</div>
					<div>
						<div className='font-semibold text-gray-900'>
							{currentUser?.displayName || 'You'}
						</div>
						<div className='text-sm text-gray-500'>
							Share what you&apos;re cooking!
						</div>
					</div>
				</div>

				{/* Content Input */}
				<div className='p-4'>
					<textarea
						value={content}
						onChange={e => setContent(e.target.value)}
						placeholder="What's cooking? Share your culinary journey..."
						className='w-full resize-none rounded-lg border border-gray-300 p-3 text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
						rows={4}
					/>

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
											className='absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100'
										>
											<X className='h-4 w-4' />
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
									<label className='mb-1 block text-sm font-medium text-gray-700'>
										Video URL (optional)
									</label>
									<input
										type='url'
										value={videoUrl}
										onChange={e => setVideoUrl(e.target.value)}
										placeholder='https://...'
										className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
									/>
								</div>
								<div>
									<label className='mb-1 block text-sm font-medium text-gray-700'>
										Tags (comma-separated)
									</label>
									<input
										type='text'
										value={tags}
										onChange={e => setTags(e.target.value)}
										placeholder='baking, bread, sourdough'
										className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
									/>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* Footer Actions */}
				<div className='flex items-center justify-between border-t border-gray-100 bg-gray-50/50 p-3'>
					<div className='flex gap-2'>
						<label className='group cursor-pointer rounded-lg p-2 transition-colors hover:bg-gray-100'>
							<ImageIcon className='h-5 w-5 text-gray-600 transition-colors group-hover:text-primary' />
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
							className={`rounded-lg p-2 transition-colors hover:bg-gray-100 ${
								showAdvanced ? 'bg-primary/10 text-primary' : 'text-gray-600'
							}`}
						>
							<Video className='h-5 w-5' />
						</button>

						<button
							type='button'
							onClick={() => setShowAdvanced(!showAdvanced)}
							className={`rounded-lg p-2 transition-colors hover:bg-gray-100 ${
								showAdvanced ? 'bg-primary/10 text-primary' : 'text-gray-600'
							}`}
						>
							<Tag className='h-5 w-5' />
						</button>
					</div>

					<button
						type='submit'
						disabled={isSubmitting || !content.trim()}
						className='flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/40 disabled:cursor-not-allowed disabled:opacity-50'
					>
						{isSubmitting ? (
							<>
								<div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
								<span>Posting...</span>
							</>
						) : (
							<>
								<Send className='h-4 w-4' />
								<span>Post</span>
							</>
						)}
					</button>
				</div>
			</form>
		</motion.div>
	)
}
