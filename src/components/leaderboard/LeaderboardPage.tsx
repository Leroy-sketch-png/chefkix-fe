'use client'

import { motion } from 'framer-motion'
import {
	Globe,
	Users,
	Trophy,
	Clock,
	Share2,
	ArrowLeft,
	ChefHat,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING, staggerContainer, staggerItem } from '@/lib/motion'
import {
	LeaderboardItem,
	LeaderboardItemSkeleton,
	ListDivider,
	type LeaderboardEntry,
} from './LeaderboardItem'
import {
	LeaderboardPodium,
	LeaderboardPodiumSkeleton,
	type PodiumEntry,
} from './LeaderboardPodium'

// ============================================================================
// TYPES
// ============================================================================

export type LeaderboardType = 'global' | 'friends' | 'league'
export type Timeframe = 'weekly' | 'monthly' | 'all_time'

export interface MyRankInfo {
	rank: number
	xpThisWeek: number
	recipesCooked: number
	xpToNextRank: number
	nextRankPosition: number
}

export interface ResetInfo {
	days: number
	hours: number
	minutes: number
}

export interface LeaderboardPageProps {
	entries: LeaderboardEntry[]
	myRank?: MyRankInfo
	resetInfo?: ResetInfo
	type: LeaderboardType
	timeframe: Timeframe
	isLoading?: boolean
	onTypeChange?: (type: LeaderboardType) => void
	onTimeframeChange?: (timeframe: Timeframe) => void
	onUserClick?: (entry: LeaderboardEntry) => void
	onBack?: () => void
	onShare?: () => void
	onCookNow?: () => void
	className?: string
}

// ============================================================================
// TABS COMPONENT
// ============================================================================

function LeaderboardTabs({
	activeType,
	onTypeChange,
}: {
	activeType: LeaderboardType
	onTypeChange?: (type: LeaderboardType) => void
}) {
	const tabs: { type: LeaderboardType; label: string; icon: typeof Globe }[] = [
		{ type: 'global', label: 'Global', icon: Globe },
		{ type: 'friends', label: 'Friends', icon: Users },
		{ type: 'league', label: 'League', icon: Trophy },
	]

	return (
		<div className='flex gap-2 p-1.5 bg-panel-bg rounded-2xl mb-4'>
			{tabs.map(({ type, label, icon: Icon }) => (
				<motion.button
					key={type}
					whileTap={{ scale: 0.98 }}
					onClick={() => onTypeChange?.(type)}
					className={cn(
						'flex-1 flex items-center justify-center gap-2 py-3 px-4',
						'rounded-xl text-sm font-semibold transition-all',
						activeType === type
							? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
							: 'text-muted hover:text-text',
					)}
				>
					<Icon className='size-icon-sm' />
					<span className='hidden sm:inline'>{label}</span>
				</motion.button>
			))}
		</div>
	)
}

// ============================================================================
// TIMEFRAME TOGGLE
// ============================================================================

function TimeframeToggle({
	activeTimeframe,
	onTimeframeChange,
}: {
	activeTimeframe: Timeframe
	onTimeframeChange?: (timeframe: Timeframe) => void
}) {
	const timeframes: { value: Timeframe; label: string }[] = [
		{ value: 'weekly', label: 'This Week' },
		{ value: 'monthly', label: 'This Month' },
		{ value: 'all_time', label: 'All Time' },
	]

	const activeIndex = timeframes.findIndex(t => t.value === activeTimeframe)

	return (
		<div className='relative flex p-1 bg-panel-bg rounded-xl mb-5'>
			{/* Sliding indicator */}
			<motion.div
				className='absolute top-1 h-[calc(100%-8px)] bg-bg rounded-lg'
				initial={false}
				animate={{
					left: `calc(${activeIndex * 33.33}% + 4px)`,
					width: 'calc(33.33% - 6px)',
				}}
				transition={TRANSITION_SPRING}
			/>

			{timeframes.map(({ value, label }) => (
				<button
					key={value}
					onClick={() => onTimeframeChange?.(value)}
					className={cn(
						'flex-1 py-2.5 text-sm font-semibold z-10 transition-colors',
						activeTimeframe === value ? 'text-text' : 'text-muted',
					)}
				>
					{label}
				</button>
			))}
		</div>
	)
}

// ============================================================================
// MY RANK BANNER
// ============================================================================

function MyRankBanner({
	myRank,
	onCookNow,
}: {
	myRank: MyRankInfo
	onCookNow?: () => void
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className={cn(
				'flex flex-col sm:flex-row items-center gap-5 p-4 sm:p-5',
				'bg-gradient-to-r from-indigo-500/10 to-purple-500/5',
				'border-2 border-indigo-500/20 rounded-2xl mb-6',
			)}
		>
			{/* Rank Position */}
			<div className='flex flex-col items-center sm:pr-5 sm:border-r border-border pb-4 sm:pb-0 w-full sm:w-auto'>
				<span className='text-xs font-semibold text-muted uppercase tracking-wide'>
					Your Rank
				</span>
				<span className='text-3xl font-black text-indigo-500'>
					#{myRank.rank}
				</span>
			</div>

			{/* Stats */}
			<div className='flex gap-5'>
				<div className='flex flex-col'>
					<span className='text-xl font-extrabold text-text'>
						{myRank.xpThisWeek}
					</span>
					<span className='text-xs text-muted'>XP this week</span>
				</div>
				<div className='flex flex-col'>
					<span className='text-xl font-extrabold text-text'>
						{myRank.recipesCooked}
					</span>
					<span className='text-xs text-muted'>Recipes cooked</span>
				</div>
			</div>

			{/* Goal & CTA */}
			<div className='flex-1 flex flex-col items-center sm:items-end gap-2 w-full sm:w-auto'>
				<span className='text-xs text-muted'>
					+{myRank.xpToNextRank} XP to reach #{myRank.nextRankPosition}
				</span>
				<motion.button
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
					onClick={onCookNow}
					className={cn(
						'py-2 px-4 rounded-lg text-sm font-bold text-white',
						'bg-gradient-to-r from-indigo-500 to-purple-500',
						'w-full sm:w-auto',
					)}
				>
					Cook Now
				</motion.button>
			</div>
		</motion.div>
	)
}

