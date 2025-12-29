'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Check,
	CheckCheck,
	ThumbsUp,
	Trash2,
	MoreHorizontal,
	Reply,
	Copy,
	Share2,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { TRANSITION_SPRING, scaleIn } from '@/lib/motion'

// =============================================================================
// TYPES
// =============================================================================

export interface Message {
	id: string
	senderId: string
	content: string
	timestamp: Date
	status: 'sending' | 'sent' | 'delivered' | 'read'
	isOwn: boolean
	replyTo?: {
		id: string
		content: string
		senderName: string
	}
	reactions?: {
		emoji: string
		count: number
		userReacted: boolean
	}[]
	type?: 'TEXT' | 'POST_SHARE'
	relatedId?: string // Post ID for POST_SHARE
	sharedPostImage?: string // Post thumbnail
	sharedPostTitle?: string // Optional: recipe title if available
}

interface ChatMessageProps {
	message: Message
	senderAvatar?: string
	senderName?: string
	showAvatar?: boolean
	onReact?: (messageId: string, emoji: string) => void
	onDelete?: (messageId: string) => void
	onReply?: (message: Message) => void
	onCopy?: (content: string) => void
}

// =============================================================================
// HELPERS
// =============================================================================

const formatTime = (date: Date): string => {
	return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const getStatusIcon = (status: Message['status']) => {
	switch (status) {
		case 'sending':
			return <div className='h-3 w-3 rounded-full bg-muted-foreground/50' />
		case 'sent':
			return <Check className='h-3 w-3 text-muted-foreground' />
		case 'delivered':
			return <CheckCheck className='h-3 w-3 text-muted-foreground' />
		case 'read':
			return <CheckCheck className='h-3 w-3 text-primary' />
	}
}

// =============================================================================
// MESSAGE ACTIONS
// =============================================================================

interface MessageActionsProps {
	isOwn: boolean
	onReact: () => void
	onReply: () => void
	onCopy: () => void
	onDelete?: () => void
}

const MessageActions = ({
	isOwn,
	onReact,
	onReply,
	onCopy,
	onDelete,
}: MessageActionsProps) => {
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.9 }}
			className={cn(
				'absolute top-0 flex gap-1 rounded-lg bg-card p-1 shadow-lg',
				isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full',
			)}
		>
			<button
				onClick={onReact}
				className='rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
			>
				<ThumbsUp className='h-4 w-4' />
			</button>
			<button
				onClick={onReply}
				className='rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
			>
				<Reply className='h-4 w-4' />
			</button>
			<button
				onClick={onCopy}
				className='rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
			>
				<Copy className='h-4 w-4' />
			</button>
			{isOwn && onDelete && (
				<button
					onClick={onDelete}
					className='rounded p-1.5 text-destructive transition-colors hover:bg-destructive/10'
				>
					<Trash2 className='h-4 w-4' />
				</button>
			)}
			<button className='rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'>
				<MoreHorizontal className='h-4 w-4' />
			</button>
		</motion.div>
	)
}

// =============================================================================
// CHAT MESSAGE (MAIN EXPORT)
// =============================================================================

