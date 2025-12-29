'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	X,
	Send,
	Loader2,
	MessageCircle,
	Users,
	CheckCircle,
} from 'lucide-react'
import Image from 'next/image'
import { Portal } from '@/components/ui/portal'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import {
	getShareSuggestions,
	sharePostToConversation,
	type ShareContactResponse,
} from '@/services/chat'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	TRANSITION_SMOOTH,
	ICON_BUTTON_HOVER,
	ICON_BUTTON_TAP,
} from '@/lib/motion'

interface SharePostModalProps {
	isOpen: boolean
	onClose: () => void
	postId: string
	postTitle?: string
	postImage?: string
	postContent?: string
}

const overlayVariants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1 },
}

const modalVariants = {
	hidden: { opacity: 0, scale: 0.95, y: 20 },
	visible: { opacity: 1, scale: 1, y: 0 },
}

export const SharePostModal = ({
	isOpen,
	onClose,
	postId,
	postTitle,
	postImage,
	postContent,
}: SharePostModalProps) => {
	const [conversations, setConversations] = useState<ShareContactResponse[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')
	const [selectedConversations, setSelectedConversations] = useState<
		Set<string>
	>(new Set())
	const [isSending, setIsSending] = useState(false)
	const [customMessage, setCustomMessage] = useState('')

	// Fetch conversation suggestions
	useEffect(() => {
		if (!isOpen) return

		const fetchSuggestions = async () => {
			setIsLoading(true)
			try {
				const response = await getShareSuggestions(20)
				if (response.success && response.data) {
					setConversations(response.data)
				}
			} catch (error) {
				console.error('Failed to fetch share suggestions:', error)
				toast.error('Failed to load conversations')
			} finally {
				setIsLoading(false)
			}
		}

		fetchSuggestions()
	}, [isOpen])

	// Reset state when modal closes
	useEffect(() => {
		if (!isOpen) {
			setSelectedConversations(new Set())
			setSearchQuery('')
			setCustomMessage('')
		}
	}, [isOpen])

	// Filter conversations by search
	const filteredConversations = conversations.filter(conv =>
		conv.displayName.toLowerCase().includes(searchQuery.toLowerCase()),
	)

	const toggleConversation = (conversationId: string) => {
		setSelectedConversations(prev => {
			const newSet = new Set(prev)
			if (newSet.has(conversationId)) {
				newSet.delete(conversationId)
			} else {
				newSet.add(conversationId)
			}
			return newSet
		})
	}

	const handleShare = async () => {
		if (selectedConversations.size === 0) {
			toast.error('Please select at least one conversation')
			return
		}

		setIsSending(true)
		let successCount = 0
		let failCount = 0

		try {
			await Promise.all(
				Array.from(selectedConversations).map(async conversationId => {
					try {
						const response = await sharePostToConversation({
							conversationId,
							message: customMessage.trim() || undefined,
							type: 'POST_SHARE',
							relatedId: postId,
						})

						if (response.success) {
							successCount++
						} else {
							failCount++
						}
					} catch {
						failCount++
					}
				}),
			)

			if (successCount > 0) {
				toast.success(
					`Post shared to ${successCount} conversation${successCount > 1 ? 's' : ''}!`,
				)
			}

			if (failCount > 0) {
				toast.error(`Failed to share to ${failCount} conversation(s)`)
			}

			if (successCount > 0) {
				onClose()
			}
		} finally {
			setIsSending(false)
		}
	}

	if (!isOpen) return null

	return (
		<Portal>
			<AnimatePresence mode='wait'>
				<motion.div
					className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'
					variants={overlayVariants}
					initial='hidden'
					animate='visible'
					exit='hidden'
					transition={TRANSITION_SMOOTH}
					onClick={onClose}
				>
					<motion.div
						className='relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-bg-card shadow-2xl'
						variants={modalVariants}
						initial='hidden'
						animate='visible'
						exit='hidden'
						transition={TRANSITION_SPRING}
						onClick={e => e.stopPropagation()}
					>
						{/* Header */}
						<div className='flex items-center justify-between border-b border-border-subtle p-4'>
							<h2 className='text-xl font-bold text-text'>Share Post</h2>
							<motion.button
								onClick={onClose}
								className='grid size-9 place-items-center rounded-lg text-text-secondary transition-colors hover:bg-bg-hover hover:text-text'
								whileHover={ICON_BUTTON_HOVER}
								whileTap={ICON_BUTTON_TAP}
							>
								<X className='size-5' />
							</motion.button>
						</div>

						{/* Post Preview */}
						{(postImage || postTitle || postContent) && (
							<div className='border-b border-border-subtle bg-bg-elevated p-4'>
								<div className='flex gap-3'>
									{postImage && (
										<div className='relative size-16 flex-shrink-0 overflow-hidden rounded-lg'>
											<Image
												src={postImage}
												alt='Post preview'
												fill
												className='object-cover'
											/>
										</div>
									)}
									<div className='min-w-0 flex-1'>
										{postTitle && (
											<p className='font-semibold text-text line-clamp-1'>
												{postTitle}
											</p>
										)}
										{postContent && (
											<p className='text-sm text-text-secondary line-clamp-2'>
												{postContent}
											</p>
										)}
									</div>
								</div>
							</div>
						)}

						{/* Search */}
						<div className='border-b border-border-subtle p-4'>
							<Input
								placeholder='Search conversations...'
								value={searchQuery}
								onChange={e => setSearchQuery(e.target.value)}
								className='bg-bg-elevated'
							/>
						</div>

						{/* Conversation List */}
						<div className='max-h-96 overflow-y-auto'>
							{isLoading ? (
								<div className='flex items-center justify-center py-12'>
									<Loader2 className='size-6 animate-spin text-text-muted' />
								</div>
							) : filteredConversations.length === 0 ? (
								<div className='flex flex-col items-center justify-center gap-2 py-12 text-center'>
									<MessageCircle className='size-8 text-text-muted' />
									<p className='text-sm text-text-secondary'>
										{searchQuery ? 'No conversations found' : 'No recent chats'}
									</p>
								</div>
							) : (
								<div className='divide-y divide-border-subtle'>
									{filteredConversations.map(conv => {
										const isSelected = selectedConversations.has(
											conv.conversationId,
										)

										return (
											<motion.button
												key={conv.conversationId}
												onClick={() => toggleConversation(conv.conversationId)}
												className={cn(
													'flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-bg-hover',
													isSelected && 'bg-primary/5',
												)}
												whileTap={{ scale: 0.98 }}
											>
												{/* Avatar */}
												<div className='relative'>
													<Avatar className='size-12'>
														<AvatarImage
															src={conv.avatar}
															alt={conv.displayName}
														/>
														<AvatarFallback>
															{conv.displayName.slice(0, 2).toUpperCase()}
														</AvatarFallback>
													</Avatar>
													{conv.type === 'GROUP' && (
														<div className='absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-bg-card'>
															<Users className='size-3 text-text-muted' />
														</div>
													)}
												</div>

												{/* Name */}
												<div className='min-w-0 flex-1'>
													<p className='truncate font-semibold text-text'>
														{conv.displayName}
													</p>
													<p className='text-xs text-text-muted'>
														{conv.type === 'GROUP'
															? 'Group chat'
															: 'Direct message'}
													</p>
												</div>

												{/* Checkbox */}
												<div
													className={cn(
														'grid size-6 flex-shrink-0 place-items-center rounded-full border-2 transition-colors',
														isSelected
															? 'border-primary bg-primary'
															: 'border-border',
													)}
												>
													{isSelected && (
														<CheckCircle className='size-4 text-white' />
													)}
												</div>
											</motion.button>
										)
									})}
								</div>
							)}
						</div>

						{/* Custom Message */}
						<div className='border-t border-border-subtle p-4'>
							<Input
								placeholder='Add a message (optional)...'
								value={customMessage}
								onChange={e => setCustomMessage(e.target.value)}
								maxLength={200}
								className='bg-bg-elevated'
							/>
							<p className='mt-1 text-xs text-text-muted'>
								Leave empty to use auto-generated caption
							</p>
						</div>

						{/* Footer */}
						<div className='flex items-center justify-between border-t border-border-subtle p-4'>
							<p className='text-sm text-text-secondary'>
								{selectedConversations.size > 0
									? `${selectedConversations.size} selected`
									: 'Select conversations'}
							</p>
							<Button
								onClick={handleShare}
								disabled={selectedConversations.size === 0 || isSending}
								className='gap-2'
							>
								{isSending ? (
									<>
										<Loader2 className='size-4 animate-spin' />
										Sharing...
									</>
								) : (
									<>
										<Send className='size-4' />
										Share
									</>
								)}
							</Button>
						</div>
					</motion.div>
				</motion.div>
			</AnimatePresence>
		</Portal>
	)
}
