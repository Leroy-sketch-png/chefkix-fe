'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Upload, Clock, AlertTriangle, ChefHat, Search, Sun, Apple } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING, BUTTON_HOVER, BUTTON_TAP, LIST_ITEM_HOVER } from '@/lib/motion'

// ============================================
// TYPES
// ============================================

type NotificationType =
	| 'xp_awarded'
	| 'xp_awarded_full'
	| 'level_up'
	| 'badge_unlocked'
	| 'badge_unlocked_surprise'
	| 'creator_bonus'
	| 'post_deadline'
	| 'post_deadline_urgent'
	| 'streak_warning'
	| 'streak_lost'
	| 'challenge_reminder'
	| 'weekend_nudge'
	| 'pantry_expiring'

interface BaseNotification {
	id: string
	type: NotificationType
	timestamp: Date
	isRead?: boolean
}

interface XPAwardedNotification extends BaseNotification {
	type: 'xp_awarded'
	recipeName: string
	xpAmount: number
	pendingXp: number
	onPost?: () => void
}

interface XPAwardedFullNotification extends BaseNotification {
	type: 'xp_awarded_full'
	recipeName: string
	xpAmount: number
	photoCount: number
}

interface LevelUpNotification extends BaseNotification {
	type: 'level_up'
	newLevel?: number
	newGoalXp?: number
	recipesToNextLevel?: number
}

interface BadgeUnlockedNotification extends BaseNotification {
	type: 'badge_unlocked'
	badgeIcon: string
	badgeName: string
	badgeRarity: 'common' | 'rare' | 'epic' | 'legendary'
	requirement: string
	onViewBadge?: () => void
}

interface BadgeSurpriseNotification extends BaseNotification {
	type: 'badge_unlocked_surprise'
	badgeIcon: string
	badgeName: string
	percentOwned: number
}

interface CreatorBonusNotification extends BaseNotification {
	type: 'creator_bonus'
	cookerName: string
	cookerUsername: string
	cookerAvatarUrl: string
	recipeName: string
	xpBonus: number
	totalCookRewards?: number
	postId?: string
	onViewPost?: () => void
}

interface PostDeadlineNotification extends BaseNotification {
	type: 'post_deadline'
	recipeName: string
	daysRemaining: number
	pendingXp: number
	onPostNow?: () => void
}

interface PostDeadlineUrgentNotification extends BaseNotification {
	type: 'post_deadline_urgent'
	recipeName: string
	daysRemaining: number
	pendingXp: number
	originalXp: number
	decayPercent: number
	onPostNow?: () => void
}

interface StreakWarningNotification extends BaseNotification {
	type: 'streak_warning'
	streakCount: number
	hoursRemaining: number
	onFindRecipe?: () => void
}

interface StreakLostNotification extends BaseNotification {
	type: 'streak_lost'
	lostStreakCount: number
	bestStreak: number
	onStartNewStreak?: () => void
}

interface ChallengeReminderNotification extends BaseNotification {
	type: 'challenge_reminder'
	challengeTitle: string
	challengeDescription: string
	xpBonusPercent: number
	hoursRemaining: number
	onSeeRecipes?: () => void
}

interface WeekendNudgeNotification extends BaseNotification {
	type: 'weekend_nudge'
	content: string
	onExplore?: () => void
}

interface PantryExpiringNotification extends BaseNotification {
	type: 'pantry_expiring'
	content: string
	daysRemaining: number
	onViewPantry?: () => void
}

type GamifiedNotification =
	| XPAwardedNotification
	| XPAwardedFullNotification
	| LevelUpNotification
	| BadgeUnlockedNotification
	| BadgeSurpriseNotification
	| CreatorBonusNotification
	| PostDeadlineNotification
	| PostDeadlineUrgentNotification
	| StreakWarningNotification
	| StreakLostNotification
	| ChallengeReminderNotification
	| WeekendNudgeNotification
	| PantryExpiringNotification

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatTimeAgo = (date: Date, t: ReturnType<typeof useTranslations<'notifications'>>): string => {
	const now = new Date()
	const diffMs = now.getTime() - date.getTime()
	const diffMins = Math.floor(diffMs / 60000)
	const diffHours = Math.floor(diffMs / 3600000)
	const diffDays = Math.floor(diffMs / 86400000)

	if (diffMins < 1) return t('timeJustNow')
	if (diffMins < 60) return t('timeMinAgo', { count: diffMins })
	if (diffHours < 24) return t('timeHAgo', { count: diffHours })
	if (diffDays === 1) return t('timeYesterday')
	return `${diffDays}d ago`
}

