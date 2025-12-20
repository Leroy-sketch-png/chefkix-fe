'use client'

import { useState, useEffect } from 'react'
import { useUiStore } from '@/store/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import {
	Heart,
	MessageCircle,
	UserPlus,
	ChefHat,
	X,
	CheckCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { UserHoverCard } from '@/components/social/UserHoverCard'
import {
	NotificationItemGamified,
	type GamifiedNotification,
} from '@/components/notifications/NotificationItemsGamified'
import {
	getNotifications,
	markAllNotificationsRead,
	type Notification as APINotification,
} from '@/services/notification'

type NotificationType = 'like' | 'comment' | 'follow' | 'cook' | 'achievement'

interface SocialNotification {
	id: number
	type: NotificationType
	userId: string
	user: string
	avatar: string
	action: string
	target?: string
	time: string
	read: boolean
}

// Helper to transform API notification to gamified notification format
// Uses BE NotificationType enum values (SCREAMING_SNAKE_CASE)
const transformToGamifiedNotification = (
	notif: APINotification,
): GamifiedNotification | null => {
	const data = notif.data as Record<string, unknown>
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

// Helper to format time ago
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

// Helper to transform API notification to social notification format
// Uses BE NotificationType enum values (SCREAMING_SNAKE_CASE)
const transformToSocialNotification = (
	notif: APINotification,
	index: number,
): SocialNotification | null => {
	const data = notif.data as Record<string, unknown>
	const timestamp = new Date(notif.createdAt)

	const typeMap: Record<string, NotificationType> = {
		NEW_FOLLOWER: 'follow',
		FOLLOW: 'follow',
		POST_LIKE: 'like',
		POST_COMMENT: 'comment',
	}

	const type = typeMap[notif.type]
	if (!type) return null

	return {
		id: index,
		type,
		userId: (data.userId as string) || '',
		user: (data.userName as string) || (data.displayName as string) || 'User',
		avatar: (data.avatarUrl as string) || '/placeholder-avatar.png',
		action: notif.content || notif.body || '',
		target: (data.targetTitle as string) || undefined,
		time: formatTimeAgo(timestamp),
		read: notif.isRead,
	}
}

const NotificationBadge = ({ type }: { type: NotificationType }) => {
	const iconMap = {
		like: { icon: Heart, bg: 'bg-destructive' },
		comment: { icon: MessageCircle, bg: 'bg-primary' },
		follow: { icon: UserPlus, bg: 'bg-accent' },
		cook: { icon: ChefHat, bg: 'bg-gold' },
		achievement: { icon: ChefHat, bg: 'bg-gradient-gold' },
	}

	const { icon: Icon, bg } = iconMap[type]

	return (
		<div
			className={cn(
				'absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-card',
				bg,
			)}
		>
			<Icon className='h-3 w-3 text-primary-foreground' />
		</div>
	)
}

export const NotificationsPopup = () => {
	const { isNotificationsPopupOpen, toggleNotificationsPopup } = useUiStore()
	const { user } = useAuth()
	const router = useRouter()
	const [gamifiedNotifications, setGamifiedNotifications] = useState<
		GamifiedNotification[]
	>([])
	const [socialNotifications, setSocialNotifications] = useState<
		SocialNotification[]
	>([])
	const [unreadCount, setUnreadCount] = useState(0)
	const [isLoading, setIsLoading] = useState(false)

	// Fetch notifications when popup opens
	useEffect(() => {
		if (!isNotificationsPopupOpen) return

		const fetchNotifications = async () => {
			setIsLoading(true)
			try {
				const response = await getNotifications({ size: 20 })
				if (response.success && response.data) {
					const { notifications, unreadCount: count } = response.data
					setUnreadCount(count)

					// Split notifications into gamified and social
					const gamified: GamifiedNotification[] = []
					const social: SocialNotification[] = []

					notifications.forEach((notif, idx) => {
						const gamifiedNotif = transformToGamifiedNotification(notif)
						if (gamifiedNotif) {
							gamified.push(gamifiedNotif)
						} else {
							const socialNotif = transformToSocialNotification(notif, idx)
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
	}, [isNotificationsPopupOpen])

	if (!isNotificationsPopupOpen) return null

	const handleMarkAllRead = async () => {
		try {
			const response = await markAllNotificationsRead()
			if (response.success) {
				setUnreadCount(0)
				setGamifiedNotifications(prev =>
					prev.map(n => ({ ...n, isRead: true })),
				)
				setSocialNotifications(prev => prev.map(n => ({ ...n, read: true })))
			}
		} catch (err) {
			console.error('Failed to mark all as read:', err)
		}
	}

	const handleClose = () => {
		toggleNotificationsPopup()
	}

	return (
		<>
			{/* Backdrop */}
			<div
				className='fixed inset-0 z-40'
				onClick={handleClose}
				aria-hidden='true'
			/>

			{/* Dropdown */}
			<div className='fixed right-2 top-16 z-50 w-[calc(100vw-16px)] max-w-md animate-slideInDown overflow-hidden rounded-radius border border-border bg-card text-card-foreground shadow-glow md:absolute md:right-6 md:w-96'>
				{/* Header */}
				<div className='flex items-center justify-between border-b border-border p-4'>
					<div className='flex items-center gap-2'>
						<h3 className='text-lg font-bold text-foreground'>Notifications</h3>
						{unreadCount > 0 && (
							<span className='rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground'>
								{unreadCount}
							</span>
						)}
					</div>
					<button
						onClick={handleMarkAllRead}
						className='flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-semibold text-primary transition-colors hover:bg-primary/10'
					>
						<CheckCheck className='h-4 w-4' />
						Mark all read
					</button>
				</div>

				{/* Notification List */}
				<div className='max-h-96 overflow-y-auto'>
					{/* Gamified Notifications (XP, levels, streaks) */}
					{gamifiedNotifications.length > 0 && (
						<>
							<div className='border-b border-border bg-muted/30 px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground'>
								Activity
							</div>
							{gamifiedNotifications.map(notif => {
								// Provide callbacks based on notification type
								const callbacks = {
									onPost:
										notif.type === 'xp_awarded'
											? () => {
													toggleNotificationsPopup()
													router.push('/create')
												}
											: undefined,
									onFindRecipe:
										notif.type === 'streak_warning'
											? () => {
													toggleNotificationsPopup()
													router.push('/explore')
												}
											: undefined,
									onViewPost:
										notif.type === 'creator_bonus'
											? () => {
													toggleNotificationsPopup()
													router.push('/dashboard')
												}
											: undefined,
								}

								return (
									<NotificationItemGamified
										key={notif.id}
										{...notif}
										{...callbacks}
									/>
								)
							})}
						</>
					)}

					{/* Social Notifications */}
					{socialNotifications.length > 0 && (
						<>
							<div className='border-b border-border bg-muted/30 px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground'>
								Social
							</div>
							{socialNotifications.map(notif => (
								<div
									key={notif.id}
									className={cn(
										'relative flex cursor-pointer items-start gap-3 border-b border-border p-4 transition-colors hover:bg-muted/50',
										!notif.read && 'bg-primary/5',
									)}
								>
									{/* Avatar with badge */}
									<UserHoverCard
										userId={notif.userId}
										currentUserId={user?.userId}
									>
										<div className='relative flex-shrink-0'>
											<Avatar size='lg' className='shadow-md'>
												<AvatarImage src={notif.avatar} alt={notif.user} />
												<AvatarFallback>
													{notif.user
														.split(' ')
														.map(n => n[0])
														.join('')
														.toUpperCase()
														.slice(0, 2)}
												</AvatarFallback>
											</Avatar>
											<NotificationBadge type={notif.type} />
										</div>
									</UserHoverCard>
									{/* Content */}
									<div className='min-w-0 flex-1'>
										<p className='text-sm leading-relaxed text-foreground'>
											<UserHoverCard
												userId={notif.userId}
												currentUserId={user?.userId}
											>
												<span className='cursor-pointer font-semibold hover:underline'>
													{notif.user}
												</span>
											</UserHoverCard>{' '}
											{notif.action}
											{notif.target && (
												<>
													{' '}
													<span className='font-medium text-primary'>
														&ldquo;{notif.target}&rdquo;
													</span>
												</>
											)}
										</p>
										<span className='text-xs text-muted-foreground'>
											{notif.time}
										</span>
									</div>
									{/* Unread dot */}
									{!notif.read && (
										<div className='absolute right-4 top-5 h-2 w-2 rounded-full bg-primary shadow-glow' />
									)}{' '}
									{/* Follow back button */}
									{notif.type === 'follow' && !notif.read && (
										<button className='flex-shrink-0 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:bg-primary/90'>
											Follow Back
										</button>
									)}
								</div>
							))}
						</>
					)}
				</div>

				{/* Footer */}
				<div className='border-t border-border p-3 text-center'>
					<a
						href='#'
						className='text-sm font-semibold text-primary transition-colors hover:text-primary/80'
					>
						View All Notifications
					</a>
				</div>
			</div>
		</>
	)
}
