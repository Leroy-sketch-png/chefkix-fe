'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useUiStore } from '@/store/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import {
	Bell,
	Heart,
	MessageCircle,
	UserPlus,
	ChefHat,
	CheckCheck,
	ArrowRight,
	Check,
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
	markNotificationRead,
	markAllNotificationsRead,
} from '@/services/notification'
import { toggleFollow } from '@/services/social'
import { toast } from 'sonner'
import { useTranslations } from '@/i18n/hooks'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { logDevError } from '@/lib/dev-log'
import { Portal } from '@/components/ui/portal'
import { useNotificationStore } from '@/store/notificationStore'
import {
	markNotificationReadTruthfully,
	resolveSocialNotificationPath,
	type SocialNotification,
	type SocialNotificationType,
} from '@/lib/notifications/social'
import { partitionNotifications } from '@/lib/notifications/presentation'
import { getGamifiedNotificationCallbacks } from '@/lib/notifications/actions'

const NotificationBadge = ({ type }: { type: SocialNotificationType }) => {
	const iconMap = {
		like: { icon: Heart, bg: 'bg-destructive' },
		comment: { icon: MessageCircle, bg: 'bg-brand' },
		mention: { icon: MessageCircle, bg: 'bg-brand' },
		story: { icon: Heart, bg: 'bg-destructive' },
		follow: { icon: UserPlus, bg: 'bg-accent-purple' },
		cook: { icon: ChefHat, bg: 'bg-gold' },
		achievement: { icon: ChefHat, bg: 'bg-gradient-gold' },
		generic: { icon: Bell, bg: 'bg-bg-elevated' },
	}

	const { icon: Icon, bg } = iconMap[type]

	return (
		<div
			className={cn(
				'absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full border-2 border-card',
				bg,
			)}
		>
			<Icon className='size-3 text-white' />
		</div>
	)
}

const NotificationActorHover = ({
	userId,
	currentUserId,
	children,
}: {
	userId: string
	currentUserId?: string
	children: React.ReactNode
}) =>
	userId ? (
		<UserHoverCard userId={userId} currentUserId={currentUserId}>
			{children}
		</UserHoverCard>
	) : (
		<>{children}</>
	)