const rarityConfig = {
	common: {
		bg: 'bg-text-muted/15',
		text: 'text-text-secondary',
		label: 'Common',
	},
	rare: { bg: 'bg-rare/15', text: 'text-rare', label: 'Rare' },
	epic: { bg: 'bg-combo/15', text: 'text-combo', label: 'Epic' },
	legendary: {
		bg: 'bg-gradient-celebration',
		text: 'text-white',
		label: 'Legendary',
	},
}

// ============================================
// SHARED COMPONENTS
// ============================================

const NotifWrapper = ({
	children,
	className,
	isRead,
}: {
	children: React.ReactNode
	className?: string
	isRead?: boolean
}) => (
	<motion.div
		initial={{ opacity: 0, x: -10 }}
		animate={{ opacity: 1, x: 0 }}
		whileHover={LIST_ITEM_HOVER}
		className={cn(
			'relative flex items-start gap-3.5 border-b border-border px-5 py-4 transition-colors hover:bg-bg-elevated',
			!isRead && 'bg-brand/5',
			className,
		)}
	>
		{children}
	</motion.div>
)

const NotifHeader = ({
	type,
	time,
	className,
}: {
	type: string
	time: Date
	className?: string
}) => {
	const t = useTranslations('notifications')
	return (
	<div className='mb-1 flex items-center justify-between'>
		<span
			className={cn(
				'text-xs font-bold uppercase tracking-wide text-text-muted',
				className,
			)}
		>
			{type}
		</span>
		<span className='text-xs text-text-muted'>{formatTimeAgo(time, t)}</span>
	</div>
	)
}

const MetaTag = ({
	children,
	className,
}: {
	children: React.ReactNode
	className?: string
}) => (
	<span
		className={cn(
			'rounded-full px-2.5 py-0.5 text-xs font-semibold',
			className,
		)}
	>
		{children}
	</span>
)

const ActionButton = ({
	onClick,
	children,
	className,
}: {
	onClick?: () => void
	children: React.ReactNode
	className?: string
}) => (
	<motion.button
		onClick={onClick}
		whileHover={BUTTON_HOVER}
		whileTap={BUTTON_TAP}
		className={cn(
			'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
			className,
		)}
	>
		{children}
	</motion.button>
)

// ============================================
// NOTIFICATION VARIANTS
// ============================================

// XP Awarded (30% instant)
const XPAwardedItem = ({
	recipeName,
	xpAmount,
	pendingXp,
	timestamp,
	isRead,
	onPost,
}: XPAwardedNotification) => {
	const t = useTranslations('notifications')
	return (
	<NotifWrapper isRead={isRead}>
		{/* Icon */}
		<div className='relative flex size-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-xp to-accent-teal'>
			<span className='relative z-10 text-2xl'>âš¡</span>
			<div className='absolute -inset-1 rounded-full border-2 border-xp/30' />
		</div>

		{/* Content */}
		<div className='min-w-0 flex-1'>
			<NotifHeader type={t('typeXPEarned')} time={timestamp} />
			<p className='text-sm'>
				You earned <strong className='tabular-nums font-bold text-xp'>+{xpAmount.toLocaleString()} XP</strong>{' '}
				for completing{' '}
				<span className='font-semibold text-brand'>{recipeName}</span>
			</p>
			<div className='mt-2 flex items-center gap-2.5'>
				<MetaTag className='bg-xp/15 text-xp'>{t('xpInstant')}</MetaTag>
				<span className='text-xs text-text-muted'>
					{t('xpPendingPost', { xp: pendingXp })}
				</span>
			</div>
		</div>

		{/* Action */}
		<ActionButton
			onClick={onPost}
			className='flex-shrink-0 bg-xp text-white shadow-card shadow-xp/30'
		>
			<Upload className='size-4' />
			{t('post')}
		</ActionButton>
	</NotifWrapper>
	)
}

