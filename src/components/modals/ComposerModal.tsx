'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	X,
	Globe,
	Image as ImageIcon,
	Smile,
	AtSign,
	MapPin,
	BookOpen,
	Sparkles,
	Wand2,
	Loader2,
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	TRANSITION_SMOOTH,
	BUTTON_HOVER,
	BUTTON_TAP,
} from '@/lib/motion'

// ============================================
// TYPES
// ============================================

type PrivacySetting = 'public' | 'friends' | 'private'

interface RecipeAttachment {
	id: string
	name: string
	time: string
	xpReward: number
}

interface ComposerModalProps {
	isOpen: boolean
	onClose: () => void
	onPost: (data: PostData) => Promise<void>
	user: {
		displayName: string
		avatarUrl: string
	}
}

interface PostData {
	content: string
	images: File[]
	recipe?: RecipeAttachment
	privacy: PrivacySetting
}

// ============================================
// ANIMATIONS
// ============================================

const overlayVariants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1 },
}

const modalVariants = {
	hidden: {
		opacity: 0,
		y: 50,
		scale: 0.95,
	},
	visible: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: TRANSITION_SMOOTH,
	},
	exit: {
		opacity: 0,
		y: 50,
		scale: 0.95,
		transition: { duration: 0.2 },
	},
}

// ============================================
// COMPOSER MODAL COMPONENT
// ============================================

