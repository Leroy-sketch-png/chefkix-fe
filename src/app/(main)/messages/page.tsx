'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Portal } from '@/components/ui/portal'
import {
	MessageCircle,
	Send,
	Loader2,
	Wifi,
	WifiOff,
	Search,
	CheckCheck,
	Sparkles,
	ArrowLeft,
	Phone,
	X,
} from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { MentionInput, MentionInputRef } from '@/components/shared/MentionInput'
import { useChatWebSocket } from '@/hooks/useChatWebSocket'
import VideoCall from '@/components/chat/VideoCall'
import {
	getMyConversations,
	getMessages,
	sendMessage as sendMessageRest,
	createConversation,
	mapChatMessageToMessage,
	reactToMessage,
	deleteMessage,
	Conversation,
	ChatMessage as ChatMessageType,
} from '@/services/chat'
import { ChatMessage } from '@/components/messages/ChatMessage'
import type { Message } from '@/components/messages/ChatMessage'
import { TRANSITION_SPRING } from '@/lib/motion'
import { logDevError } from '@/lib/dev-log'
import { toast } from 'sonner'

// ============================================
// HELPERS
// ============================================

function formatMessageTime(dateString: string): string {
	const date = new Date(dateString)
	const now = new Date()
	const diffDays = Math.floor(
		(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
	)

	if (diffDays === 0) {
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
	} else if (diffDays === 1) {
		return 'Yesterday'
	} else if (diffDays < 7) {
		return date.toLocaleDateString([], { weekday: 'short' })
	} else {
		return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
	}
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface ConversationItemProps {
	conversation: Conversation
	isSelected: boolean
	currentUserId: string | undefined
	onClick: () => void
}

function ConversationItem({
	conversation,
	isSelected,
	currentUserId,
	onClick,
}: ConversationItemProps) {
	const otherParticipant = conversation.participants.find(
		p => p.userId !== currentUserId,
	)

	const name =
		conversation.conversationName ||
		(otherParticipant
			? `${otherParticipant.firstName} ${otherParticipant.lastName}`.trim() ||
				otherParticipant.username
			: 'Unknown')

	const avatar =
		conversation.conversationAvatar ||
		otherParticipant?.avatar ||
		'/placeholder-avatar.svg'

	const hasUnread = conversation.unreadCount && conversation.unreadCount > 0

	return (
		<button
			onClick={onClick}
			className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl p-3 text-left transition-all duration-200 ${
				isSelected ? 'bg-brand/10' : 'hover:bg-bg-elevated'
			}`}
		>
			{/* Avatar */}
			<div className='relative size-12 flex-shrink-0'>
				<Image
					src={avatar}
					alt={name}
					fill
					className='rounded-full object-cover'
				/>
			</div>

			{/* Content */}
			<div className='min-w-0 flex-1'>
				<div className='flex items-center justify-between gap-2'>
					<span
						className={`truncate font-semibold ${
							hasUnread ? 'text-text' : 'text-text-secondary'
						}`}
					>
						{name}
					</span>
					{conversation.lastMessage && (
						<span className='flex-shrink-0 text-xs text-text-muted'>
							{formatMessageTime(conversation.lastMessage.createdDate)}
						</span>
					)}
				</div>
				{conversation.lastMessage && (
					<p
						className={`mt-0.5 truncate text-sm ${
							hasUnread ? 'font-medium text-text' : 'text-text-muted'
						}`}
					>
						{conversation.lastMessage.message}
					</p>
				)}
			</div>

			{/* Unread badge */}
			{hasUnread && (
				<span className='flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white'>
					{conversation.unreadCount! > 9 ? '9+' : conversation.unreadCount}
				</span>
			)}
		</button>
	)
}

function MessageBubble({
	message,
	isMe,
	showAvatar,
	onReact,
	onDelete,
	onReply,
	onCopy,
}: {
	message: ChatMessageType
	isMe: boolean
	showAvatar?: boolean
	onReact?: (messageId: string, emoji: string) => void
	onDelete?: (messageId: string) => void
	onReply?: (message: Message) => void
	onCopy?: (content: string) => void
}) {
	// Map backend ChatMessage to frontend Message format
	const mappedMessage: Message = {
		...mapChatMessageToMessage(message),
		// Override isOwn with computed value for WebSocket broadcasts
		isOwn: isMe,
	}

	// Get sender info for non-own messages
	const senderAvatar = !isMe ? message.sender?.avatar : undefined
	const senderName = !isMe
		? `${message.sender?.firstName || ''} ${message.sender?.lastName || ''}`.trim() ||
			message.sender?.username
		: undefined

	return (
		<ChatMessage
			message={mappedMessage}
			senderAvatar={senderAvatar}
			senderName={senderName}
			showAvatar={showAvatar}
			onReact={onReact}
			onDelete={onDelete}
			onReply={onReply}
			onCopy={onCopy}
		/>
	)
}

function EmptyConversations() {
	return (
		<div className='flex h-full flex-col items-center justify-center gap-4 p-6 text-center'>
			<div className='grid size-16 place-items-center rounded-2xl bg-brand/10'>
				<MessageCircle className='size-8 text-brand' />
			</div>
			<div>
				<h3 className='font-semibold text-text'>No conversations yet</h3>
				<p className='mt-1 text-sm text-text-muted'>
					Visit a chef&apos;s profile to start chatting! 🍳
				</p>
			</div>
		</div>
	)
}

function WelcomeState({ hasConversations }: { hasConversations: boolean }) {
	return (
		<div className='flex h-full flex-col items-center justify-center gap-4 p-6 text-center'>
			<motion.div
				initial={{ scale: 0.8, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={TRANSITION_SPRING}
				className='grid size-20 place-items-center rounded-2xl bg-gradient-hero'
			>
				<Sparkles className='size-10 text-white' />
			</motion.div>
			<div>
				<h2 className='text-xl font-bold text-text'>Welcome to Messages</h2>
				<p className='mt-2 text-text-secondary'>
					{hasConversations
						? 'Select a conversation to continue chatting'
						: "Start a conversation from any chef's profile"}
				</p>
			</div>
		</div>
	)
}

function ConnectionStatus({
	isConnected,
	error,
}: {
	isConnected: boolean
	error: string | null
}) {
	if (isConnected) {
		return (
			<div className='flex items-center gap-1.5 text-xs text-success'>
				<Wifi className='size-3' />
				<span>Connected</span>
			</div>
		)
	}

	return (
		<div className='flex items-center gap-1.5 text-xs text-text-muted'>
			<WifiOff className='size-3' />
			<span>{error || 'Connecting...'}</span>
		</div>
	)
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function MessagesPage() {
	const { user } = useAuth()
	const searchParams = useSearchParams()
	const targetUserId = searchParams.get('userId')

	// State
	const [conversations, setConversations] = useState<Conversation[]>([])
	const [messages, setMessages] = useState<ChatMessageType[]>([])
	const [selectedConversation, setSelectedConversation] =
		useState<Conversation | null>(null)
	const [newMessage, setNewMessage] = useState('')
	const [searchQuery, setSearchQuery] = useState('')
	const [isLoadingConversations, setIsLoadingConversations] = useState(true)
	const [isLoadingMessages, setIsLoadingMessages] = useState(false)
	const [isSending, setIsSending] = useState(false)
	const [isCreatingConversation, setIsCreatingConversation] = useState(false)
	const [conversationError, setConversationError] = useState<string | null>(
		null,
	)
	const [retryCount, setRetryCount] = useState(0)
	const [isVideoCallActive, setIsVideoCallActive] = useState(false)

	// Reply state
	const [replyingTo, setReplyingTo] = useState<Message | null>(null)

	// @mention tagged users (captured for future backend support)
	const taggedUserIdsRef = useRef<string[]>([])

	// Mobile: show chat panel when conversation selected
	const [showMobileChat, setShowMobileChat] = useState(false)

	const messagesEndRef = useRef<HTMLDivElement>(null)
	const messagesContainerRef = useRef<HTMLDivElement>(null)
	const isNearBottomRef = useRef(true)
	const inputRef = useRef<MentionInputRef>(null)
	const hasHandledUserIdRef = useRef(false)

	// Handle incoming WebSocket messages
	const handleIncomingMessage = useCallback((message: ChatMessageType) => {
		setMessages(prev => {
			if (prev.some(m => m.id === message.id)) return prev
			return [...prev, message]
		})
	}, [])

	// Handle new conversation notifications via WebSocket
	const handleNewConversation = useCallback((conversation: Conversation) => {
		setConversations(prev => {
			// Don't add duplicates
			if (prev.some(c => c.id === conversation.id)) return prev
			// Add to beginning of list
			return [conversation, ...prev]
		})
	}, [])

	// WebSocket connection
	const {
		sendMessage: sendMessageWs,
		isConnected,
		error: wsError,
	} = useChatWebSocket({
		conversationId: selectedConversation?.id ?? null,
		onMessage: handleIncomingMessage,
		onNewConversation: handleNewConversation,
		userId: user?.userId,
		enabled: true,
	})

	// Initialize chat & handle ?userId= param
	useEffect(() => {
		// Reset the guard so a new targetUserId is handled on re-navigation
		hasHandledUserIdRef.current = false
		let cancelled = false

		const initializeChat = async () => {
			setIsLoadingConversations(true)
			setConversationError(null)

			try {
				const response = await getMyConversations()
				if (cancelled) return
				if (!response.success || !response.data) {
					setConversationError(
						response.message || 'Failed to load conversations',
					)
					setIsLoadingConversations(false)
					return
				}

				const allConversations = response.data
				setConversations(allConversations)

				// Handle incoming ?userId= from profile "Message" button
				if (targetUserId && !hasHandledUserIdRef.current) {
					hasHandledUserIdRef.current = true
					setIsCreatingConversation(true)

					// Check if conversation already exists
					const existingConversation = allConversations.find(
						conv =>
							conv.type === 'DIRECT' &&
							conv.participants.some(p => p.userId === targetUserId),
					)

					if (existingConversation) {
						if (!cancelled) {
							setSelectedConversation(existingConversation)
							setShowMobileChat(true)
						}
					} else {
						// Create new conversation
						const createResponse = await createConversation({
							type: 'DIRECT',
							participantIds: [targetUserId],
						})
						if (cancelled) return

						if (createResponse.success && createResponse.data) {
							setConversations(prev => [createResponse.data!, ...prev])
							setSelectedConversation(createResponse.data)
							setShowMobileChat(true)
						} else {
							setConversationError(
								createResponse.message || 'Failed to start conversation',
							)
						}
					}
					if (!cancelled) setIsCreatingConversation(false)
				}
			} catch (err) {
				if (cancelled) return
				logDevError('Failed to initialize chat:', err)
				setConversationError('Failed to load conversations')
			} finally {
				if (!cancelled) setIsLoadingConversations(false)
			}
		}

		initializeChat()
		return () => {
			cancelled = true
		}
	}, [targetUserId, retryCount])

	// Fetch messages when conversation changes
	const selectedConversationId = selectedConversation?.id
	useEffect(() => {
		if (!selectedConversationId) {
			setMessages([])
			return
		}

		let cancelled = false
		const fetchMessages = async () => {
			setIsLoadingMessages(true)
			try {
				const response = await getMessages(selectedConversationId)
				if (cancelled) return
				if (response.success && response.data) {
					setMessages(response.data)
				}
			} catch (err) {
				if (cancelled) return
				logDevError('Failed to fetch messages:', err)
				toast.error('Could not load messages')
			} finally {
				if (!cancelled) setIsLoadingMessages(false)
			}
		}

		fetchMessages()
		// Focus input
		setTimeout(() => inputRef.current?.focus(), 100)
		return () => {
			cancelled = true
		}
	}, [selectedConversationId])

	// Track scroll position to decide auto-scroll behavior
	useEffect(() => {
		const container = messagesContainerRef.current
		if (!container) return
		const handleScroll = () => {
			const { scrollTop, scrollHeight, clientHeight } = container
			isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100
		}
		container.addEventListener('scroll', handleScroll)
		return () => container.removeEventListener('scroll', handleScroll)
	}, [selectedConversationId])

	// Scroll to bottom on new messages only if user is near bottom
	useEffect(() => {
		if (isNearBottomRef.current) {
			messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
		}
	}, [messages])

	// Send message handler
	const handleSendMessage = async () => {
		if (!newMessage.trim() || !selectedConversation || isSending) return

		const messageText = newMessage.trim()
		const replyToId = replyingTo?.id
		setNewMessage('')
		setReplyingTo(null)
		taggedUserIdsRef.current = []

		if (isConnected) {
			sendMessageWs(messageText, replyToId)
		} else {
			// Fallback to REST
			setIsSending(true)
			try {
				const response = await sendMessageRest({
					conversationId: selectedConversation.id,
					message: messageText,
					replyToId,
				})
				if (response.success && response.data) {
					setMessages(prev => [...prev, response.data!])
				} else {
					setNewMessage(messageText)
					toast.error('Failed to send message')
				}
			} catch (err) {
				logDevError('Failed to send message:', err)
				setNewMessage(messageText)
				toast.error('Failed to send message')
			} finally {
				setIsSending(false)
			}
		}
	}

	// Select conversation (and show mobile chat)
	const handleSelectConversation = (conv: Conversation) => {
		setSelectedConversation(conv)
		setShowMobileChat(true)
	}

	// React to a message
	const reactingRef = useRef(new Set<string>())
	const handleReact = useCallback(async (messageId: string, emoji: string) => {
		if (reactingRef.current.has(messageId)) return
		reactingRef.current.add(messageId)
		try {
			const response = await reactToMessage(messageId, emoji)
			if (response.success && response.data) {
				setMessages(prev =>
					prev.map(m => (m.id === messageId ? response.data! : m)),
				)
			} else {
				toast.error('Failed to react to message')
			}
		} catch {
			toast.error('Failed to react to message')
		} finally {
			reactingRef.current.delete(messageId)
		}
	}, [])

	// Delete a message (own messages only)
	const deletingRef = useRef(new Set<string>())
	const handleDelete = useCallback(async (messageId: string) => {
		if (deletingRef.current.has(messageId)) return
		deletingRef.current.add(messageId)
		try {
			const response = await deleteMessage(messageId)
			if (response.success && response.data) {
				setMessages(prev =>
					prev.map(m => (m.id === messageId ? response.data! : m)),
				)
			} else {
				toast.error('Failed to delete message')
			}
		} catch {
			toast.error('Failed to delete message')
		} finally {
			deletingRef.current.delete(messageId)
		}
	}, [])

	// Reply to a message - focus input and prepend reply context
	const handleReply = useCallback((message: Message) => {
		setReplyingTo(message)
		inputRef.current?.focus()
	}, [])

	// Copy message content
	const handleCopy = useCallback(async (content: string) => {
		try {
			await navigator.clipboard.writeText(content)
		} catch {
			toast.error('Failed to copy message')
		}
	}, [])

	// Back to list (mobile)
	const handleBackToList = () => {
		setShowMobileChat(false)
	}

	// Filter conversations by search
	const filteredConversations = conversations.filter(conv => {
		if (!searchQuery.trim()) return true
		const name =
			conv.conversationName ||
			conv.participants
				.filter(p => p.userId !== user?.userId)
				.map(p => `${p.firstName} ${p.lastName} ${p.username}`)
				.join(' ')
		return name.toLowerCase().includes(searchQuery.toLowerCase())
	})

	// Get selected conversation display info
	const getSelectedInfo = () => {
		if (!selectedConversation) return { name: '', avatar: '' }
		const other = selectedConversation.participants.find(
			p => p.userId !== user?.userId,
		)
		return {
			name:
				selectedConversation.conversationName ||
				(other
					? `${other.firstName} ${other.lastName}`.trim() || other.username
					: 'Unknown'),
			avatar:
				selectedConversation.conversationAvatar ||
				other?.avatar ||
				'/placeholder-avatar.svg',
		}
	}

	const selectedInfo = getSelectedInfo()

	// ============================================
	// RENDER: Master-Detail Split-Pane Layout
	// ============================================

	return (
		<div className='flex h-[calc(100vh-4rem)] overflow-hidden'>
			{/* ========== LEFT PANEL: Conversations Sidebar ========== */}
			{/* Full height, fixed width on desktop, full screen on mobile when no chat selected */}
			<aside
				className={`flex h-full w-full flex-col border-r border-border-subtle bg-bg-card md:w-80 md:flex-shrink-0 ${
					showMobileChat ? 'hidden md:flex' : 'flex'
				}`}
			>
				{/* Sidebar Header */}
				<header className='flex-shrink-0 border-b border-border-subtle p-4'>
					<div className='mb-3 flex items-center gap-3'>
						<div className='flex size-10 items-center justify-center rounded-xl bg-gradient-hero shadow-card shadow-brand/25'>
							<MessageCircle className='size-5 text-white' />
						</div>
						<h1 className='text-2xl font-bold text-text'>Messages</h1>
					</div>
					{/* Search */}
					<div className='relative mt-3'>
						<Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted' />
						<Input
							placeholder='Search conversations...'
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
							className='bg-bg-elevated pl-9'
						/>
					</div>
				</header>

				{/* Conversations List - Scrollable */}
				<nav className='flex-1 overflow-y-auto px-2 py-2'>
					{isLoadingConversations ? (
						<div className='flex items-center justify-center py-12'>
							<Loader2 className='size-6 animate-spin text-text-muted' />
						</div>
					) : conversationError ? (
						<div className='flex flex-col items-center gap-3 p-6 text-center'>
							<p className='text-sm text-error'>{conversationError}</p>
							<Button
								variant='outline'
								size='sm'
								onClick={() => {
									setConversationError(null)
									setRetryCount(c => c + 1)
								}}
							>
								Retry
							</Button>
						</div>
					) : filteredConversations.length === 0 ? (
						<EmptyConversations />
					) : (
						<div className='flex flex-col gap-1'>
							<AnimatePresence initial={false} mode='popLayout'>
								{filteredConversations.map(conv => (
									<motion.div
										key={conv.id}
										initial={{ opacity: 0, y: -10, scale: 0.95 }}
										animate={{ opacity: 1, y: 0, scale: 1 }}
										exit={{ opacity: 0, scale: 0.95 }}
										transition={TRANSITION_SPRING}
										layout
									>
										<ConversationItem
											conversation={conv}
											isSelected={selectedConversation?.id === conv.id}
											currentUserId={user?.userId}
											onClick={() => handleSelectConversation(conv)}
										/>
									</motion.div>
								))}
							</AnimatePresence>
						</div>
					)}
				</nav>
			</aside>

			{/* ========== RIGHT PANEL: Chat Area ========== */}
			{/* Full height, takes remaining space */}
			<main
				className={`flex h-full flex-1 flex-col bg-bg ${
					showMobileChat ? 'flex' : 'hidden md:flex'
				}`}
			>
				{selectedConversation ? (
					<>
						{/* Chat Header */}
						<header className='flex flex-shrink-0 items-center gap-3 border-b border-border-subtle bg-bg-card px-4 py-3 md:px-6 md:py-4'>
							{/* Back button (mobile only) */}
							<Button
								variant='ghost'
								size='icon'
								onClick={handleBackToList}
								className='md:hidden'
								aria-label='Back to conversations'
							>
								<ArrowLeft className='size-5' />
							</Button>

							{/* User info */}
							<div className='relative size-10 flex-shrink-0'>
								<Image
									src={selectedInfo.avatar}
									alt={selectedInfo.name}
									fill
									className='rounded-full object-cover'
								/>
							</div>
							<div className='min-w-0 flex-1'>
								<h2 className='truncate font-semibold text-text'>
									{selectedInfo.name}
								</h2>
								<ConnectionStatus isConnected={isConnected} error={wsError} />
							</div>

							{/* Top Right Action - Video Call */}
							{user && (
								<Button
									variant='ghost'
									size='icon'
									onClick={() => setIsVideoCallActive(true)}
									className='text-brand hover:bg-brand/10'
									aria-label='Start video call'
								>
									<Phone className='size-5' />
								</Button>
							)}
						</header>

						{/* Video Call Modal / Overlay */}
						{isVideoCallActive && selectedConversation && user && (
							<Portal>
								<div className='fixed inset-0 z-modal flex items-center justify-center bg-black/80 backdrop-blur-sm p-4'>
									<div className='relative w-full max-w-5xl bg-bg rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200'>
										<Button
											variant='ghost'
											size='icon'
											className='absolute -top-3 -right-3 z-[60] bg-bg-card rounded-full shadow-card text-error hover:bg-error/10 hover:text-error-vivid size-10'
											onClick={() => setIsVideoCallActive(false)}
											aria-label='End video call'
										>
											<X className='size-5' />
										</Button>

										<VideoCall
											conversationId={selectedConversation.id}
											currentUserId={user.userId}
											onClose={() => setIsVideoCallActive(false)}
										/>
									</div>
								</div>
							</Portal>
						)}

						{/* Messages Area - Scrollable */}
						<div
							ref={messagesContainerRef}
							className='flex-1 overflow-y-auto px-4 py-4 md:px-6'
						>
							{isLoadingMessages ? (
								<div className='flex h-full items-center justify-center'>
									<Loader2 className='size-6 animate-spin text-text-muted' />
								</div>
							) : messages.length === 0 ? (
								<div className='flex h-full flex-col items-center justify-center gap-3 text-center'>
									<div className='grid size-14 place-items-center rounded-2xl bg-bg-elevated'>
										<MessageCircle className='size-7 text-text-muted' />
									</div>
									<p className='text-text-secondary'>
										No messages yet. Say hello! 👋
									</p>
								</div>
							) : (
								<div className='flex flex-col gap-3'>
									<AnimatePresence mode='popLayout'>
										{messages.map((message, idx) => {
											// Compute isMe client-side to handle WebSocket broadcasts correctly
											// Server's `me` field is only accurate for REST calls (computed for requester)
											// WebSocket broadcasts same message to all participants
											const isMe = message.sender?.userId === user?.userId
											return (
												<MessageBubble
													key={message.id}
													message={message}
													isMe={isMe}
													showAvatar={
														!isMe &&
														(idx === 0 ||
															messages[idx - 1]?.sender?.userId ===
																user?.userId)
													}
													onReact={handleReact}
													onDelete={handleDelete}
													onReply={handleReply}
													onCopy={handleCopy}
												/>
											)
										})}
									</AnimatePresence>
									<div ref={messagesEndRef} />
								</div>
							)}
						</div>

						{/* Input Area */}
						<footer className='flex-shrink-0 border-t border-border-subtle bg-bg-card p-3 md:p-4'>
							{/* Reply Preview */}
							{replyingTo && (
								<div className='mb-2 flex items-center gap-2 rounded-lg border border-brand/30 bg-brand/5 px-3 py-2'>
									<div className='min-w-0 flex-1'>
										<p className='truncate text-xs font-medium text-brand'>
											Replying to{' '}
											{replyingTo.isOwn
												? 'yourself'
												: (() => {
														const orig = messages.find(
															m => m.id === replyingTo.id,
														)
														return orig?.sender
															? `${orig.sender.firstName || ''} ${orig.sender.lastName || ''}`.trim() ||
																	orig.sender.username
															: 'message'
													})()}
										</p>
										<p className='truncate text-xs text-text-secondary'>
											{replyingTo.content}
										</p>
									</div>
									<button
										type='button'
										onClick={() => setReplyingTo(null)}
										className='flex-shrink-0 rounded p-1 text-text-muted hover:bg-bg-elevated hover:text-text'
									>
										<X className='size-3.5' />
									</button>
								</div>
							)}
							<div className='flex items-center gap-3'>
								<MentionInput
									ref={inputRef}
									placeholder='Type a message... (use @ to mention)'
									value={newMessage}
									onChange={setNewMessage}
									onTaggedUsersChange={ids => {
										taggedUserIdsRef.current = ids
									}}
									onSubmit={handleSendMessage}
									disabled={isSending}
									className='bg-bg-elevated'
									maxLength={4000}
								/>
								<Button
									onClick={handleSendMessage}
									disabled={!newMessage.trim() || isSending}
									size='icon'
									className='bg-brand text-white hover:bg-brand-hover'
								>
									{isSending ? (
										<Loader2 className='size-5 animate-spin' />
									) : (
										<Send className='size-5' />
									)}
								</Button>
							</div>
							{!isConnected && wsError && (
								<p className='mt-2 text-xs text-text-muted'>
									WebSocket unavailable — messages sent via REST
								</p>
							)}
						</footer>
					</>
				) : isCreatingConversation ? (
					<div className='flex h-full items-center justify-center'>
						<div className='flex flex-col items-center gap-3'>
							<Loader2 className='size-8 animate-spin text-brand' />
							<p className='text-text-secondary'>Starting conversation...</p>
						</div>
					</div>
				) : (
					<WelcomeState hasConversations={conversations.length > 0} />
				)}
			</main>
		</div>
	)
}
