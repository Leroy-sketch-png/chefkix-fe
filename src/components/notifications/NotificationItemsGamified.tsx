'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Upload, Clock, AlertTriangle, ChefHat, Search } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING, BUTTON_HOVER, BUTTON_TAP } from '@/lib/motion'

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
	newLevel: number
	newGoalXp: number
	recipesToNextLevel: number
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
	totalCookRewards: number
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

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatTimeAgo = (date: Date): string => {
	const now = new Date()
	const diffMs = now.getTime() - date.getTime()
	const diffMins = Math.floor(diffMs / 60000)
	const diffHours = Math.floor(diffMs / 3600000)
	const diffDays = Math.floor(diffMs / 86400000)

	if (diffMins < 1) return 'Just now'
	if (diffMins < 60) return `${diffMins} min ago`
	if (diffHours < 24) return `${diffHours}h ago`
	if (diffDays === 1) return 'Yesterday'
	return `${diffDays}d ago`
}

const rarityConfig = {
	common: { bg: 'bg-slate-500/15', text: 'text-slate-600', label: 'Common' },
	rare: { bg: 'bg-amber-500/15', text: 'text-amber-600', label: 'Rare' },
	epic: { bg: 'bg-purple-500/15', text: 'text-purple-600', label: 'Epic' },
	legendary: {
		bg: 'bg-gradient-to-r from-purple-500 to-pink-500',
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
}) => (
	<div className='mb-1 flex items-center justify-between'>
		<span
			className={cn(
				'text-xs font-bold uppercase tracking-wide text-text-muted',
				className,
			)}
		>
			{type}
		</span>
		<span className='text-xs text-text-muted'>{formatTimeAgo(time)}</span>
	</div>
)

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
}: XPAwardedNotification) => (
	<NotifWrapper isRead={isRead}>
		{/* Icon */}
		<div className='relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-success to-success/80'>
			<span className='relative z-10 text-2xl'>⚡</span>
			<div className='absolute -inset-1 rounded-full border-2 border-success/30' />
		</div>

		{/* Content */}
		<div className='min-w-0 flex-1'>
			<NotifHeader type='XP Earned' time={timestamp} />
			<p className='text-sm'>
				You earned{' '}
				<strong className='font-bold text-success'>+{xpAmount} XP</strong> for
				completing{' '}
				<span className='font-semibold text-brand'>{recipeName}</span>
			</p>
			<div className='mt-2 flex items-center gap-2.5'>
				<MetaTag className='bg-success/15 text-success'>30% instant</MetaTag>
				<span className='text-xs text-text-muted'>
					{pendingXp} XP pending • Post to unlock
				</span>
			</div>
		</div>

		{/* Action */}
		<ActionButton
			onClick={onPost}
			className='flex-shrink-0 bg-success text-white'
		>
			<Upload className='h-4 w-4' />
			Post
		</ActionButton>
	</NotifWrapper>
)

// XP Awarded Full (After Post)
const XPAwardedFullItem = ({
	recipeName,
	xpAmount,
	photoCount,
	timestamp,
	isRead,
}: XPAwardedFullNotification) => (
	<NotifWrapper isRead={isRead}>
		{/* Icon */}
		<div className='relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600'>
			<span className='relative z-10 text-2xl'>✨</span>
			<motion.div
				className='absolute -inset-1 rounded-full border-2 border-amber-500/30'
				animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
				transition={{ duration: 1.5, repeat: Infinity }}
			/>
		</div>

		{/* Content */}
		<div className='min-w-0 flex-1'>
			<NotifHeader
				type='Full XP Unlocked!'
				time={timestamp}
				className='text-amber-600'
			/>
			<p className='text-sm'>
				<strong className='text-lg font-bold text-success'>
					+{xpAmount} XP
				</strong>{' '}
				from <span className='font-semibold text-brand'>{recipeName}</span>
			</p>
			<div className='mt-2 flex items-center gap-2.5'>
				<MetaTag className='bg-success/15 text-success'>100% earned</MetaTag>
				<span className='text-xs text-text-muted'>
					Posted with {photoCount} photos
				</span>
			</div>
		</div>
	</NotifWrapper>
)