// XP Awarded Full (After Post)
const XPAwardedFullItem = ({
	recipeName,
	xpAmount,
	photoCount,
	timestamp,
	isRead,
}: XPAwardedFullNotification) => {
	const t = useTranslations('notifications')
	return (
	<NotifWrapper isRead={isRead}>
		{/* Icon */}
		<div className='relative flex size-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-bonus to-legendary'>
			<span className='relative z-10 text-2xl'>âœ¨</span>
			<motion.div
				className='absolute -inset-1 rounded-full border-2 border-bonus/30'
				animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
				transition={{ duration: 1.5, repeat: Infinity }}
			/>
		</div>

		{/* Content */}
		<div className='min-w-0 flex-1'>
			<NotifHeader
				type={t('typeFullXP')}
				time={timestamp}
				className='text-bonus'
			/>
			<p className='text-sm'>
				<strong className='tabular-nums text-lg font-bold text-xp'>+{xpAmount.toLocaleString()} XP</strong>{' '}
				from <span className='font-semibold text-brand'>{recipeName}</span>
			</p>
			<div className='mt-2 flex items-center gap-2.5'>
				<MetaTag className='bg-level/15 text-level'>{t('xp100Earned')}</MetaTag>
				<span className='text-xs text-text-muted'>
					{t('postedWithPhotos', { count: photoCount })}
				</span>
			</div>
		</div>
	</NotifWrapper>
	)
}

// Level Up
const LevelUpItem = ({
	newLevel,
	newGoalXp,
	recipesToNextLevel,
	timestamp,
	isRead,
}: LevelUpNotification) => {
	const t = useTranslations('notifications')
	return (
	<NotifWrapper
		isRead={isRead}
		className='bg-gradient-to-r from-rare/10 to-combo/5'
	>
		{/* Icon */}
		<div className='relative flex size-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rare to-combo'>
			<span className='absolute -right-2 -top-2 z-10 text-lg'>ðŸŽ‰</span>
			<span className='text-lg font-display font-extrabold text-white drop-shadow-sm'>
				{newLevel ?? '?'}
			</span>
			<motion.div
				className='absolute -inset-1.5 rounded-full border-3 border-rare/40'
				animate={{ scale: [1, 1.15, 1], opacity: [1, 0.5, 1] }}
				transition={{ duration: 2, repeat: Infinity }}
			/>
		</div>

		{/* Content */}
		<div className='min-w-0 flex-1'>
			<NotifHeader
				type={t('typeLevelUp')}
				time={timestamp}
				className='text-sm text-rare'
			/>
			<p className='text-sm'>
				{t('levelUpCongrats', { level: newLevel ?? '?' })}
			</p>
			<div className='mt-2 flex items-center gap-2.5'>
				{newGoalXp != null && (
					<MetaTag className='bg-rare/15 text-rare'>
						{t('levelNewGoal', { xp: newGoalXp.toLocaleString() })}
					</MetaTag>
				)}
				{recipesToNextLevel != null && newLevel != null && (
					<span className='text-xs text-text-muted'>
						{t('levelRecipesToNext', { count: recipesToNextLevel, next: (newLevel ?? 0) + 1 })}
					</span>
				)}
			</div>
		</div>

		{/* Celebration particles */}
		<div className='absolute right-5 top-2.5'>
			{[0, 1, 2].map(i => (
				<motion.span
					key={i}
					className={cn(
						'absolute h-1.5 w-1.5 rounded-full',
						i === 0 && 'bg-rare',
						i === 1 && 'bg-bonus',
						i === 2 && 'bg-xp',
					)}
					style={{ left: i * 15 }}
					animate={{ y: [0, -20], opacity: [1, 0], scale: [1, 0] }}
					transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
				/>
			))}
		</div>
	</NotifWrapper>
	)
}

