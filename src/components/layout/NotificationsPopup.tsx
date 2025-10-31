'use client'

import { useUiStore } from '@/store/uiStore'
import Image from 'next/image'

const notifications = [
	{
		id: 1,
		user: 'SauceBoss',
		avatar: 'https://i.pravatar.cc/40?u=2',
		action: 'liked your post.',
		read: false,
	},
	{
		id: 2,
		user: 'ChefAnna',
		avatar: 'https://i.pravatar.cc/40?u=1',
		action: 'started following you.',
		read: false,
	},
	{
		id: 3,
		user: 'MarcoB',
		avatar: 'https://i.pravatar.cc/40?u=3',
		action: 'commented on your recipe.',
		read: true,
	},
]

export const NotificationsPopup = () => {
	const { isNotificationsPopupOpen } = useUiStore()

	if (!isNotificationsPopupOpen) return null

	return (
		<div className='absolute right-6 top-16 z-50 w-[300px] overflow-hidden rounded-lg border bg-card text-card-foreground shadow-lg'>
			<div className='border-b p-3 font-semibold'>
				<h3>Notifications</h3>
			</div>
			<div>
				{notifications.map(notif => (
					<div
						key={notif.id}
						className='flex cursor-pointer items-center gap-3 p-3 hover:bg-muted'
					>
						<div className='relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full'>
							<Image
								src={notif.avatar}
								alt={notif.user}
								fill
								className='object-cover'
							/>
						</div>
						<p className='text-sm'>
							<span className={!notif.read ? 'font-bold' : ''}>
								{notif.user}
							</span>
							{notif.action}
						</p>
					</div>
				))}
			</div>
		</div>
	)
}