// Level Up
const LevelUpItem = ({
	newLevel,
	newGoalXp,
	recipesToNextLevel,
	timestamp,
	isRead,
}: LevelUpNotification) => (
	<NotifWrapper
		isRead={isRead}
		className='bg-gradient-to-r from-purple-500/10 to-violet-500/5'
	>
		{/* Icon */}
		<div className='relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-violet-500'>
			<span className='absolute -right-2 -top-2 z-10 text-lg'>🎉</span>
			<span className='text-lg font-extrabold text-white drop-shadow-sm'>
				{newLevel}
			</span>
			<motion.div
				className='absolute -inset-1.5 rounded-full border-[3px] border-purple-500/40'
				animate={{ scale: [1, 1.15, 1], opacity: [1, 0.5, 1] }}
				transition={{ duration: 2, repeat: Infinity }}
			/>
		</div>

		{/* Content */}
		<div className='min-w-0 flex-1'>
			<NotifHeader
				type='Level Up!'
				time={timestamp}
				className='text-sm text-purple-500'
			/>
			<p className='text-sm'>
				Congratulations! You&apos;ve reached{' '}
				<strong className='font-bold'>Level {newLevel}</strong>
			</p>
			<div className='mt-2 flex items-center gap-2.5'>
				<MetaTag className='bg-purple-500/15 text-purple-500'>
					New goal: {newGoalXp.toLocaleString()} XP
				</MetaTag>
				<span className='text-xs text-text-muted'>
					{recipesToNextLevel} recipes to Level {newLevel + 1}
				</span>
			</div>
		</div>

		{/* Celebration particles */}
		<div className='absolute right-5 top-2.5'>
			{[0, 1, 2].map(i => (
				<motion.span
					key={i}
					className={cn(
						'absolute h-1.5 w-1.5 rounded-full',
						i === 0 && 'bg-purple-500',
						i === 1 && 'bg-amber-500',
						i === 2 && 'bg-success',
					)}
					style={{ left: i * 15 }}
					animate={{ y: [0, -20], opacity: [1, 0], scale: [1, 0] }}
					transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
				/>
			))}
		</div>
	</NotifWrapper>
)

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
	const rarity = rarityConfig[badgeRarity]

	return (
		<NotifWrapper isRead={isRead}>
			{/* Icon */}
			<div className='relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600'>
				<span className='text-icon-lg'>{badgeIcon}</span>
				<div className='absolute -inset-1.5 rounded-full bg-amber-500/20 blur-sm' />
			</div>

			{/* Content */}
			<div className='min-w-0 flex-1'>
				<NotifHeader
					type='New Badge!'
					time={timestamp}
					className='text-amber-500'
				/>
				<p className='text-sm'>
					You earned{' '}
					<strong className='font-bold'>&quot;{badgeName}&quot;</strong>
				</p>
				<div className='mt-2 flex items-center gap-2.5'>
					<MetaTag className={cn(rarity.bg, rarity.text)}>
						{rarity.label}
					</MetaTag>
					<span className='text-xs text-text-muted'>{requirement}</span>
				</div>
			</div>

			{/* Action */}
			<ActionButton
				onClick={onViewBadge}
				className='flex-shrink-0 border border-amber-500/30 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
			>
				View Badge
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
}: BadgeSurpriseNotification) => (
	<NotifWrapper
		isRead={isRead}
		className='bg-gradient-to-r from-purple-500/10 to-pink-500/5'
	>
		{/* Icon */}
		<div className='relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500'>
			<span className='text-icon-lg'>{badgeIcon}</span>
			<motion.div
				className='absolute -inset-2.5 rounded-full bg-purple-500/30 blur-md'
				initial={{ scale: 0.5, opacity: 1 }}
				animate={{ scale: 1.5, opacity: 0 }}
				transition={{ duration: 1 }}
			/>
		</div>

		{/* Content */}
		<div className='min-w-0 flex-1'>
			<NotifHeader
				type='Surprise Badge!'
				time={timestamp}
				className='text-purple-500'
			/>
			<p className='text-sm'>
				You unlocked a hidden badge:{' '}
				<strong className='font-bold'>&quot;{badgeName}&quot;</strong>
			</p>
			<div className='mt-2 flex items-center gap-2.5'>
				<MetaTag className='bg-gradient-to-r from-purple-500 to-pink-500 text-white'>
					Ultra Rare
				</MetaTag>
				<span className='text-xs text-text-muted'>
					Only {percentOwned}% of cooks have this
				</span>
			</div>
		</div>
	</NotifWrapper>
)

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
}: CreatorBonusNotification) => (
	<NotifWrapper isRead={isRead} className='bg-blue-500/5'>
		{/* Avatar */}
		<div className='relative flex-shrink-0'>
			<Image
				src={cookerAvatarUrl}
				alt={cookerName}
				className='h-12 w-12 rounded-full object-cover'
			/>
			<div className='absolute -bottom-0.5 -right-0.5 flex size-icon-md items-center justify-center rounded-full border-2 border-panel-bg bg-blue-500 text-white'>
				<ChefHat className='h-3 w-3' />
			</div>
		</div>

		{/* Content */}
		<div className='min-w-0 flex-1'>
			<NotifHeader
				type='Recipe Cooked!'
				time={timestamp}
				className='text-blue-500'
			/>
			<p className='text-sm'>
				<strong className='font-bold'>@{cookerUsername}</strong> cooked your{' '}
				<span className='font-semibold text-brand'>{recipeName}</span>
			</p>
			<div className='mt-2 flex items-center gap-2.5'>
				<MetaTag className='bg-success/15 text-success'>
					+{xpBonus} XP bonus
				</MetaTag>
				<span className='text-xs text-text-muted'>
					Your {totalCookRewards}th cook reward
				</span>
			</div>
		</div>

		{/* Action */}
		<ActionButton
			onClick={onViewPost}
			className='flex-shrink-0 border border-blue-500/30 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
		>
			See Their Post
		</ActionButton>
	</NotifWrapper>
)

