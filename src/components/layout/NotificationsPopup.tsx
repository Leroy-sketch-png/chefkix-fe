'use client'

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

type NotificationType = 'like' | 'comment' | 'follow' | 'cook' | 'achievement'

interface Notification {
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

// Social notifications (non-gamified)
const socialNotifications: Notification[] = [
	{
		id: 1,
		type: 'like',
		userId: 'user-1',
		user: 'Chef Marco',
		avatar: 'https://i.pravatar.cc/48?u=1',
		action: 'liked your recipe',
		target: 'Spicy Carbonara',
		time: '2 minutes ago',
		read: false,
	},
	{
		id: 2,
		type: 'comment',
		userId: 'user-2',
		user: 'Lisa Chen',
		avatar: 'https://i.pravatar.cc/48?u=2',
		action: 'commented: "This looks amazing! 🤤"',
		time: '15 minutes ago',
		read: false,
	},
	{
		id: 3,
		type: 'follow',
		userId: 'user-3',
		user: 'RamenKing',
		avatar: 'https://i.pravatar.cc/48?u=3',
		action: 'started following you',
		time: '1 hour ago',
		read: true,
	},
]

// Gamified notifications (XP, levels, badges, streaks)
const gamifiedNotifications: GamifiedNotification[] = [
	{
		id: 'gam-1',
		type: 'xp_awarded',
		recipeName: 'Creamy Carbonara',
		xpAmount: 15,
		pendingXp: 35,
		timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
		isRead: false,
	},
	{
		id: 'gam-2',
		type: 'streak_warning',
		streakCount: 7,
		hoursRemaining: 6,
		timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
		isRead: false,
	},
	{
		id: 'gam-3',
		type: 'creator_bonus',
		cookerName: 'PastryQueen',
		cookerUsername: 'pastryqueen',
		cookerAvatarUrl: 'https://i.pravatar.cc/48?u=4',
		recipeName: 'Fluffy Pancakes',
		xpBonus: 5,
		totalCookRewards: 12,
		timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3h ago
		isRead: true,
	},
]

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

	if (!isNotificationsPopupOpen) return null

	const handleMarkAllRead = () => {
		// TODO: Implement mark all as read API call
		// toast.info('Mark all as read feature coming soon')
	}

	const handleClose = () => {
		toggleNotificationsPopup()
	}

	// Count unread notifications
	const unreadCount =
		gamifiedNotifications.filter(n => !n.isRead).length +
		socialNotifications.filter(n => !n.read).length

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
