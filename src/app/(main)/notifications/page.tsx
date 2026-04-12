'use client'
import { useTranslations } from 'next-intl'
import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Bell,
	CheckCheck,
	Filter,
	ChefHat,
	Heart,
	MessageCircle,
	UserPlus,
	Loader2,
	Sparkles,
	Trophy,
	Flame,
	Star,
} from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/shared/EmptyStateGamified'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { UserHoverCard } from '@/components/social/UserHoverCard'
import { useAuth } from '@/hooks/useAuth'
import { formatShortTimeAgo, cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	staggerContainer,
	staggerItem,
	BUTTON_SUBTLE_TAP,
	LIST_ITEM_HOVER,
	LIST_ITEM_TAP,
} from '@/lib/motion'
import {
	getNotifications,
	markAllNotificationsRead,
	markNotificationRead,
	type Notification as APINotification,
} from '@/services/notification'
import { useNotificationStore } from '@/store/notificationStore'
import {
	NotificationItemGamified,
	type GamifiedNotification,
} from '@/components/notifications/NotificationItemsGamified'
import { logDevError } from '@/lib/dev-log'
import { ErrorState } from '@/components/ui/error-state'
import { toast } from 'sonner'

// ============================================
// TYPES
// ============================================

type NotificationFilter = 'all' | 'gamified' | 'social' | 'unread'

type SocialNotificationType =
	| 'like'
	| 'comment'
	| 'follow'
	| 'cook'
	| 'achievement'
	| 'mention'

interface SocialNotification {
	id: string
	type: SocialNotificationType
	userId: string
	user: string
	avatar: string
	action: string
	target?: string
	targetEntityId?: string
	targetEntityUrl?: string
	time: string
	read: boolean
	createdAt: Date
}

// ============================================
// HELPERS
// ============================================

// Parse structured values from content string when data field is missing
function parseXpFromContent(content?: string): { xp: number; recipe: string } {
	if (!content) return { xp: 0, recipe: 'Recipe' }
	const xpMatch = content.match(/(\d+)\s*XP/i)
	const recipeMatch = content.match(/completing\s+(.+?)(?:[!.]|$)/i)
	return {
		xp: xpMatch ? parseInt(xpMatch[1], 10) : 0,
		recipe: recipeMatch ? recipeMatch[1].trim().replace(/!$/, '') : 'Recipe',
	}
}

function parseLevelFromContent(content?: string): number | undefined {
	if (!content) return undefined
	const m = content.match(/Level\s+(\d+)/i)
	return m ? parseInt(m[1], 10) : undefined
}

function parseStreakFromContent(content?: string): number {
	if (!content) return 0
	const m = content.match(/(\d+)[- ]day/i)
	return m ? parseInt(m[1], 10) : 0
}

function parseDaysFromContent(content?: string): number {
	if (!content) return 0
	const m = content.match(/(\d+)\s*days?\s*(?:remaining|left)/i)
	return m ? parseInt(m[1], 10) : 0
}

