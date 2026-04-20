'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
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
	Play,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	BUTTON_SUBTLE_HOVER,
	BUTTON_SUBTLE_TAP,
	DURATION_S,
} from '@/lib/motion'
import { AnimatedNumber } from '@/components/ui/animated-number'
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
	onCookAgain?: (recipeId: string) => void
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

const getTimeLeft = (
	expiresAt: Date,
	t: (key: string, values?: Record<string, unknown>) => string,
): string => {
	const now = new Date()
	const diff = expiresAt.getTime() - now.getTime()

	if (diff <= 0) return t('getTimeExpired')

	const hours = Math.floor(diff / (1000 * 60 * 60))
	const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
	const days = Math.floor(hours / 24)

	if (days > 0) return t('getTimeDays', { days })
	if (hours > 0) return t('getTimeHours', { hours, minutes })
	return t('getTimeMinutes', { minutes })
}

const getTimeSinceCook = (
	cookedAt: Date,
	t: (key: string, values?: Record<string, unknown>) => string,
): string => {
	const now = new Date()
	const diff = now.getTime() - cookedAt.getTime()

	const hours = Math.floor(diff / (1000 * 60 * 60))
	const days = Math.floor(hours / 24)
	const weeks = Math.floor(days / 7)

	if (weeks > 0) return t('timeSinceWeeks', { weeks })
	if (days > 0) return t('timeSinceDays', { days })
	if (hours > 0) return t('timeSinceHours', { hours })
	return t('timeSinceJustNow')
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
	const t = useTranslations('history')
	const statItems = [
		{ label: t('totalSessions'), value: stats.totalSessions },
		{ label: t('uniqueRecipes'), value: stats.uniqueRecipes },
		{
			label: t('pendingPosts'),
			value: stats.pendingPosts,
			highlight: stats.pendingPosts > 0,
		},
		{
			label: t('xpEarned'),
			value: stats.totalXPEarned.toLocaleString(),
		},
	]

	return (
		<motion.div
			className='grid grid-cols-2 md:grid-cols-4 gap-4 bg-bg-card rounded-2xl p-5 border border-border mb-6'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: DURATION_S.slow, ease: 'easeOut' }}
		>
			{statItems.map((stat, index) => (
				<motion.div
					key={stat.label}
					className={cn(
						'text-center p-3 rounded-xl transition-colors hover:bg-muted/50',
						stat.highlight && 'bg-brand/10 border border-brand/20',
					)}
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: index * 0.05, duration: DURATION_S.smooth }}
				>
					<span
						className={cn(
							'block text-2xl md:text-3xl font-display font-extrabold',
							stat.highlight ? 'text-brand' : 'text-foreground',
						)}
					>
						{stat.value}
					</span>
					<span className='text-xs md:text-sm text-text-secondary font-medium'>
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
	const t = useTranslations('history')
	const isUrgent = session.status === 'urgent'
	const isWarning = session.status === 'warning'
	const decayPercent =
		session.baseXP > 0
			? ((session.baseXP - session.currentXP) / session.baseXP) * 100
			: 0

	return (
		<motion.div
			className={cn(
				'bg-muted/30 rounded-2xl overflow-hidden transition-shadow hover:shadow-warm',
				isUrgent &&
					'border border-error/30 bg-gradient-to-r from-error/5 to-transparent',
				isWarning &&
					'border border-warning/30 bg-gradient-to-r from-warning/5 to-transparent',
			)}
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: DURATION_S.smooth, ease: 'easeOut' }}
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
					{getTimeLeft(session.expiresAt, t)}
				</div>
			)}

			{/* Content */}
			<div className='flex items-center gap-4 p-4'>
				<Image
					src={session.recipeImage}
					alt={session.recipeName}
					width={64}
					height={64}
					className='size-16 rounded-xl object-cover flex-shrink-0'
				/>

				<div className='flex-1 min-w-0'>
					<span className='block text-base font-bold text-foreground'>
						{session.recipeName}
					</span>
					<span className='flex items-center gap-2 text-sm text-text-secondary'>
						<span>
							{t('cookedAgo', { time: getTimeSinceCook(session.cookedAt, t) })}
						</span>
						<span className='opacity-50'>•</span>
						<span>
							{t('sessionDuration', {
								duration: formatDuration(session.duration),
							})}
						</span>
					</span>

					{/* XP Decay Indicator - ONLY shown when actual time-based decay has occurred */}
					{/* Decay happens after 7 days: 50% at days 8-14, 0% after day 14 */}
					{decayPercent > 0 && (
						<div className='mt-2'>
							<div className='h-1 bg-border rounded-full overflow-hidden max-w-thumbnail-2xl'>
								<motion.div
									className='h-full bg-gradient-to-r from-error to-warning rounded-full'
									initial={{ width: 0 }}
									animate={{ width: `${decayPercent}%` }}
									transition={{ duration: DURATION_S.slow }}
								/>
							</div>
							<span className='text-xs text-error font-semibold'>
								{t('timeDecay', { percent: Math.round(decayPercent) })}
							</span>
						</div>
					)}
				</div>

				{/* XP Display */}
				<div className='text-right flex-shrink-0 min-w-thumbnail-lg'>
					<span className='block text-xl font-display font-extrabold text-success'>
						+
						<AnimatedNumber
							value={session.currentXP}
							className='tabular-nums'
						/>
					</span>
					{/* Only show original XP if there's actual time-based decay */}
					{session.currentXP < session.baseXP && session.currentXP > 0 && (
						<span className='block text-xs text-error line-through'>
							{t('wasXp', { xp: session.baseXP })}
						</span>
					)}
				</div>

				{/* Post Button */}
				<motion.button
					type='button'
					className={cn(
						'px-5 py-2.5 rounded-xl font-semibold text-sm focus-visible:ring-2 focus-visible:ring-brand/50',
						isUrgent
							? 'bg-error text-white shadow-warm shadow-error/30'
							: 'bg-brand text-white shadow-warm shadow-primary/30',
					)}
					onClick={() => onPost(session.id)}
					whileHover={BUTTON_HOVER}
					whileTap={BUTTON_TAP}
					transition={TRANSITION_SPRING}
					style={
						isUrgent
							? { animation: 'urgentPulse 1.5s ease-in-out infinite' }
							: undefined
					}
				>
					{isUrgent ? t('postNow') : t('post')}
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
	onCookAgain?: (recipeId: string) => void
}

