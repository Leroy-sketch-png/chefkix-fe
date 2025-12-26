'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { UserPlus, ChefHat } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	staggerContainer,
	staggerItem,
	LIST_ITEM_HOVER,
	LIST_ITEM_TAP,
} from '@/lib/motion'
import {
	LeaderboardItem,
	ListDivider,
	type LeaderboardEntry,
} from './LeaderboardItem'
import { LeaderboardPodium, type PodiumEntry } from './LeaderboardPodium'

// ============================================================================
// TYPES
// ============================================================================

export interface FriendsLeaderboardProps {
	entries: LeaderboardEntry[]
	totalFriends: number
	closestCompetitor?: {
		entry: LeaderboardEntry
		xpBehind: number
	}
	isLoading?: boolean
	onUserClick?: (entry: LeaderboardEntry) => void
	onInviteFriends?: () => void
	onCookToDefend?: () => void
	className?: string
}

// ============================================================================
// AVATAR WITH FALLBACK
// ============================================================================

function AvatarWithFallback({
	src,
	alt,
	size = 32,
}: {
	src?: string
	alt: string
	size?: number
}) {
	const [imgError, setImgError] = useState(false)
	const hasValidAvatar = src && !imgError

	if (!hasValidAvatar) {
		return (
			<div
				className='flex items-center justify-center rounded-full bg-gradient-to-br from-bg-elevated to-bg-hover'
				style={{ width: size, height: size }}
			>
				<ChefHat
					className='text-text-muted'
					style={{ width: size * 0.5, height: size * 0.5 }}
				/>
			</div>
		)
	}

	return (
		<Image
			src={src}
			alt={alt}
			width={size}
			height={size}
			className='rounded-full object-cover'
			style={{ width: size, height: size }}
			onError={() => setImgError(true)}
		/>
	)
}

// ============================================================================
// FRIENDS SUMMARY
// ============================================================================

function FriendsSummary({
	totalFriends,
	onInviteFriends,
}: {
	totalFriends: number
	onInviteFriends?: () => void
}) {
	// Actionable copy based on friend count
	const getMessage = () => {
		if (totalFriends === 0) {
			return (
				<>
					<span className='text-streak font-semibold'>No rivals yet!</span>{' '}
					Start the competition
				</>
			)
		}
		return (
			<>
				Competing with{' '}
				<strong className='text-text'>
					{totalFriends} {totalFriends === 1 ? 'friend' : 'friends'}
				</strong>{' '}
				this week
			</>
		)
	}

	return (
		<div className='flex items-center justify-between py-4 px-5 bg-bg-card rounded-2xl border border-border-subtle mb-5'>
			<span className='text-sm text-text-secondary'>{getMessage()}</span>
			{onInviteFriends && (
				<motion.button
					whileHover={LIST_ITEM_HOVER}
					whileTap={LIST_ITEM_TAP}
					onClick={onInviteFriends}
					className={cn(
						'flex items-center gap-1.5 py-2 px-3.5',
						'bg-gradient-xp',
						'rounded-lg text-sm font-semibold text-white',
					)}
				>
					<UserPlus className='size-4' />
					{totalFriends === 0 ? 'Invite Rivals' : 'Invite'}
				</motion.button>
			)}
		</div>
	)
}

// ============================================================================
// CATCHING UP ALERT
// ============================================================================

function CatchingUpAlert({
	competitor,
	xpBehind,
	onCookToDefend,
}: {
	competitor: LeaderboardEntry
	xpBehind: number
	onCookToDefend?: () => void
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className={cn(
				'flex flex-col sm:flex-row items-center justify-between gap-3 p-4',
				'bg-streak/10 border border-streak/20 rounded-xl mt-3',
			)}
		>
			<div className='flex items-center gap-2.5'>
				<div className='size-8 flex-shrink-0 overflow-hidden rounded-full'>
					<AvatarWithFallback
						src={competitor.avatarUrl}
						alt={competitor.displayName}
						size={32}
					/>
				</div>
				<span className='text-sm text-text'>
					<strong className='text-streak'>{competitor.displayName}</strong> is
					only {xpBehind} XP behind you!
				</span>
			</div>
			{onCookToDefend && (
				<motion.button
					whileHover={LIST_ITEM_HOVER}
					whileTap={LIST_ITEM_TAP}
					onClick={onCookToDefend}
					className='py-2 px-3.5 bg-streak rounded-lg text-sm font-bold text-white whitespace-nowrap w-full sm:w-auto'
				>
					Cook to defend 🍳
				</motion.button>
			)}
		</motion.div>
	)
}

