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
	Heart,
	Smile,
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
	relatedId?: string
	sharedPostImage?: string
	sharedPostTitle?: string
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
			return (
				<motion.div
					className='h-3 w-3 rounded-full bg-text-muted/30'
					animate={{ scale: [1, 1.2, 1] }}
					transition={{ duration: 1, repeat: Infinity }}
				/>
			)
		case 'sent':
			return <Check className='h-3.5 w-3.5 text-text-muted' />
		case 'delivered':
			return <CheckCheck className='h-3.5 w-3.5 text-text-muted' />
		case 'read':
			return <CheckCheck className='h-3.5 w-3.5 text-brand' />
	}
}

// Quick reactions
const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏']

// =============================================================================
// REACTION PICKER
// =============================================================================

interface ReactionPickerProps {
	isOwn: boolean
	onSelect: (emoji: string) => void
}

const ReactionPicker = ({ isOwn, onSelect }: ReactionPickerProps) => {
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.8, y: 10 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.8, y: 10 }}
			transition={{ type: 'spring', stiffness: 400, damping: 25 }}
			className={cn(
				'absolute z-50 flex gap-1 rounded-full bg-bg-card p-2 shadow-xl ring-1 ring-border',
				isOwn ? 'bottom-full right-0 mb-2' : 'bottom-full left-0 mb-2',
			)}
		>
			{QUICK_REACTIONS.map((emoji, i) => (
				<motion.button
					key={emoji}
					onClick={() => onSelect(emoji)}
					className='flex h-9 w-9 items-center justify-center rounded-full text-lg transition-all hover:scale-125 hover:bg-bg-hover'
					initial={{ opacity: 0, scale: 0 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: i * 0.05 }}
					whileHover={{ scale: 1.25 }}
					whileTap={{ scale: 0.95 }}
				>
					{emoji}
				</motion.button>
			))}
		</motion.div>
	)
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
			initial={{ opacity: 0, scale: 0.9, y: 5 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.9, y: 5 }}
			transition={{ type: 'spring', stiffness: 400, damping: 25 }}
			className={cn(
				'absolute -top-2 z-40 flex gap-1 rounded-xl bg-bg-card p-1.5 shadow-xl ring-1 ring-border backdrop-blur-sm',
				isOwn ? 'right-0' : 'left-0',
			)}
		>
			<motion.button
				onClick={onReact}
				className='rounded-lg p-2 text-text-muted transition-colors hover:bg-bg-hover hover:text-brand'
				whileHover={{ scale: 1.1 }}
				whileTap={{ scale: 0.95 }}
			>
				<Heart className='h-4 w-4' />
			</motion.button>
			<motion.button
				onClick={onReply}
				className='rounded-lg p-2 text-text-muted transition-colors hover:bg-bg-hover hover:text-text'
				whileHover={{ scale: 1.1 }}
				whileTap={{ scale: 0.95 }}
			>
				<Reply className='h-4 w-4' />
			</motion.button>
			<motion.button
				onClick={onCopy}
				className='rounded-lg p-2 text-text-muted transition-colors hover:bg-bg-hover hover:text-text'
				whileHover={{ scale: 1.1 }}
				whileTap={{ scale: 0.95 }}
			>
				<Copy className='h-4 w-4' />
			</motion.button>
			{isOwn && onDelete && (
				<motion.button
					onClick={onDelete}
					className='rounded-lg p-2 text-text-muted transition-colors hover:bg-destructive/10 hover:text-destructive'
					whileHover={{ scale: 1.1 }}
					whileTap={{ scale: 0.95 }}
				>
					<Trash2 className='h-4 w-4' />
				</motion.button>
			)}
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
	const [showReactionPicker, setShowReactionPicker] = useState(false)

	const handleReact = (emoji: string) => {
		onReact?.(message.id, emoji)
		setShowReactionPicker(false)
	}

	const handleReply = () => {
		onReply?.(message)
		setShowActions(false)
	}

	const handleCopy = () => {
		navigator.clipboard.writeText(message.content)
		onCopy?.(message.content)
		setShowActions(false)
	}

	const handleDelete = () => {
		onDelete?.(message.id)
		setShowActions(false)
	}

	return (
		<motion.div
			className={cn(
				'group relative mb-3 flex flex-col',
				message.isOwn ? 'items-end' : 'items-start',
			)}
			variants={scaleIn}
			initial='hidden'
			animate='visible'
		>
			<div
				className={cn(
					'relative flex items-end gap-2.5',
					message.isOwn && 'flex-row-reverse',
				)}
				onMouseEnter={() => setShowActions(true)}
				onMouseLeave={() => setShowActions(false)}
			>
				{/* Avatar (for received messages) */}
				{!message.isOwn && showAvatar && (
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ type: 'spring', stiffness: 400, damping: 25 }}
					>
						<Avatar className='h-9 w-9 flex-shrink-0 ring-2 ring-bg-card'>
							<AvatarImage src={senderAvatar} alt={senderName} />
							<AvatarFallback className='bg-brand/10 text-xs font-semibold text-brand'>
								{senderName?.slice(0, 2).toUpperCase() || 'U'}
							</AvatarFallback>
						</Avatar>
					</motion.div>
				)}

				{/* Message Bubble Container */}
				<div className='relative max-w-[85%] sm:max-w-md md:max-w-lg'>
					{/* Reply Preview */}
					{message.replyTo && (
						<motion.div
							initial={{ opacity: 0, y: -5 }}
							animate={{ opacity: 1, y: 0 }}
							className={cn(
								'mb-1.5 rounded-xl border-l-4 px-3 py-2 text-xs',
								message.isOwn
									? 'border-brand bg-brand/5'
									: 'border-border bg-bg-elevated',
							)}
						>
							<span className='font-semibold text-text'>
								{message.replyTo.senderName}
							</span>
							<p className='mt-0.5 line-clamp-2 text-text-secondary'>
								{message.replyTo.content}
							</p>
						</motion.div>
					)}

					{/* Message Bubble */}
					{message.type === 'POST_SHARE' && message.relatedId ? (
						// POST_SHARE: Enhanced card
						<Link href={`/post/${message.relatedId}`}>
							<motion.div
								whileHover={{ scale: 1.02, y: -2 }}
								whileTap={{ scale: 0.98 }}
								className={cn(
									'group/card overflow-hidden rounded-2xl border transition-all hover:shadow-lg',
									message.isOwn
										? 'rounded-br-md border-brand/30 bg-brand/5'
										: 'rounded-bl-md border-border bg-bg-elevated',
								)}
							>
								<div className='flex items-start gap-3 p-3.5'>
									{/* Thumbnail */}
									{message.sharedPostImage && (
										<div className='relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl ring-2 ring-border-subtle'>
											<Image
												src={message.sharedPostImage}
												alt='Shared post'
												fill
												className='object-cover transition-transform group-hover/card:scale-110'
												unoptimized
											/>
										</div>
									)}

									{/* Content */}
									<div className='min-w-0 flex-1'>
										{/* Badge */}
										<div className='mb-1.5 flex items-center gap-1.5'>
											<div
												className={cn(
													'rounded-full p-1',
													message.isOwn ? 'bg-brand/10' : 'bg-bg-hover',
												)}
											>
												<Share2
													className={cn(
														'h-3 w-3',
														message.isOwn ? 'text-brand' : 'text-text-muted',
													)}
												/>
											</div>
											<span
												className={cn(
													'text-[10px] font-bold uppercase tracking-wider',
													message.isOwn ? 'text-brand' : 'text-text-muted',
												)}
											>
												Shared Recipe
											</span>
										</div>

										{/* Title */}
										{message.sharedPostTitle && (
											<p className='mb-1 line-clamp-1 text-sm font-bold text-text'>
												{message.sharedPostTitle}
											</p>
										)}

										{/* Caption */}
										<p className='line-clamp-2 text-xs leading-relaxed text-text-secondary'>
											{message.content}
										</p>

										{/* View indicator */}
										<div className='mt-2 flex items-center gap-1.5'>
											<motion.div
												animate={{ x: [0, 3, 0] }}
												transition={{ duration: 1.5, repeat: Infinity }}
												className={cn(
													'text-xs font-medium',
													message.isOwn ? 'text-brand' : 'text-text-muted',
												)}
											>
												Tap to view →
											</motion.div>
										</div>
									</div>
								</div>
							</motion.div>
						</Link>
					) : (
						// TEXT: Enhanced bubble
						<motion.div
							initial={{ scale: 0.9, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ type: 'spring', stiffness: 400, damping: 25 }}
							className={cn(
								'rounded-2xl px-4 py-2.5 shadow-sm',
								message.isOwn
									? 'rounded-br-md bg-brand text-white shadow-brand/10'
									: 'rounded-bl-md bg-bg-elevated text-text shadow-border/5 ring-1 ring-border/50',
							)}
						>
							<p className='text-[15px] leading-relaxed whitespace-pre-wrap break-words'>
								{message.content}
							</p>
						</motion.div>
					)}

					{/* Reactions */}
					{message.reactions && message.reactions.length > 0 && (
						<motion.div
							initial={{ opacity: 0, y: 5 }}
							animate={{ opacity: 1, y: 0 }}
							className={cn(
								'mt-1.5 flex flex-wrap gap-1.5',
								message.isOwn ? 'justify-end' : 'justify-start',
							)}
						>
							{message.reactions.map((reaction, i) => (
								<motion.button
									key={i}
									onClick={() => onReact?.(message.id, reaction.emoji)}
									className={cn(
										'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium shadow-sm transition-all',
										reaction.userReacted
											? 'bg-brand/10 text-brand ring-2 ring-brand/20'
											: 'bg-bg-elevated text-text-secondary ring-1 ring-border hover:bg-bg-hover',
									)}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
								>
									<span className='text-sm'>{reaction.emoji}</span>
									<span className='font-semibold'>{reaction.count}</span>
								</motion.button>
							))}
						</motion.div>
					)}

					{/* Actions */}
					<AnimatePresence>
						{showActions && (
							<MessageActions
								isOwn={message.isOwn}
								onReact={() => setShowReactionPicker(!showReactionPicker)}
								onReply={handleReply}
								onCopy={handleCopy}
								onDelete={message.isOwn ? handleDelete : undefined}
							/>
						)}
					</AnimatePresence>

					{/* Reaction Picker */}
					<AnimatePresence>
						{showReactionPicker && (
							<ReactionPicker isOwn={message.isOwn} onSelect={handleReact} />
						)}
					</AnimatePresence>
				</div>
			</div>

			{/* Status & Time */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.1 }}
				className={cn(
					'mt-1 flex items-center gap-1.5 text-xs text-text-muted',
					message.isOwn ? 'mr-2' : !showAvatar ? 'ml-0' : 'ml-11',
				)}
			>
				<span className='font-medium'>{formatTime(message.timestamp)}</span>
				{message.isOwn && (
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ type: 'spring', stiffness: 400, damping: 25 }}
					>
						{getStatusIcon(message.status)}
					</motion.div>
				)}
			</motion.div>
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
			className='mb-3 flex items-end gap-2.5'
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 10 }}
		>
			<Avatar className='h-9 w-9 flex-shrink-0 ring-2 ring-bg-card'>
				<AvatarImage src={senderAvatar} alt={senderName} />
				<AvatarFallback className='bg-brand/10 text-xs font-semibold text-brand'>
					{senderName?.slice(0, 2).toUpperCase() || 'U'}
				</AvatarFallback>
			</Avatar>

			<motion.div
				className='rounded-2xl rounded-bl-md bg-bg-elevated px-5 py-3 shadow-sm ring-1 ring-border/50'
				animate={{
					boxShadow: [
						'0 1px 2px rgba(0,0,0,0.05)',
						'0 4px 8px rgba(0,0,0,0.08)',
						'0 1px 2px rgba(0,0,0,0.05)',
					],
				}}
				transition={{ duration: 1.5, repeat: Infinity }}
			>
				<div className='flex gap-1.5'>
					{[0, 1, 2].map(i => (
						<motion.span
							key={i}
							className='h-2 w-2 rounded-full bg-brand'
							animate={{
								y: [0, -6, 0],
								opacity: [0.5, 1, 0.5],
							}}
							transition={{
								duration: 1,
								repeat: Infinity,
								delay: i * 0.15,
								ease: 'easeInOut',
							}}
						/>
					))}
				</div>
			</motion.div>
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
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className='my-6 flex items-center gap-4'
		>
			<div className='h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent' />
			<motion.span
				initial={{ scale: 0 }}
				animate={{ scale: 1 }}
				transition={{ type: 'spring', stiffness: 400, damping: 25 }}
				className='rounded-full bg-bg-elevated px-4 py-1.5 text-xs font-semibold text-text-secondary shadow-sm ring-1 ring-border/50'
			>
				{formatDate(date)}
			</motion.span>
			<div className='h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent' />
		</motion.div>
	)
}

export default ChatMessage
