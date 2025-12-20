'use client'

import { useState, useEffect, useRef } from 'react'
import { MoreHorizontal, Send, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageTransition } from '@/components/layout/PageTransition'
import { useAuth } from '@/hooks/useAuth'
import {
	getMyConversations,
	getMessages,
	sendMessage,
	Conversation,
	ChatMessage,
} from '@/services/chat'

export default function MessagesPage() {
	const { user } = useAuth()
	const [conversations, setConversations] = useState<Conversation[]>([])
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [selectedConversation, setSelectedConversation] =
		useState<Conversation | null>(null)
	const [newMessage, setNewMessage] = useState('')
	const [isLoadingConversations, setIsLoadingConversations] = useState(true)
	const [isLoadingMessages, setIsLoadingMessages] = useState(false)
	const [isSending, setIsSending] = useState(false)
	const messagesEndRef = useRef<HTMLDivElement>(null)

	// Fetch conversations on mount
	useEffect(() => {
		const fetchConversations = async () => {
			setIsLoadingConversations(true)
			try {
				const response = await getMyConversations()
				if (response.success && response.data) {
					setConversations(response.data)
					// Auto-select first conversation if exists
					if (response.data.length > 0) {
						setSelectedConversation(response.data[0])
					}
				}
			} catch (err) {
				console.error('Failed to fetch conversations:', err)
			} finally {
				setIsLoadingConversations(false)
			}
		}

		fetchConversations()
	}, [])

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
	}, [selectedConversationId])

	// Scroll to bottom when messages change
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages])

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
			console.error('Failed to send message:', err)
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

	// Get display name for conversation
	const getConversationName = (conv: Conversation) => {
		if (conv.conversationName) return conv.conversationName
		// For direct messages, show the other participant's name
		const otherParticipant = conv.participants.find(
			p => p.userId !== user?.userId,
		)
		return otherParticipant
			? `${otherParticipant.firstName} ${otherParticipant.lastName}`.trim() ||
					otherParticipant.username
			: 'Unknown'
	}

	// Get avatar for conversation
	const getConversationAvatar = (conv: Conversation) => {
		if (conv.conversationAvatar) return conv.conversationAvatar
		const otherParticipant = conv.participants.find(
			p => p.userId !== user?.userId,
		)
		return otherParticipant?.avatar || '/placeholder-avatar.png'
	}

	return (
		<PageTransition className='flex h-full flex-1 flex-col'>
			<div className='flex flex-1 flex-col overflow-hidden rounded-lg border bg-card shadow-sm'>
				{/* Sidebar of conversations */}
				<div className='hidden w-80 flex-shrink-0 flex-col border-r md:flex'>
					<div className='border-b p-4'>
						<h2 className='text-xl font-bold'>Messages</h2>
					</div>
					<div className='flex-1 overflow-y-auto'>
						{isLoadingConversations ? (
							<div className='flex items-center justify-center p-8'>
								<Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
							</div>
						) : conversations.length === 0 ? (
							<div className='p-4 text-center text-muted-foreground'>
								<p>No conversations yet</p>
								<p className='mt-1 text-sm'>
									Start a conversation from a user&apos;s profile
								</p>
							</div>
						) : (
							conversations.map(conv => (
								<div
									key={conv.id}
									onClick={() => setSelectedConversation(conv)}
									className={`flex cursor-pointer items-center gap-3 border-b p-3 transition-colors hover:bg-muted ${
										selectedConversation?.id === conv.id ? 'bg-muted' : ''
									}`}
								>
									<div className='relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full'>
										<Image
											src={getConversationAvatar(conv)}
											alt={getConversationName(conv)}
											fill
											className='object-cover'
										/>
									</div>
									<div className='flex-1 overflow-hidden'>
										<p
											className={`font-semibold ${
												conv.unreadCount && conv.unreadCount > 0
													? ''
													: 'text-muted-foreground'
											}`}
										>
											{getConversationName(conv)}
										</p>
										{conv.lastMessage && (
											<p
												className={`truncate text-sm ${
													conv.unreadCount && conv.unreadCount > 0
														? 'font-semibold'
														: 'text-muted-foreground'
												}`}
											>
												{conv.lastMessage.message}
											</p>
										)}
									</div>
									{conv.unreadCount && conv.unreadCount > 0 && (
										<span className='rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground'>
											{conv.unreadCount}
										</span>
									)}
								</div>
							))
						)}
					</div>
				</div>

				{/* Main Chat Window */}
				<div className='flex flex-1 flex-col'>
					{selectedConversation ? (
						<>
							<div className='flex items-center justify-between border-b p-4'>
								<div className='flex items-center gap-3'>
									<div className='relative h-8 w-8 overflow-hidden rounded-full'>
										<Image
											src={getConversationAvatar(selectedConversation)}
											alt={getConversationName(selectedConversation)}
											fill
											className='object-cover'
										/>
									</div>
									<h3 className='text-lg font-semibold'>
										{getConversationName(selectedConversation)}
									</h3>
								</div>
								<Button variant='ghost' size='icon'>
									<MoreHorizontal className='h-5 w-5' />
								</Button>
							</div>
							<div className='flex-1 overflow-y-auto p-4'>
								{isLoadingMessages ? (
									<div className='flex h-full items-center justify-center'>
										<Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
									</div>
								) : messages.length === 0 ? (
									<div className='flex h-full items-center justify-center text-muted-foreground'>
										<p>No messages yet. Start the conversation!</p>
									</div>
								) : (
									<div className='flex flex-col gap-4'>
										{messages.map(message => (
											<div
												key={message.id}
												className={`flex ${message.me ? 'justify-end' : 'justify-start'}`}
											>
												<div
													className={`max-w-[70%] rounded-lg p-3 ${
														message.me
															? 'rounded-br-none bg-primary text-primary-foreground'
															: 'rounded-bl-none bg-muted'
													}`}
												>
													<p className='text-sm'>{message.message}</p>
													<span className='mt-1 block text-xs opacity-70'>
														{new Date(message.createdDate).toLocaleTimeString(
															[],
															{
																hour: '2-digit',
																minute: '2-digit',
															},
														)}
													</span>
												</div>
											</div>
										))}
										<div ref={messagesEndRef} />
									</div>
								)}
							</div>
							<div className='flex items-center gap-2 border-t p-4'>
								<Input
									placeholder='Type a message...'
									className='flex-1'
									value={newMessage}
									onChange={e => setNewMessage(e.target.value)}
									onKeyDown={handleKeyPress}
									disabled={isSending}
								/>
								<Button
									size='icon'
									onClick={handleSendMessage}
									disabled={!newMessage.trim() || isSending}
								>
									{isSending ? (
										<Loader2 className='h-5 w-5 animate-spin' />
									) : (
										<Send className='h-5 w-5' />
									)}
								</Button>
							</div>
						</>
					) : (
						<div className='flex h-full flex-col items-center justify-center text-muted-foreground'>
							<p className='text-lg font-medium'>Welcome to Messages</p>
							<p className='mt-1 text-sm'>
								{conversations.length > 0
									? 'Select a conversation to start chatting'
									: 'Start a conversation from a user profile'}
							</p>
						</div>
					)}
				</div>
			</div>
		</PageTransition>
	)
}
