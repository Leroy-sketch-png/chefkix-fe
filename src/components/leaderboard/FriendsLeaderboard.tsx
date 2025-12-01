'use client'

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
// FRIENDS SUMMARY
// ============================================================================

function FriendsSummary({
	totalFriends,
	onInviteFriends,
}: {
	totalFriends: number
	onInviteFriends?: () => void
}) {
	return (
		<div className='flex items-center justify-between py-4 px-5 bg-panel-bg rounded-2xl mb-5'>
			<span className='text-sm text-muted-foreground'>
				Competing with{' '}
				<strong className='text-text'>{totalFriends} friends</strong> this week
			</span>
			{onInviteFriends && (
				<motion.button
					whileHover={LIST_ITEM_HOVER}
					whileTap={LIST_ITEM_TAP}
					onClick={onInviteFriends}
					className={cn(
						'flex items-center gap-1.5 py-2 px-3.5',
						'bg-gradient-to-r from-indigo-500 to-purple-500',
						'rounded-lg text-sm font-semibold text-white',
					)}
				>
					<UserPlus className='w-4 h-4' />
					Invite
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
				'bg-orange-500/10 border border-orange-500/20 rounded-xl mt-3',
			)}
		>
			<div className='flex items-center gap-2.5'>
				<Image
					src={competitor.avatarUrl || '/images/default-avatar.png'}
					alt={competitor.displayName}
					width={32}
					height={32}
					className='rounded-full'
				/>
				<span className='text-sm text-text'>
					<strong className='text-orange-500'>{competitor.displayName}</strong>{' '}
					is only {xpBehind} XP behind you!
				</span>
			</div>
			{onCookToDefend && (
				<motion.button
					whileHover={LIST_ITEM_HOVER}
					whileTap={LIST_ITEM_TAP}
					onClick={onCookToDefend}
					className='py-2 px-3.5 bg-orange-500 rounded-lg text-sm font-bold text-white whitespace-nowrap w-full sm:w-auto'
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
							recipesCooked: 0,
							streak: 0,
						})
					}
				/>
			)}

			{/* Friends List */}
			<motion.div
				variants={staggerContainer}
				initial='hidden'
				animate='visible'
				className='bg-panel-bg rounded-2xl p-4'
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

			{/* Empty State - No Friends */}
			{entries.length === 0 && (
				<div className='flex flex-col items-center justify-center py-16 text-center'>
					<div className='w-16 h-16 mb-4 rounded-full bg-muted/10 flex items-center justify-center'>
						<ChefHat className='w-8 h-8 text-muted-foreground' />
					</div>
					<h3 className='text-lg font-bold text-text mb-2'>No Friends Yet</h3>
					<p className='text-sm text-muted-foreground max-w-xs mb-4'>
						Invite your friends to compete and see who can cook the most!
					</p>
					{onInviteFriends && (
						<motion.button
							whileHover={LIST_ITEM_HOVER}
							whileTap={LIST_ITEM_TAP}
							onClick={onInviteFriends}
							className={cn(
								'flex items-center gap-2 py-2.5 px-5',
								'bg-gradient-to-r from-indigo-500 to-purple-500',
								'rounded-xl text-sm font-semibold text-white',
							)}
						>
							<UserPlus className='w-4 h-4' />
							Invite Friends
						</motion.button>
					)}
				</div>
			)}
		</div>
	)
}

export default FriendsLeaderboard