// ============================================================================
// FRIENDS LEADERBOARD COMPONENT
// ============================================================================

export function FriendsLeaderboard({
	entries,
	totalFriends,
	closestCompetitor,
	isLoading = false,
	onUserClick,
	onInviteFriends,
	onCookToDefend,
	className,
}: FriendsLeaderboardProps) {
	// Check if current user is leading
	const currentUser = entries.find(e => e.isCurrentUser)
	const isLeading = currentUser?.rank === 1

	// Extract top 3 for podium (only if we have enough entries)
	const podiumEntries =
		entries.length >= 3
			? (entries
					.filter(e => e.rank <= 3)
					.map(e => ({
						...e,
						rank: e.rank as 1 | 2 | 3,
						xp: e.xpThisWeek,
					})) as PodiumEntry[])
			: []

	// Remaining entries for list
	const listEntries = entries.filter(e => e.rank > 3)

	return (
		<div className={cn('max-w-modal-xl mx-auto p-4', className)}>
			{/* Friends Summary */}
			<FriendsSummary
				totalFriends={totalFriends}
				onInviteFriends={onInviteFriends}
			/>

			{/* Podium (if we have 3+ friends) */}
			{podiumEntries.length === 3 && (
				<LeaderboardPodium
					entries={podiumEntries}
					onUserClick={e =>
						onUserClick?.({
							...e,
							xpThisWeek: e.xp,
							recipesCooked: e.recipesCooked ?? 0,
							streak: e.streak ?? 0,
						})
					}
				/>
			)}

			{/* Friends List */}
			<motion.div
				variants={staggerContainer}
				initial='hidden'
				animate='visible'
				className='bg-bg-card rounded-2xl p-4'
			>
				{/* Show current user first if leading */}
				{isLeading && currentUser && (
					<motion.div variants={staggerItem}>
						<LeaderboardItem
							entry={currentUser}
							variant='leading'
							onClick={onUserClick}
						/>
					</motion.div>
				)}

				{/* Rest of list */}
				{listEntries
					.filter(e => !(isLeading && e.isCurrentUser))
					.map((entry, index) => {
						// Calculate XP diff from leader
						const leader = entries[0]
						const xpDiff = entry.xpThisWeek - leader.xpThisWeek

						return (
							<motion.div key={entry.userId} variants={staggerItem}>
								<LeaderboardItem
									entry={entry}
									variant={
										entry.isCurrentUser && isLeading ? 'leading' : 'default'
									}
									xpDiff={xpDiff}
									onClick={onUserClick}
								/>
							</motion.div>
						)
					})}

				{/* Catching Up Alert */}
				{isLeading && closestCompetitor && closestCompetitor.xpBehind < 100 && (
					<CatchingUpAlert
						competitor={closestCompetitor.entry}
						xpBehind={closestCompetitor.xpBehind}
						onCookToDefend={onCookToDefend}
					/>
				)}
			</motion.div>

			{/* Empty State - No Friends - ENCOURAGING, not depressing */}
			{entries.length === 0 && (
				<div className='flex flex-col items-center justify-center py-16 text-center'>
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={TRANSITION_SPRING}
						className='mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-xp shadow-lg'
					>
						<ChefHat className='size-8 text-white' />
					</motion.div>
					<h3 className='mb-2 text-lg font-bold text-text'>
						Ready to Compete? 🔥
					</h3>
					<p className='mb-4 max-w-xs text-sm text-text-secondary'>
						Invite friends to start the ultimate cooking showdown. Who will earn
						the most XP?
					</p>
					{onInviteFriends && (
						<motion.button
							whileHover={LIST_ITEM_HOVER}
							whileTap={LIST_ITEM_TAP}
							onClick={onInviteFriends}
							className={cn(
								'flex items-center gap-2 py-2.5 px-5',
								'bg-gradient-xp',
								'rounded-xl text-sm font-semibold text-white',
							)}
						>
							<UserPlus className='size-4' />
							Invite Friends
						</motion.button>
					)}
				</div>
			)}
		</div>
	)
}

export default FriendsLeaderboard