// Transform API notification to gamified format
const transformToGamifiedNotification = (
	notif: APINotification,
): GamifiedNotification | null => {
	const data = (notif.data ?? {}) as Record<string, unknown>
	const timestamp = new Date(notif.createdAt)

	switch (notif.type) {
		case 'XP_AWARDED': {
			const parsed = parseXpFromContent(notif.content)
			return {
				id: notif.id,
				type: 'xp_awarded',
				recipeName: (data.recipeName as string) || parsed.recipe,
				xpAmount: (data.xpAmount as number) || parsed.xp,
				pendingXp: (data.pendingXp as number) || 0,
				timestamp,
				isRead: notif.isRead,
			}
		}
		case 'LEVEL_UP': {
			const parsedLevel =
				(data.newLevel as number) ?? parseLevelFromContent(notif.content)
			return {
				id: notif.id,
				type: 'level_up',
				newLevel: parsedLevel,
				newGoalXp: (data.newGoalXp as number) ?? undefined,
				recipesToNextLevel: (data.recipesToNextLevel as number) ?? undefined,
				timestamp,
				isRead: notif.isRead,
			}
		}
		case 'BADGE_EARNED':
			return {
				id: notif.id,
				type: 'badge_unlocked',
				badgeIcon: (data.badgeIcon as string) || '🏆',
				badgeName: (data.badgeName as string) || 'Badge',
				badgeRarity:
					(data.badgeRarity as 'common' | 'rare' | 'epic' | 'legendary') ||
					'common',
				requirement: (data.requirement as string) || '',
				timestamp,
				isRead: notif.isRead,
			}
		case 'CREATOR_BONUS':
			return {
				id: notif.id,
				type: 'creator_bonus',
				cookerName: (data.cookerName as string) || 'User',
				cookerUsername: (data.cookerUsername as string) || 'user',
				cookerAvatarUrl:
					(data.cookerAvatarUrl as string) || '/placeholder-avatar.svg',
				recipeName: (data.recipeName as string) || 'Recipe',
				xpBonus: (data.xpBonus as number) || 0,
				totalCookRewards: (data.totalCookRewards as number) ?? undefined,
				timestamp,
				isRead: notif.isRead,
			}
		case 'STREAK_WARNING':
			return {
				id: notif.id,
				type: 'streak_warning',
				streakCount:
					(data.streakCount as number) || parseStreakFromContent(notif.content),
				hoursRemaining: (data.hoursRemaining as number) || 0,
				timestamp,
				isRead: notif.isRead,
			}
		case 'POST_DEADLINE': {
			const days =
				(data.daysRemaining as number) || parseDaysFromContent(notif.content)
			return {
				id: notif.id,
				type: days <= 1 ? 'post_deadline_urgent' : 'post_deadline',
				recipeName: (data.recipeName as string) || 'Recipe',
				daysRemaining: days,
				pendingXp: (data.pendingXp as number) || 0,
				...(days <= 1
					? {
							originalXp: (data.originalXp as number) || 0,
							decayPercent: (data.decayPercent as number) || 0,
						}
					: {}),
				timestamp,
				isRead: notif.isRead,
			} as GamifiedNotification
		}
		case 'CHALLENGE_AVAILABLE':
		case 'CHALLENGE_REMINDER':
			return {
				id: notif.id,
				type: 'challenge_reminder',
				challengeTitle: (data.challengeTitle as string) || 'Challenge',
				challengeDescription: (data.challengeDescription as string) || '',
				xpBonusPercent: (data.xpBonusPercent as number) || 0,
				hoursRemaining: (data.hoursRemaining as number) || 24,
				timestamp,
				isRead: notif.isRead,
			}
		case 'WEEKEND_NUDGE':
			return {
				id: notif.id,
				type: 'weekend_nudge',
				content:
					notif.content ||
					(data.content as string) ||
					"It's the weekend — perfect time to try a new recipe!",
				timestamp,
				isRead: notif.isRead,
			}
		case 'PANTRY_EXPIRING':
			return {
				id: notif.id,
				type: 'pantry_expiring',
				content:
					notif.content ||
					(data.content as string) ||
					'Some ingredients are expiring soon',
				daysRemaining: (data.daysRemaining as number) || 3,
				timestamp,
				isRead: notif.isRead,
			}
		default:
			return null
	}
}

// Transform API notification to social format
const transformToSocialNotification = (
	notif: APINotification,
): SocialNotification | null => {
	const data = (notif.data || {}) as Record<string, unknown>
	const timestamp = new Date(notif.createdAt)

	const typeMap: Record<string, SocialNotificationType> = {
		NEW_FOLLOWER: 'follow',
		FOLLOW: 'follow',
		POST_LIKE: 'like',
		RECIPE_LIKED: 'like',
		POST_COMMENT: 'comment',
		USER_MENTION: 'mention',
		ROOM_INVITE: 'cook',
		CO_CHEF_TAGGED: 'mention',
		DUEL_INVITE: 'cook',
		DUEL_ACCEPTED: 'cook',
		DUEL_DECLINED: 'cook',
		DUEL_COMPLETED: 'achievement',
		DUEL_EXPIRED: 'cook',
		JOIN_REQUESTED: 'follow',
		MEMBER_JOINED: 'follow',
		JOIN_REQUEST_APPROVED: 'follow',
	}

	const type = typeMap[notif.type]
	if (!type) return null

	return {
		id: notif.id,
		type,
		// Use top-level fields first, fallback to data object for backwards compat
		userId: notif.latestActorId || (data.userId as string) || '',
		user:
			notif.latestActorName ||
			(data.userName as string) ||
			(data.displayName as string) ||
			'User',
		avatar:
			notif.latestActorAvatarUrl ||
			notif.actorInfo?.avatarUrl ||
			(data.avatarUrl as string) ||
			'/placeholder-avatar.svg',
		action: notif.content || notif.body || '',
		target: (data.targetTitle as string) || undefined,
		targetEntityId:
			notif.targetEntityId || (data.targetEntityId as string) || undefined,
		targetEntityUrl:
			notif.targetEntityUrl || (data.targetEntityUrl as string) || undefined,
		time: formatShortTimeAgo(timestamp),
		read: notif.isRead,
		createdAt: timestamp,
	}
}

