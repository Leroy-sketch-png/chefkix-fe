'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Clock,
	ChevronDown,
	ChevronRight,
	ExternalLink,
	RefreshCw,
	Star,
	Award,
	Filter,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	fadeInUp,
	staggerContainer,
	scaleIn,
} from '@/lib/motion'
import type { PendingSession } from './PendingPostsSection'

// =============================================================================
// TYPES
// =============================================================================

interface CookingHistoryTabProps {
	sessions: PendingSession[]
	stats: CookingStats
	onPost: (sessionId: string) => void
	onViewPost?: (postId: string) => void
	onRetry?: (sessionId: string) => void
	onFilterChange?: (filter: HistoryFilter) => void
	className?: string
}

interface CookingStats {
	totalSessions: number
	uniqueRecipes: number
	pendingPosts: number
	totalXPEarned: number
}

interface HistoryFilter {
	timeRange: 'all' | 'week' | 'month' | 'year'
	sortBy: 'recent' | 'xp' | 'rating'
}

// =============================================================================
// HELPERS
// =============================================================================

const getTimeLeft = (expiresAt: Date): string => {
	const now = new Date()
	const diff = expiresAt.getTime() - now.getTime()

	if (diff <= 0) return 'Expired'

	const hours = Math.floor(diff / (1000 * 60 * 60))
	const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
	const days = Math.floor(hours / 24)

	if (days > 0) return `${days}d left`
	if (hours > 0) return `${hours}h ${minutes}m left`
	return `${minutes}m left`
}

