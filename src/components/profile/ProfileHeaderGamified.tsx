'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import {
	Settings,
	Share2,
	Check,
	UserPlus,
	MessageCircle,
	AlertTriangle,
	GitCompare,
	Utensils,
	Grid3X3,
	ChefHat,
	Bookmark,
	Trophy,
	BadgeCheck,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	BUTTON_SUBTLE_HOVER,
	BUTTON_SUBTLE_TAP,
	STAT_ITEM_HOVER,
} from '@/lib/motion'
import type { Badge } from '@/lib/types/gamification'

// ============================================
// TYPES
// ============================================

type UserTitle = 'BEGINNER' | 'AMATEUR' | 'SEMIPRO' | 'PRO'

interface ProfileStats {
	followers: number
	following: number
	friends?: number
	recipesCooked: number
	recipesCreated: number
	mastered?: number
}

interface GamificationStats {
	currentLevel: number
	currentXP: number
	currentXPGoal: number
	xpToNextLevel: number
	progressPercent: number
	streakCount: number
	title: UserTitle
}

interface PendingPost {
	count: number
	totalPendingXP: number
}

interface ProfileUser {
	id: string
	displayName: string
	username: string
	avatarUrl: string
	coverUrl?: string
	bio?: string
	isVerified?: boolean
	stats: ProfileStats
	gamification: GamificationStats
	badges: Badge[]
	totalBadges: number
}

interface OwnProfileProps {
	variant: 'own'
	user: ProfileUser
	pendingPosts?: PendingPost
	onEditProfile?: () => void
	onShareProfile?: () => void
	onPostPending?: () => void
	activeTab?: string
	onTabChange?: (tab: string) => void
}

interface OtherUserProfileProps {
	variant: 'other'
	user: ProfileUser
	isFollowing?: boolean
	isFriend?: boolean
	recipesYouCooked?: number
	onFollow?: () => void
	onAddFriend?: () => void
	onMessage?: () => void
	onCompare?: () => void
	activeTab?: string
	onTabChange?: (tab: string) => void
}

interface MiniHeaderProps {
	variant: 'mini'
	user: Pick<
		ProfileUser,
		'id' | 'displayName' | 'avatarUrl' | 'isVerified' | 'stats'
	>
	level: number
	title: UserTitle
	streakCount?: number
	isFollowing?: boolean
	onFollow?: () => void
}

type ProfileHeaderGamifiedProps =
	| OwnProfileProps
	| OtherUserProfileProps
	| MiniHeaderProps

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatNumber = (num: number): string => {
	if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
	if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
	return num.toString()
}

const titleConfig: Record<UserTitle, { gradient: string; label: string }> = {
	BEGINNER: { gradient: 'bg-slate-500', label: 'Beginner' },
	AMATEUR: { gradient: 'bg-blue-500', label: 'Amateur' },
	SEMIPRO: { gradient: 'bg-amber-500', label: 'Semi-Pro' },
	PRO: {
		gradient: 'bg-gradient-to-r from-purple-500 to-violet-500',
		label: 'Pro',
	},
}

// ============================================
// SHARED COMPONENTS
// ============================================

// Level Ring with XP Progress
const LevelRing = ({
	level,
	progressPercent,
	xpText,
	size = 'default',
}: {
	level: number
	progressPercent: number
	xpText: string
	size?: 'default' | 'small'
}) => {
	const circumference = 2 * Math.PI * 45
	const strokeDashoffset =
		circumference - (progressPercent / 100) * circumference

	return (
		<div
			className={cn(
				'absolute flex items-center gap-3 rounded-full border border-white/15 bg-black/60 backdrop-blur-xl',
				size === 'default'
					? 'right-4 top-4 py-2.5 pl-2.5 pr-4'
					: 'right-3 top-3 py-2 pl-2 pr-3',
			)}
		>
			<div
				className={cn(
					'relative',
					size === 'default' ? 'h-12 w-12' : 'h-10 w-10',
				)}
			>
				<svg viewBox='0 0 100 100' className='-rotate-90'>
					<circle
						cx='50'
						cy='50'
						r='45'
						fill='none'
						stroke='rgba(255,255,255,0.2)'
						strokeWidth='6'
					/>
					<motion.circle
						cx='50'
						cy='50'
						r='45'
						fill='none'
						stroke='#22c55e'
						strokeWidth='6'
						strokeLinecap='round'
						strokeDasharray={circumference}
						initial={{ strokeDashoffset: circumference }}
						animate={{ strokeDashoffset }}
						transition={{ duration: 0.8 }}
					/>
				</svg>
				<span
					className={cn(
						'absolute inset-0 flex items-center justify-center font-extrabold text-white',
						size === 'default' ? 'text-lg' : 'text-base',
					)}
				>
					{level}
				</span>
			</div>
			<div className='flex flex-col'>
				<span className='text-xs uppercase tracking-wide text-white/70'>
					Level
				</span>
				<span
					className={cn(
						'font-semibold text-white',
						size === 'default' ? 'text-sm' : 'text-xs',
					)}
				>
					{xpText}
				</span>
			</div>
		</div>
	)
}