export const ChatMessage = ({
	message,
	senderAvatar,
	senderName,
	showAvatar = true,
	onReact,
	onDelete,
	onReply,
	onCopy,
}: ChatMessageProps) => {
	const [showActions, setShowActions] = useState(false)

	const handleReact = () => {
		onReact?.(message.id, '👍')
	}

	const handleReply = () => {
		onReply?.(message)
	}

	const handleCopy = () => {
		navigator.clipboard.writeText(message.content)
		onCopy?.(message.content)
	}

	const handleDelete = () => {
		onDelete?.(message.id)
	}

	return (
		<motion.div
			className={cn(
				'flex flex-col mb-2',
				message.isOwn ? 'items-end' : 'items-start',
			)}
			variants={scaleIn}
			initial='hidden'
			animate='visible'
		>
			<div
				className={cn(
					'relative flex items-end gap-2',
					message.isOwn && 'flex-row-reverse',
				)}
				onMouseEnter={() => setShowActions(true)}
				onMouseLeave={() => setShowActions(false)}
			>
				{/* Avatar (for received messages) */}
				{!message.isOwn && showAvatar && (
					<Avatar className='h-8 w-8 flex-shrink-0'>
						<AvatarImage src={senderAvatar} alt={senderName} />
						<AvatarFallback className='text-xs'>
							{senderName?.slice(0, 2).toUpperCase() || 'U'}
						</AvatarFallback>
					</Avatar>
				)}

				{/* Message Bubble */}
				<div className='relative'>
					{/* Reply Preview */}
					{message.replyTo && (
						<div
							className={cn(
								'text-xs px-3 py-1.5 mb-1 rounded-t-lg border-l-2',
								message.isOwn
									? 'bg-primary/20 border-primary/50 text-primary-foreground/80'
									: 'bg-muted border-border text-muted-foreground',
							)}
						>
							<span className='font-semibold'>
								{message.replyTo.senderName}
							</span>
							<p className='truncate max-w-bubble-sm'>
								{message.replyTo.content}
							</p>
						</div>
					)}

					{/* Bubble - Conditional rendering based on message type */}
					{message.type === 'POST_SHARE' && message.relatedId ? (
						// POST_SHARE: Clickable card linking to post detail
						<Link
							href={`/post/${message.relatedId}`}
							className={cn(
								'block rounded-2xl overflow-hidden border transition-all hover:shadow-lg hover:scale-[1.02] max-w-bubble-md md:max-w-bubble-lg',
								message.isOwn
									? 'bg-primary/10 border-primary/30 rounded-br-md'
									: 'bg-bg-elevated border-border-subtle rounded-bl-md',
							)}
						>
							<div className='flex items-start gap-3 p-3'>
								{/* Thumbnail */}
								{message.sharedPostImage && (
									<div className='relative size-16 flex-shrink-0 overflow-hidden rounded-lg bg-bg-hover'>
										<Image
											src={message.sharedPostImage}
											alt='Shared post'
											fill
											className='object-cover'
											unoptimized // Cloudinary images don't need Next.js optimization
											onError={e => {
												// Fallback to placeholder on error
												e.currentTarget.src = '/images/post-placeholder.png'
											}}
										/>
									</div>
								)}

								{/* Content */}
								<div className='min-w-0 flex-1'>
									{/* Badge */}
									<div className='flex items-center gap-1.5 mb-1'>
										<Share2
											className={cn(
												'size-3',
												message.isOwn ? 'text-primary' : 'text-text-muted',
											)}
										/>
										<span
											className={cn(
												'text-xs font-semibold uppercase tracking-wide',
												message.isOwn ? 'text-primary' : 'text-text-muted',
											)}
										>
											Shared Post
										</span>
									</div>

									{/* Recipe title (if cooking post) */}
									{message.sharedPostTitle && (
										<p
											className={cn(
												'text-xs font-bold mb-0.5 line-clamp-1',
												message.isOwn
													? 'text-primary-foreground'
													: 'text-text-primary',
											)}
										>
											{message.sharedPostTitle}
										</p>
									)}

									{/* Caption/message (auto-filled by BE or custom) */}
									<p
										className={cn(
											'text-sm leading-relaxed line-clamp-2',
											message.isOwn ? 'text-text' : 'text-text-secondary',
										)}
									>
										{message.content}
									</p>

									{/* Click to view indicator */}
									<p
										className={cn(
											'text-xs mt-1 opacity-70',
											message.isOwn ? 'text-primary' : 'text-text-muted',
										)}
									>
										Tap to view post
									</p>
								</div>
							</div>
						</Link>
					) : (
						// TEXT: Regular bubble
						<div
							className={cn(
								'px-4 py-2.5 rounded-2xl max-w-bubble-md md:max-w-bubble-lg',
								message.isOwn
									? 'bg-primary text-primary-foreground rounded-br-md'
									: 'bg-muted text-foreground rounded-bl-md',
							)}
						>
							<p className='text-sm leading-relaxed whitespace-pre-wrap break-words'>
								{message.content}
							</p>
						</div>
					)}

					{/* Reactions */}
					{message.reactions && message.reactions.length > 0 && (
						<div
							className={cn(
								'flex gap-1 mt-1',
								message.isOwn ? 'justify-end' : 'justify-start',
							)}
						>
							{message.reactions.map((reaction, i) => (
								<button
									key={i}
									className={cn(
										'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
										reaction.userReacted
											? 'bg-primary/20 text-primary'
											: 'bg-muted text-muted-foreground hover:bg-muted/80',
									)}
									onClick={() => onReact?.(message.id, reaction.emoji)}
								>
									<span>{reaction.emoji}</span>
									<span>{reaction.count}</span>
								</button>
							))}
						</div>
					)}

					{/* Actions */}
					<AnimatePresence>
						{showActions && (
							<MessageActions
								isOwn={message.isOwn}
								onReact={handleReact}
								onReply={handleReply}
								onCopy={handleCopy}
								onDelete={message.isOwn ? handleDelete : undefined}
							/>
						)}
					</AnimatePresence>
				</div>
			</div>

			{/* Status & Time */}
			<div
				className={cn(
					'flex items-center gap-1 mt-1 text-xs text-muted-foreground',
					message.isOwn ? 'mr-2' : !showAvatar ? 'ml-0' : 'ml-10',
				)}
			>
				<span>{formatTime(message.timestamp)}</span>
				{message.isOwn && getStatusIcon(message.status)}
			</div>
		</motion.div>
	)
}