// Badge Unlocked
const BadgeUnlockedItem = ({
	badgeIcon,
	badgeName,
	badgeRarity,
	requirement,
	timestamp,
	isRead,
	onViewBadge,
}: BadgeUnlockedNotification) => {
	const t = useTranslations('notifications')
	const rarity = rarityConfig[badgeRarity]

	return (
		<NotifWrapper isRead={isRead}>
			{/* Icon */}
			<div className='relative flex size-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-bonus to-legendary'>
				<span className='text-icon-lg'>{badgeIcon}</span>
				<div className='absolute -inset-1.5 rounded-full bg-bonus/20 blur-sm' />
			</div>

			{/* Content */}
			<div className='min-w-0 flex-1'>
				<NotifHeader
					type={t('typeNewBadge')}
					time={timestamp}
					className='text-bonus'
				/>
				<p className='text-sm'>
					You earned{' '}
					<strong className='font-bold'>&quot;{badgeName}&quot;</strong>
				</p>
				<div className='mt-2 flex items-center gap-2.5'>
					<MetaTag className={cn(rarity.bg, rarity.text)}>
						{t(`rarity${badgeRarity.charAt(0).toUpperCase() + badgeRarity.slice(1)}`)}
					</MetaTag>
					<span className='text-xs text-text-muted'>{requirement}</span>
				</div>
			</div>

			{/* Action */}
			<ActionButton
				onClick={onViewBadge}
				className='flex-shrink-0 border border-bonus/30 bg-bonus/10 text-legendary hover:bg-bonus/20'
			>
				{t('viewBadge')}
			</ActionButton>
		</NotifWrapper>
	)
}

// Badge Unlocked Surprise
const BadgeSurpriseItem = ({
	badgeIcon,
	badgeName,
	percentOwned,
	timestamp,
	isRead,
}: BadgeSurpriseNotification) => {
	const t = useTranslations('notifications')
	return (
	<NotifWrapper
		isRead={isRead}
		className='bg-gradient-to-r from-rare/10 to-combo/5'
	>
		{/* Icon */}
		<div className='relative flex size-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rare to-combo'>
			<span className='text-icon-lg'>{badgeIcon}</span>
			<motion.div
				className='absolute -inset-2.5 rounded-full bg-rare/30 blur-md'
				initial={{ scale: 0.5, opacity: 1 }}
				animate={{ scale: 1.5, opacity: 0 }}
				transition={{ duration: 1 }}
			/>
		</div>

		{/* Content */}
		<div className='min-w-0 flex-1'>
			<NotifHeader
				type={t('typeSurpriseBadge')}
				time={timestamp}
				className='text-rare'
			/>
			<p className='text-sm'>
				You unlocked a hidden badge:{' '}
				<strong className='font-bold'>&quot;{badgeName}&quot;</strong>
			</p>
			<div className='mt-2 flex items-center gap-2.5'>
				<MetaTag className='bg-gradient-to-r from-rare to-combo text-white'>
					{t('rarityUltraRare')}
				</MetaTag>
				<span className='text-xs text-text-muted'>
					{t('badgePercentOwned', { percent: percentOwned })}
				</span>
			</div>
		</div>
	</NotifWrapper>
	)
}

// Creator Bonus
const CreatorBonusItem = ({
	cookerName,
	cookerUsername,
	cookerAvatarUrl,
	recipeName,
	xpBonus,
	totalCookRewards,
	timestamp,
	isRead,
	onViewPost,
}: CreatorBonusNotification) => {
	const t = useTranslations('notifications')
	return (
	<NotifWrapper isRead={isRead} className='bg-info/5'>
		{/* Avatar */}
		<div className='relative flex-shrink-0'>
			<Image
				src={cookerAvatarUrl}
				alt={cookerName}
				width={48}
				height={48}
				className='size-12 rounded-full object-cover'
			/>
			<div className='absolute -bottom-0.5 -right-0.5 flex size-icon-md items-center justify-center rounded-full border-2 border-bg-card bg-info text-white'>
				<ChefHat className='size-3' />
			</div>
		</div>

		{/* Content */}
		<div className='min-w-0 flex-1'>
			<NotifHeader
				type={t('typeRecipeCooked')}
				time={timestamp}
				className='text-info'
			/>
			<p className='text-sm'>
				{t('creatorCookedYour', { username: cookerUsername })}{' '}
				<span className='font-semibold text-brand'>{recipeName}</span>
			</p>
			<div className='mt-2 flex items-center gap-2.5'>
				<MetaTag className='bg-xp/15 text-xp'>{t('xpBonus', { amount: xpBonus })}</MetaTag>
				{totalCookRewards != null && (
					<span className='text-xs text-text-muted'>
						{t('creatorCookReward', { count: totalCookRewards })}
					</span>
				)}
			</div>
		</div>

		{/* Action */}
		<ActionButton
			onClick={onViewPost}
			className='flex-shrink-0 border border-info/30 bg-info/10 text-info hover:bg-info/20'
		>
			{t('seeTheirPost')}
		</ActionButton>
	</NotifWrapper>
	)
}

