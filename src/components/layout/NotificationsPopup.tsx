'use client'

import { useUiStore } from '@/store/uiStore'
import Image from 'next/image'
import {
	Heart,
	MessageCircle,
	UserPlus,
	ChefHat,
	X,
	CheckCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NotificationType = 'like' | 'comment' | 'follow' | 'cook' | 'achievement'

interface Notification {
	id: number
	type: NotificationType
	user: string
	avatar: string
	action: string
	target?: string
	time: string
	read: boolean
}

const notifications: Notification[] = [
	{
		id: 1,
		type: 'like',
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
		user: 'Lisa Chen',
		avatar: 'https://i.pravatar.cc/48?u=2',
		action: 'commented: "This looks amazing! 🤤"',
		time: '15 minutes ago',
		read: false,
	},
	{
		id: 3,
		type: 'follow',
		user: 'RamenKing',
		avatar: 'https://i.pravatar.cc/48?u=3',
		action: 'started following you',
		time: '1 hour ago',
		read: true,
	},
	{
		id: 4,
		type: 'cook',
		user: 'PastryQueen',
		avatar: 'https://i.pravatar.cc/48?u=4',
		action: 'cooked your recipe',
		target: 'Fluffy Pancakes',
		time: '3 hours ago',
		read: true,
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

	if (!isNotificationsPopupOpen) return null

	const handleMarkAllRead = () => {
		// TODO: Implement mark all as read API call
		// toast.info('Mark all as read feature coming soon')
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
					<h3 className='text-lg font-bold text-foreground'>Notifications</h3>
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
					{notifications.map(notif => (
						<div
							key={notif.id}
							className={cn(
								'relative flex cursor-pointer items-start gap-3 border-b border-border p-4 transition-colors hover:bg-muted/50',
								!notif.read && 'bg-primary/5',
							)}
						>
							{/* Avatar with badge */}
							<div className='relative flex-shrink-0'>
								<div className='relative h-12 w-12 overflow-hidden rounded-full shadow-md'>
									<Image
										src={notif.avatar}
										alt={notif.user}
										fill
										className='object-cover'
									/>
								</div>
								<NotificationBadge type={notif.type} />
							</div>
							{/* Content */}
							<div className='flex-1 min-w-0'>
								<p className='text-sm leading-relaxed text-foreground'>
									<span className='font-semibold'>{notif.user}</span>{' '}
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
