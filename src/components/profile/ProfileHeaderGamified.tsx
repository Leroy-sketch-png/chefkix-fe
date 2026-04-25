'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import {
	Settings,
	Share2,
	Check,
	Users,
	MessageCircle,
	AlertTriangle,
	Sparkles,
	Utensils,
	Grid3X3,
	ChefHat,
	Bookmark,
	Trophy,
	Heart,
	ShieldBan,
	MoreHorizontal,
} from 'lucide-react'
import Link from 'next/link'
import { VerifiedBadge } from '@/components/shared/VerifiedBadge'
import { TipJarButton } from '@/components/tip/TipJarButton'
import { cn, formatNumber } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	BUTTON_SUBTLE_HOVER,
	BUTTON_SUBTLE_TAP,
	STAT_ITEM_HOVER,
	FOLLOW_PULSE,
	DURATION_S,
} from '@/lib/motion'
import { useTranslations } from 'next-intl'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { SparklesEffect } from '@/components/ui/sparkles-effect'
import type { Badge } from '@/lib/types/gamification'

// ============================================
// TYPES
// ============================================

type UserTitle = 'BEGINNER' | 'AMATEUR' | 'SEMIPRO' | 'PRO'

interface ProfileStats {
	followers: number
	following: number
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
	isMutualFollow?: boolean // They follow each other = implicit friends
	isBlocked?: boolean
	isFollowLoading?: boolean
	isBlockLoading?: boolean
	onFollow?: () => void
	onMessage?: () => void
	onBlock?: () => void
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

const titleConfig: Record<UserTitle, { gradient: string; labelKey: string }> = {
	BEGINNER: { gradient: 'bg-text-muted', labelKey: 'titleBeginner' },
	AMATEUR: { gradient: 'bg-info', labelKey: 'titleAmateur' },
	SEMIPRO: { gradient: 'bg-warning', labelKey: 'titleSemiPro' },
	PRO: {
		gradient: 'bg-gradient-xp',
		labelKey: 'titlePro',
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
	xpText: React.ReactNode
	size?: 'default' | 'small'
}) => {
	const t = useTranslations('profile')
	const circumference = 2 * Math.PI * 45
	const strokeDashoffset =
		circumference - (progressPercent / 100) * circumference

	return (
		<div
			className={cn(
				'absolute flex items-center gap-3 rounded-full border border-white/15 bg-black/45 backdrop-blur-xl',
				size === 'default'
					? 'right-4 top-4 py-2.5 pl-2.5 pr-4'
					: 'right-3 top-3 py-2 pl-2 pr-3',
			)}
		>
			<div
				className={cn('relative', size === 'default' ? 'size-12' : 'size-10')}
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
						className='stroke-xp' /* Purple XP color */
						strokeWidth='6'
						strokeLinecap='round'
						strokeDasharray={circumference}
						initial={{ strokeDashoffset: circumference }}
						animate={{ strokeDashoffset }}
						transition={{ duration: DURATION_S.verySlow }}
					/>
				</svg>
				<span
					className={cn(
						'absolute inset-0 flex items-center justify-center font-display font-extrabold text-white',
						size === 'default' ? 'text-lg' : 'text-base',
					)}
				>
					<SparklesEffect color='var(--color-xp)' count={6}>
						{level}
					</SparklesEffect>
				</span>
			</div>
			<div className='flex flex-col'>
				<span className='text-xs uppercase tracking-wide text-white/70'>
					{t('levelLabel')}
				</span>
				<span
					className={cn(
						'font-semibold tabular-nums text-white',
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
	const t = useTranslations('profile')
	if (count === 0) return null

	return (
		<motion.div
			initial={{ scale: 0.8, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			className='absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-streak px-3 py-2 font-display font-semibold text-white shadow-warm shadow-streak/30'
		>
			<span className='text-base'>🔥</span>
			<span className='text-lg tabular-nums'>{count}</span>
			<span className='text-xs opacity-90'>{t('dayStreak')}</span>
		</motion.div>
	)
}

// Title Badge
const TitleBadge = ({ title }: { title: UserTitle }) => {
	const t = useTranslations('profile')
	const config = titleConfig[title]

	return (
		<motion.div
			initial={{ opacity: 0, y: 6, scale: 0.9 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={TRANSITION_SPRING}
			className={cn(
				'absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-2xs font-semibold tracking-normal text-white',
				config.gradient,
			)}
		>
			{t(config.labelKey)}
		</motion.div>
	)
}

// Stats Row
const StatsRow = ({
	social,
	cooking,
	isOwnProfile,
}: {
	social: { followers: number; following: number }
	cooking: { recipesCooked: number; recipesCreated: number; mastered?: number }
	isOwnProfile?: boolean
}) => {
	const t = useTranslations('profile')
	return (
		<div className='flex flex-col gap-4 border-y border-border bg-bg-elevated px-4 py-5 sm:flex-row sm:items-center sm:gap-0 md:px-6'>
			{/* Social Stats */}
			<div className='flex gap-6 md:gap-8'>
				{isOwnProfile ? (
					<Link
						href='/profile/followers?tab=followers'
						className='flex flex-col transition-opacity hover:opacity-70'
					>
						<span className='text-xl font-display font-extrabold tabular-nums'>
							<AnimatedNumber value={social.followers} format={formatNumber} />
						</span>
						<span className='text-xs text-text-muted'>
							{t('followersLabel')}
						</span>
					</Link>
				) : (
					<div className='flex flex-col'>
						<span className='text-xl font-display font-extrabold tabular-nums'>
							<AnimatedNumber value={social.followers} format={formatNumber} />
						</span>
						<span className='text-xs text-text-muted'>
							{t('followersLabel')}
						</span>
					</div>
				)}
				{isOwnProfile ? (
					<Link
						href='/profile/followers?tab=following'
						className='flex flex-col transition-opacity hover:opacity-70'
					>
						<span className='text-xl font-display font-extrabold tabular-nums'>
							<AnimatedNumber value={social.following} format={formatNumber} />
						</span>
						<span className='text-xs text-text-muted'>
							{t('followingLabel')}
						</span>
					</Link>
				) : (
					<div className='flex flex-col'>
						<span className='text-xl font-display font-extrabold tabular-nums'>
							<AnimatedNumber value={social.following} format={formatNumber} />
						</span>
						<span className='text-xs text-text-muted'>
							{t('followingLabel')}
						</span>
					</div>
				)}
			</div>

			{/* Divider */}
			<div className='hidden h-10 w-px bg-border sm:mx-6 sm:block md:mx-8' />

			{/* Cooking Stats */}
			<div className='flex gap-6 md:gap-8'>
				<div className='flex flex-col'>
					<span className='text-xl font-display font-extrabold text-success tabular-nums'>
						<AnimatedNumber
							value={cooking.recipesCooked}
							format={formatNumber}
						/>
					</span>
					<span className='text-xs font-semibold text-success'>
						{cooking.recipesCooked === 0 && isOwnProfile
							? t('startCooking')
							: t('recipesCooked')}
					</span>
				</div>
				<div className='flex flex-col'>
					<span className='text-xl font-display font-extrabold tabular-nums'>
						<AnimatedNumber
							value={cooking.recipesCreated}
							format={formatNumber}
						/>
					</span>
					<span className='text-xs text-text-muted'>
						{cooking.recipesCreated === 0 && isOwnProfile
							? t('shareRecipe')
							: t('recipesCreated')}
					</span>
				</div>
				{cooking.mastered !== undefined && (
					<div className='flex flex-col'>
						<span className='text-xl font-display font-extrabold tabular-nums'>
							<AnimatedNumber value={cooking.mastered} format={formatNumber} />
						</span>
						<span className='text-xs text-text-muted'>{t('mastered')}</span>
					</div>
				)}
			</div>
		</div>
	)
}

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
}) => {
	const t = useTranslations('profile')
	return (
		<div className='px-6 py-4'>
			<div className='relative mb-2 h-2.5 overflow-hidden rounded-full bg-border'>
				<motion.div
					className='h-full rounded-full bg-gradient-to-r from-brand to-streak'
					initial={{ width: 0 }}
					animate={{ width: `${progressPercent}%` }}
					transition={{ duration: DURATION_S.slow }}
				/>
				{/* Next level milestone marker */}
				<div className='absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center'>
					<div className='h-4 w-1 rounded-sm bg-text-muted' />
				</div>
			</div>
			<div className='flex justify-between text-sm'>
				<span className='font-display font-semibold text-brand'>
					{t('xpLabel', { xp: formatNumber(currentXP) })}
				</span>
				<span className='text-text-muted'>
					{t('xpToLevel', { xp: formatNumber(xpToNext), level: nextLevel })}
				</span>
			</div>
		</div>
	)
}

// Badges Showcase
const BadgesShowcase = ({
	badges,
	totalBadges,
	compact = false,
	userId,
	isOwnProfile = false,
}: {
	badges: Badge[]
	totalBadges: number
	compact?: boolean
	userId?: string // For linking to other user's badge pages (future feature)
	isOwnProfile?: boolean // Only show "View all" link for own profile
}) => {
	const t = useTranslations('profile')
	return (
		<div className={cn('px-6', compact ? 'py-4' : 'py-5')}>
			{!compact && (
				<div className='mb-4 flex items-center justify-between'>
					<h3 className='text-sm font-bold'>{t('badgesTitle')}</h3>
					{isOwnProfile && totalBadges > 0 ? (
						<Link
							href='/profile/badges'
							className='text-sm font-semibold text-brand hover:underline'
						>
							{t('viewAllBadges', { count: totalBadges })}
						</Link>
					) : !isOwnProfile ? (
						<span className='text-sm text-text-muted'>
							{t('badgesEarned', { count: totalBadges })}
						</span>
					) : null}
				</div>
			)}
			<div className='flex gap-3 overflow-x-auto scrollbar-hide pb-2 pr-4'>
				{badges.length === 0 && isOwnProfile ? (
					<Link
						href='/profile/badges'
						className='flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border-subtle py-4 text-sm text-text-muted transition-colors hover:border-brand hover:text-brand'
					>
						<span className='text-lg'>🏅</span>
						{t('earnFirstBadge')}
					</Link>
				) : badges.length === 0 ? (
					<p className='py-4 text-center text-sm text-text-muted'>
						{t('noBadgesYet')}
					</p>
				) : (
					badges.slice(0, compact ? 3 : 5).map((badge, index) => (
						<motion.div
							key={badge.id || `badge-${index}`}
							transition={TRANSITION_SPRING}
							className={cn(
								'flex flex-shrink-0 flex-col items-center gap-1.5 rounded-xl border border-border bg-bg-elevated',
								compact
									? 'min-w-nav px-3 py-2.5'
									: 'min-w-thumbnail-xl px-4 py-3.5',
								index === 0 && !compact && 'border-xp/30 bg-xp/10',
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
								<span className='rounded-full bg-xp px-2 py-0.5 text-2xs text-white'>
									{t('badgeRare')}
								</span>
							)}
						</motion.div>
					))
				)}
				{compact && totalBadges > 3 && (
					<span className='flex items-center px-3 text-xs font-semibold text-text-muted'>
						+{totalBadges - 3}
					</span>
				)}
			</div>
		</div>
	)
}

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
}) => {
	return (
		<div className='relative border-t border-border'>
			<div className='flex gap-0.5 overflow-x-auto scrollbar-hide px-2 md:px-4'>
				{tabs.map(tab => (
					<button
						type='button'
						key={tab.id}
						onClick={() => onTabChange?.(tab.id)}
						className={cn(
							'flex items-center gap-1.5 whitespace-nowrap border-b-3 px-2.5 py-3 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand/50 md:px-4 md:py-4',
							activeTab === tab.id
								? 'border-brand text-brand'
								: 'border-transparent text-text-muted hover:text-text',
						)}
					>
						{tab.icon}
						{tab.label}
						{tab.badge !== undefined && (
							<span className='rounded-full bg-error px-2 py-0.5 text-xs font-bold tabular-nums text-white'>
								{tab.badge}
							</span>
						)}
						{tab.count !== undefined && (
							<span
								className={cn(
									'text-xs tabular-nums',
									activeTab === tab.id ? 'text-brand' : 'text-text-muted',
								)}
							>
								<AnimatedNumber value={tab.count} format={formatNumber} />
							</span>
						)}
					</button>
				))}
			</div>
			{/* Right-edge fade hint for scrollable tabs on mobile */}
			<div className='pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-bg-card to-transparent md:hidden' />
		</div>
	)
}

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
	// Platform detection for keyboard shortcuts
	const isMac =
		typeof navigator !== 'undefined' &&
		(('userAgentData' in navigator &&
			(navigator.userAgentData as { platform?: string })?.platform ===
				'macOS') ||
			/Mac/i.test(navigator.userAgent))
	const modKey = isMac ? '⌘' : 'Ctrl'

	const t = useTranslations('profile')

	// Keyboard shortcut: Ctrl/Cmd+E to edit profile
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
				e.preventDefault()
				onEditProfile?.()
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [onEditProfile])

	const tabs = [
		{
			id: 'recipes',
			label: t('tabRecipes'),
			icon: <Utensils className='size-4' />,
		},
		{ id: 'posts', label: t('tabPosts'), icon: <Grid3X3 className='size-4' /> },
		{
			id: 'cooking',
			label: t('tabCooking'),
			icon: <ChefHat className='size-4' />,
			badge: pendingPosts?.count,
		},
		{
			id: 'saved',
			label: t('tabSaved'),
			icon: <Bookmark className='size-4' />,
		},
		{ id: 'liked', label: t('tabLiked'), icon: <Heart className='size-4' /> },
		{
			id: 'achievements',
			label: t('tabAchievements'),
			icon: <Trophy className='size-4' />,
		},
	]

	return (
		<div className='overflow-hidden rounded-2xl bg-bg-card shadow-warm'>
			{/* Cover Photo */}
			<div className='relative h-48 overflow-hidden'>
				<Image
					src={user.coverUrl || '/default-cover.svg'}
					alt={t('coverAlt')}
					fill
					sizes='100vw'
					className='object-cover'
					onError={e => {
						;(e.target as HTMLImageElement).src = '/default-cover.svg'
					}}
				/>
				<div className='pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60' />

				{/* Level Ring */}
				<LevelRing
					level={user.gamification.currentLevel}
					progressPercent={user.gamification.progressPercent}
					xpText={
						<>
							<AnimatedNumber
								value={user.gamification.currentXP}
								format={formatNumber}
							/>{' '}
							/{' '}
							<AnimatedNumber
								value={user.gamification.currentXPGoal}
								format={formatNumber}
							/>{' '}
							XP
						</>
					}
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
						className='size-avatar-xl rounded-full border-5 border-bg-card object-cover shadow-warm'
						onError={e => {
							;(e.target as HTMLImageElement).src = '/placeholder-avatar.svg'
						}}
					/>
					<TitleBadge title={user.gamification.title} />
				</div>

				{/* Info */}
				<div className='flex-1 pt-14'>
					<h1 className='truncate text-2xl font-display font-extrabold'>
						{user.displayName}
					</h1>
					<p className='mt-1 truncate text-sm text-text-muted'>
						@{user.username}
					</p>
					{user.bio && (
						<p className='mt-2 text-sm leading-relaxed'>{user.bio}</p>
					)}
				</div>

				{/* Actions */}
				<div className='flex gap-2 pt-14'>
					<motion.button
						type='button'
						onClick={onEditProfile}
						whileHover={BUTTON_HOVER}
						whileTap={BUTTON_TAP}
						className='group flex items-center gap-1.5 rounded-lg border border-border bg-bg-elevated px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-border focus-visible:ring-2 focus-visible:ring-brand/50'
						title={`${t('phEditProfile')} (${modKey}+E)`}
					>
						<Settings className='size-4' />
						{t('phEditProfile')}
						<kbd className='ml-1.5 hidden rounded bg-bg px-1.5 py-0.5 font-mono text-2xs text-text-muted group-hover:inline'>
							{modKey}+E
						</kbd>
					</motion.button>
					<motion.button
						type='button'
						onClick={onShareProfile}
						whileHover={BUTTON_SUBTLE_HOVER}
						whileTap={BUTTON_SUBTLE_TAP}
						transition={TRANSITION_SPRING}
						className='flex h-avatar-sm w-avatar-sm items-center justify-center rounded-lg border border-border bg-bg-elevated text-text-muted hover:bg-border hover:text-text focus-visible:ring-2 focus-visible:ring-brand/50'
						aria-label={t('shareProfileAria')}
					>
						<Share2 className='size-4' />
					</motion.button>
				</div>
			</div>

			{/* Stats */}
			<div className='mt-4'>
				<StatsRow
					isOwnProfile
					social={{
						followers: user.stats.followers,
						following: user.stats.following,
					}}
					cooking={{
						recipesCooked: user.stats.recipesCooked,
						recipesCreated: user.stats.recipesCreated,
						mastered: user.stats.mastered,
					}}
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
			<BadgesShowcase
				badges={user.badges}
				totalBadges={user.totalBadges}
				isOwnProfile
			/>

			{/* Pending Posts Banner */}
			{pendingPosts && pendingPosts.count > 0 && (
				<div className='mx-6 mb-4 flex items-center gap-4 rounded-xl border border-error/30 bg-error/10 px-4 py-3.5'>
					<div className='flex size-10 items-center justify-center rounded-full bg-error text-white'>
						<AlertTriangle className='size-5' />
					</div>
					<div className='flex flex-1 flex-col gap-0.5'>
						<span className='text-sm font-semibold'>
							{t('pendingRecipesWaiting', { count: pendingPosts.count })}
						</span>
						<span className='text-xs text-text-muted'>
							{t('pendingDontLose', {
								xp: formatNumber(pendingPosts.totalPendingXP),
							})}
						</span>
					</div>
					<motion.button
						type='button'
						onClick={onPostPending}
						whileHover={BUTTON_HOVER}
						whileTap={BUTTON_TAP}
						className='rounded-lg bg-error px-4 py-2.5 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-brand/50'
					>
						{t('postNow')}
					</motion.button>
				</div>
			)}

			{/* Taste DNA link */}
			<div className='flex justify-center py-2'>
				<Link
					href='/profile/taste'
					className='inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-4 py-1.5 text-sm font-medium text-brand transition-colors hover:bg-brand/20'
				>
					<Sparkles className='size-4' />
					{t('viewTasteDNA')}
				</Link>
			</div>

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
	isMutualFollow,
	isBlocked,
	isFollowLoading,
	isBlockLoading,
	onFollow,
	onMessage,
	onBlock,
	activeTab,
	onTabChange,
}: OtherUserProfileProps) => {
	const t = useTranslations('profile')
	const tabs = [
		{
			id: 'recipes',
			label: t('tabRecipes'),
			icon: <Utensils className='size-4' />,
			count: user.stats.recipesCreated,
		},
		{ id: 'posts', label: t('tabPosts'), icon: <Grid3X3 className='size-4' /> },
		{
			id: 'achievements',
			label: t('tabAchievements'),
			icon: <Trophy className='size-4' />,
			count: user.totalBadges,
		},
	]

	return (
		<div className='overflow-hidden rounded-2xl bg-bg-card shadow-warm'>
			{/* Cover Photo */}
			<div className='relative h-48 overflow-hidden'>
				<Image
					src={user.coverUrl || '/default-cover.svg'}
					alt={t('coverAlt')}
					fill
					sizes='100vw'
					className='object-cover'
					onError={e => {
						;(e.target as HTMLImageElement).src = '/default-cover.svg'
					}}
				/>
				<div className='pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60' />

				{/* Level Ring */}
				<LevelRing
					level={user.gamification.currentLevel}
					progressPercent={user.gamification.progressPercent}
					xpText={t('topPercent')}
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
						className='size-avatar-xl rounded-full border-5 border-bg-card object-cover shadow-warm'
						onError={e => {
							;(e.target as HTMLImageElement).src = '/placeholder-avatar.svg'
						}}
					/>
					<TitleBadge title={user.gamification.title} />
				</div>

				{/* Info */}
				<div className='flex-1 pt-14'>
					<div className='flex items-center gap-2'>
						<h1 className='truncate text-2xl font-display font-extrabold'>
							{user.displayName}
						</h1>
						{user.isVerified && (
							<VerifiedBadge className='flex-shrink-0 text-info' />
						)}
					</div>
					<p className='mt-1 truncate text-sm text-text-muted'>
						@{user.username}
					</p>
					{user.bio && (
						<p className='mt-2 text-sm leading-relaxed'>{user.bio}</p>
					)}
				</div>

				{/* Actions */}
				<div className='flex gap-2 pt-14'>
					<motion.button
						type='button'
						onClick={onFollow}
						disabled={isFollowLoading}
						whileHover={BUTTON_HOVER}
						whileTap={BUTTON_TAP}
						className={cn(
							'flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand/50',
							isFollowing
								? 'border border-border bg-bg-elevated hover:bg-border'
								: 'bg-brand text-white',
						)}
					>
						{isFollowing ? (
							<>
								<Check className='size-4' />
								Following
							</>
						) : (
							'Follow'
						)}
					</motion.button>
					{/* Mutual Follow Badge (Instagram model: mutual follow = friends) */}
					{isMutualFollow && (
						<div className='flex items-center gap-1.5 rounded-lg border border-success/30 bg-success/10 px-3 py-2.5 text-sm font-semibold text-success'>
							<Users className='size-4' />
							{t('friends')}
						</div>
					)}
					<motion.button
						type='button'
						onClick={onMessage}
						aria-label={t('ariaSendMessage')}
						whileHover={BUTTON_SUBTLE_HOVER}
						whileTap={BUTTON_SUBTLE_TAP}
						transition={TRANSITION_SPRING}
						className='flex h-avatar-sm w-avatar-sm items-center justify-center rounded-lg border border-border bg-bg-elevated text-text-muted hover:bg-border hover:text-text focus-visible:ring-2 focus-visible:ring-brand/50'
					>
						<MessageCircle className='size-4' />
					</motion.button>
					<TipJarButton
						creatorId={user.id}
						creatorName={user.displayName || user.username}
						variant='profile'
					/>
					{/* Block/Unblock Button */}
					<motion.button
						type='button'
						onClick={onBlock}
						disabled={isBlockLoading}
						whileHover={BUTTON_SUBTLE_HOVER}
						whileTap={BUTTON_SUBTLE_TAP}
						transition={TRANSITION_SPRING}
						className={cn(
							'flex h-avatar-sm w-avatar-sm items-center justify-center rounded-lg border transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand/50',
							isBlocked
								? 'border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20'
								: 'border-border bg-bg-elevated text-text-muted hover:bg-border hover:text-destructive',
						)}
						title={isBlocked ? t('unblockUser') : t('blockUser')}
					>
						<ShieldBan className='size-4' />
					</motion.button>
				</div>
			</div>

			{/* Stats */}
			<div className='mt-4'>
				<StatsRow
					isOwnProfile={false}
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

			{/* Badges */}
			<BadgesShowcase
				badges={user.badges}
				totalBadges={user.totalBadges}
				compact
				userId={user.id}
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
	const t = useTranslations('profile')
	const config = titleConfig[title]

	return (
		<div className='flex items-center gap-3 rounded-xl border border-border bg-bg-card p-3'>
			{/* Avatar with Level */}
			<div className='relative flex-shrink-0'>
				<Image
					src={user.avatarUrl}
					alt={user.displayName}
					width={48}
					height={48}
					className='size-12 rounded-full object-cover'
				/>
				<span className='absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full border-2 border-bg-card bg-success text-2xs font-display font-extrabold text-white'>
					{level}
				</span>
			</div>

			{/* Info */}
			<div className='min-w-0 flex-1'>
				<div className='flex items-center gap-1.5'>
					<span className='truncate text-sm font-bold'>{user.displayName}</span>
					{user.isVerified && (
						<VerifiedBadge size='sm' className='flex-shrink-0 text-info' />
					)}
					<span
						className={cn(
							'rounded-lg px-2 py-0.5 text-2xs font-bold uppercase text-white',
							config.gradient,
						)}
					>
						{t(config.labelKey)}
					</span>
				</div>
				<div className='mt-0.5 flex items-center gap-1.5 text-xs text-text-muted'>
					<span className='tabular-nums'>
						<AnimatedNumber
							value={user.stats.followers}
							format={formatNumber}
						/>{' '}
						{t('followersCount')}
					</span>
					{streakCount !== undefined && streakCount > 0 && (
						<>
							<span className='text-border'>•</span>
							<span>
								🔥 {streakCount} {t('dayStreak')}
							</span>
						</>
					)}
				</div>
			</div>

			{/* Follow Button */}
			<motion.button
				type='button'
				onClick={onFollow}
				whileHover={BUTTON_SUBTLE_HOVER}
				whileTap={BUTTON_SUBTLE_TAP}
				animate={isFollowing ? FOLLOW_PULSE.followed : undefined}
				transition={TRANSITION_SPRING}
				className={cn(
					'rounded-lg px-4 py-2 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-brand/50',
					isFollowing
						? 'border border-border bg-bg-elevated hover:bg-border'
						: 'bg-brand text-white',
				)}
			>
				{isFollowing ? t('phFollowing') : t('phFollow')}
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