// Get icon for notification type
const getNotificationIcon = (type: SocialNotificationType) => {
	switch (type) {
		case 'like':
			return { icon: Heart, color: 'text-error', bg: 'bg-error/10' }
		case 'comment':
			return {
				icon: MessageCircle,
				color: 'text-info',
				bg: 'bg-info/10',
			}
		case 'follow':
			return { icon: UserPlus, color: 'text-success', bg: 'bg-success/10' }
		case 'mention':
			return {
				icon: MessageCircle,
				color: 'text-accent-purple',
				bg: 'bg-accent-purple/10',
			}
		case 'cook':
			return { icon: ChefHat, color: 'text-brand', bg: 'bg-brand/10' }
		case 'achievement':
			return { icon: Trophy, color: 'text-gold', bg: 'bg-gold/10' }
		default:
			return { icon: Bell, color: 'text-text-muted', bg: 'bg-bg-elevated' }
	}
}

// ============================================
// FILTER TABS COMPONENT
// ============================================

interface FilterTabsProps {
	activeFilter: NotificationFilter
	onFilterChange: (filter: NotificationFilter) => void
	counts: {
		all: number
		gamified: number
		social: number
		unread: number
	}
}

const FilterTabs = ({
	activeFilter,
	onFilterChange,
	counts,
}: FilterTabsProps) => {
	const t = useTranslations('notifications')
	const filters: {
		id: NotificationFilter
		label: string
		icon: typeof Bell
	}[] = [
		{ id: 'all', label: t('filterAll'), icon: Bell },
		{ id: 'gamified', label: t('filterActivity'), icon: Sparkles },
		{ id: 'social', label: t('filterSocial'), icon: Heart },
		{ id: 'unread', label: t('filterUnread'), icon: Filter },
	]

	return (
		<div
			role='tablist'
			aria-label={t('filterLabel')}
			className='grid grid-cols-4 gap-2 sm:flex sm:gap-2 sm:overflow-x-auto sm:pb-2 sm:pr-8 scrollbar-hide'
		>
			{filters.map(filter => {
				const count = counts[filter.id]
				const Icon = filter.icon
				const isActive = activeFilter === filter.id

				return (
					<motion.button
						type='button'
						key={filter.id}
						role='tab'
						aria-selected={isActive}
						onClick={() => onFilterChange(filter.id)}
						whileTap={BUTTON_SUBTLE_TAP}
						className={cn(
							'flex items-center justify-center gap-1 whitespace-nowrap rounded-full px-2 py-1.5 text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-brand/50 sm:gap-1.5 sm:px-3 sm:text-sm',
							isActive
								? 'border border-brand/20 bg-brand/10 text-brand-text shadow-card'
								: 'bg-bg-elevated text-text-secondary hover:bg-bg-hover hover:text-text',
						)}
					>
						<Icon className='hidden size-4 sm:block' />
						{filter.label}
						{count > 0 && (
							<span
								className={cn(
									'min-w-5 tabular-nums rounded-full px-1 py-0.5 text-center text-xs font-bold sm:min-w-6 sm:px-1.5',
									isActive
										? 'bg-brand/15 text-brand-text'
										: 'bg-brand/10 text-brand',
								)}
							>
								{count}
							</span>
						)}
					</motion.button>
				)
			})}
		</div>
	)
}

// ============================================
// SOCIAL NOTIFICATION ITEM
// ============================================

interface SocialNotificationItemProps extends SocialNotification {
	currentUserId?: string
	onMarkRead: (id: string) => void
}