// Post Deadline Normal
const PostDeadlineItem = ({
	recipeName,
	daysRemaining,
	pendingXp,
	timestamp,
	isRead,
	onPostNow,
}: PostDeadlineNotification) => {
	const t = useTranslations('notifications')
	return (
	<NotifWrapper isRead={isRead}>
		{/* Icon */}
		<div className='relative flex size-12 flex-shrink-0 items-center justify-center rounded-full bg-text-muted text-white'>
			<Clock className='relative z-10 size-6' />
			<div className='absolute -inset-1 rounded-full border-2 border-text-muted/30' />
		</div>

		{/* Content */}
		<div className='min-w-0 flex-1'>
			<NotifHeader type={t('typePostReminder')} time={timestamp} />
			<p className='text-sm'>
				{t('postWaiting', { name: recipeName })}
			</p>
			<div className='mt-2 flex items-center gap-2.5'>
				<MetaTag className='bg-text-secondary/15 text-text-secondary'>
					{t('daysLeft', { count: daysRemaining })}
				</MetaTag>
				<span className='text-xs text-text-muted'>{t('xpAtStake', { xp: pendingXp })}</span>
			</div>
		</div>

		{/* Action */}
		<ActionButton
			onClick={onPostNow}
			className='flex-shrink-0 bg-brand text-white'
		>
			{t('postNow')}
		</ActionButton>
	</NotifWrapper>
	)
}

// Post Deadline Urgent
const PostDeadlineUrgentItem = ({
	recipeName,
	daysRemaining,
	pendingXp,
	originalXp,
	decayPercent,
	timestamp,
	isRead,
	onPostNow,
}: PostDeadlineUrgentNotification) => {
	const t = useTranslations('notifications')
	return (
	<NotifWrapper
		isRead={isRead}
		className='border-l-4 border-l-error bg-error/10'
	>
		{/* Icon */}
		<div className='relative flex size-12 flex-shrink-0 items-center justify-center rounded-full bg-error text-white'>
			<AlertTriangle className='relative z-10 size-6' />
			<motion.div
				className='absolute -inset-1 rounded-full border-2 border-error/40'
				animate={{ scale: [1, 1.1, 1] }}
				transition={{ duration: 1, repeat: Infinity }}
			/>
		</div>

		{/* Content */}
		<div className='min-w-0 flex-1'>
			<NotifHeader
				type={t('typeDeadlineSoon')}
				time={timestamp}
				className='text-error'
			/>
			<p className='text-sm'>
				{t('deadlineExpires', { name: recipeName })}{' '}
				<strong className='font-bold text-error'>{t('daysCount', { count: daysRemaining })}</strong>
			</p>
			<div className='mt-2 flex items-center gap-2.5'>
				<MetaTag className='bg-error/15 text-error'>
					{t('decayActive', { percent: decayPercent })}
				</MetaTag>
				<span className='text-xs text-text-muted'>
					{t('xpRemainingOf', { pending: pendingXp, original: originalXp })}
				</span>
			</div>
		</div>

		{/* Action */}
		<motion.button
			onClick={onPostNow}
			whileHover={BUTTON_HOVER}
			whileTap={BUTTON_TAP}
			animate={{ scale: [1, 1.02, 1] }}
			transition={{ duration: 1, repeat: Infinity }}
			className='flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-error px-4 py-2 text-sm font-semibold text-white'
		>
			{t('postNowUrgent')}
		</motion.button>
	</NotifWrapper>
	)
}

