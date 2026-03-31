'use client'

import { useState, useCallback } from 'react'
import { Post } from '@/lib/types'
import { votePoll } from '@/services/post'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { BarChart3 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'
import { UserHoverCard } from '@/components/social/UserHoverCard'
import { TRANSITION_SPRING, CARD_FEED_HOVER } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { logDevError } from '@/lib/dev-log'

interface PollCardProps {
	post: Post
	onUpdate?: (post: Post) => void
	currentUserId?: string
}

export const PollCard = ({
	post: initialPost,
	onUpdate,
	currentUserId,
}: PollCardProps) => {
	const [post, setPost] = useState<Post>(initialPost)
	const [isVoting, setIsVoting] = useState(false)

	const poll = post.pollData

	const handleVote = useCallback(
		async (option: 'A' | 'B') => {
			if (isVoting || currentUserId === post.userId || !poll) return
			setIsVoting(true)
			try {
				const response = await votePoll(post.id, option)
				if (response.success && response.data) {
					const updatedPost = {
						...post,
						userVote: response.data.userVote,
						pollData: {
							...poll,
							votesA: response.data.votesA,
							votesB: response.data.votesB,
						},
					}
					setPost(updatedPost)
					onUpdate?.(updatedPost)
				} else {
					toast.error(response.message || 'Failed to vote')
				}
			} catch (error) {
				logDevError('Failed to vote:', error)
				toast.error('An error occurred while voting')
			} finally {
				setIsVoting(false)
			}
		},
		[isVoting, currentUserId, post, poll, onUpdate],
	)

	if (!poll) return null

	const totalVotes = poll.votesA + poll.votesB
	const percentA =
		totalVotes > 0 ? Math.round((poll.votesA / totalVotes) * 100) : 50
	const percentB =
		totalVotes > 0 ? Math.round((poll.votesB / totalVotes) * 100) : 50
	const hasVoted = post.userVote !== null && post.userVote !== undefined
	const isOwner = currentUserId === post.userId

	const canVote = !hasVoted && !isOwner

	const timeAgo = post.createdAt
		? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
		: ''

	return (
		<motion.div
			layout
			className='group -mx-4 sm:mx-0 sm:rounded-radius border-y sm:border border-border-medium bg-bg-card p-4 transition-all duration-300 md:p-6'
		>
			{/* Header */}
			<div className='mb-3 flex items-center gap-3'>
				<UserHoverCard userId={post.userId}>
					<Link href={`/profile/${post.userId}`}>
						<Avatar className='size-10 ring-2 ring-border-subtle'>
							<AvatarImage src={post.avatarUrl || undefined} />
							<AvatarFallback className='bg-bg-elevated text-text-muted'>
								{(post.displayName || 'U')[0].toUpperCase()}
							</AvatarFallback>
						</Avatar>
					</Link>
				</UserHoverCard>
				<div className='flex-1'>
					<UserHoverCard userId={post.userId}>
						<Link
							href={`/profile/${post.userId}`}
							className='font-medium text-text hover:text-brand transition-colors'
						>
							{post.displayName || 'Chef'}
						</Link>
					</UserHoverCard>
					<p className='text-xs text-text-muted'>{timeAgo}</p>
				</div>
				<div className='flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand'>
					<BarChart3 className='size-3.5' />
					Poll
				</div>
			</div>

			{/* Question */}
			<p className='mb-4 text-lg font-semibold text-text'>
				{poll.question || post.content}
			</p>

			{/* Options */}
			<div className='space-y-3'>
				<PollOption
					label={poll.optionA}
					percent={percentA}
					votes={poll.votesA}
					isSelected={post.userVote === 'A'}
					hasVoted={hasVoted}
					disabled={isVoting || isOwner}
					onClick={() => handleVote('A')}
				/>
				<PollOption
					label={poll.optionB}
					percent={percentB}
					votes={poll.votesB}
					isSelected={post.userVote === 'B'}
					hasVoted={hasVoted}
					disabled={isVoting || isOwner}
					onClick={() => handleVote('B')}
				/>
			</div>

			{/* Footer */}
			<div className='mt-3 flex items-center justify-between text-xs text-text-muted'>
				<span className='tabular-nums'>
					{totalVotes} vote{totalVotes !== 1 ? 's' : ''}
				</span>
				{isOwner && <span className='italic'>Your poll</span>}
			</div>
		</motion.div>
	)
}

function PollOption({
	label,
	percent,
	votes,
	isSelected,
	hasVoted,
	disabled,
	onClick,
}: {
	label: string
	percent: number
	votes: number
	isSelected: boolean
	hasVoted: boolean
	disabled: boolean
	onClick: () => void
}) {
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			className={cn(
				'relative w-full overflow-hidden rounded-lg border p-3 text-left transition-all',
				isSelected
					? 'border-brand bg-brand/5 ring-1 ring-brand/30'
					: 'border-border-subtle hover:border-brand/40',
				disabled && !isSelected && 'cursor-default',
			)}
		>
			{/* Progress fill */}
			{hasVoted && (
				<motion.div
					initial={{ width: 0 }}
					animate={{ width: `${percent}%` }}
					transition={{ duration: 0.6, ease: 'easeOut' }}
					className={cn(
						'absolute inset-y-0 left-0 rounded-lg',
						isSelected ? 'bg-brand/15' : 'bg-bg-elevated/60',
					)}
				/>
			)}

			{/* Content */}
			<div className='relative flex items-center justify-between'>
				<span
					className={cn('font-medium', isSelected ? 'text-brand' : 'text-text')}
				>
					{label}
				</span>
				{hasVoted && (
					<span
						className={cn(
							'text-sm font-semibold tabular-nums',
							isSelected ? 'text-brand' : 'text-text-secondary',
						)}
					>
						{percent}%
					</span>
				)}
			</div>
		</button>
	)
}
