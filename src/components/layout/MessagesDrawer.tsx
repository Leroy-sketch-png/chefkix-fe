'use client'

import { Send, X, Search, Loader2, MessageSquare } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from '@/components/ui/input-group'
import { useUiStore } from '@/store/uiStore'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
	getMyConversations,
	getMessages,
	sendMessage,
	Conversation,
	ChatMessage,
} from '@/services/chat'
import Image from 'next/image'
import { logDevError } from '@/lib/dev-log'
import Link from 'next/link'
import { PATHS } from '@/constants/paths'
import { useEscapeKey } from '@/hooks/useEscapeKey'

export const MessagesDrawer = () => {
	const t = useTranslations('messages')
	const { user } = useAuth()
	const { isMessagesDrawerOpen, toggleMessagesDrawer } = useUiStore()

	useEscapeKey(isMessagesDrawerOpen, toggleMessagesDrawer)
	const [width, setWidth] = useState<number | null>(null) // Start null, use CSS variable
	const [height, setHeight] = useState<number | null>(null)
	const [isResizing, setIsResizing] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const drawerRef = useRef<HTMLDivElement>(null)
	const messagesEndRef = useRef<HTMLDivElement>(null)

	// Chat state
	const [conversations, setConversations] = useState<Conversation[]>([])
	const [selectedConversation, setSelectedConversation] =
		useState<Conversation | null>(null)
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [newMessage, setNewMessage] = useState('')
	const [isLoadingConversations, setIsLoadingConversations] = useState(false)
	const [isLoadingMessages, setIsLoadingMessages] = useState(false)
	const [isSending, setIsSending] = useState(false)

	// Fetch conversations when drawer opens
	useEffect(() => {
		if (!isMessagesDrawerOpen) return

		const fetchConversations = async () => {
			setIsLoadingConversations(true)
			try {
				const response = await getMyConversations()
				if (response.success && response.data) {
					setConversations(response.data)
				}
			} catch (err) {
				logDevError('Failed to fetch conversations:', err)
			} finally {
				setIsLoadingConversations(false)
			}
		}

		fetchConversations()
	}, [isMessagesDrawerOpen])

	// Fetch messages when conversation is selected
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
				logDevError('Failed to fetch messages:', err)
			} finally {
				setIsLoadingMessages(false)
			}
		}

		fetchMessages()
	}, [selectedConversationId])

	// Scroll to bottom when messages change
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages])

	// Handle resize
	useEffect(() => {
		if (!isResizing) return

		const handleMouseMove = (e: MouseEvent) => {
			if (!drawerRef.current) return
			const rect = drawerRef.current.getBoundingClientRect()

			// Calculate new width (from right edge)
			const newWidth = window.innerWidth - e.clientX - 20 // 20px = right margin
			// Calculate new height (from bottom edge)
			const newHeight = window.innerHeight - e.clientY

			if (newWidth > 300 && newWidth < 800) {
				setWidth(newWidth)
			}
			if (newHeight > 300 && newHeight < 800) {
				setHeight(newHeight)
			}
		}

		const handleMouseUp = () => {
			setIsResizing(false)
		}

		document.addEventListener('mousemove', handleMouseMove)
		document.addEventListener('mouseup', handleMouseUp)

		return () => {
			document.removeEventListener('mousemove', handleMouseMove)
			document.removeEventListener('mouseup', handleMouseUp)
		}
	}, [isResizing])

	// Helper functions
	const getConversationName = useCallback(
		(conv: Conversation) => {
			if (conv.conversationName) return conv.conversationName
			const otherParticipant = conv.participants.find(
				p => p.userId !== user?.userId,
			)
			return otherParticipant
				? `${otherParticipant.firstName} ${otherParticipant.lastName}`.trim() ||
						otherParticipant.username
				: 'Unknown'
		},
		[user?.userId],
	)

	const getConversationAvatar = useCallback(
		(conv: Conversation) => {
			if (conv.conversationAvatar) return conv.conversationAvatar
			const otherParticipant = conv.participants.find(
				p => p.userId !== user?.userId,
			)
			return otherParticipant?.avatar || '/placeholder-avatar.svg'
		},
		[user?.userId],
	)

	const handleSendMessage = async () => {
		if (!newMessage.trim() || !selectedConversation || isSending) return

		setIsSending(true)
		try {
			const response = await sendMessage({
				conversationId: selectedConversation.id,
				message: newMessage.trim(),
			})

			if (response.success && response.data) {
				setMessages(prev => [...prev, response.data!])
				setNewMessage('')
			}
		} catch (err) {
			logDevError('Failed to send message:', err)
		} finally {
			setIsSending(false)
		}
	}

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSendMessage()
		}
	}

	const filteredConversations = conversations.filter(conv =>
		getConversationName(conv).toLowerCase().includes(searchTerm.toLowerCase()),
	)

	if (!isMessagesDrawerOpen) return null

	return (
		<div
			ref={drawerRef}
			className='fixed bottom-0 right-6 z-popover flex w-drawer h-drawer flex-col rounded-t-lg border bg-card text-card-foreground shadow-lg'
			style={
				width || height
					? {
							width: width ? `${width}px` : undefined,
							height: height ? `${height}px` : undefined,
						}
					: undefined
			}
		>
			{/* Resize handle */}
			<div
				onMouseDown={() => setIsResizing(true)}
				className='absolute left-0 top-0 flex h-full w-2 cursor-ew-resize items-center justify-center hover:bg-brand/10'
			>
				<div className='h-12 w-1 rounded-full bg-border' />
			</div>
			<div
				onMouseDown={() => setIsResizing(true)}
				className='absolute left-0 top-0 flex h-2 w-full cursor-ns-resize items-center justify-center hover:bg-brand/10'
			>
				<div className='h-1 w-12 rounded-full bg-border' />
			</div>

			<div className='flex items-center justify-between border-b p-3'>
				<h3 className='font-semibold'>{t('drawerTitle')}</h3>
				<Button
					variant='ghost'
					size='icon'
					onClick={toggleMessagesDrawer}
					aria-label={t('ariaCloseMessages')}
				>
					<X className='size-4' />
				</Button>
			</div>

			{/* Search conversations */}
			<div className='border-b p-3'>
				<InputGroup>
					<InputGroupAddon align='inline-start'>
						<Search className='size-4 text-text-muted' />
					</InputGroupAddon>
					<InputGroupInput
						placeholder={t('searchConversations')}
						value={searchTerm}
						onChange={e => setSearchTerm(e.target.value)}
					/>
				</InputGroup>
			</div>

			<div className='flex-1 overflow-y-auto'>
				{selectedConversation ? (
					// Chat view
					<div className='flex h-full flex-col'>
						{/* Chat header */}
						<div className='flex items-center gap-2 border-b p-2'>
							<Button
								variant='ghost'
								size='sm'
								onClick={() => setSelectedConversation(null)}
								className='h-7 px-2 text-xs'
							>
								← Back
							</Button>
							<div className='relative size-6 overflow-hidden rounded-full'>
								<Image
									src={getConversationAvatar(selectedConversation)}
									alt={getConversationName(selectedConversation)}
									fill
									sizes='24px'
									className='object-cover'
								/>
							</div>
							<span className='text-sm font-medium'>
								{getConversationName(selectedConversation)}
							</span>
						</div>
						{/* Messages */}
						<div className='flex-1 overflow-y-auto p-3'>
							{isLoadingMessages ? (
								<div className='flex h-full items-center justify-center'>
									<Loader2 className='size-5 animate-spin text-text-secondary' />
								</div>
							) : messages.length === 0 ? (
									<div className='flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-text-secondary'>
										<MessageSquare className='size-8 text-text-muted' />
										{t('noMessagesYet')}
								</div>
							) : (
								<div className='flex flex-col gap-2'>
									{messages.map(message => (
										<div
											key={message.id}
											className={`flex items-end ${message.me ? 'justify-end' : 'justify-start'}`}
										>
											<div
												className={`max-w-[70%] rounded-lg p-2 ${
													message.me
														? 'rounded-br-none bg-brand text-white'
														: 'rounded-bl-none bg-bg-elevated'
												}`}
											>
												<p className='text-sm'>{message.message}</p>
											</div>
										</div>
									))}
									<div ref={messagesEndRef} />
								</div>
							)}
						</div>
					</div>
				) : (
					// Conversations list
					<div className='p-2'>
						{isLoadingConversations ? (
							<div className='flex items-center justify-center py-8'>
								<Loader2 className='size-5 animate-spin text-text-secondary' />
							</div>
						) : filteredConversations.length === 0 ? (
							<div className='flex flex-col items-center justify-center gap-2 py-8 text-center text-text-secondary'>
								<MessageSquare className='size-8' />
								<p className='text-sm'>
									{searchTerm
										? t('noConversationsFound')
										: t('noConversationsYet')}
								</p>
								<Link
									href={PATHS.COMMUNITY}
									onClick={toggleMessagesDrawer}
									className='text-xs text-brand hover:underline'
								>
									{t('findPeopleToChat')}
								</Link>
							</div>
						) : (
							<div className='flex flex-col gap-1'>
								{filteredConversations.map(conv => (
									<button
										type='button'
										key={conv.id}
										onClick={() => setSelectedConversation(conv)}
										className='flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors hover:bg-bg-hover'
									>
										<div className='relative size-9 flex-shrink-0 overflow-hidden rounded-full'>
											<Image
												src={getConversationAvatar(conv)}
												alt={getConversationName(conv)}
												fill
												sizes='36px'
												className='object-cover'
											/>
										</div>
										<div className='min-w-0 flex-1'>
											<p className='truncate text-sm font-medium'>
												{getConversationName(conv)}
											</p>
											{conv.lastMessage && (
												<p className='truncate text-xs text-text-secondary'>
													{conv.lastMessage.message}
												</p>
											)}
										</div>
										{conv.unreadCount && conv.unreadCount > 0 && (
											<span className='flex size-5 items-center justify-center rounded-full bg-brand text-xs font-bold text-white'>
												{conv.unreadCount}
											</span>
										)}
									</button>
								))}
							</div>
						)}
					</div>
				)}
			</div>
			<div className='flex items-center gap-2 border-t p-3'>
				{selectedConversation ? (
					<>
						<InputGroup className='flex-1'>
							<InputGroupInput
								placeholder={t('typeMessage')}
								value={newMessage}
								onChange={e => setNewMessage(e.target.value)}
								onKeyDown={handleKeyPress}
								disabled={isSending}
							/>
						</InputGroup>
						<Button
							size='icon'
							onClick={handleSendMessage}
							disabled={!newMessage.trim() || isSending}
						>
							{isSending ? (
								<Loader2 className='size-4 animate-spin' />
							) : (
								<Send className='size-4' />
							)}
						</Button>
					</>
				) : (
					<Link
						href={PATHS.MESSAGES}
						onClick={toggleMessagesDrawer}
						className='flex w-full items-center justify-center gap-2 rounded-lg bg-bg-elevated py-2 text-sm font-medium transition-colors hover:bg-muted/80'
					>
						<MessageSquare className='size-4' />
						Open Full Messages
					</Link>
				)}
			</div>
		</div>
	)
}