// ============================================================================
// RESET TIMER
// ============================================================================

function ResetTimer({ resetInfo }: { resetInfo: ResetInfo }) {
	return (
		<div className='flex items-center justify-center gap-2 py-3.5 bg-panel-bg rounded-xl mt-4 text-sm text-muted'>
			<Clock className='size-icon-sm' />
			<span>
				Resets in{' '}
				<strong className='text-text'>
					{resetInfo.days}d {resetInfo.hours}h {resetInfo.minutes}m
				</strong>
			</span>
		</div>
	)
}

// ============================================================================
// LEADERBOARD PAGE COMPONENT
// ============================================================================

export function LeaderboardPage({
	entries,
	myRank,
	resetInfo,
	type,
	timeframe,
	isLoading = false,
	onTypeChange,
	onTimeframeChange,
	onUserClick,
	onBack,
	onShare,
	onCookNow,
	className,
}: LeaderboardPageProps) {
	// Extract top 3 for podium
	const podiumEntries = entries
		.filter(e => e.rank <= 3)
		.map(e => ({
			...e,
			rank: e.rank as 1 | 2 | 3,
			xp: e.xpThisWeek,
		})) as PodiumEntry[]

	// Remaining entries
	const listEntries = entries.filter(e => e.rank > 3)

	// Check if current user is in visible list
	const userInList = entries.find(e => e.isCurrentUser)
	const showMyRankBanner = myRank && (!userInList || myRank.rank > 50)

	return (
		<div className={cn('max-w-container-md mx-auto p-4', className)}>
			{/* Header */}
			<div className='flex items-center gap-4 mb-5'>
				{onBack && (
					<motion.button
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={onBack}
						className='w-10 h-10 flex items-center justify-center bg-panel-bg border border-border rounded-xl text-text'
					>
						<ArrowLeft className='w-5 h-5' />
					</motion.button>
				)}
				<h1 className='flex-1 text-2xl font-extrabold text-text'>
					Leaderboard
				</h1>
				{onShare && (
					<motion.button
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={onShare}
						className='w-10 h-10 flex items-center justify-center bg-panel-bg border border-border rounded-xl text-muted'
					>
						<Share2 className='w-5 h-5' />
					</motion.button>
				)}
			</div>

			{/* Tabs */}
			<LeaderboardTabs activeType={type} onTypeChange={onTypeChange} />

			{/* Timeframe Toggle */}
			<TimeframeToggle
				activeTimeframe={timeframe}
				onTimeframeChange={onTimeframeChange}
			/>

			{/* My Rank Banner (when not in visible list) */}
			{showMyRankBanner && (
				<MyRankBanner myRank={myRank} onCookNow={onCookNow} />
			)}

			{/* Loading State */}
			{isLoading ? (
				<>
					<LeaderboardPodiumSkeleton />
					<div className='bg-panel-bg rounded-2xl p-2'>
						{[1, 2, 3, 4, 5].map(i => (
							<LeaderboardItemSkeleton key={i} />
						))}
					</div>
				</>
			) : (
				<>
					{/* Podium (Top 3) */}
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

					{/* Leaderboard List */}
					<motion.div
						variants={staggerContainer}
						initial='hidden'
						animate='visible'
						className='bg-panel-bg rounded-2xl p-2'
					>
						{listEntries.map((entry, index) => (
							<motion.div key={entry.userId} variants={staggerItem}>
								<LeaderboardItem entry={entry} onClick={onUserClick} />
								{/* Add divider after rank 6 if there's a gap to user */}
								{index === 2 && userInList && userInList.rank > 10 && (
									<ListDivider />
								)}
							</motion.div>
						))}

						{/* Show current user if they're far down */}
						{userInList && userInList.rank > 10 && (
							<>
								<LeaderboardItem entry={userInList} onClick={onUserClick} />
								<ListDivider />
							</>
						)}
					</motion.div>
				</>
			)}

			{/* Reset Timer */}
			{resetInfo && timeframe !== 'all_time' && (
				<ResetTimer resetInfo={resetInfo} />
			)}

			{/* Empty State */}
			{!isLoading && entries.length === 0 && (
				<div className='flex flex-col items-center justify-center py-16 text-center'>
					<div className='w-16 h-16 mb-4 rounded-full bg-muted/10 flex items-center justify-center'>
						<ChefHat className='w-8 h-8 text-muted' />
					</div>
					<h3 className='text-lg font-bold text-text mb-2'>No Rankings Yet</h3>
					<p className='text-sm text-muted max-w-xs'>
						{type === 'friends'
							? 'Invite friends to compete with you!'
							: 'Be the first to cook and claim the top spot!'}
					</p>
				</div>
			)}
		</div>
	)
}

export default LeaderboardPage