// Streak Warning
const StreakWarningItem = ({
	streakCount,
	hoursRemaining,
	timestamp,
	isRead,
	onFindRecipe,
}: StreakWarningNotification) => {
	const t = useTranslations('notifications')
	return (
	<NotifWrapper
		isRead={isRead}
		className='border-l-4 border-l-streak bg-streak/10'
	>
		{/* Icon */}
		<div className='relative flex size-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-streak to-streak/90'>
			<span className='relative z-10 text-2xl'>ðŸ”¥</span>
			<motion.div
				className='absolute -inset-1.5 rounded-full bg-streak/30 blur-sm'
				animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
				transition={{ duration: 1.5, repeat: Infinity }}
			/>
		</div>

		{/* Content */}
		<div className='min-w-0 flex-1'>
			<NotifHeader
				type={t('typeStreakRisk')}
				time={timestamp}
				className='text-streak'
			/>
			<p className='text-sm'>
				{t('streakKeepAlive', { count: streakCount })}
			</p>
			<div className='mt-2 flex items-center gap-2.5'>
				<MetaTag className='bg-streak/15 text-streak'>
					{t('hoursLeft', { count: hoursRemaining })}
				</MetaTag>
				<span className='text-xs text-text-muted'>{t('quickRecipesAvailable')}</span>
			</div>
		</div>

		{/* Action */}
		<ActionButton
			onClick={onFindRecipe}
			className='flex-shrink-0 bg-streak text-white'
		>
			<Search className='size-4' />
			{t('findRecipe')}
		</ActionButton>
	</NotifWrapper>
	)
}

// Streak Lost
const StreakLostItem = ({
	lostStreakCount,
	bestStreak,
	timestamp,
	isRead,
	onStartNewStreak,
}: StreakLostNotification) => {
	const t = useTranslations('notifications')
	return (
	<NotifWrapper isRead={isRead} className='opacity-80'>
		{/* Icon */}
		<div className='flex size-12 flex-shrink-0 items-center justify-center rounded-full bg-text-muted'>
			<span className='text-2xl'>ðŸ˜¢</span>
		</div>

		{/* Content */}
		<div className='min-w-0 flex-1'>
			<NotifHeader
				type={t('typeStreakLost')}
				time={timestamp}
				className='text-text-secondary'
			/>
			<p className='text-sm'>
				{t('streakLostMsg', { count: lostStreakCount })}
			</p>
			<div className='mt-2 flex items-center gap-2.5'>
				<MetaTag className='bg-text-secondary/15 text-text-secondary'>
					{t('streakBest', { count: bestStreak })}
				</MetaTag>
				<span className='text-xs text-text-muted'>
					{t('streakNewStarts')}
				</span>
			</div>
		</div>

		{/* Action */}
		<ActionButton
			onClick={onStartNewStreak}
			className='flex-shrink-0 border border-streak/30 bg-streak/10 text-streak hover:bg-streak hover:text-white'
		>
			{t('startNewStreak')}
		</ActionButton>
	</NotifWrapper>
	)
}

// Challenge Reminder
const ChallengeReminderItem = ({
	challengeTitle,
	challengeDescription,
	xpBonusPercent,
	hoursRemaining,
	timestamp,
	isRead,
	onSeeRecipes,
}: ChallengeReminderNotification) => {
	const t = useTranslations('notifications')
	return (
	<NotifWrapper isRead={isRead} className='bg-xp/10'>
		{/* Icon */}
		<div className='relative flex size-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-xp to-rare'>
			<span className='relative z-10 text-2xl'>ðŸŽ¯</span>
			<motion.div
				className='absolute -inset-1 rounded-full border-2 border-dashed border-xp/40'
				animate={{ rotate: 360 }}
				transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
			/>
		</div>

		{/* Content */}
		<div className='min-w-0 flex-1'>
			<NotifHeader
				type={t('typeDailyChallenge')}
				time={timestamp}
				className='text-xp'
			/>
			<p className='text-sm'>
				<strong className='font-bold'>{challengeTitle}</strong>{' '}
				{challengeDescription}
			</p>
			<div className='mt-2 flex items-center gap-2.5'>
				<MetaTag className='bg-xp/15 text-xp'>{t('challengeXPBonus', { percent: xpBonusPercent })}</MetaTag>
				<span className='text-xs text-text-muted'>
					{t('endsInHours', { count: hoursRemaining })}
				</span>
			</div>
		</div>

		{/* Action */}
		<ActionButton
			onClick={onSeeRecipes}
			className='flex-shrink-0 bg-xp text-white shadow-card shadow-xp/30'
		>
			{t('seeRecipes')}
		</ActionButton>
	</NotifWrapper>
	)
}