const getTimeSinceCook = (cookedAt: Date): string => {
	const now = new Date()
	const diff = now.getTime() - cookedAt.getTime()

	const hours = Math.floor(diff / (1000 * 60 * 60))
	const days = Math.floor(hours / 24)
	const weeks = Math.floor(days / 7)

	if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`
	if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
	if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
	return 'Just now'
}

const formatDuration = (minutes: number): string => {
	if (minutes >= 60) {
		const hours = Math.floor(minutes / 60)
		const mins = minutes % 60
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
	}
	return `${minutes}m`
}

// =============================================================================
// STATS BANNER
// =============================================================================

interface StatsBannerProps {
	stats: CookingStats
}

const StatsBanner = ({ stats }: StatsBannerProps) => {
	const statItems = [
		{ label: 'Total Sessions', value: stats.totalSessions },
		{ label: 'Unique Recipes', value: stats.uniqueRecipes },
		{
			label: 'Pending Posts',
			value: stats.pendingPosts,
			highlight: stats.pendingPosts > 0,
		},
		{
			label: 'XP Earned',
			value: stats.totalXPEarned.toLocaleString(),
		},
	]

	return (
		<motion.div
			className='grid grid-cols-2 md:grid-cols-4 gap-4 bg-panel-bg rounded-2xl p-5 border border-border mb-6'
			variants={fadeInUp}
		>
			{statItems.map((stat, index) => (
				<motion.div
					key={stat.label}
					className={cn(
						'text-center p-3 rounded-xl transition-colors hover:bg-muted/50',
						stat.highlight && 'bg-primary/10 border border-primary/20',
					)}
					variants={scaleIn}
					transition={{ delay: index * 0.05 }}
				>
					<span
						className={cn(
							'block text-2xl md:text-3xl font-extrabold',
							stat.highlight ? 'text-primary' : 'text-foreground',
						)}
					>
						{stat.value}
					</span>
					<span className='text-xs md:text-sm text-muted-foreground font-medium'>
						{stat.label}
					</span>
				</motion.div>
			))}
		</motion.div>
	)
}

// =============================================================================
// PENDING ITEM
// =============================================================================

interface PendingItemProps {
	session: PendingSession
	onPost: (id: string) => void
}

const PendingItem = ({ session, onPost }: PendingItemProps) => {
	const isUrgent = session.status === 'urgent'
	const isWarning = session.status === 'warning'
	const decayPercent =
		session.baseXP > 0
			? ((session.baseXP - session.currentXP) / session.baseXP) * 100
			: 0

	return (
		<motion.div
			className={cn(
				'bg-muted/30 rounded-2xl overflow-hidden transition-shadow hover:shadow-lg',
				isUrgent &&
					'border border-error/30 bg-gradient-to-r from-error/5 to-transparent',
				isWarning &&
					'border border-warning/30 bg-gradient-to-r from-warning/5 to-transparent',
			)}
			variants={fadeInUp}
		>
			{/* Expiry Badge */}
			{(isUrgent || isWarning) && (
				<div
					className={cn(
						'px-4 py-2 text-xs font-bold uppercase tracking-wide text-white',
						isUrgent
							? 'bg-gradient-to-r from-error to-error/80'
							: 'bg-gradient-to-r from-warning to-warning/80',
					)}
				>
					{getTimeLeft(session.expiresAt)}
				</div>
			)}

			{/* Content */}
			<div className='flex items-center gap-4 p-4'>
				<Image
					src={session.recipeImage}
					alt={session.recipeName}
					className='w-16 h-16 rounded-xl object-cover flex-shrink-0'
				/>

				<div className='flex-1 min-w-0'>
					<span className='block text-base font-bold text-foreground'>
						{session.recipeName}
					</span>
					<span className='flex items-center gap-2 text-sm text-muted-foreground'>
						<span>Cooked {getTimeSinceCook(session.cookedAt)}</span>
						<span className='opacity-50'>•</span>
						<span>{formatDuration(session.duration)} session</span>
					</span>

					{/* XP Decay Indicator */}
					{decayPercent > 0 && (
						<div className='mt-2'>
							<div className='h-1 bg-border rounded-full overflow-hidden max-w-thumbnail-2xl'>
								<motion.div
									className='h-full bg-gradient-to-r from-error to-warning rounded-full'
									initial={{ width: 0 }}
									animate={{ width: `${decayPercent}%` }}
									transition={{ duration: 0.5 }}
								/>
							</div>
							<span className='text-xs text-error font-semibold'>
								XP at {100 - Math.round(decayPercent)}% (late posting)
							</span>
						</div>
					)}
				</div>

				{/* XP Display */}
				<div className='text-right flex-shrink-0 min-w-thumbnail-lg'>
					<span className='block text-xl font-extrabold text-success'>
						+{session.currentXP}
					</span>
					{session.currentXP < session.baseXP && (
						<span className='block text-xs text-error line-through'>
							(was +{session.baseXP})
						</span>
					)}
				</div>

				{/* Post Button */}
				<motion.button
					className={cn(
						'px-5 py-2.5 rounded-xl font-semibold text-sm',
						isUrgent
							? 'bg-error text-white shadow-lg shadow-error/30'
							: 'bg-primary text-primary-foreground shadow-lg shadow-primary/30',
					)}
					onClick={() => onPost(session.id)}
					whileHover={{ scale: 1.02, y: -1 }}
					whileTap={{ scale: 0.98 }}
					style={
						isUrgent
							? { animation: 'urgentPulse 1.5s ease-in-out infinite' }
							: undefined
					}
				>
					{isUrgent ? 'POST NOW' : 'Post'}
				</motion.button>
			</div>
		</motion.div>
	)
}

// =============================================================================
// COMPLETED ITEM
// =============================================================================

interface CompletedItemProps {
	session: PendingSession
	onViewPost?: (postId: string) => void
}

const CompletedItem = ({ session, onViewPost }: CompletedItemProps) => {
	const isMastered = session.cookCount && session.cookCount >= 5
	const isReduced = session.cookCount && session.cookCount > 2

	return (
		<motion.div
			className='bg-muted/30 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow'
			variants={fadeInUp}
		>
			<div className='flex items-center gap-4 p-4'>
				{/* Image Stack */}
				<div className='relative w-16 h-16 flex-shrink-0'>
					<Image
						src={session.recipeImage}
						alt={session.recipeName}
						className='w-full h-full rounded-xl object-cover'
					/>
					{session.postId && (
						<Image
							src={session.recipeImage}
							alt=''
							className='absolute -bottom-1 -right-1 w-8 h-8 rounded-lg border-2 border-panel-bg object-cover'
						/>
					)}
				</div>

				<div className='flex-1 min-w-0'>
					<span className='flex items-center gap-2 text-base font-bold text-foreground'>
						{session.recipeName}
						{isMastered && (
							<span className='text-xs font-semibold text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-md'>
								🥇 Mastered
							</span>
						)}
						{!isMastered && session.cookCount && session.cookCount > 1 && (
							<span className='text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md'>
								{session.cookCount}
								{session.cookCount === 2
									? 'nd'
									: session.cookCount === 3
										? 'rd'
										: 'th'}{' '}
								cook
							</span>
						)}
					</span>
					<span className='flex items-center gap-2 text-sm text-muted-foreground'>
						<span>{getTimeSinceCook(session.cookedAt)}</span>
						<span className='opacity-50'>•</span>
						<span>{formatDuration(session.duration)}</span>
						{session.rating && (
							<>
								<span className='opacity-50'>•</span>
								<span className='flex items-center gap-1'>
									<Star className='h-3 w-3 fill-warning text-warning' />
									{session.rating.toFixed(1)}
								</span>
							</>
						)}
					</span>
				</div>

				{/* XP Display */}
				<div className='text-right flex-shrink-0'>
					<span className='block text-xl font-extrabold text-success'>
						+{session.currentXP}
					</span>
					{!isReduced && (
						<span className='block text-xs text-success'>Full XP!</span>
					)}
					{isReduced && (
						<span className='block text-xs text-muted-foreground'>
							25% ({session.cookCount}
							{session.cookCount === 2 ? 'nd' : 'rd'}+ cook)
						</span>
					)}
				</div>

				{/* View Post Button */}
				{session.postId && onViewPost && (
					<motion.button
						className='flex items-center gap-1.5 px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm font-semibold hover:bg-muted transition-colors'
						onClick={() => onViewPost(session.postId!)}
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
					>
						<ExternalLink className='h-3.5 w-3.5' />
						View Post
					</motion.button>
				)}
			</div>
		</motion.div>
	)
}

// =============================================================================
// EXPIRED/ABANDONED ITEM
// =============================================================================

interface ExpiredItemProps {
	session: PendingSession
	onRetry?: (id: string) => void
}

const ExpiredItem = ({ session, onRetry }: ExpiredItemProps) => {
	const isAbandoned = session.status === 'abandoned'

	return (
		<motion.div
			className='bg-muted/30 rounded-2xl overflow-hidden opacity-60'
			variants={fadeInUp}
		>
			<div className='flex items-center gap-4 p-4'>
				<Image
					src={session.recipeImage}
					alt={session.recipeName}
					className='w-16 h-16 rounded-xl object-cover grayscale-[50%] flex-shrink-0'
				/>

				<div className='flex-1 min-w-0'>
					<span className='block text-base font-bold text-muted-foreground'>
						{session.recipeName}
					</span>
					<span className='flex items-center gap-2 text-sm'>
						<span className='text-muted-foreground'>
							{getTimeSinceCook(session.cookedAt)}
						</span>
						<span className='opacity-50'>•</span>
						<span
							className={cn(
								'font-semibold',
								isAbandoned ? 'text-muted-foreground' : 'text-error',
							)}
						>
							{isAbandoned
								? `Abandoned at Step ${session.abandonedAtStep}`
								: 'Expired'}
						</span>
					</span>
				</div>

				{/* XP Display */}
				<div className='text-right flex-shrink-0'>
					{isAbandoned ? (
						<span className='text-base font-semibold text-muted-foreground'>
							0 XP
						</span>
					) : (
						<>
							<span className='block text-lg font-bold text-muted-foreground'>
								+{session.currentXP}
							</span>
							<span className='block text-xs text-error'>
								-{session.baseXP - session.currentXP} lost
							</span>
						</>
					)}
				</div>

				{/* Action */}
				{isAbandoned && onRetry ? (
					<motion.button
						className='flex items-center gap-1.5 px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm font-semibold hover:bg-muted transition-colors'
						onClick={() => onRetry(session.id)}
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
					>
						<RefreshCw className='h-3.5 w-3.5' />
						Try Again
					</motion.button>
				) : (
					<span className='text-xs text-muted-foreground px-4 py-2.5 bg-muted/50 rounded-lg'>
						Not posted
					</span>
				)}
			</div>
		</motion.div>
	)
}

// =============================================================================
// COOKING HISTORY TAB (MAIN EXPORT)
// =============================================================================

export const CookingHistoryTab = ({
	sessions,
	stats,
	onPost,
	onViewPost,
	onRetry,
	onFilterChange,
	className,
}: CookingHistoryTabProps) => {
	const [filter, setFilter] = useState<HistoryFilter>({
		timeRange: 'all',
		sortBy: 'recent',
	})
	const [showMorePending, setShowMorePending] = useState(false)

	// Categorize sessions
	const pendingSessions = sessions.filter(
		s => !s.postId && s.status !== 'expired' && s.status !== 'abandoned',
	)
	const completedSessions = sessions.filter(s => s.postId)
	const expiredSessions = sessions.filter(
		s => s.status === 'expired' || s.status === 'abandoned',
	)

	const totalPendingXP = pendingSessions.reduce(
		(sum, s) => sum + s.currentXP,
		0,
	)
	const urgentCount = pendingSessions.filter(
		s => s.status === 'urgent' || s.status === 'warning',
	).length

	const visiblePending = showMorePending
		? pendingSessions
		: pendingSessions.slice(0, 4)
	const hiddenPendingCount = pendingSessions.length - visiblePending.length

	const handleFilterChange = (newFilter: Partial<HistoryFilter>) => {
		const updated = { ...filter, ...newFilter }
		setFilter(updated)
		onFilterChange?.(updated)
	}

	return (
		<motion.div
			className={cn('p-6', className)}
			variants={staggerContainer}
			initial='hidden'
			animate='visible'
		>
			{/* Stats Banner */}
			<StatsBanner stats={stats} />

			{/* Pending Posts Section */}
			{pendingSessions.length > 0 && (
				<motion.section
					className='bg-panel-bg rounded-2xl p-5 border border-border border-l-4 border-l-primary mb-6'
					variants={fadeInUp}
				>
					{/* Section Header */}
					<div className='flex items-center justify-between mb-4'>
						<h3 className='flex items-center gap-2 text-lg font-bold'>
							<span>📸</span>
							Pending Posts
						</h3>
						<span className='text-base font-bold text-success bg-success/10 px-3 py-1.5 rounded-full'>
							+{totalPendingXP} XP available
						</span>
					</div>

					{/* Urgent Alert */}
					{urgentCount > 0 && (
						<div className='flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-error/10 to-error/5 border border-error/20 rounded-xl mb-4 text-sm font-semibold text-error'>
							<span>⚠️</span>
							{urgentCount} recipe{urgentCount > 1 ? 's' : ''} expire within 24
							hours!
						</div>
					)}

					{/* Pending List */}
					<div className='space-y-3'>
						{visiblePending.map(session => (
							<PendingItem key={session.id} session={session} onPost={onPost} />
						))}
					</div>

					{/* Show More */}
					{hiddenPendingCount > 0 && (
						<button
							className='flex items-center justify-center gap-2 w-full mt-4 py-3 border border-dashed border-border rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted/50 hover:border-solid hover:text-foreground transition-all'
							onClick={() => setShowMorePending(true)}
						>
							Show {hiddenPendingCount} more pending
							<ChevronDown className='h-4 w-4' />
						</button>
					)}
				</motion.section>
			)}

			{/* Completed Sessions Section */}
			<motion.section
				className='bg-panel-bg rounded-2xl p-5 border border-border mb-6'
				variants={fadeInUp}
			>
				{/* Section Header */}
				<div className='flex items-center justify-between mb-4'>
					<h3 className='flex items-center gap-2 text-lg font-bold'>
						<span>✅</span>
						Cooking History
					</h3>
					<div className='flex gap-2'>
						<select
							className='px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm cursor-pointer'
							value={filter.timeRange}
							onChange={e =>
								handleFilterChange({
									timeRange: e.target.value as HistoryFilter['timeRange'],
								})
							}
						>
							<option value='all'>All Time</option>
							<option value='week'>This Week</option>
							<option value='month'>This Month</option>
							<option value='year'>This Year</option>
						</select>
						<select
							className='px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm cursor-pointer'
							value={filter.sortBy}
							onChange={e =>
								handleFilterChange({
									sortBy: e.target.value as HistoryFilter['sortBy'],
								})
							}
						>
							<option value='recent'>Most Recent</option>
							<option value='xp'>Highest XP</option>
							<option value='rating'>Highest Rated</option>
						</select>
					</div>
				</div>

				{/* Completed List */}
				<div className='space-y-3'>
					{completedSessions.map(session => (
						<CompletedItem
							key={session.id}
							session={session}
							onViewPost={onViewPost}
						/>
					))}

					{/* Expired/Abandoned */}
					{expiredSessions.map(session => (
						<ExpiredItem key={session.id} session={session} onRetry={onRetry} />
					))}
				</div>

				{completedSessions.length === 0 && expiredSessions.length === 0 && (
					<div className='text-center py-8 text-muted-foreground'>
						<p className='text-lg'>No cooking history yet</p>
						<p className='text-sm'>Start cooking to build your history!</p>
					</div>
				)}
			</motion.section>
		</motion.div>
	)
}

export default CookingHistoryTab