const SocialNotificationItem = ({
	id,
	type,
	userId,
	user,
	avatar,
	action,
	target,
	targetEntityId,
	targetEntityUrl,
	time,
	read,
	currentUserId,
	onMarkRead,
}: SocialNotificationItemProps) => {
	const router = useRouter()
	const [isNavigating, startNavigationTransition] = useTransition()
	const t = useTranslations('notifications')
	const { icon: Icon, color, bg } = getNotificationIcon(type)

	const handleClick = () => {
		if (!read) {
			onMarkRead(id)
		}
		// Navigate based on type — use targetEntityUrl first, then derive from type
		let resolved = false
		startNavigationTransition(() => {
			if (targetEntityUrl) {
				router.push(targetEntityUrl)
				resolved = true
			} else if (type === 'follow' && userId) {
				router.push(`/${userId}`)
				resolved = true
			} else if (
				(type === 'like' || type === 'comment' || type === 'mention') &&
				targetEntityId
			) {
				router.push(`/post/${targetEntityId}`)
				resolved = true
			} else if (type === 'cook' || type === 'achievement') {
				router.push('/dashboard')
				resolved = true
			}
		})
		if (!resolved) {
			toast.error(t('navigationUnavailable'))
		}
	}

	return (
		<motion.div
			variants={staggerItem}
			whileHover={LIST_ITEM_HOVER}
			whileTap={LIST_ITEM_TAP}
			onClick={handleClick}
			className={cn(
				'group relative flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all hover:shadow-card',
				read
					? 'border-transparent bg-bg-card'
					: 'border-brand/20 bg-brand/5 hover:border-brand/30',
				isNavigating && 'opacity-50 pointer-events-none',
			)}
		>
			{/* Loading indicator */}
			{isNavigating && (
				<div className='absolute inset-0 grid place-items-center rounded-xl bg-bg-card/50'>
					<Loader2 className='size-5 animate-spin text-brand' />
				</div>
			)}
			{/* Unread indicator */}
			{!read && (
				<div className='absolute left-2 top-1/2 size-2 -translate-y-1/2 rounded-full bg-brand' />
			)}

			{/* Avatar with badge */}
			<UserHoverCard userId={userId} currentUserId={currentUserId}>
				<div className='relative flex-shrink-0'>
					<Avatar size='lg' className='shadow-card'>
						<AvatarImage src={avatar} alt={user} />
						<AvatarFallback>
							{user
								.split(' ')
								.map(n => n[0])
								.join('')
								.toUpperCase()
								.slice(0, 2)}
						</AvatarFallback>
					</Avatar>
					<div
						className={cn(
							'absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full border-2 border-bg-card',
							bg,
						)}
					>
						<Icon className={cn('size-3', color)} />
					</div>
				</div>
			</UserHoverCard>

			{/* Content */}
			<div className='flex-1 min-w-0'>
				<p className='text-sm text-text'>
					<span className='font-semibold text-text'>{user}</span>{' '}
					<span className='text-text-secondary'>{action}</span>
					{target && (
						<span className='font-medium text-text'>
							{' '}
							&ldquo;{target}&rdquo;
						</span>
					)}
				</p>
				<p className='mt-1 text-xs text-text-muted'>{time}</p>
			</div>
		</motion.div>
	)
}

// ============================================
// NOTIFICATIONS PAGE
// ============================================