// Post Deadline Normal
const PostDeadlineItem = ({
	recipeName,
	daysRemaining,
	pendingXp,
	timestamp,
	isRead,
	onPostNow,
}: PostDeadlineNotification) => (
	<NotifWrapper isRead={isRead}>
		{/* Icon */}
		<div className='relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-slate-500 text-white'>
			<Clock className='relative z-10 h-6 w-6' />
			<div className='absolute -inset-1 rounded-full border-2 border-slate-500/30' />
		</div>

		{/* Content */}
		<div className='min-w-0 flex-1'>
			<NotifHeader type='Post Reminder' time={timestamp} />
			<p className='text-sm'>
				<span className='font-semibold text-brand'>{recipeName}</span> is
				waiting to be posted
			</p>
			<div className='mt-2 flex items-center gap-2.5'>
				<MetaTag className='bg-slate-500/15 text-slate-600'>
					{daysRemaining} days left
				</MetaTag>
				<span className='text-xs text-text-muted'>{pendingXp} XP at stake</span>
			</div>
		</div>

		{/* Action */}
		<ActionButton
			onClick={onPostNow}
			className='flex-shrink-0 bg-brand text-white'
		>
			Post Now
		</ActionButton>
	</NotifWrapper>
)

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
}: PostDeadlineUrgentNotification) => (
	<NotifWrapper
		isRead={isRead}
		className='border-l-4 border-l-error bg-error/10'
	>
		{/* Icon */}
		<div className='relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-error text-white'>
			<AlertTriangle className='relative z-10 h-6 w-6' />
			<motion.div
				className='absolute -inset-1 rounded-full border-2 border-error/40'
				animate={{ scale: [1, 1.1, 1] }}
				transition={{ duration: 1, repeat: Infinity }}
			/>
		</div>

		{/* Content */}
		<div className='min-w-0 flex-1'>
			<NotifHeader
				type='⚠️ Deadline Soon!'
				time={timestamp}
				className='text-error'
			/>
			<p className='text-sm'>
				<span className='font-semibold text-brand'>{recipeName}</span> expires
				in{' '}
				<strong className='font-bold text-error'>{daysRemaining} days</strong>
			</p>
			<div className='mt-2 flex items-center gap-2.5'>
				<MetaTag className='bg-error/15 text-error'>
					{decayPercent}% decay active
				</MetaTag>
				<span className='text-xs text-text-muted'>
					Only {pendingXp} XP remaining of {originalXp}
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
			Post Now!
		</motion.button>
	</NotifWrapper>
)

