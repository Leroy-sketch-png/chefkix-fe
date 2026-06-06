'use client'
import { useTranslations } from 'next-intl'
import { useState, useEffect, useTransition } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Bell,
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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { UserHoverCard } from '@/components/social/UserHoverCard'
import { useAuth } from '@/hooks/useAuth'
import { formatShortTimeAgo, cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	staggerContainer,
	staggerItem,
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
	NotificationsCommandDeck,
	NotificationsContextRail,
	type NotificationFilter,
} from '@/components/notifications'
import type { GamifiedNotification } from '@/components/notifications/NotificationItemsGamified'
import { transformToGamifiedNotification } from '@/lib/notifications/gamified'
import { logDevError } from '@/lib/dev-log'
import { ErrorState } from '@/components/ui/error-state'
import { toast } from 'sonner'

const NotificationItemGamified = dynamic(
	() =>
		import('@/components/notifications/NotificationItemsGamified').then(
			module => module.NotificationItemGamified,
		),
	{ ssr: false, loading: () => null },
)

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
				<p className='text-sm text-text-primary'>
					<span className='font-semibold text-text-primary'>{user}</span>{' '}
					<span className='text-text-secondary'>{action}</span>
					{target && (
						<span className='font-medium text-text-primary'>
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

	const navigateFromNotification = (id: string, path: string) => {
		void handleMarkRead(id)
		startNavigationTransition(() => {
			router.push(path)
		})
	}

	const openPostComposer = (id: string, sessionId?: string) => {
		const target = sessionId
			? `/post/new?session=${encodeURIComponent(sessionId)}`
			: '/post/new'
		navigateFromNotification(id, target)
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
				<div data-testid='notifications-page' data-visual-ready='true'>
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
				</div>
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

			<PageContainer maxWidth='2xl'>
				<div
					data-testid='notifications-page'
					data-visual-ready={isLoading ? 'false' : 'true'}
				>
					<div className='grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start xl:gap-6'>
						<div className='space-y-3 sm:space-y-4'>
							<NotificationsCommandDeck
								counts={counts}
								activeFilter={activeFilter}
								onFilterChange={setActiveFilter}
								onMarkAllRead={handleMarkAllRead}
								isMarkingAllRead={isMarkingAllRead}
							/>

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
									className='space-y-2.5'
								>
									{/* Gamified Notifications */}
									{filtered.gamified.length > 0 && (
										<>
											{activeFilter === 'all' && (
												<div className='flex items-center gap-2 py-0.5'>
													<Sparkles className='size-4 text-xp' />
													<span className='text-sm font-semibold text-text-secondary'>
														{t('activitySection')}
													</span>
												</div>
											)}
											{filtered.gamified.map(notif => {
												const extraProps: Record<string, unknown> = {}
												if (
													notif.type === 'xp_awarded' &&
													notif.pendingXp > 0
												) {
													extraProps.onPost = () =>
														openPostComposer(notif.id, notif.sessionId)
												}
												if (notif.type === 'streak_warning') {
													extraProps.onFindRecipe = () =>
														navigateFromNotification(notif.id, '/explore')
												}
												if (notif.type === 'badge_unlocked') {
													extraProps.onViewBadge = () =>
														navigateFromNotification(
															notif.id,
															'/profile/badges',
														)
												}
												if (
													notif.type === 'post_deadline' ||
													notif.type === 'post_deadline_urgent'
												) {
													extraProps.onPostNow = () =>
														openPostComposer(notif.id, notif.sessionId)
												}
												if (notif.type === 'challenge_reminder') {
													extraProps.onSeeRecipes = () =>
														navigateFromNotification(notif.id, '/challenges')
												}
												if (notif.type === 'weekend_nudge') {
													extraProps.onExplore = () =>
														navigateFromNotification(notif.id, '/explore')
												}
												if (notif.type === 'pantry_expiring') {
													extraProps.onViewPantry = () =>
														navigateFromNotification(notif.id, '/pantry')
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
												<div className='flex items-center gap-2 py-0.5'>
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
							<div className='pb-[calc(var(--h-mobile-nav)+var(--space-20))] md:pb-8' />
						</div>

						<NotificationsContextRail counts={counts} className='xl:w-72' />
					</div>
				</div>
			</PageContainer>
		</PageTransition>
	)
}