// Streak Badge
const StreakBadge = ({ count }: { count: number }) => {
	if (count === 0) return null

	return (
		<motion.div
			initial={{ scale: 0.8, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			className='absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 px-4 py-2.5 font-bold text-white shadow-lg shadow-orange-500/40'
		>
			<span className='text-xl'>🔥</span>
			<span className='text-xl'>{count}</span>
			<span className='text-xs opacity-90'>day streak</span>
		</motion.div>
	)
}

// Title Badge
const TitleBadge = ({ title }: { title: UserTitle }) => {
	const config = titleConfig[title]

	return (
		<div
			className={cn(
				'absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white',
				config.gradient,
			)}
		>
			{config.label}
		</div>
	)
}

// Stats Row
const StatsRow = ({
	social,
	cooking,
	showFriends = false,
}: {
	social: { followers: number; following: number; friends?: number }
	cooking: { recipesCooked: number; recipesCreated: number; mastered?: number }
	showFriends?: boolean
}) => (
	<div className='flex items-center border-y border-border bg-bg-elevated px-6 py-5'>
		{/* Social Stats */}
		<div className='flex gap-8'>
			<motion.div
				whileHover={STAT_ITEM_HOVER}
				transition={TRANSITION_SPRING}
				className='flex cursor-pointer flex-col'
			>
				<span className='text-xl font-extrabold'>
					{formatNumber(social.followers)}
				</span>
				<span className='text-xs text-text-muted'>Followers</span>
			</motion.div>
			<motion.div
				whileHover={STAT_ITEM_HOVER}
				transition={TRANSITION_SPRING}
				className='flex cursor-pointer flex-col'
			>
				<span className='text-xl font-extrabold'>
					{formatNumber(social.following)}
				</span>
				<span className='text-xs text-text-muted'>Following</span>
			</motion.div>
			{showFriends && social.friends !== undefined && (
				<motion.div
					whileHover={STAT_ITEM_HOVER}
					transition={TRANSITION_SPRING}
					className='flex cursor-pointer flex-col'
				>
					<span className='text-xl font-extrabold'>
						{formatNumber(social.friends)}
					</span>
					<span className='text-xs text-text-muted'>Friends</span>
				</motion.div>
			)}
		</div>

		{/* Divider */}
		<div className='mx-8 h-10 w-px bg-border' />

		{/* Cooking Stats */}
		<div className='flex gap-8'>
			<motion.div
				whileHover={STAT_ITEM_HOVER}
				transition={TRANSITION_SPRING}
				className='flex cursor-pointer flex-col'
			>
				<span className='text-xl font-extrabold text-success'>
					{cooking.recipesCooked}
				</span>
				<span className='text-xs font-semibold text-success'>
					Recipes Cooked
				</span>
			</motion.div>
			<motion.div
				whileHover={STAT_ITEM_HOVER}
				transition={TRANSITION_SPRING}
				className='flex cursor-pointer flex-col'
			>
				<span className='text-xl font-extrabold'>{cooking.recipesCreated}</span>
				<span className='text-xs text-text-muted'>Recipes Created</span>
			</motion.div>
			{cooking.mastered !== undefined && (
				<motion.div
					whileHover={STAT_ITEM_HOVER}
					transition={TRANSITION_SPRING}
					className='flex cursor-pointer flex-col'
				>
					<span className='text-xl font-extrabold'>{cooking.mastered}</span>
					<span className='text-xs text-text-muted'>Mastered</span>
				</motion.div>
			)}
		</div>
	</div>
)

// XP Progress Bar
const XPProgressBar = ({
	currentXP,
	xpToNext,
	progressPercent,
	nextLevel,
}: {
	currentXP: number
	xpToNext: number
	progressPercent: number
	nextLevel: number
}) => (
	<div className='px-6 py-4'>
		<div className='relative mb-2 h-2.5 overflow-hidden rounded-full bg-border'>
			<motion.div
				className='h-full rounded-full bg-gradient-to-r from-success to-success/80'
				initial={{ width: 0 }}
				animate={{ width: `${progressPercent}%` }}
				transition={{ duration: 0.5 }}
			/>
			{/* Next level milestone marker */}
			<div className='absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center'>
				<div className='h-4 w-1 rounded-sm bg-text-muted' />
			</div>
		</div>
		<div className='flex justify-between text-sm'>
			<span className='font-semibold text-success'>
				{formatNumber(currentXP)} XP
			</span>
			<span className='text-text-muted'>
				{formatNumber(xpToNext)} XP to Level {nextLevel}
			</span>
		</div>
	</div>
)

// Badges Showcase
const BadgesShowcase = ({
	badges,
	totalBadges,
	compact = false,
}: {
	badges: Badge[]
	totalBadges: number
	compact?: boolean
}) => (
	<div className={cn('px-6', compact ? 'py-4' : 'py-5')}>
		{!compact && (
			<div className='mb-4 flex items-center justify-between'>
				<h3 className='text-sm font-bold'>Badges</h3>
				<Link
					href='/profile/badges'
					className='text-sm font-semibold text-brand hover:underline'
				>
					View all {totalBadges} →
				</Link>
			</div>
		)}
		<div className='flex gap-3 overflow-x-auto pb-2'>
			{badges.slice(0, compact ? 3 : 5).map((badge, index) => (
				<motion.div
					key={badge.id}
					whileHover={STAT_ITEM_HOVER}
					transition={TRANSITION_SPRING}
					className={cn(
						'flex flex-shrink-0 cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-border bg-bg-elevated hover:shadow-md',
						compact
							? 'min-w-nav px-3 py-2.5'
							: 'min-w-thumbnail-xl px-4 py-3.5',
						index === 0 && !compact && 'border-purple-500/30 bg-purple-500/10',
					)}
				>
					<span className={compact ? 'text-xl' : 'text-icon-lg'}>
						{badge.icon}
					</span>
					<span
						className={cn(
							'text-center font-semibold',
							compact ? 'text-2xs' : 'text-xs',
						)}
					>
						{badge.name}
					</span>
					{!compact && badge.rarity === 'RARE' && (
						<span className='rounded-full bg-purple-500 px-2 py-0.5 text-2xs text-white'>
							Rare
						</span>
					)}
				</motion.div>
			))}
			{compact && totalBadges > 3 && (
				<span className='flex items-center px-3 text-xs font-semibold text-text-muted'>
					+{totalBadges - 3}
				</span>
			)}
		</div>
	</div>
)

// Profile Tabs
const ProfileTabs = ({
	tabs,
	activeTab,
	onTabChange,
}: {
	tabs: {
		id: string
		label: string
		icon: React.ReactNode
		badge?: number
		count?: number
	}[]
	activeTab?: string
	onTabChange?: (tab: string) => void
}) => (
	<div className='flex gap-1 overflow-x-auto border-t border-border px-4'>
		{tabs.map(tab => (
			<button
				key={tab.id}
				onClick={() => onTabChange?.(tab.id)}
				className={cn(
					'flex items-center gap-1.5 whitespace-nowrap border-b-3 px-4 py-4 text-sm font-semibold transition-colors',
					activeTab === tab.id
						? 'border-brand text-brand'
						: 'border-transparent text-text-muted hover:text-text',
				)}
			>
				{tab.icon}
				{tab.label}
				{tab.badge !== undefined && (
					<span className='rounded-full bg-error px-2 py-0.5 text-xs font-bold text-white'>
						{tab.badge}
					</span>
				)}
				{tab.count !== undefined && (
					<span
						className={cn(
							'text-xs',
							activeTab === tab.id ? 'text-brand' : 'text-text-muted',
						)}
					>
						{formatNumber(tab.count)}
					</span>
				)}
			</button>
		))}
	</div>
)

// ============================================
// VARIANT: OWN PROFILE
// ============================================

const OwnProfileHeader = ({
	user,
	pendingPosts,
	onEditProfile,
	onShareProfile,
	onPostPending,
	activeTab,
	onTabChange,
}: OwnProfileProps) => {
	const tabs = [
		{ id: 'recipes', label: 'Recipes', icon: <Utensils className='h-4 w-4' /> },
		{ id: 'posts', label: 'Posts', icon: <Grid3X3 className='h-4 w-4' /> },
		{
			id: 'cooking',
			label: 'Cooking',
			icon: <ChefHat className='h-4 w-4' />,
			badge: pendingPosts?.count,
		},
		{ id: 'saved', label: 'Saved', icon: <Bookmark className='h-4 w-4' /> },
		{
			id: 'achievements',
			label: 'Achievements',
			icon: <Trophy className='h-4 w-4' />,
		},
	]

	return (
		<div className='overflow-hidden rounded-2xl bg-panel-bg shadow-lg'>
			{/* Cover Photo */}
			<div className='relative h-48 overflow-hidden'>
				<Image
					src={
						user.coverUrl ||
						'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200'
					}
					alt='Cover'
					fill
					className='object-cover'
				/>
				<div className='absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60' />

				{/* Level Ring */}
				<LevelRing
					level={user.gamification.currentLevel}
					progressPercent={user.gamification.progressPercent}
					xpText={`${formatNumber(user.gamification.currentXP)} / ${formatNumber(user.gamification.currentXPGoal)} XP`}
				/>

				{/* Streak Badge */}
				<StreakBadge count={user.gamification.streakCount} />
			</div>

			{/* Profile Details */}
			<div className='relative z-10 -mt-12 flex flex-wrap items-start gap-5 px-6 md:flex-nowrap'>
				{/* Avatar */}
				<div className='relative flex-shrink-0'>
					<Image
						src={user.avatarUrl}
						alt={user.displayName}
						width={96}
						height={96}
						className='size-avatar-xl rounded-full border-5 border-panel-bg object-cover shadow-lg'
					/>
					<TitleBadge title={user.gamification.title} />
				</div>

				{/* Info */}
				<div className='flex-1 pt-14'>
					<h1 className='text-2xl font-extrabold'>{user.displayName}</h1>
					<p className='mt-1 text-sm text-text-muted'>@{user.username}</p>
					{user.bio && (
						<p className='mt-2 text-sm leading-relaxed'>{user.bio}</p>
					)}
				</div>

				{/* Actions */}
				<div className='flex gap-2 pt-14'>
					<motion.button
						onClick={onEditProfile}
						whileHover={BUTTON_HOVER}
						whileTap={BUTTON_TAP}
						className='flex items-center gap-1.5 rounded-lg border border-border bg-bg-elevated px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-border'
					>
						<Settings className='h-4 w-4' />
						Edit Profile
					</motion.button>
					<motion.button
						onClick={onShareProfile}
						whileHover={BUTTON_SUBTLE_HOVER}
						whileTap={BUTTON_SUBTLE_TAP}
						transition={TRANSITION_SPRING}
						className='flex h-avatar-sm w-avatar-sm items-center justify-center rounded-lg border border-border bg-bg-elevated text-text-muted hover:bg-border hover:text-text'
					>
						<Share2 className='h-4 w-4' />
					</motion.button>
				</div>
			</div>

			{/* Stats */}
			<div className='mt-4'>
				<StatsRow
					social={{
						followers: user.stats.followers,
						following: user.stats.following,
						friends: user.stats.friends,
					}}
					cooking={{
						recipesCooked: user.stats.recipesCooked,
						recipesCreated: user.stats.recipesCreated,
						mastered: user.stats.mastered,
					}}
					showFriends
				/>
			</div>

			{/* XP Progress */}
			<XPProgressBar
				currentXP={user.gamification.currentXP}
				xpToNext={user.gamification.xpToNextLevel}
				progressPercent={user.gamification.progressPercent}
				nextLevel={user.gamification.currentLevel + 1}
			/>

			{/* Badges */}
			<BadgesShowcase badges={user.badges} totalBadges={user.totalBadges} />

			{/* Pending Posts Banner */}
			{pendingPosts && pendingPosts.count > 0 && (
				<div className='mx-6 mb-4 flex items-center gap-4 rounded-xl border border-error/30 bg-error/10 px-4 py-3.5'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-error text-white'>
						<AlertTriangle className='h-5 w-5' />
					</div>
					<div className='flex flex-1 flex-col gap-0.5'>
						<span className='text-sm font-semibold'>
							{pendingPosts.count} recipes waiting to be posted
						</span>
						<span className='text-xs text-text-muted'>
							Don&apos;t lose {formatNumber(pendingPosts.totalPendingXP)} XP!
							Post before deadlines expire
						</span>
					</div>
					<motion.button
						onClick={onPostPending}
						whileHover={BUTTON_HOVER}
						whileTap={BUTTON_TAP}
						className='rounded-lg bg-error px-4 py-2.5 text-sm font-semibold text-white'
					>
						Post Now
					</motion.button>
				</div>
			)}

			{/* Tabs */}
			<ProfileTabs
				tabs={tabs}
				activeTab={activeTab}
				onTabChange={onTabChange}
			/>
		</div>
	)
}

// ============================================
// VARIANT: OTHER USER PROFILE
// ============================================

const OtherUserProfileHeader = ({
	user,
	isFollowing,
	isFriend,
	recipesYouCooked,
	onFollow,
	onAddFriend,
	onMessage,
	onCompare,
	activeTab,
	onTabChange,
}: OtherUserProfileProps) => {
	const tabs = [
		{
			id: 'recipes',
			label: 'Recipes',
			icon: <Utensils className='h-4 w-4' />,
			count: user.stats.recipesCreated,
		},
		{ id: 'posts', label: 'Posts', icon: <Grid3X3 className='h-4 w-4' /> },
		{
			id: 'achievements',
			label: 'Achievements',
			icon: <Trophy className='h-4 w-4' />,
			count: user.totalBadges,
		},
	]

	return (
		<div className='overflow-hidden rounded-2xl bg-panel-bg shadow-lg'>
			{/* Cover Photo */}
			<div className='relative h-48 overflow-hidden'>
				<Image
					src={
						user.coverUrl ||
						'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=1200'
					}
					alt='Cover'
					fill
					className='object-cover'
				/>
				<div className='absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60' />

				{/* Level Ring */}
				<LevelRing
					level={user.gamification.currentLevel}
					progressPercent={user.gamification.progressPercent}
					xpText='Top 5%'
				/>

				{/* Streak Badge */}
				<StreakBadge count={user.gamification.streakCount} />
			</div>

			{/* Profile Details */}
			<div className='relative z-10 -mt-12 flex flex-wrap items-start gap-5 px-6 md:flex-nowrap'>
				{/* Avatar */}
				<div className='relative flex-shrink-0'>
					<Image
						src={user.avatarUrl}
						alt={user.displayName}
						width={96}
						height={96}
						className='h-avatar-xl w-avatar-xl rounded-full border-5 border-panel-bg object-cover shadow-lg'
					/>
					<TitleBadge title={user.gamification.title} />
				</div>

				{/* Info */}
				<div className='flex-1 pt-14'>
					<div className='flex items-center gap-2'>
						<h1 className='text-2xl font-extrabold'>{user.displayName}</h1>
						{user.isVerified && (
							<BadgeCheck className='h-icon-md w-icon-md text-blue-500' />
						)}
					</div>
					<p className='mt-1 text-sm text-text-muted'>@{user.username}</p>
					{user.bio && (
						<p className='mt-2 text-sm leading-relaxed'>{user.bio}</p>
					)}
				</div>

				{/* Actions */}
				<div className='flex gap-2 pt-14'>
					<motion.button
						onClick={onFollow}
						whileHover={BUTTON_HOVER}
						whileTap={BUTTON_TAP}
						className={cn(
							'flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors',
							isFollowing
								? 'border border-border bg-bg-elevated hover:bg-border'
								: 'bg-brand text-white',
						)}
					>
						{isFollowing ? (
							<>
								<Check className='h-4 w-4' />
								Following
							</>
						) : (
							'Follow'
						)}
					</motion.button>
					<motion.button
						onClick={onAddFriend}
						whileHover={BUTTON_HOVER}
						whileTap={BUTTON_TAP}
						className={cn(
							'flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors',
							isFriend
								? 'border-success/30 bg-success/10 text-success'
								: 'border-blue-500/30 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
						)}
					>
						<UserPlus className='h-4 w-4' />
						{isFriend ? 'Friends' : 'Add Friend'}
					</motion.button>
					<motion.button
						onClick={onMessage}
						whileHover={BUTTON_SUBTLE_HOVER}
						whileTap={BUTTON_SUBTLE_TAP}
						transition={TRANSITION_SPRING}
						className='flex h-avatar-sm w-avatar-sm items-center justify-center rounded-lg border border-border bg-bg-elevated text-text-muted hover:bg-border hover:text-text'
					>
						<MessageCircle className='h-4 w-4' />
					</motion.button>
				</div>
			</div>

			{/* Stats */}
			<div className='mt-4'>
				<StatsRow
					social={{
						followers: user.stats.followers,
						following: user.stats.following,
					}}
					cooking={{
						recipesCooked: user.stats.recipesCooked,
						recipesCreated: user.stats.recipesCreated,
					}}
				/>
			</div>

			{/* Comparison Teaser */}
			{recipesYouCooked !== undefined && recipesYouCooked > 0 && (
				<motion.button
					onClick={onCompare}
					whileHover={{ backgroundColor: 'rgba(34, 197, 94, 0.15)' }}
					className='mx-6 my-4 flex w-[calc(100%-48px)] items-center gap-3.5 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-left transition-colors'
				>
					<GitCompare className='size-icon-md text-success' />
					<div className='flex flex-col gap-0.5'>
						<span className='text-sm font-semibold'>
							You&apos;ve cooked {recipesYouCooked} of their recipes
						</span>
						<span className='text-xs text-success'>
							Compare your attempts →
						</span>
					</div>
				</motion.button>
			)}

			{/* Badges */}
			<BadgesShowcase
				badges={user.badges}
				totalBadges={user.totalBadges}
				compact
			/>

			{/* Tabs */}
			<ProfileTabs
				tabs={tabs}
				activeTab={activeTab}
				onTabChange={onTabChange}
			/>
		</div>
	)
}

// ============================================
// VARIANT: MINI HEADER
// ============================================

const MiniProfileHeader = ({
	user,
	level,
	title,
	streakCount,
	isFollowing,
	onFollow,
}: MiniHeaderProps) => {
	const config = titleConfig[title]

	return (
		<div className='flex items-center gap-3 rounded-xl border border-border bg-panel-bg p-3'>
			{/* Avatar with Level */}
			<div className='relative flex-shrink-0'>
				<Image
					src={user.avatarUrl}
					alt={user.displayName}
					width={48}
					height={48}
					className='h-12 w-12 rounded-full object-cover'
				/>
				<span className='absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-panel-bg bg-success text-2xs font-extrabold text-white'>
					{level}
				</span>
			</div>

			{/* Info */}
			<div className='min-w-0 flex-1'>
				<div className='flex items-center gap-1.5'>
					<span className='text-sm font-bold'>{user.displayName}</span>
					{user.isVerified && (
						<BadgeCheck className='h-3.5 w-3.5 text-blue-500' />
					)}
					<span
						className={cn(
							'rounded-lg px-2 py-0.5 text-2xs font-bold uppercase text-white',
							config.gradient,
						)}
					>
						{config.label}
					</span>
				</div>
				<div className='mt-0.5 flex items-center gap-1.5 text-xs text-text-muted'>
					<span>{formatNumber(user.stats.followers)} followers</span>
					{streakCount !== undefined && streakCount > 0 && (
						<>
							<span className='text-border'>•</span>
							<span>🔥 {streakCount} day streak</span>
						</>
					)}
				</div>
			</div>

			{/* Follow Button */}
			<motion.button
				onClick={onFollow}
				whileHover={BUTTON_SUBTLE_HOVER}
				whileTap={BUTTON_SUBTLE_TAP}
				transition={TRANSITION_SPRING}
				className={cn(
					'rounded-lg px-4 py-2 text-sm font-semibold',
					isFollowing
						? 'border border-border bg-bg-elevated hover:bg-border'
						: 'bg-brand text-white',
				)}
			>
				{isFollowing ? 'Following' : 'Follow'}
			</motion.button>
		</div>
	)
}

// ============================================
// MAIN EXPORT
// ============================================

export const ProfileHeaderGamified = (props: ProfileHeaderGamifiedProps) => {
	switch (props.variant) {
		case 'own':
			return <OwnProfileHeader {...props} />
		case 'other':
			return <OtherUserProfileHeader {...props} />
		case 'mini':
			return <MiniProfileHeader {...props} />
		default:
			return null
	}
}

// Export individual variants for direct use
export { OwnProfileHeader, OtherUserProfileHeader, MiniProfileHeader }
