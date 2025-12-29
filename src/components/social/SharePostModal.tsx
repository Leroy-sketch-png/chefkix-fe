'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	X,
	Send,
	Loader2,
	MessageCircle,
	Users,
	Search,
	Sparkles,
	User,
} from 'lucide-react'
import Image from 'next/image'
import { Portal } from '@/components/ui/portal'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import { CHAT_MESSAGES } from '@/constants/messages'
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
	CARD_HOVER,
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

const listItemVariants = {
	hidden: { opacity: 0, x: -20 },
	visible: { opacity: 1, x: 0 },
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
			toast.error(CHAT_MESSAGES.SELECT_CONVERSATION)
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
							console.error(
								'Share failed for conversation:',
								conversationId,
								response.message,
							)
						}
					} catch (err) {
						failCount++
						console.error(
							'Share exception for conversation:',
							conversationId,
							err,
						)
					}
				}),
			)

			if (successCount > 0) {
				toast.success(
					successCount === 1
						? CHAT_MESSAGES.SHARE_SUCCESS
						: CHAT_MESSAGES.SHARE_MULTIPLE_SUCCESS(successCount),
				)
			}

			if (failCount > 0) {
				toast.error(CHAT_MESSAGES.SHARE_PARTIAL_FAIL(failCount))
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
					className='fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4'
					variants={overlayVariants}
					initial='hidden'
					animate='visible'
					exit='hidden'
					transition={TRANSITION_SMOOTH}
					onClick={onClose}
				>
					<motion.div
						className='relative flex w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-border bg-bg-card shadow-2xl sm:max-h-[90vh] sm:rounded-2xl'
						variants={modalVariants}
						initial='hidden'
						animate='visible'
						exit='hidden'
						transition={TRANSITION_SPRING}
						onClick={e => e.stopPropagation()}
					>
						{/* Header with gradient accent */}
						<div className='relative flex-shrink-0 overflow-hidden border-b border-border-subtle bg-gradient-to-br from-brand/5 via-transparent to-transparent p-4 sm:p-6 sm:pb-4'>
							<div className='flex items-start justify-between gap-3'>
								<div className='flex items-start gap-2.5 sm:gap-3'>
									<div className='grid size-9 flex-shrink-0 place-items-center rounded-xl bg-brand/10 sm:size-10'>
										<Sparkles className='size-4 text-brand sm:size-5' />
									</div>
									<div className='min-w-0'>
										<h2 className='text-lg font-bold text-text sm:text-xl'>
											Share Recipe
										</h2>
										<p className='text-xs text-text-secondary sm:text-sm'>
											Inspire your cooking friends!
										</p>
									</div>
								</div>
								<motion.button
									onClick={onClose}
									className='grid size-8 flex-shrink-0 place-items-center rounded-lg text-text-secondary transition-colors hover:bg-bg-hover hover:text-text sm:size-9'
									whileHover={ICON_BUTTON_HOVER}
									whileTap={ICON_BUTTON_TAP}
								>
									<X className='size-4 sm:size-5' />
								</motion.button>
							</div>
						</div>

						{/* Scrollable content area */}
						<div className='flex-1 overflow-y-auto overscroll-contain'>
							{/* Enhanced Post Preview */}
							{(postImage || postTitle || postContent) && (
								<motion.div
									className='mx-3 my-3 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-amber-50/50 to-transparent p-3 shadow-sm dark:from-amber-950/10 sm:mx-4 sm:my-4 sm:p-4'
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.1 }}
								>
									<div className='flex gap-2.5 sm:gap-3'>
										{postImage && (
											<div className='relative size-16 flex-shrink-0 overflow-hidden rounded-lg ring-2 ring-brand/20 sm:size-20'>
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
												<p className='mb-1 text-sm font-bold text-text line-clamp-1 sm:text-base'>
													{postTitle}
												</p>
											)}
											{postContent && (
												<p className='text-xs leading-relaxed text-text-secondary line-clamp-2 sm:text-sm'>
													{postContent}
												</p>
											)}
										</div>
									</div>
								</motion.div>
							)}

							{/* Search */}
							<div className='px-3 pb-2 sm:px-4 sm:pb-3'>
								<div className='relative'>
									<Search className='absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-text-muted sm:size-4' />
									<Input
										placeholder='Search by name...'
										value={searchQuery}
										onChange={e => setSearchQuery(e.target.value)}
										className='h-10 bg-bg-elevated pl-9 text-sm placeholder:text-text-muted sm:h-auto sm:pl-10'
									/>
								</div>
							</div>

							{/* Conversation List */}
							<div className='px-3 sm:px-4'>
								{isLoading ? (
									<div className='flex flex-col items-center justify-center gap-3 py-12 sm:py-16'>
										<Loader2 className='size-7 animate-spin text-brand sm:size-8' />
										<p className='text-xs text-text-secondary sm:text-sm'>
											Loading conversations...
										</p>
									</div>
								) : filteredConversations.length === 0 ? (
									<div className='flex flex-col items-center justify-center gap-3 py-12 text-center sm:py-16'>
										<div className='grid size-14 place-items-center rounded-2xl bg-brand/5 sm:size-16'>
											<MessageCircle className='size-7 text-brand/40 sm:size-8' />
										</div>
										<div>
											<p className='text-sm font-semibold text-text sm:text-base'>
												{searchQuery ? 'No matches found' : 'No recent chats'}
											</p>
											<p className='text-xs text-text-muted sm:text-sm'>
												{searchQuery
													? 'Try a different search term'
													: 'Start a conversation first!'}
											</p>
										</div>
									</div>
								) : (
									<motion.div
										className='space-y-1.5 pb-3 sm:space-y-2 sm:pb-4'
										initial='hidden'
										animate='visible'
										variants={{
											visible: {
												transition: {
													staggerChildren: 0.05,
												},
											},
										}}
									>
										{filteredConversations.map(conv => {
											const isSelected = selectedConversations.has(
												conv.conversationId,
											)

											return (
												<motion.button
													key={conv.conversationId}
													onClick={() =>
														toggleConversation(conv.conversationId)
													}
													className={cn(
														'group relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl p-2.5 text-left transition-all sm:gap-3 sm:p-3',
														isSelected
															? 'bg-brand/10 shadow-sm ring-2 ring-brand/50'
															: 'hover:bg-bg-hover active:bg-bg-hover',
													)}
													variants={listItemVariants}
													whileHover={CARD_HOVER}
													whileTap={{ scale: 0.98 }}
												>
													{/* Selection glow effect */}
													{isSelected && (
														<motion.div
															className='absolute inset-0 bg-gradient-to-r from-brand/10 to-transparent'
															initial={{ opacity: 0 }}
															animate={{ opacity: 1 }}
															transition={{ duration: 0.3 }}
														/>
													)}

													{/* Avatar with type indicator */}
													<div className='relative z-10 flex-shrink-0'>
														<Avatar
															className={cn(
																'size-11 ring-2 transition-all sm:size-12',
																isSelected
																	? 'ring-brand/40'
																	: 'ring-transparent group-hover:ring-border',
															)}
														>
															<AvatarImage
																src={conv.avatar}
																alt={conv.displayName}
															/>
															<AvatarFallback className='bg-brand/10 text-xs font-bold text-brand sm:text-sm'>
																{conv.displayName.slice(0, 2).toUpperCase()}
															</AvatarFallback>
														</Avatar>
														{/* Type badge */}
														<div
															className={cn(
																'absolute -bottom-0.5 -right-0.5 grid size-4.5 place-items-center rounded-full border-2 border-bg-card shadow-sm sm:size-5',
																conv.type === 'GROUP'
																	? 'bg-purple-500'
																	: 'bg-green-500',
															)}
														>
															{conv.type === 'GROUP' ? (
																<Users className='size-2 text-white sm:size-2.5' />
															) : (
																<User className='size-2 text-white sm:size-2.5' />
															)}
														</div>
													</div>

													{/* Name and type */}
													<div className='z-10 min-w-0 flex-1'>
														<p
															className={cn(
																'truncate text-sm font-semibold transition-colors sm:text-base',
																isSelected ? 'text-brand' : 'text-text',
															)}
														>
															{conv.displayName}
														</p>
														<p className='text-xs text-text-muted'>
															{conv.type === 'GROUP'
																? 'Group conversation'
																: 'Direct message'}
														</p>
													</div>

													{/* Enhanced Checkbox */}
													<div className='z-10 flex-shrink-0'>
														<div
															className={cn(
																'grid size-5.5 place-items-center rounded-full border-2 transition-all sm:size-6',
																isSelected
																	? 'scale-110 border-brand bg-brand shadow-lg shadow-brand/30'
																	: 'border-border group-hover:border-brand/50',
															)}
														>
															<motion.div
																initial={false}
																animate={{
																	scale: isSelected ? 1 : 0,
																	opacity: isSelected ? 1 : 0,
																}}
																transition={{
																	type: 'spring',
																	stiffness: 300,
																}}
															>
																<svg
																	className='size-3 text-white sm:size-3.5'
																	viewBox='0 0 20 20'
																	fill='currentColor'
																>
																	<path
																		fillRule='evenodd'
																		d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
																		clipRule='evenodd'
																	/>
																</svg>
															</motion.div>
														</div>
													</div>
												</motion.button>
											)
										})}
									</motion.div>
								)}
							</div>

							{/* Custom Message */}
							<div className='border-t border-border-subtle p-3 sm:p-4'>
								<div className='relative'>
									<Input
										placeholder='Add a personal message (optional)...'
										value={customMessage}
										onChange={e => setCustomMessage(e.target.value)}
										maxLength={200}
										className='h-10 bg-bg-elevated pr-14 text-sm sm:h-auto sm:pr-12'
									/>
									<span
										className={cn(
											'absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium tabular-nums transition-colors',
											customMessage.length > 180
												? 'text-brand'
												: 'text-text-muted',
										)}
									>
										{customMessage.length}/200
									</span>
								</div>
								<p className='mt-2 flex items-center gap-1.5 text-xs text-text-muted'>
									<Sparkles className='size-3' />
									Leave empty for auto-generated caption
								</p>
							</div>
						</div>

						{/* Fixed Footer - stays at bottom */}
						<div className='flex-shrink-0 border-t border-border-subtle bg-gradient-to-br from-bg-elevated to-transparent p-3 sm:p-4'>
							<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2'>
								<div className='flex items-center gap-2'>
									{selectedConversations.size > 0 ? (
										<>
											<div className='grid size-7 flex-shrink-0 place-items-center rounded-lg bg-brand/10 sm:size-8'>
												<span className='text-xs font-bold text-brand sm:text-sm'>
													{selectedConversations.size}
												</span>
											</div>
											<p className='text-xs font-medium text-text sm:text-sm'>
												{selectedConversations.size === 1
													? 'conversation selected'
													: 'conversations selected'}
											</p>
										</>
									) : (
										<p className='text-xs text-text-muted sm:text-sm'>
											Select who to share with
										</p>
									)}
								</div>
								<Button
									onClick={handleShare}
									disabled={selectedConversations.size === 0 || isSending}
									className='w-full gap-2 shadow-lg shadow-brand/20 sm:w-auto'
								>
									{isSending ? (
										<>
											<Loader2 className='size-4 animate-spin' />
											<span className='text-sm'>Sharing...</span>
										</>
									) : (
										<>
											<Send className='size-4' />
											<span className='text-sm'>
												Share ({selectedConversations.size})
											</span>
										</>
									)}
								</Button>
							</div>
						</div>
					</motion.div>
				</motion.div>
			</AnimatePresence>
		</Portal>
	)
}