export default function NotificationsPage() {
	const { user } = useAuth()
	const t = useTranslations('notifications')
	const router = useRouter()
	const { setUnreadCount, fetchUnreadCount } = useNotificationStore()
	const [isNavigating, startNavigationTransition] = useTransition()

	const [gamifiedNotifications, setGamifiedNotifications] = useState<
		GamifiedNotification[]
	>([])
	const [socialNotifications, setSocialNotifications] = useState<
		SocialNotification[]
	>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState(false)
	const [retryKey, setRetryKey] = useState(0)
	const [isMarkingAllRead, setIsMarkingAllRead] = useState(false)
	const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all')

	// Fetch notifications and sync unread count
	useEffect(() => {
		let cancelled = false
		const fetchNotifications = async () => {
			setIsLoading(true)
			try {
				const response = await getNotifications({ size: 50 })
				if (cancelled) return
				if (response.success && response.data) {
					const { notifications } = response.data

					const gamified: GamifiedNotification[] = []
					const social: SocialNotification[] = []

					notifications.forEach(notif => {
						const gamifiedNotif = transformToGamifiedNotification(notif)
						if (gamifiedNotif) {
							gamified.push(gamifiedNotif)
						} else {
							const socialNotif = transformToSocialNotification(notif)
							if (socialNotif) {
								social.push(socialNotif)
							} else {
								// Unknown notification type — skip rather than show broken UI
								logDevError(`Unhandled notification type: ${notif.type}`, notif)
							}
						}
					})

					setGamifiedNotifications(gamified)
					setSocialNotifications(social)
				}
			} catch (err) {
				if (cancelled) return
				logDevError('Failed to fetch notifications:', err)
				setError(true)
			} finally {
				if (!cancelled) setIsLoading(false)
			}
		}

		fetchNotifications()
		return () => {
			cancelled = true
		}
	}, [retryKey])

	// Calculate counts
	const counts = {
		all: gamifiedNotifications.length + socialNotifications.length,
		gamified: gamifiedNotifications.length,
		social: socialNotifications.length,
		unread:
			gamifiedNotifications.filter(n => !n.isRead).length +
			socialNotifications.filter(n => !n.read).length,
	}

	// Mark all as read
	const handleMarkAllRead = async () => {
		setIsMarkingAllRead(true)
		try {
			const response = await markAllNotificationsRead()
			if (response.success) {
				setGamifiedNotifications(prev =>
					prev.map(n => ({ ...n, isRead: true })),
				)
				setSocialNotifications(prev => prev.map(n => ({ ...n, read: true })))
				setUnreadCount(0)
			} else {
				toast.error(t('failedToMarkRead'))
			}
		} catch (err) {
			logDevError('Failed to mark all as read:', err)
			toast.error(t('failedToMarkRead'))
		} finally {
			setIsMarkingAllRead(false)
		}
	}

	// Mark single notification as read
	const handleMarkRead = async (id: string) => {
		// Check if notification is already read before marking
		const isGamifiedUnread = gamifiedNotifications.find(
			n => n.id === id && !n.isRead,
		)
		const isSocialUnread = socialNotifications.find(n => n.id === id && !n.read)
		const wasUnread = isGamifiedUnread || isSocialUnread

		try {
			await markNotificationRead(id)
			setGamifiedNotifications(prev =>
				prev.map(n => (n.id === id ? { ...n, isRead: true } : n)),
			)
			setSocialNotifications(prev =>
				prev.map(n => (n.id === id ? { ...n, read: true } : n)),
			)
			// Decrement badge count if it was unread
			if (wasUnread) {
				fetchUnreadCount() // Re-fetch to get accurate count
			}
		} catch (err) {
			logDevError('Failed to mark notification as read:', err)
			toast.error(t('failedToUpdate'))
		}
	}

	// Filter notifications
	const getFilteredNotifications = () => {
		let filtered = {
			gamified: gamifiedNotifications,
			social: socialNotifications,
		}

		switch (activeFilter) {
			case 'gamified':
				filtered.social = []
				break
			case 'social':
				filtered.gamified = []
				break
			case 'unread':
				filtered.gamified = gamifiedNotifications.filter(n => !n.isRead)
				filtered.social = socialNotifications.filter(n => !n.read)
				break
		}

		return filtered
	}

	const filtered = getFilteredNotifications()
	const hasNotifications =
		filtered.gamified.length > 0 || filtered.social.length > 0

	if (error) {
		return (
			<PageTransition>
				<PageContainer maxWidth='lg'>
					<ErrorState
						title={t('failedToLoad')}
						message={t('failedToLoadDesc')}
						onRetry={() => {
							setError(false)
							setIsLoading(true)
							setRetryKey(k => k + 1)
						}}
					/>
				</PageContainer>
			</PageTransition>
		)
	}

	return (
		<PageTransition>
			{/* Global navigation loading indicator */}
			<AnimatePresence>
				{isNavigating && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed top-20 left-1/2 z-toast -translate-x-1/2'
					>
						<div className='flex items-center gap-2 rounded-full border border-brand/20 bg-bg-card px-4 py-2 text-sm font-semibold text-brand-text shadow-warm'>
							<Loader2 className='size-4 animate-spin' />
							{t('loading')}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<PageContainer maxWidth='lg'>
				{/* Header - PRIMARY page (in LeftSidebar), no back button */}
				<PageHeader
					icon={Bell}
					title={t('title')}
					subtitle=''
					showSparkles={false}
					gradient='blue'
					marginBottom='sm'
					rightAction={
						counts.unread > 0 ? (
							<Button
								variant='ghost'
								size='sm'
								onClick={handleMarkAllRead}
								disabled={isMarkingAllRead}
								className='gap-2'
							>
								{isMarkingAllRead ? (
									<Loader2 className='size-4 animate-spin' />
								) : (
									<CheckCheck className='size-4' />
								)}
								{t('markAllRead')}
							</Button>
						) : null
					}
				/>

				{/* Filter Tabs */}
				<div className='relative mb-3'>
					<FilterTabs
						activeFilter={activeFilter}
						onFilterChange={setActiveFilter}
						counts={counts}
					/>
					<div className='pointer-events-none absolute inset-y-0 right-0 hidden w-8 bg-gradient-to-l from-bg to-transparent sm:block' />
				</div>

				{/* Loading State — content-shaped skeleton */}
				{isLoading && (
					<div className='space-y-3'>
						{Array.from({ length: 6 }).map((_, i) => (
							<div
								key={i}
								className='flex items-start gap-3 rounded-radius border border-border-subtle bg-bg-card p-4'
							>
								<Skeleton className='size-10 shrink-0 rounded-full' />
								<div className='flex-1 space-y-2'>
									<Skeleton className='h-4 w-3/4' />
									<Skeleton className='h-3 w-1/2' />
								</div>
								<Skeleton className='h-3 w-12' />
							</div>
						))}
					</div>
				)}

				{/* Empty State */}
				{!isLoading && !hasNotifications && (
					<EmptyState
						variant='notifications'
						title={t('noNotificationsYet')}
						description={
							activeFilter === 'unread'
								? t('noUnread')
								: t('noNotificationsDesc')
						}
						primaryAction={
							activeFilter !== 'all'
								? {
										label: t('viewAll'),
										onClick: () => setActiveFilter('all'),
									}
								: {
										label: t('exploreRecipes'),
										href: '/explore',
									}
						}
					/>
				)}

				{/* Notifications List */}
				{!isLoading && hasNotifications && (
					<motion.div
						variants={staggerContainer}
						initial='hidden'
						animate='visible'
						role='log'
						aria-live='polite'
						aria-label={t('notificationsList')}
						className='space-y-2'
					>
						{/* Gamified Notifications */}
						{filtered.gamified.length > 0 && (
							<>
								{activeFilter === 'all' && (
									<div className='flex items-center gap-2 py-1'>
										<Sparkles className='size-4 text-xp' />
										<span className='text-sm font-semibold text-text-secondary'>
											{t('activitySection')}
										</span>
									</div>
								)}
								{filtered.gamified.map(notif => {
									// Add callbacks based on notification type
									const extraProps: Record<string, unknown> = {}
									if (notif.type === 'xp_awarded') {
										extraProps.onPost = () =>
											startNavigationTransition(() => {
												router.push('/create')
											})
									}
									if (notif.type === 'streak_warning') {
										extraProps.onFindRecipe = () =>
											startNavigationTransition(() => {
												router.push('/explore')
											})
									}
									return (
										<NotificationItemGamified
											key={notif.id}
											{...notif}
											{...extraProps}
										/>
									)
								})}
							</>
						)}

						{/* Social Notifications */}
						{filtered.social.length > 0 && (
							<>
								{activeFilter === 'all' && (
									<div className='flex items-center gap-2 py-1'>
										<Heart className='size-4 text-error' />
										<span className='text-sm font-semibold text-text-secondary'>
											{t('socialSection')}
										</span>
									</div>
								)}
								{filtered.social.map(notif => (
									<SocialNotificationItem
										key={notif.id}
										{...notif}
										currentUserId={user?.userId}
										onMarkRead={handleMarkRead}
									/>
								))}
							</>
						)}
					</motion.div>
				)}
				{/* Bottom breathing room */}
				<div className='pb-40 md:pb-8' />
			</PageContainer>
		</PageTransition>
	)
}
