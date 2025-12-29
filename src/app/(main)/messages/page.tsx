'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
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
} from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { useChatWebSocket } from '@/hooks/useChatWebSocket'
import {
	getMyConversations,
	getMessages,
	sendMessage as sendMessageRest,
	createConversation,
	Conversation,
	ChatMessage,
} from '@/services/chat'
import { TRANSITION_SPRING } from '@/lib/motion'

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
		'/placeholder-avatar.png'

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
				{/* Online indicator */}
				<span className='absolute bottom-0 right-0 size-3 rounded-full border-2 border-bg-card bg-success' />
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
}: {
	message: ChatMessage
	isMe: boolean
	showAvatar?: boolean
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10, scale: 0.95 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={TRANSITION_SPRING}
			className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
		>
			{/* Avatar for received messages */}
			{!isMe && showAvatar && (
				<div className='size-8 flex-shrink-0 rounded-full bg-bg-elevated' />
			)}
			{!isMe && !showAvatar && <div className='size-8 flex-shrink-0' />}

			{/* Bubble */}
			<div
				className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
					isMe
						? 'rounded-br-md bg-brand text-white'
						: 'rounded-bl-md bg-bg-elevated text-text'
				}`}
			>
				<p className='text-sm leading-relaxed'>{message.message}</p>
				<div
					className={`mt-1 flex items-center justify-end gap-1 text-xs ${
						isMe ? 'text-white/70' : 'text-text-muted'
					}`}
				>
					<span>
						{new Date(message.createdDate).toLocaleTimeString([], {
							hour: '2-digit',
							minute: '2-digit',
						})}
					</span>
					{isMe && <CheckCheck className='size-3.5' />}
				</div>
			</div>
		</motion.div>
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
				className='grid size-20 place-items-center rounded-3xl bg-gradient-hero'
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
	const [messages, setMessages] = useState<ChatMessage[]>([])
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

	// Mobile: show chat panel when conversation selected
	const [showMobileChat, setShowMobileChat] = useState(false)

	const messagesEndRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)
	const hasHandledUserIdRef = useRef(false)

	// Handle incoming WebSocket messages
	const handleIncomingMessage = useCallback((message: ChatMessage) => {
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
		const initializeChat = async () => {
			setIsLoadingConversations(true)
			setConversationError(null)

			try {
				const response = await getMyConversations()
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
						setSelectedConversation(existingConversation)
						setShowMobileChat(true)
					} else {
						// Create new conversation
						const createResponse = await createConversation({
							type: 'DIRECT',
							participantIds: [targetUserId],
						})

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
					setIsCreatingConversation(false)
				}
			} catch (err) {
				console.error('Failed to initialize chat:', err)
				setConversationError('Failed to load conversations')
			} finally {
				setIsLoadingConversations(false)
			}
		}

		initializeChat()
	}, [targetUserId])

	// Fetch messages when conversation changes
	const selectedConversationId = selectedConversation?.id
	useEffect(() => {
		if (!selectedConversationId) {
			setMessages([])
			return
		}

		const fetchMessages = async () => {
			setIsLoadingMessages(true)
			try {
				const response = await getMessages(selectedConversationId)
				if (response.success && response.data) {
					setMessages(response.data)
				}
			} catch (err) {
				console.error('Failed to fetch messages:', err)
			} finally {
				setIsLoadingMessages(false)
			}
		}

		fetchMessages()
		// Focus input
		setTimeout(() => inputRef.current?.focus(), 100)
	}, [selectedConversationId])

	// Scroll to bottom on new messages
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages])

	// Send message handler
	const handleSendMessage = async () => {
		if (!newMessage.trim() || !selectedConversation || isSending) return

		const messageText = newMessage.trim()
		setNewMessage('')

		if (isConnected) {
			sendMessageWs(messageText)
		} else {
			// Fallback to REST
			setIsSending(true)
			try {
				const response = await sendMessageRest({
					conversationId: selectedConversation.id,
					message: messageText,
				})
				if (response.success && response.data) {
					setMessages(prev => [...prev, response.data!])
				} else {
					setNewMessage(messageText)
				}
			} catch (err) {
				console.error('Failed to send message:', err)
				setNewMessage(messageText)
			} finally {
				setIsSending(false)
			}
		}
	}

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSendMessage()
		}
	}

	// Select conversation (and show mobile chat)
	const handleSelectConversation = (conv: Conversation) => {
		setSelectedConversation(conv)
		setShowMobileChat(true)
	}

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
				'/placeholder-avatar.png',
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
					<h1 className='text-2xl font-bold text-text'>Messages</h1>
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
								onClick={() => window.location.reload()}
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
								<span className='absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-bg-card bg-success' />
							</div>
							<div className='min-w-0 flex-1'>
								<h2 className='truncate font-semibold text-text'>
									{selectedInfo.name}
								</h2>
								<ConnectionStatus isConnected={isConnected} error={wsError} />
							</div>
						</header>

						{/* Messages Area - Scrollable */}
						<div className='flex-1 overflow-y-auto px-4 py-4 md:px-6'>
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
							<div className='flex items-center gap-3'>
								<Input
									ref={inputRef}
									placeholder='Type a message...'
									value={newMessage}
									onChange={e => setNewMessage(e.target.value)}
									onKeyDown={handleKeyPress}
									disabled={isSending}
									className='flex-1 bg-bg-elevated'
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
