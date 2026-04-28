'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { AlertCircle } from 'lucide-react'
import { ErrorBoundary } from '@/components/providers/ErrorBoundary'
import { Conversation } from '@/services/chat'
import { TRANSITION_SPRING, LIST_ITEM_HOVER, LIST_ITEM_TAP } from '@/lib/motion'
import { cn } from '@/lib/utils'

function formatMessageTime(
	dateString: string,
	yesterdayLabel = 'Yesterday',
): string {
	const date = new Date(dateString)
	const now = new Date()
	const diffDays = Math.floor(
		(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
	)

	if (diffDays === 0) {
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
	} else if (diffDays === 1) {
		return yesterdayLabel
	} else if (diffDays < 7) {
		return date.toLocaleDateString([], { weekday: 'short' })
	} else {
		return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
	}
}

export interface MessagesConversationListItemProps {
	conversation: Conversation
	isSelected: boolean
	currentUserId: string | undefined
	onClick: () => void
}

function ConversationItemErrorFallback({
	error,
	onReset,
}: {
	error?: Error
	onReset: () => void
}) {
	const tCommon = useTranslations('common')

	return (
		<div
			role='alert'
			className='rounded-xl border border-destructive/20 bg-bg-card p-3 shadow-card'
		>
			<div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
				<div className='flex items-start gap-3'>
					<div className='rounded-full bg-destructive/10 p-2 text-destructive'>
						<AlertCircle className='size-4' />
					</div>
					<div className='min-w-0'>
						<p className='text-sm font-semibold text-text-primary'>
							{tCommon('somethingWentWrong')}
						</p>
						<p className='mt-1 text-sm text-text-secondary'>
							{error?.message || tCommon('unexpectedError')}
						</p>
					</div>
				</div>
				<button
					type='button'
					onClick={onReset}
					className='inline-flex h-10 w-fit items-center justify-center rounded-lg border border-border-subtle px-4 text-sm font-medium text-text-primary transition-colors hover:bg-bg-elevated'
				>
					{tCommon('tryAgain')}
				</button>
			</div>
		</div>
	)
}

function ConversationItem({
	conversation,
	isSelected,
	currentUserId,
	onClick,
}: MessagesConversationListItemProps) {
	const t = useTranslations('messages')
	const otherParticipants = conversation.participants.filter(
		p => p.userId !== currentUserId,
	)

	const getParticipantName = (
		participant: Conversation['participants'][number],
	) => {
		return (
			`${participant.firstName} ${participant.lastName}`.trim() ||
			participant.username
		)
	}

	const name =
		conversation.conversationName ||
		(conversation.type === 'GROUP'
			? (() => {
					const names = otherParticipants.slice(0, 2).map(getParticipantName)
					if (names.length === 0) return 'Group chat'
					const extraCount = otherParticipants.length - names.length
					return extraCount > 0
						? `${names.join(', ')} +${extraCount}`
						: names.join(', ')
				})()
			: otherParticipants[0]
				? getParticipantName(otherParticipants[0])
				: t('unknownUser'))

	const avatar =
		conversation.conversationAvatar ||
		otherParticipants[0]?.avatar ||
		'/placeholder-avatar.svg'
	const previewText = conversation.lastMessage?.message || t('noMessagesYet')
	const previewDate =
		conversation.lastMessage?.createdDate ||
		conversation.modifiedDate ||
		conversation.createdDate

	const hasUnread = conversation.unreadCount && conversation.unreadCount > 0

	return (
		<motion.button
			type='button'
			onClick={onClick}
			whileHover={LIST_ITEM_HOVER}
			whileTap={LIST_ITEM_TAP}
			transition={TRANSITION_SPRING}
			className={cn(
				'group flex w-full cursor-pointer items-center gap-2.5 rounded-xl p-2.5 text-left transition-all duration-200 focus-visible:ring-2 focus-visible:ring-brand/50',
				isSelected ? 'bg-brand/10' : 'hover:bg-bg-elevated',
			)}
		>
			<div className='relative size-11 flex-shrink-0'>
				<Image
					src={avatar}
					alt={name}
					fill
					sizes='44px'
					className='rounded-full object-cover'
				/>
			</div>

			<div className='min-w-0 flex-1'>
				<div className='flex items-center justify-between gap-2'>
					<span
						className={cn(
							'truncate font-semibold',
							hasUnread ? 'text-text' : 'text-text-secondary',
						)}
					>
						{name}
					</span>
					<span className='tabular-nums flex-shrink-0 text-xs text-text-muted'>
						{formatMessageTime(previewDate, t('yesterday'))}
					</span>
				</div>
				<p
					className={cn(
						'mt-0.5 truncate text-sm',
						conversation.lastMessage
							? hasUnread
								? 'font-medium text-text'
								: 'text-text-muted'
							: 'italic text-text-muted',
					)}
				>
					{previewText}
				</p>
			</div>

			{hasUnread && (
				<span
					className='flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold tabular-nums text-white'
					role='status'
					aria-label={`${conversation.unreadCount! > 9 ? '9+' : conversation.unreadCount} ${t('unreadMessages')}`}
				>
					{conversation.unreadCount! > 9 ? '9+' : conversation.unreadCount}
				</span>
			)}
		</motion.button>
	)
}

export function MessagesConversationListItem({
	conversation,
	isSelected,
	currentUserId,
	onClick,
}: MessagesConversationListItemProps) {
	return (
		<ErrorBoundary
			fallbackRender={({ error, onReset }) => (
				<ConversationItemErrorFallback error={error} onReset={onReset} />
			)}
		>
			<ConversationItem
				conversation={conversation}
				isSelected={isSelected}
				currentUserId={currentUserId}
				onClick={onClick}
			/>
		</ErrorBoundary>
	)
}