// Streak Warning
const StreakWarningItem = ({
	streakCount,
	hoursRemaining,
	timestamp,
	isRead,
	onFindRecipe,
}: StreakWarningNotification) => (
	<NotifWrapper
		isRead={isRead}
		className='border-l-4 border-l-orange-500 bg-orange-500/10'
	>
		{/* Icon */}
		<div className='relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600'>
			<span className='relative z-10 text-2xl'>🔥</span>
			<motion.div
				className='absolute -inset-1.5 rounded-full bg-orange-500/30 blur-sm'
				animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
				transition={{ duration: 1.5, repeat: Infinity }}
			/>
		</div>

		{/* Content */}
		<div className='min-w-0 flex-1'>
			<NotifHeader
				type='Streak at Risk!'
				time={timestamp}
				className='text-orange-500'
			/>
			<p className='text-sm'>
				Cook something today to keep your{' '}
				<strong className='font-bold'>{streakCount}-day streak</strong> alive!
			</p>
			<div className='mt-2 flex items-center gap-2.5'>
				<MetaTag className='bg-orange-500/15 text-orange-600'>
					{hoursRemaining} hours left
				</MetaTag>
				<span className='text-xs text-text-muted'>Quick recipes available</span>
			</div>
		</div>

		{/* Action */}
		<ActionButton
			onClick={onFindRecipe}
			className='flex-shrink-0 bg-orange-500 text-white'
		>
			<Search className='h-4 w-4' />
			Find Recipe
		</ActionButton>
	</NotifWrapper>
)

// Streak Lost
const StreakLostItem = ({
	lostStreakCount,
	bestStreak,
	timestamp,
	isRead,
	onStartNewStreak,
}: StreakLostNotification) => (
	<NotifWrapper isRead={isRead} className='opacity-80'>
		{/* Icon */}
		<div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-slate-500'>
			<span className='text-2xl'>😢</span>
		</div>

		{/* Content */}
		<div className='min-w-0 flex-1'>
			<NotifHeader
				type='Streak Lost'
				time={timestamp}
				className='text-slate-500'
			/>
			<p className='text-sm'>
				Your {lostStreakCount}-day streak has ended. Don&apos;t worry, start
				fresh!
			</p>
			<div className='mt-2 flex items-center gap-2.5'>
				<MetaTag className='bg-slate-500/15 text-slate-600'>
					Best: {bestStreak} days
				</MetaTag>
				<span className='text-xs text-text-muted'>
					New streak starts with your next cook
				</span>
			</div>
		</div>

		{/* Action */}
		<ActionButton
			onClick={onStartNewStreak}
			className='flex-shrink-0 border border-orange-500/30 bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white'
		>
			Start New Streak
		</ActionButton>
	</NotifWrapper>
)

// Challenge Reminder
const ChallengeReminderItem = ({
	challengeTitle,
	challengeDescription,
	xpBonusPercent,
	hoursRemaining,
	timestamp,
	isRead,
	onSeeRecipes,
}: ChallengeReminderNotification) => (
	<NotifWrapper isRead={isRead} className='bg-indigo-500/10'>
		{/* Icon */}
		<div className='relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500'>
			<span className='relative z-10 text-2xl'>🎯</span>
			<motion.div
				className='absolute -inset-1 rounded-full border-2 border-dashed border-indigo-500/40'
				animate={{ rotate: 360 }}
				transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
			/>
		</div>

		{/* Content */}
		<div className='min-w-0 flex-1'>
			<NotifHeader
				type='Daily Challenge'
				time={timestamp}
				className='text-indigo-500'
			/>
			<p className='text-sm'>
				<strong className='font-bold'>{challengeTitle}</strong>{' '}
				{challengeDescription}
			</p>
			<div className='mt-2 flex items-center gap-2.5'>
				<MetaTag className='bg-indigo-500/15 text-indigo-600'>
					+{xpBonusPercent}% XP
				</MetaTag>
				<span className='text-xs text-text-muted'>
					Ends in {hoursRemaining} hours
				</span>
			</div>
		</div>

		{/* Action */}
		<ActionButton
			onClick={onSeeRecipes}
			className='flex-shrink-0 bg-indigo-500 text-white'
		>
			See Recipes
		</ActionButton>
	</NotifWrapper>
)

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
}

// Export types
export type { GamifiedNotification, NotificationType }
