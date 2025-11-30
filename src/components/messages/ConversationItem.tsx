'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { TRANSITION_SPRING, fadeInUp } from '@/lib/motion'

// =============================================================================
// TYPES
// =============================================================================

export interface Conversation {
	id: string
	participantId: string
	participantName: string
	participantAvatar: string
	lastMessage: string
	lastMessageTime: Date
	unreadCount: number
	isOnline: boolean
	isTyping?: boolean
	isPinned?: boolean
	isMuted?: boolean
}

interface ConversationItemProps {
	conversation: Conversation
	isActive?: boolean
	onClick?: () => void
}

interface ConversationListProps {
	conversations: Conversation[]
	activeConversationId?: string
	onConversationClick?: (conversationId: string) => void
	className?: string
}

// =============================================================================
// HELPERS
// =============================================================================

const formatTime = (date: Date): string => {
	const now = new Date()
	const diff = now.getTime() - date.getTime()
	const hours = Math.floor(diff / (1000 * 60 * 60))
	const days = Math.floor(hours / 24)

	if (days > 0) {
		return days === 1 ? 'Yesterday' : `${days}d`
	}
	if (hours > 0) {
		return `${hours}h`
	}
	const minutes = Math.floor(diff / (1000 * 60))
	if (minutes > 0) {
		return `${minutes}m`
	}
	return 'Now'
}

// =============================================================================
// CONVERSATION ITEM (MAIN EXPORT)
// =============================================================================

export const ConversationItem = ({
	conversation,
	isActive,
	onClick,
}: ConversationItemProps) => {
	const {
		participantName,
		participantAvatar,
		lastMessage,
		lastMessageTime,
		unreadCount,
		isOnline,
		isTyping,
		isPinned,
		isMuted,
	} = conversation

	return (
		<motion.div
			className={cn(
				'relative flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-border transition-colors',
				isActive
					? 'bg-primary/10 border-l-[3px] border-l-primary'
					: 'hover:bg-muted/50',
				unreadCount > 0 && !isActive && 'bg-muted/30',
			)}
			onClick={onClick}
			whileHover={{ x: isActive ? 0 : 2 }}
			whileTap={{ scale: 0.99 }}
			transition={TRANSITION_SPRING}
		>
			{/* Avatar with Online Indicator */}
			<div className='relative flex-shrink-0'>
				<Avatar className='h-12 w-12'>
					<AvatarImage src={participantAvatar} alt={participantName} />
					<AvatarFallback>
						{participantName.slice(0, 2).toUpperCase()}
					</AvatarFallback>
				</Avatar>
				{isOnline && (
					<span
						className={cn(
							'absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-panel-bg',
							'bg-success',
						)}
					/>
				)}
			</div>

			{/* Content */}
			<div className='flex-1 min-w-0'>
				<div className='flex items-center justify-between gap-2'>
					<span
						className={cn(
							'text-sm font-semibold truncate',
							unreadCount > 0 ? 'text-foreground' : 'text-foreground',
						)}
					>
						{participantName}
					</span>
					<span className='text-xs text-muted-foreground flex-shrink-0'>
						{formatTime(lastMessageTime)}
					</span>
				</div>
				<div className='flex items-center gap-2 mt-0.5'>
					<p
						className={cn(
							'text-sm truncate',
							unreadCount > 0
								? 'text-foreground font-medium'
								: 'text-muted-foreground',
							isTyping && 'text-primary italic',
						)}
					>
						{isTyping ? 'typing...' : lastMessage}
					</p>
				</div>
			</div>

			{/* Badges */}
			<div className='flex items-center gap-2 flex-shrink-0'>
				{isPinned && <span className='text-xs'>📌</span>}
				{isMuted && <span className='text-xs opacity-50'>🔇</span>}
				{unreadCount > 0 && !isMuted && (
					<span className='min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold'>
						{unreadCount > 99 ? '99+' : unreadCount}
					</span>
				)}
			</div>
		</motion.div>
	)
}

// =============================================================================
// CONVERSATION LIST
// =============================================================================

export const ConversationList = ({
	conversations,
	activeConversationId,
	onConversationClick,
	className,
}: ConversationListProps) => {
	// Sort: pinned first, then by last message time
	const sortedConversations = [...conversations].sort((a, b) => {
		if (a.isPinned && !b.isPinned) return -1
		if (!a.isPinned && b.isPinned) return 1
		return b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
	})

	return (
		<div className={cn('flex flex-col', className)}>
			{sortedConversations.map((conversation, index) => (
				<motion.div
					key={conversation.id}
					variants={fadeInUp}
					initial='hidden'
					animate='visible'
					transition={{ delay: index * 0.03 }}
				>
					<ConversationItem
						conversation={conversation}
						isActive={activeConversationId === conversation.id}
						onClick={() => onConversationClick?.(conversation.id)}
					/>
				</motion.div>
			))}

			{conversations.length === 0 && (
				<div className='flex flex-col items-center justify-center py-12 px-4 text-center'>
					<span className='text-4xl mb-3'>💬</span>
					<p className='text-foreground font-semibold'>No conversations yet</p>
					<p className='text-sm text-muted-foreground mt-1'>
						Start a conversation with a friend!
					</p>
				</div>
			)}
		</div>
	)
}

// =============================================================================
// CONVERSATION SKELETON
// =============================================================================

export const ConversationItemSkeleton = () => {
	return (
		<div className='flex items-center gap-3 px-4 py-3 border-b border-border animate-pulse'>
			<div className='w-12 h-12 rounded-full bg-muted flex-shrink-0' />
			<div className='flex-1'>
				<div className='h-4 w-24 bg-muted rounded mb-2' />
				<div className='h-3 w-32 bg-muted rounded' />
			</div>
		</div>
	)
}

export const ConversationListSkeleton = ({ count = 5 }: { count?: number }) => {
	return (
		<div>
			{Array.from({ length: count }).map((_, i) => (
				<ConversationItemSkeleton key={i} />
			))}
		</div>
	)
}

export default ConversationItem