const CompletedItem = ({
	session,
	onViewPost,
	onCookAgain,
}: CompletedItemProps) => {
	const t = useTranslations('history')
	const isMastered = session.cookCount && session.cookCount >= 5
	const isReduced = session.cookCount && session.cookCount > 2

	return (
		<motion.div
			className='bg-muted/30 rounded-2xl overflow-hidden hover:shadow-warm transition-shadow'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: DURATION_S.smooth, ease: 'easeOut' }}
		>
			<div className='flex items-center gap-4 p-4'>
				{/* Image Stack */}
				<div className='relative size-16 flex-shrink-0'>
					<Image
						src={session.recipeImage}
						alt={session.recipeName}
						fill
						sizes='64px'
						className='rounded-xl object-cover'
					/>
					{session.postId && (
						<Image
							src={session.recipeImage}
							alt={session.recipeName || 'Recipe thumbnail'}
							width={32}
							height={32}
							className='absolute -bottom-1 -right-1 rounded-lg border-2 border-bg-card object-cover'
						/>
					)}
				</div>

				<div className='flex-1 min-w-0'>
					<span className='flex items-center gap-2 text-base font-bold text-foreground'>
						{session.recipeName}
						{isMastered && (
							<span className='rounded-md bg-accent-purple/10 px-2 py-0.5 text-xs font-semibold text-accent-purple'>
								🥇 {t('mastered')}
							</span>
						)}
						{!isMastered && session.cookCount && session.cookCount > 1 && (
							<span className='text-xs font-semibold text-text-secondary bg-bg-elevated px-2 py-0.5 rounded-md'>
								{t('nthCook', {
									count: session.cookCount,
									suffix:
										session.cookCount === 2
											? 'nd'
											: session.cookCount === 3
												? 'rd'
												: 'th',
								})}
							</span>
						)}
					</span>
					<span className='flex items-center gap-2 text-sm text-text-secondary'>
						<span>{getTimeSinceCook(session.cookedAt, t)}</span>
						<span className='opacity-50'>•</span>
						<span>{formatDuration(session.duration)}</span>
						{session.rating && (
							<>
								<span className='opacity-50'>•</span>
								<span className='flex items-center gap-1'>
									<Star className='size-3 fill-warning text-warning' />
									{session.rating.toFixed(1)}
								</span>
							</>
						)}
					</span>
				</div>

				{/* XP Display */}
				<div className='text-right flex-shrink-0'>
					<span className='block text-xl font-display font-extrabold text-success'>
						+
						<AnimatedNumber
							value={session.currentXP}
							className='tabular-nums'
						/>
					</span>
					{!isReduced && (
						<span className='block text-xs text-success'>{t('fullXp')}</span>
					)}
					{isReduced && (
						<span className='block text-xs text-text-secondary'>
							{t('reducedXp', {
								count: session.cookCount,
								suffix: session.cookCount === 2 ? 'nd' : 'rd',
							})}
						</span>
					)}
				</div>

				{/* View Post Button */}
				{session.postId && onViewPost && (
					<motion.button
						type='button'
						className='flex items-center gap-1.5 px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm font-semibold hover:bg-bg-hover focus-visible:ring-2 focus-visible:ring-brand/50'
						onClick={() => onViewPost(session.postId!)}
						whileHover={BUTTON_SUBTLE_HOVER}
						whileTap={BUTTON_SUBTLE_TAP}
						transition={TRANSITION_SPRING}
					>
						<ExternalLink className='h-3.5 w-3.5' />
						{t('viewPost')}
					</motion.button>
				)}

				{/* Cook Again Button */}
				{onCookAgain && session.recipeId && (
					<motion.button
						type='button'
						className='flex items-center gap-1.5 px-4 py-2.5 bg-brand/10 border border-brand/30 rounded-xl text-sm font-semibold text-brand hover:bg-brand/20 focus-visible:ring-2 focus-visible:ring-brand/50'
						onClick={() => onCookAgain(session.recipeId!)}
						whileHover={BUTTON_SUBTLE_HOVER}
						whileTap={BUTTON_SUBTLE_TAP}
						transition={TRANSITION_SPRING}
					>
						<Play className='h-3.5 w-3.5 fill-current' />
						{t('cookAgain')}
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
	const t = useTranslations('history')
	const isAbandoned = session.status === 'abandoned'

	return (
		<motion.div
			className='bg-muted/30 rounded-2xl overflow-hidden'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 0.6, y: 0 }}
			transition={{ duration: DURATION_S.smooth, ease: 'easeOut' }}
		>
			<div className='flex items-center gap-4 p-4'>
				<Image
					src={session.recipeImage}
					alt={session.recipeName}
					width={64}
					height={64}
					className='size-16 rounded-xl object-cover grayscale flex-shrink-0'
				/>

				<div className='flex-1 min-w-0'>
					<span className='block text-base font-bold text-text-secondary'>
						{session.recipeName}
					</span>
					<span className='flex items-center gap-2 text-sm'>
						<span className='text-text-secondary'>
							{getTimeSinceCook(session.cookedAt, t)}
						</span>
						<span className='opacity-50'>•</span>
						<span
							className={cn(
								'font-semibold',
								isAbandoned ? 'text-text-secondary' : 'text-error',
							)}
						>
							{isAbandoned
								? session.abandonedAtStep
									? t('abandonedAtStep', { step: session.abandonedAtStep })
									: t('abandoned')
								: t('expired')}
						</span>
					</span>
				</div>

				{/* XP Display */}
				<div className='text-right flex-shrink-0'>
					{isAbandoned ? (
						<span className='text-base font-semibold text-text-secondary'>
							{t('zeroXp')}
						</span>
					) : (
						<>
							<span className='block text-lg font-bold text-text-secondary'>
								+
								<AnimatedNumber
									value={session.currentXP}
									className='tabular-nums'
								/>
							</span>
							<span className='block text-xs text-error'>
								{t('xpLost', { amount: session.baseXP - session.currentXP })}
							</span>
						</>
					)}
				</div>

				{/* Action */}
				{isAbandoned && onRetry ? (
					<motion.button
						type='button'
						className='flex items-center gap-1.5 px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm font-semibold hover:bg-bg-hover focus-visible:ring-2 focus-visible:ring-brand/50'
						onClick={() => onRetry(session.id)}
						whileHover={BUTTON_SUBTLE_HOVER}
						whileTap={BUTTON_SUBTLE_TAP}
						transition={TRANSITION_SPRING}
					>
						<RefreshCw className='h-3.5 w-3.5' />
						{t('tryAgain')}
					</motion.button>
				) : (
					<span className='text-xs text-text-secondary px-4 py-2.5 bg-muted/50 rounded-lg'>
						{t('notPosted')}
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
	onCookAgain,
	onFilterChange,
	className,
}: CookingHistoryTabProps) => {
	const t = useTranslations('history')
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
		<div className={cn('p-6', className)}>
			{/* Stats Banner */}
			<StatsBanner stats={stats} />

			{/* Pending Posts Section */}
			{pendingSessions.length > 0 && (
				<motion.section
					className='bg-bg-card rounded-2xl p-5 border border-border border-l-4 border-l-primary mb-6'
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: DURATION_S.slow, ease: 'easeOut' }}
				>
					{/* Section Header */}
					<div className='flex items-center justify-between mb-4'>
						<h3 className='flex items-center gap-2 text-lg font-bold'>
							<span>📸</span>
							{t('pendingPostsTitle')}
						</h3>
						<span className='text-base font-bold text-success bg-success/10 px-3 py-1.5 rounded-full'>
							{t('xpAvailable', { xp: Math.round(totalPendingXP) })}
						</span>
					</div>

					{/* Urgent Alert */}
					{urgentCount > 0 && (
						<div className='flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-error/10 to-error/5 border border-error/20 rounded-xl mb-4 text-sm font-semibold text-error'>
							<span>⚠ï¸</span>
							{t('urgentAlert', { count: urgentCount })}
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
							type='button'
							className='flex items-center justify-center gap-2 w-full mt-4 py-3 border border-border rounded-xl text-sm font-semibold text-text-secondary hover:bg-muted/50 hover:text-foreground transition-all'
							onClick={() => setShowMorePending(true)}
						>
							{t('showMore', { count: hiddenPendingCount })}
							<ChevronDown className='size-4' />
						</button>
					)}
				</motion.section>
			)}

			{/* Completed Sessions Section */}
			<motion.section
				className='bg-bg-card rounded-2xl p-5 border border-border mb-6'
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: DURATION_S.slow, ease: 'easeOut', delay: 0.1 }}
			>
				{/* Section Header */}
				<div className='flex items-center justify-between mb-4'>
					<h3 className='flex items-center gap-2 text-lg font-bold'>
						<span>✅</span>
						{t('cookingHistory')}
					</h3>
					<div className='flex gap-2'>
						<select
							aria-label={t('filterTimeRange')}
							className='px-3 py-2 bg-bg-card border border-border rounded-lg text-sm text-text cursor-pointer'
							value={filter.timeRange}
							onChange={e =>
								handleFilterChange({
									timeRange: e.target.value as HistoryFilter['timeRange'],
								})
							}
						>
							<option value='all'>{t('filterAll')}</option>
							<option value='week'>{t('filterWeek')}</option>
							<option value='month'>{t('filterMonth')}</option>
							<option value='year'>{t('filterYear')}</option>
						</select>
						<select
							aria-label={t('filterSortBy')}
							className='px-3 py-2 bg-bg-card border border-border rounded-lg text-sm text-text cursor-pointer'
							value={filter.sortBy}
							onChange={e =>
								handleFilterChange({
									sortBy: e.target.value as HistoryFilter['sortBy'],
								})
							}
						>
							<option value='recent'>{t('sortRecent')}</option>
							<option value='xp'>{t('sortXp')}</option>
							<option value='rating'>{t('sortRating')}</option>
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
							onCookAgain={onCookAgain}
						/>
					))}

					{/* Expired/Abandoned */}
					{expiredSessions.map(session => (
						<ExpiredItem key={session.id} session={session} onRetry={onRetry} />
					))}
				</div>

				{completedSessions.length === 0 && expiredSessions.length === 0 && (
					<div className='text-center py-8 text-text-secondary'>
						<p className='text-lg'>{t('noHistory')}</p>
						<p className='text-sm'>{t('noHistoryDesc')}</p>
					</div>
				)}
			</motion.section>
		</div>
	)
}

export default CookingHistoryTab
