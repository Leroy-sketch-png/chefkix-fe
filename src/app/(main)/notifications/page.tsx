'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Bell,
	CheckCheck,
	Filter,
	Trash2,
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
import { EmptyState } from '@/components/shared/EmptyStateGamified'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { UserHoverCard } from '@/components/social/UserHoverCard'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING, staggerContainer, staggerItem } from '@/lib/motion'
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
	time: string
	read: boolean
	createdAt: Date
}

// ============================================
// HELPERS
// ============================================

const formatTimeAgo = (date: Date): string => {
	const now = new Date()
	const diffMs = now.getTime() - date.getTime()
	const diffMins = Math.floor(diffMs / 60000)
	const diffHours = Math.floor(diffMs / 3600000)
	const diffDays = Math.floor(diffMs / 86400000)

	if (diffMins < 1) return 'Just now'
	if (diffMins < 60) return `${diffMins}m ago`
	if (diffHours < 24) return `${diffHours}h ago`
	if (diffDays === 1) return 'Yesterday'
	if (diffDays < 7) return `${diffDays}d ago`
	return date.toLocaleDateString()
}

// Transform API notification to gamified format
const transformToGamifiedNotification = (
	notif: APINotification,
): GamifiedNotification | null => {
	const data = (notif.data ?? {}) as Record<string, unknown>
	const timestamp = new Date(notif.createdAt)

	switch (notif.type) {
		case 'XP_AWARDED':
			return {
				id: notif.id,
				type: 'xp_awarded',
				recipeName: (data.recipeName as string) || 'Recipe',
				xpAmount: (data.xpAmount as number) || 0,
				pendingXp: (data.pendingXp as number) || 0,
				timestamp,
				isRead: notif.isRead,
			}
		case 'LEVEL_UP':
			return {
				id: notif.id,
				type: 'level_up',
				newLevel: (data.newLevel as number) || 1,
				newGoalXp: (data.newGoalXp as number) || 1000,
				recipesToNextLevel: (data.recipesToNextLevel as number) || 5,
				timestamp,
				isRead: notif.isRead,
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
					(data.cookerAvatarUrl as string) || '/placeholder-avatar.png',
				recipeName: (data.recipeName as string) || 'Recipe',
				xpBonus: (data.xpBonus as number) || 0,
				totalCookRewards: (data.totalCookRewards as number) || 1,
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
		POST_COMMENT: 'comment',
		USER_MENTION: 'mention',
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
			'/placeholder-avatar.png',
		action: notif.content || notif.body || '',
		target: (data.targetTitle as string) || undefined,
		time: formatTimeAgo(timestamp),
		read: notif.isRead,
		createdAt: timestamp,
	}
}

// Get icon for notification type
const getNotificationIcon = (type: SocialNotificationType) => {
	switch (type) {
		case 'like':
			return { icon: Heart, color: 'text-red-500', bg: 'bg-red-500/10' }
		case 'comment':
			return {
				icon: MessageCircle,
				color: 'text-blue-500',
				bg: 'bg-blue-500/10',
			}
		case 'follow':
			return { icon: UserPlus, color: 'text-green-500', bg: 'bg-green-500/10' }
		case 'mention':
			return {
				icon: MessageCircle,
				color: 'text-purple-500',
				bg: 'bg-purple-500/10',
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
	const filters: {
		id: NotificationFilter
		label: string
		icon: typeof Bell
	}[] = [
		{ id: 'all', label: 'All', icon: Bell },
		{ id: 'gamified', label: 'Activity', icon: Sparkles },
		{ id: 'social', label: 'Social', icon: Heart },
		{ id: 'unread', label: 'Unread', icon: Filter },
	]

	return (
		<div className='flex gap-2 overflow-x-auto pb-2'>
			{filters.map(filter => {
				const count = counts[filter.id]
				const Icon = filter.icon
				const isActive = activeFilter === filter.id

				return (
					<button
						key={filter.id}
						onClick={() => onFilterChange(filter.id)}
						className={cn(
							'flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all',
							isActive
								? 'bg-brand text-white shadow-md'
								: 'bg-bg-elevated text-text-secondary hover:bg-bg-hover hover:text-text',
						)}
					>
						<Icon className='size-4' />
						{filter.label}
						{count > 0 && (
							<span
								className={cn(
									'rounded-full px-1.5 py-0.5 text-xs font-bold',
									isActive ? 'bg-white/20' : 'bg-brand/10 text-brand',
								)}
							>
								{count}
							</span>
						)}
					</button>
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
	time,
	read,
	currentUserId,
	onMarkRead,
}: SocialNotificationItemProps) => {
	const router = useRouter()
	const { icon: Icon, color, bg } = getNotificationIcon(type)

	const handleClick = () => {
		if (!read) {
			onMarkRead(id)
		}
		// Navigate based on type
		if (type === 'follow' && userId) {
			router.push(`/${userId}`)
		}
	}

	return (
		<motion.div
			variants={staggerItem}
			onClick={handleClick}
			className={cn(
				'group relative flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all hover:shadow-md',
				read
					? 'border-transparent bg-bg-card'
					: 'border-brand/20 bg-brand/5 hover:border-brand/30',
			)}
		>
			{/* Unread indicator */}
			{!read && (
				<div className='absolute left-2 top-1/2 size-2 -translate-y-1/2 rounded-full bg-brand' />
			)}

			{/* Avatar with badge */}
			<UserHoverCard userId={userId} currentUserId={currentUserId}>
				<div className='relative flex-shrink-0'>
					<Avatar size='lg' className='shadow-md'>
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
	const router = useRouter()
	const { setUnreadCount, fetchUnreadCount } = useNotificationStore()

	const [gamifiedNotifications, setGamifiedNotifications] = useState<
		GamifiedNotification[]
	>([])
	const [socialNotifications, setSocialNotifications] = useState<
		SocialNotification[]
	>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isMarkingAllRead, setIsMarkingAllRead] = useState(false)
	const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all')

	// Fetch notifications and sync unread count
	useEffect(() => {
		const fetchNotifications = async () => {
			setIsLoading(true)
			try {
				const response = await getNotifications({ size: 50 })
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
							}
						}
					})

					setGamifiedNotifications(gamified)
					setSocialNotifications(social)
				}
			} catch (err) {
				console.error('Failed to fetch notifications:', err)
			} finally {
				setIsLoading(false)
			}
		}

		fetchNotifications()
	}, [])

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
				// Update the notification badge count
				setUnreadCount(0)
			}
		} catch (err) {
			console.error('Failed to mark all as read:', err)
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
			console.error('Failed to mark notification as read:', err)
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

	return (
		<PageTransition>
			<PageContainer maxWidth='lg'>
				{/* Header - PRIMARY page (in LeftSidebar), no back button */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={TRANSITION_SPRING}
					className='mb-6'
				>
					<div className='mb-2 flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							<motion.div
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{ delay: 0.2, ...TRANSITION_SPRING }}
								className='flex size-12 items-center justify-center rounded-2xl bg-gradient-hero shadow-md shadow-brand/25'
							>
								<Bell className='size-6 text-white' />
							</motion.div>
							<h1 className='text-3xl font-bold text-text'>Notifications</h1>
						</div>
						{counts.unread > 0 && (
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
								Mark all read
							</Button>
						)}
					</div>
					<p className='flex items-center gap-2 text-text-secondary'>
						<Sparkles className='size-4 text-streak' />
						Stay updated with your cooking journey
					</p>
				</motion.div>

				{/* Filter Tabs */}
				<div className='mb-6'>
					<FilterTabs
						activeFilter={activeFilter}
						onFilterChange={setActiveFilter}
						counts={counts}
					/>
				</div>

				{/* Loading State */}
				{isLoading && (
					<div className='flex flex-col items-center justify-center py-20'>
						<Loader2 className='size-8 animate-spin text-brand' />
						<p className='mt-4 text-sm text-text-muted'>
							Loading notifications...
						</p>
					</div>
				)}

				{/* Empty State */}
				{!isLoading && !hasNotifications && (
					<EmptyState
						variant='notifications'
						title='No notifications yet'
						description={
							activeFilter === 'unread'
								? "You're all caught up! No unread notifications."
								: 'Your notification feed will fill up as you cook and interact with others.'
						}
						primaryAction={
							activeFilter !== 'all'
								? {
										label: 'View All',
										onClick: () => setActiveFilter('all'),
									}
								: {
										label: 'Explore Recipes',
										href: '/discover',
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
						className='space-y-3'
					>
						{/* Gamified Notifications */}
						{filtered.gamified.length > 0 && (
							<>
								{activeFilter === 'all' && (
									<div className='flex items-center gap-2 py-2'>
										<Sparkles className='size-4 text-xp' />
										<span className='text-sm font-semibold text-text-secondary'>
											Activity
										</span>
									</div>
								)}
								{filtered.gamified.map(notif => {
									// Add callbacks based on notification type
									const extraProps: Record<string, unknown> = {}
									if (notif.type === 'xp_awarded') {
										extraProps.onPost = () => router.push('/create')
									}
									if (notif.type === 'streak_warning') {
										extraProps.onFindRecipe = () => router.push('/discover')
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
									<div className='flex items-center gap-2 py-2'>
										<Heart className='size-4 text-red-500' />
										<span className='text-sm font-semibold text-text-secondary'>
											Social
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
			</PageContainer>
		</PageTransition>
	)
}