export const ComposerModal = ({
	isOpen,
	onClose,
	onPost,
	user,
}: ComposerModalProps) => {
	const [content, setContent] = useState('')
	const [images, setImages] = useState<File[]>([])
	const [imagePreviews, setImagePreviews] = useState<string[]>([])
	const [recipe, setRecipe] = useState<RecipeAttachment | null>(null)
	const [privacy, setPrivacy] = useState<PrivacySetting>('public')
	const [showAIForm, setShowAIForm] = useState(false)
	const [aiDescription, setAIDescription] = useState('')
	const [isGenerating, setIsGenerating] = useState(false)
	const [isPosting, setIsPosting] = useState(false)

	const fileInputRef = useRef<HTMLInputElement>(null)
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	const canPost = content.trim().length > 0 || images.length > 0

	const handleImageSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = Array.from(e.target.files || [])
			if (files.length === 0) return

			setImages(prev => [...prev, ...files])

			// Create previews
			files.forEach(file => {
				const reader = new FileReader()
				reader.onloadend = () => {
					setImagePreviews(prev => [...prev, reader.result as string])
				}
				reader.readAsDataURL(file)
			})
		},
		[],
	)

	const removeImage = (index: number) => {
		setImages(prev => prev.filter((_, i) => i !== index))
		setImagePreviews(prev => prev.filter((_, i) => i !== index))
	}

	const handleGenerateRecipe = async () => {
		if (!aiDescription.trim()) return

		setIsGenerating(true)

		// Simulate AI generation (replace with actual API call)
		await new Promise(resolve => setTimeout(resolve, 2000))

		setRecipe({
			id: 'generated-1',
			name: 'AI Generated Recipe',
			time: '30 min',
			xpReward: 120,
		})
		setIsGenerating(false)
		setShowAIForm(false)
		setAIDescription('')
	}

	const handlePost = async () => {
		if (!canPost) return

		setIsPosting(true)
		try {
			await onPost({
				content,
				images,
				recipe: recipe || undefined,
				privacy,
			})

			// Reset state
			setContent('')
			setImages([])
			setImagePreviews([])
			setRecipe(null)
			setPrivacy('public')
			onClose()
		} finally {
			setIsPosting(false)
		}
	}

	const handleClose = () => {
		if (content.trim() || images.length > 0) {
			// Could add confirmation dialog here
		}
		onClose()
	}

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					variants={overlayVariants}
					initial='hidden'
					animate='visible'
					exit='hidden'
					onClick={handleClose}
					className='fixed inset-0 z-modal flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm'
				>
					<motion.div
						variants={modalVariants}
						initial='hidden'
						animate='visible'
						exit='exit'
						onClick={e => e.stopPropagation()}
						className='flex max-h-[90vh] w-full max-w-modal-xl flex-col overflow-hidden rounded-2xl bg-panel-bg shadow-2xl'
					>
						{/* Header */}
						<div className='flex items-center justify-between border-b border-border px-6 py-5'>
							<h2 className='text-xl font-bold'>Create Post</h2>
							<motion.button
								whileHover={{ scale: 1.1, rotate: 90 }}
								whileTap={{ scale: 0.9 }}
								onClick={handleClose}
								className='flex h-9 w-9 items-center justify-center rounded-full bg-bg-elevated text-text-muted transition-colors hover:bg-border hover:text-text'
							>
								<X className='h-5 w-5' />
							</motion.button>
						</div>

						{/* User Info */}
						<div className='flex items-center gap-3 px-6 py-4'>
							<div className='relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-panel-bg ring-offset-2 ring-offset-brand'>
								<Image
									src={user.avatarUrl}
									alt={user.displayName}
									fill
									className='object-cover'
								/>
							</div>
							<div>
								<div className='text-sm font-semibold'>{user.displayName}</div>
								<button className='mt-0.5 flex items-center gap-1 text-sm text-text-muted hover:text-text'>
									<Globe className='h-3.5 w-3.5' />
									<span>Public</span>
								</button>
							</div>
						</div>

						{/* Content Area */}
						<div className='flex-1 overflow-y-auto px-6'>
							<textarea
								ref={textareaRef}
								value={content}
								onChange={e => setContent(e.target.value)}
								placeholder="What's cooking? Share your food journey..."
								className='min-h-textarea w-full resize-none bg-transparent text-base leading-relaxed outline-none placeholder:text-text-muted'
								rows={4}
							/>

							{/* Image Previews */}
							{imagePreviews.length > 0 && (
								<div className='mt-4 grid grid-cols-2 gap-2'>
									{imagePreviews.map((preview, index) => (
										<div
											key={index}
											className='relative overflow-hidden rounded-xl'
										>
											<Image
												src={preview}
												alt={`Preview ${index + 1}`}
												width={280}
												height={200}
												className='h-48 w-full object-cover'
											/>
											<motion.button
												whileHover={{ scale: 1.1 }}
												whileTap={{ scale: 0.9 }}
												onClick={() => removeImage(index)}
												className='absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80'
											>
												<X className='h-4 w-4' />
											</motion.button>
										</div>
									))}
								</div>
							)}

							{/* Recipe Attachment */}
							{recipe && (
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									className='relative mt-4 rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-violet-500/10 p-4'
								>
									<div className='mb-2 flex items-center gap-2 font-semibold text-purple-500'>
										<BookOpen className='h-4 w-4' />
										<span>Recipe Attached</span>
										<motion.button
											whileHover={{ scale: 1.1 }}
											whileTap={{ scale: 0.9 }}
											onClick={() => setRecipe(null)}
											className='ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/20 text-purple-500 hover:bg-purple-500/30'
										>
											<X className='h-4 w-4' />
										</motion.button>
									</div>
									<div className='flex gap-3 text-sm text-text-muted'>
										<span className='font-semibold text-text'>
											{recipe.name}
										</span>
										<span>⏱️ {recipe.time}</span>
										<span className='text-success'>+{recipe.xpReward} XP</span>
									</div>
								</motion.div>
							)}
						</div>

						{/* AI Recipe Section */}
						<div className='border-t border-border bg-bg-elevated px-6 py-4'>
							<motion.button
								onClick={() => setShowAIForm(!showAIForm)}
								whileHover={BUTTON_HOVER}
								whileTap={BUTTON_TAP}
								className='flex w-full items-center gap-2 rounded-xl border-2 border-dashed border-purple-500/40 bg-gradient-to-br from-purple-500/10 to-violet-500/10 px-4 py-3 font-semibold text-purple-500 transition-colors hover:border-purple-500'
							>
								<Sparkles className='h-4 w-4' />
								<span>Attach Recipe (AI-Assisted)</span>
							</motion.button>

							{/* AI Form */}
							<AnimatePresence>
								{showAIForm && (
									<motion.div
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: 'auto' }}
										exit={{ opacity: 0, height: 0 }}
										className='mt-4 overflow-hidden'
									>
										<label className='mb-2 block text-sm font-semibold'>
											Describe your recipe (ingredients, steps, time)
										</label>
										<textarea
											value={aiDescription}
											onChange={e => setAIDescription(e.target.value)}
											placeholder='Example: Quick pasta with garlic, olive oil, cherry tomatoes. Boil pasta 10 mins, sauté garlic 2 mins, toss together...'
											className='w-full resize-y rounded-xl border-2 border-border bg-panel-bg p-3 text-sm leading-relaxed outline-none transition-colors focus:border-purple-500'
											rows={3}
										/>
										<motion.button
											onClick={handleGenerateRecipe}
											disabled={isGenerating || !aiDescription.trim()}
											whileHover={!isGenerating ? { y: -2 } : {}}
											whileTap={!isGenerating ? { scale: 0.98 } : {}}
											className='mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-violet-500 py-3 font-semibold text-white shadow-lg shadow-purple-500/30 transition-shadow hover:shadow-purple-500/50 disabled:opacity-50'
										>
											{isGenerating ? (
												<>
													<Loader2 className='h-4 w-4 animate-spin' />
													<span>Generating...</span>
												</>
											) : (
												<>
													<Wand2 className='h-4 w-4' />
													<span>Generate Recipe</span>
												</>
											)}
										</motion.button>
										<p className='mt-2 text-center text-xs text-text-muted'>
											Our AI will transform your description into a step-by-step
											recipe you can edit.
										</p>
									</motion.div>
								)}
							</AnimatePresence>
						</div>

						{/* Action Bar */}
						<div className='flex items-center justify-between border-t border-border px-6 py-4'>
							<div className='flex gap-2'>
								<input
									ref={fileInputRef}
									type='file'
									accept='image/*,video/*'
									multiple
									onChange={handleImageSelect}
									className='hidden'
								/>
								<motion.button
									whileHover={{ scale: 1.1, color: 'var(--color-brand)' }}
									whileTap={{ scale: 0.9 }}
									onClick={() => fileInputRef.current?.click()}
									className='flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-elevated'
									title='Add photo/video'
								>
									<ImageIcon className='h-5 w-5' />
								</motion.button>
								<motion.button
									whileHover={{ scale: 1.1, color: 'var(--color-brand)' }}
									whileTap={{ scale: 0.9 }}
									className='flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-elevated'
									title='Add emoji'
								>
									<Smile className='h-5 w-5' />
								</motion.button>
								<motion.button
									whileHover={{ scale: 1.1, color: 'var(--color-brand)' }}
									whileTap={{ scale: 0.9 }}
									className='flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-elevated'
									title='Tag people'
								>
									<AtSign className='h-5 w-5' />
								</motion.button>
								<motion.button
									whileHover={{ scale: 1.1, color: 'var(--color-brand)' }}
									whileTap={{ scale: 0.9 }}
									className='flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-elevated'
									title='Add location'
								>
									<MapPin className='h-5 w-5' />
								</motion.button>
							</div>

							<motion.button
								onClick={handlePost}
								disabled={!canPost || isPosting}
								whileHover={canPost && !isPosting ? { y: -2 } : {}}
								whileTap={canPost && !isPosting ? { scale: 0.98 } : {}}
								className={cn(
									'rounded-full px-8 py-3 font-semibold text-white transition-all',
									canPost && !isPosting
										? 'bg-brand shadow-lg shadow-brand/30 hover:shadow-brand/50'
										: 'cursor-not-allowed bg-brand/50',
								)}
							>
								{isPosting ? (
									<Loader2 className='h-5 w-5 animate-spin' />
								) : (
									'Post'
								)}
							</motion.button>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}
