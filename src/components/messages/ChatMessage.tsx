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
} from 'lucide-react'
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
			return <span className='text-muted-foreground'>○</span>
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
			className={cn(
				'absolute top-0 flex items-center gap-1 bg-panel-bg border border-border rounded-lg shadow-lg p-1',
				isOwn ? 'right-full mr-2' : 'left-full ml-2',
			)}
			initial={{ opacity: 0, scale: 0.8 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.8 }}
			transition={TRANSITION_SPRING}
		>
			<button
				className='p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground'
				onClick={onReact}
				title='React'
			>
				👍
			</button>
			<button
				className='p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground'
				onClick={onReply}
				title='Reply'
			>
				<Reply className='h-4 w-4' />
			</button>
			<button
				className='p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground'
				onClick={onCopy}
				title='Copy'
			>
				<Copy className='h-4 w-4' />
			</button>
			{isOwn && onDelete && (
				<button
					className='p-1.5 rounded-md hover:bg-error/10 transition-colors text-muted-foreground hover:text-error'
					onClick={onDelete}
					title='Delete'
				>
					<Trash2 className='h-4 w-4' />
				</button>
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

	const handleReact = () => {
		onReact?.(message.id, '👍')
		setShowActions(false)
	}

	const handleReply = () => {
		onReply?.(message)
		setShowActions(false)
	}

	const handleCopy = () => {
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
							<p className='truncate max-w-[200px]'>
								{message.replyTo.content}
							</p>
						</div>
					)}

					{/* Bubble */}
					<div
						className={cn(
							'px-4 py-2.5 rounded-2xl max-w-[280px] md:max-w-[400px]',
							message.isOwn
								? 'bg-primary text-primary-foreground rounded-br-md'
								: 'bg-muted text-foreground rounded-bl-md',
						)}
					>
						<p className='text-sm leading-relaxed whitespace-pre-wrap break-words'>
							{message.content}
						</p>
					</div>

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
					'flex items-center gap-1 mt-1 text-[11px] text-muted-foreground',
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
			<span className='text-xs text-muted-foreground font-medium'>
				{formatDate(date)}
			</span>
			<div className='flex-1 h-px bg-border' />
		</div>
	)
}

export default ChatMessage