export const NotificationsPopup = () => {
	const t = useTranslations('notifications')
	const { isNotificationsPopupOpen, toggleNotificationsPopup } = useUiStore()
	const { user } = useAuth()
	const router = useRouter()
	const {
		unreadCount,
		incrementUnreadCount,
		decrementUnreadCount,
		clearUnreadCount,
		fetchUnreadCount,
	} = useNotificationStore()
	const [gamifiedNotifications, setGamifiedNotifications] = useState<
		GamifiedNotification[]
	>([])
	const [socialNotifications, setSocialNotifications] = useState<
		SocialNotification[]
	>([])
	const [isLoading, setIsLoading] = useState(true)
	const [fetchError, setFetchError] = useState(false)
	const [retryKey, setRetryKey] = useState(0)

	useEscapeKey(isNotificationsPopupOpen, toggleNotificationsPopup)

	const markPopupNotificationRead = async (notificationId: string) => {
		const wasUnread =
			gamifiedNotifications.some(
				notification =>
					notification.id === notificationId && !notification.isRead,
			) ||
			socialNotifications.some(
				notification =>
					notification.id === notificationId && !notification.read,
			)

		const updateReadState = (read: boolean) => {
			setGamifiedNotifications(prev =>
				prev.map(notification =>
					notification.id === notificationId
						? { ...notification, isRead: read }
						: notification,
				),
			)
			setSocialNotifications(prev =>
				prev.map(notification =>
					notification.id === notificationId
						? { ...notification, read }
						: notification,
				),
			)
		}

		const succeeded = await markNotificationReadTruthfully({
			wasUnread,
			request: () => markNotificationRead(notificationId),
			onOptimisticRead: () => {
				updateReadState(true)
				decrementUnreadCount()
			},
			onRollback: () => {
				updateReadState(false)
				incrementUnreadCount()
			},
		})

		if (!succeeded) {
			logDevError('Failed to mark popup notification read')
			toast.error(t('failedToUpdate'))
		}
	}

	const navigateFromPopupNotification = (
		notificationId: string,
		path: string,
	) => {
		void markPopupNotificationRead(notificationId)
		handleClose()
		router.push(path)
	}

	// Fetch notifications when popup opens
	useEffect(() => {
		if (!isNotificationsPopupOpen) return
		let cancelled = false

		const fetchNotifications = async () => {
			setIsLoading(true)
			setFetchError(false)
			try {
				const response = await getNotifications({ size: 20 })
				if (cancelled) return
				if (response.success && response.data) {
					void fetchUnreadCount()
					const { gamified, social } = partitionNotifications(
						response.data.notifications,
					)
					setGamifiedNotifications(gamified)
					setSocialNotifications(social)
				} else {
					logDevError('Failed to fetch notifications:', response)
					setFetchError(true)
				}
			} catch (err) {
				logDevError('Failed to fetch notifications:', err)
				if (!cancelled) setFetchError(true)
			} finally {
				if (!cancelled) setIsLoading(false)
			}
		}

		fetchNotifications()
		return () => {
			cancelled = true
		}
	}, [fetchUnreadCount, isNotificationsPopupOpen, retryKey])

	if (!isNotificationsPopupOpen) return null

	const handleMarkAllRead = async () => {
		try {
			const response = await markAllNotificationsRead()
			if (response.success) {
				clearUnreadCount()
				setGamifiedNotifications(prev =>
					prev.map(n => ({ ...n, isRead: true })),
				)
				setSocialNotifications(prev => prev.map(n => ({ ...n, read: true })))
			}
		} catch (err) {
			logDevError('Failed to mark all as read:', err)
			toast.error(t('toastMarkReadFailed'))
		}
	}

	const handleClose = () => {
		toggleNotificationsPopup()
	}

	return (
		<Portal>
			{/* Backdrop */}
			<div
				className='fixed inset-0 z-popover'
				onClick={handleClose}
				aria-hidden='true'
			/>

			{/* Dropdown */}
			<div className='fixed right-2 top-16 z-popover w-[calc(100vw-16px)] max-w-md animate-slide-in-down overflow-hidden rounded-2xl border border-border-subtle/80 bg-gradient-to-b from-bg-card/97 to-bg-card shadow-lg backdrop-blur-xl md:right-6 md:w-96'>
				{/* Header */}
				<div className='flex items-center justify-between border-b border-border-subtle/60 bg-gradient-to-r from-bg-card to-bg-elevated/50 p-4'>
					<div className='flex items-center gap-2'>
						<h3 className='text-lg font-bold text-text-primary'>
							{t('title')}
						</h3>
						{unreadCount > 0 && (
							<span className='rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white'>
								{unreadCount}
							</span>
						)}
					</div>
					<button
						type='button'
						onClick={handleMarkAllRead}
						className='flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-semibold text-brand transition-colors hover:bg-brand/10'
					>
						<CheckCheck className='size-4' />
						{t('markAllRead')}
					</button>
				</div>

				{/* Notification List */}
				<div className='max-h-96 overflow-y-auto'>
					{/* Loading skeleton */}
					{isLoading && (
						<div className='space-y-0'>
							{[0, 1, 2, 3].map(i => (
								<div
									key={i}
									className='flex items-start gap-3 border-b border-border p-4'
								>
									<div className='size-10 flex-shrink-0 animate-pulse rounded-full bg-bg-elevated' />
									<div className='flex-1 space-y-2'>
										<div className='h-4 w-3/4 animate-pulse rounded bg-bg-elevated' />
										<div className='h-3 w-1/3 animate-pulse rounded bg-bg-elevated' />
									</div>
								</div>
							))}
						</div>
					)}

					{/* Error state */}
					{!isLoading && fetchError && (
						<div className='px-4 py-12 text-center'>
							<p className='mb-2 text-sm text-text-muted'>
								{t('failedToLoad')}
							</p>
							<button
								type='button'
								onClick={() => setRetryKey(key => key + 1)}
								className='text-sm font-semibold text-brand hover:text-brand/80'
							>
								{t('tryAgain')}
							</button>
						</div>
					)}

					{/* Empty state */}
					{!isLoading &&
						!fetchError &&
						gamifiedNotifications.length === 0 &&
						socialNotifications.length === 0 && (
							<div className='px-4 py-12 text-center'>
								<div className='mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-bg-elevated'>
									<Bell className='size-5 text-text-muted' />
								</div>
								<p className='text-sm font-medium text-text-secondary'>
									{t('allCaughtUp')}
								</p>
								<p className='mt-1 text-xs text-text-muted'>
									{t('newActivityHere')}
								</p>
							</div>
						)}
					{/* Gamified Notifications (XP, levels, streaks) */}
					{gamifiedNotifications.length > 0 && (
						<>
							<div className='border-b border-border bg-bg-elevated/30 px-4 py-2 text-xs font-bold uppercase tracking-wide text-text-secondary'>
								{t('activitySection')}
							</div>
							{gamifiedNotifications.map(notif => {
								const callbacks = getGamifiedNotificationCallbacks(
									notif,
									navigateFromPopupNotification,
								)

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
							<div className='border-b border-border bg-bg-elevated/30 px-4 py-2 text-xs font-bold uppercase tracking-wide text-text-secondary'>
								{t('socialSection')}
							</div>
							{socialNotifications.map(notif => {
								// Determine navigation target based on notification type
								const path = resolveSocialNotificationPath(notif, user?.userId)
								const actorLabel = notif.user || t('systemUpdate')
								const handleClick = () => {
									if (path) {
										navigateFromPopupNotification(notif.id, path)
									}
								}

								const handleFollowBack = async () => {
									if (!notif.userId) {
										toast.error(t('toastFollowBackNotFound'))
										return
									}
									try {
										const response = await toggleFollow(notif.userId)
										if (response.success) {
											toast.success(
												t('toastFollowSuccess', { user: notif.user }),
											)
											void markPopupNotificationRead(notif.id)
										} else {
											toast.error(t('toastFollowFailed'))
										}
									} catch {
										toast.error(t('toastFollowFailed'))
									}
								}

								return (
									<div
										key={notif.id}
										className={cn(
											'relative flex items-start gap-3 border-b border-border p-4',
											!notif.read && 'bg-brand/5',
										)}
									>
										{/* Avatar with badge */}
										{notif.user ? (
											<NotificationActorHover
												userId={notif.userId}
												currentUserId={user?.userId}
											>
												<div className='relative flex-shrink-0'>
													<Avatar size='lg' className='shadow-card'>
														<AvatarImage src={notif.avatar} alt={actorLabel} />
														<AvatarFallback>
															{actorLabel
																.split(' ')
																.map(n => n[0])
																.join('')
																.toUpperCase()
																.slice(0, 2)}
														</AvatarFallback>
													</Avatar>
													<NotificationBadge type={notif.type} />
												</div>
											</NotificationActorHover>
										) : (
											<div className='grid size-10 shrink-0 place-items-center rounded-full bg-bg-elevated text-text-secondary'>
												<Bell className='size-5' />
											</div>
										)}
										{/* Content */}
										<div className='min-w-0 flex-1'>
											<p className='text-sm leading-relaxed text-text-primary'>
												<NotificationActorHover
													userId={notif.user ? notif.userId : ''}
													currentUserId={user?.userId}
												>
													<span
														className={cn(
															'font-semibold',
															notif.user &&
																notif.userId &&
																'cursor-pointer hover:underline',
														)}
													>
														{actorLabel}
													</span>
												</NotificationActorHover>{' '}
												{notif.action}
												{notif.target && (
													<>
														{' '}
														<span className='font-medium text-brand'>
															&ldquo;{notif.target}&rdquo;
														</span>
													</>
												)}
											</p>
											<span className='text-xs text-text-secondary'>
												{notif.time}
											</span>
										</div>
										{path ? (
											<button
												type='button'
												onClick={handleClick}
												aria-label={t('openNotification')}
												title={t('openNotification')}
												className='grid size-10 shrink-0 place-items-center rounded-full text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary focus-visible:ring-2 focus-visible:ring-brand/50'
											>
												<ArrowRight className='size-4' />
											</button>
										) : !notif.read ? (
											<button
												type='button'
												onClick={() => void markPopupNotificationRead(notif.id)}
												aria-label={t('markRead')}
												title={t('markRead')}
												className='grid size-10 shrink-0 place-items-center rounded-full text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary focus-visible:ring-2 focus-visible:ring-brand/50'
											>
												<Check className='size-4' />
											</button>
										) : null}
										{/* Unread dot */}
										{!notif.read && (
											<div className='absolute left-2 top-1/2 size-2 -translate-y-1/2 rounded-full bg-brand shadow-glow' />
										)}{' '}
										{/* Follow back button - functional */}
										{notif.type === 'follow' && !notif.read && (
											<button
												type='button'
												onClick={handleFollowBack}
												className='flex-shrink-0 rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-brand/90'
											>
												{t('followBack')}
											</button>
										)}
									</div>
								)
							})}
						</>
					)}
				</div>

				{/* Footer */}
				<div className='border-t border-border p-3 text-center'>
					<Link
						href='/notifications'
						className='text-sm font-semibold text-brand transition-colors hover:text-brand/80'
					>
						{t('viewAll')}
					</Link>
				</div>
			</div>
		</Portal>
	)
}