// =============================================================================
// TYPING INDICATOR
// =============================================================================

interface TypingIndicatorProps {
	senderAvatar?: string
	senderName?: string
}

export const TypingIndicator = ({
	senderAvatar,
	senderName,
}: TypingIndicatorProps) => {
	return (
		<motion.div
			className='flex items-end gap-2 mb-2'
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 10 }}
		>
			<Avatar className='h-8 w-8 flex-shrink-0'>
				<AvatarImage src={senderAvatar} alt={senderName} />
				<AvatarFallback className='text-xs'>
					{senderName?.slice(0, 2).toUpperCase() || 'U'}
				</AvatarFallback>
			</Avatar>

			<div className='px-4 py-3 rounded-2xl rounded-bl-md bg-muted'>
				<div className='flex gap-1'>
					{[0, 1, 2].map(i => (
						<motion.span
							key={i}
							className='w-2 h-2 rounded-full bg-muted-foreground'
							animate={{
								opacity: [0.4, 1, 0.4],
								scale: [1, 1.2, 1],
							}}
							transition={{
								duration: 1.4,
								repeat: Infinity,
								delay: i * 0.2,
							}}
						/>
					))}
				</div>
			</div>
		</motion.div>
	)
}

// =============================================================================
// DATE DIVIDER
// =============================================================================

interface DateDividerProps {
	date: Date
}

export const DateDivider = ({ date }: DateDividerProps) => {
	const formatDate = (d: Date): string => {
		const today = new Date()
		const yesterday = new Date(today)
		yesterday.setDate(yesterday.getDate() - 1)

		if (d.toDateString() === today.toDateString()) {
			return 'Today'
		}
		if (d.toDateString() === yesterday.toDateString()) {
			return 'Yesterday'
		}
		return d.toLocaleDateString(undefined, {
			weekday: 'long',
			month: 'short',
			day: 'numeric',
		})
	}

	return (
		<div className='flex items-center gap-4 my-4'>
			<div className='flex-1 h-px bg-border' />
			<span className='text-xs font-semibold text-muted-foreground px-3 py-1 bg-muted rounded-full'>
				{formatDate(date)}
			</span>
			<div className='flex-1 h-px bg-border' />
		</div>
	)
}

export default ChatMessage
