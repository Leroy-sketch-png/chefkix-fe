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
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	staggerContainer,
	staggerItem,
	LIST_ITEM_HOVER,
	LIST_ITEM_TAP,
	BUTTON_SUBTLE_HOVER,
	BUTTON_SUBTLE_TAP,
} from '@/lib/motion'
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
		<div className='flex gap-2 p-1.5 bg-bg-card rounded-2xl mb-4'>
			{tabs.map(({ type, label, icon: Icon }) => (
				<motion.button
					type='button'
					key={type}
					whileTap={LIST_ITEM_TAP}
					onClick={() => onTypeChange?.(type)}
					className={cn(
						'flex-1 flex items-center justify-center gap-2 py-3 px-4 focus-visible:ring-2 focus-visible:ring-brand/50',
						'rounded-xl text-sm font-semibold transition-all',
						activeType === type
							? 'bg-gradient-xp text-white'
							: 'text-text-muted hover:text-text',
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
	const t = useTranslations('leaderboard')
	const timeframes: { value: Timeframe; label: string }[] = [
		{ value: 'weekly', label: t('thisWeek') },
		{ value: 'monthly', label: t('thisMonth') },
		{ value: 'all_time', label: t('allTime') },
	]

	const activeIndex = timeframes.findIndex(t => t.value === activeTimeframe)

	return (
		<div className='relative flex p-1 bg-bg-card rounded-xl mb-5'>
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
					type='button'
					key={value}
					onClick={() => onTimeframeChange?.(value)}
					className={cn(
						'flex-1 py-2.5 text-sm font-semibold z-10 transition-colors',
						activeTimeframe === value ? 'text-text' : 'text-text-muted',
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
	const t = useTranslations('leaderboard')
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className={cn(
				'flex flex-col sm:flex-row items-center gap-5 p-4 sm:p-5',
				'bg-accent-purple-subtle',
				'border-2 border-accent-purple/20 rounded-2xl mb-6',
			)}
		>
			<div className='flex flex-col items-center sm:pr-5 sm:border-r border-border pb-4 sm:pb-0 w-full sm:w-auto'>
				<span className='text-xs font-semibold text-text-muted uppercase tracking-wide'>
					{t('yourRank')}
				</span>
				<span className='text-3xl font-black text-xp'>#{myRank.rank}</span>
			</div>

			{/* Stats */}
			<div className='flex gap-5'>
				<div className='flex flex-col'>
					<span className='text-xl font-display font-extrabold text-text'>
						{myRank.xpThisWeek}
					</span>
					<span className='text-xs text-text-muted'>{t('xpThisWeek')}</span>
				</div>
				<div className='flex flex-col'>
					<span className='text-xl font-display font-extrabold text-text'>
						{myRank.recipesCooked}
					</span>
					<span className='text-xs text-text-muted'>{t('recipesCooked')}</span>
				</div>
			</div>

			{/* Goal & CTA */}
			<div className='flex-1 flex flex-col items-center sm:items-end gap-2 w-full sm:w-auto'>
				<span className='text-xs text-text-muted'>
					{t('xpToNext', {xp: myRank.xpToNextRank, rank: myRank.nextRankPosition})}
				</span>
				<motion.button
					type='button'
					whileHover={LIST_ITEM_HOVER}
					whileTap={LIST_ITEM_TAP}
					onClick={onCookNow}
					className={cn(
						'py-2 px-4 rounded-lg text-sm font-bold text-white focus-visible:ring-2 focus-visible:ring-brand/50',
						'bg-gradient-xp',
						'w-full sm:w-auto',
					)}
				>
					{t('cookNow')}
				</motion.button>
			</div>
		</motion.div>
	)
}

// ============================================================================
// RESET TIMER
// ============================================================================

function ResetTimer({ resetInfo }: { resetInfo: ResetInfo }) {
	const t = useTranslations('leaderboard')
	return (
		<div className='flex items-center justify-center gap-2 py-3.5 bg-bg-card rounded-xl mt-4 text-sm text-text-muted'>
			<Clock className='size-icon-sm' />
			<span>
				{t('resetsIn')}{' '}
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
	const t = useTranslations('leaderboard')
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
						type='button'
						whileHover={BUTTON_SUBTLE_HOVER}
						whileTap={BUTTON_SUBTLE_TAP}
						onClick={onBack}
						className='size-10 flex items-center justify-center bg-bg-card border border-border rounded-xl text-text focus-visible:ring-2 focus-visible:ring-brand/50'
						aria-label={t('ariaGoBack')}
					>
						<ArrowLeft className='size-5' />
					</motion.button>
				)}
				<h1 className='flex-1 text-2xl font-display font-extrabold text-text'>
					{t('title')}
				</h1>
				{onShare && (
					<motion.button
						type='button'
						whileHover={BUTTON_SUBTLE_HOVER}
						whileTap={BUTTON_SUBTLE_TAP}
						onClick={onShare}
						className='size-10 flex items-center justify-center bg-bg-card border border-border rounded-xl text-text-muted focus-visible:ring-2 focus-visible:ring-brand/50'
						aria-label={t('ariaShareLeaderboard')}
					>
						<Share2 className='size-5' />
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
					<div className='bg-bg-card rounded-2xl p-2'>
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
						className='bg-bg-card rounded-2xl p-2'
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

			{/* Empty State - Encouraging, not depressing */}
			{!isLoading && entries.length === 0 && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className='flex flex-col items-center justify-center py-16 text-center'
				>
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={TRANSITION_SPRING}
						className='size-16 mb-4 rounded-2xl bg-gradient-xp shadow-lg flex items-center justify-center'
					>
						<ChefHat className='size-8 text-white' />
					</motion.div>
					<h3 className='text-lg font-bold text-text mb-2'>
						{type === 'friends'
							? t('emptyFriendsTitle')
							: t('emptyGlobalTitle')}
					</h3>
					<p className='text-sm text-text-secondary max-w-xs'>
						{type === 'friends'
							? t('emptyFriendsDesc')
							: t('emptyGlobalDesc')}
					</p>
				</motion.div>
			)}
		</div>
	)
}

export default LeaderboardPage