// Weekend Nudge
const WeekendNudgeItem = ({
	content,
	timestamp,
	isRead,
	onExplore,
}: WeekendNudgeNotification) => {
	const t = useTranslations('notifications')
	return (
	<NotifWrapper isRead={isRead} className='bg-bonus/5'>
		{/* Icon */}
		<div className='relative flex size-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-bonus to-streak'>
			<Sun className='relative z-10 size-6 text-white' />
			<motion.div
				className='absolute -inset-1 rounded-full border-2 border-bonus/30'
				animate={{ rotate: 360 }}
				transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
			/>
		</div>

		{/* Content */}
		<div className='min-w-0 flex-1'>
			<NotifHeader
				type={t('typeWeekendCooking')}
				time={timestamp}
				className='text-bonus'
			/>
			<p className='text-sm'>{content}</p>
			<div className='mt-2 flex items-center gap-2.5'>
				<MetaTag className='bg-bonus/15 text-bonus'>{t('weekendBonus')}</MetaTag>
				<span className='text-xs text-text-muted'>{t('timeToGetCooking')}</span>
			</div>
		</div>

		{/* Action */}
		<ActionButton
			onClick={onExplore}
			className='flex-shrink-0 bg-bonus text-white shadow-card shadow-bonus/30'
		>
			<Search className='size-4' />
			{t('explore')}
		</ActionButton>
	</NotifWrapper>
	)
}

// Pantry Expiring
const PantryExpiringItem = ({
	content,
	daysRemaining,
	timestamp,
	isRead,
	onViewPantry,
}: PantryExpiringNotification) => {
	const t = useTranslations('notifications')
	return (
	<NotifWrapper isRead={isRead} className='bg-streak/5'>
		{/* Icon */}
		<div className='relative flex size-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-streak to-error/80'>
			<Apple className='relative z-10 size-6 text-white' />
			<div className='absolute -inset-1 rounded-full border-2 border-streak/30' />
		</div>

		{/* Content */}
		<div className='min-w-0 flex-1'>
			<NotifHeader
				type={t('typePantryAlert')}
				time={timestamp}
				className='text-streak'
			/>
			<p className='text-sm'>{content}</p>
			<div className='mt-2 flex items-center gap-2.5'>
				<MetaTag className='bg-streak/15 text-streak'>
					{t('daysLeft', { count: daysRemaining })}
				</MetaTag>
				<span className='text-xs text-text-muted'>
					{t('cookBeforeExpire')}
				</span>
			</div>
		</div>

		{/* Action */}
		<ActionButton
			onClick={onViewPantry}
			className='flex-shrink-0 border border-streak/30 bg-streak/10 text-streak hover:bg-streak hover:text-white'
		>
			{t('viewPantry')}
		</ActionButton>
	</NotifWrapper>
	)
}

// ============================================
// MAIN EXPORT
// ============================================

export const NotificationItemGamified = (props: GamifiedNotification) => {
	switch (props.type) {
		case 'xp_awarded':
			return <XPAwardedItem {...props} />
		case 'xp_awarded_full':
			return <XPAwardedFullItem {...props} />
		case 'level_up':
			return <LevelUpItem {...props} />
		case 'badge_unlocked':
			return <BadgeUnlockedItem {...props} />
		case 'badge_unlocked_surprise':
			return <BadgeSurpriseItem {...props} />
		case 'creator_bonus':
			return <CreatorBonusItem {...props} />
		case 'post_deadline':
			return <PostDeadlineItem {...props} />
		case 'post_deadline_urgent':
			return <PostDeadlineUrgentItem {...props} />
		case 'streak_warning':
			return <StreakWarningItem {...props} />
		case 'streak_lost':
			return <StreakLostItem {...props} />
		case 'challenge_reminder':
			return <ChallengeReminderItem {...props} />
		case 'weekend_nudge':
			return <WeekendNudgeItem {...props} />
		case 'pantry_expiring':
			return <PantryExpiringItem {...props} />
		default:
			return null
	}
}

// Export individual variants for direct use
export {
	XPAwardedItem,
	XPAwardedFullItem,
	LevelUpItem,
	BadgeUnlockedItem,
	BadgeSurpriseItem,
	CreatorBonusItem,
	PostDeadlineItem,
	PostDeadlineUrgentItem,
	StreakWarningItem,
	StreakLostItem,
	ChallengeReminderItem,
	WeekendNudgeItem,
	PantryExpiringItem,
}

// Export types
export type { GamifiedNotification, NotificationType }
