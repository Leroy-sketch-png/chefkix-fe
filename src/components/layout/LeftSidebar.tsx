'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
	Home,
	Compass,
	Target,
	PlusSquare,
	Users,
	MessageCircle,
	Settings,
	User,
	Bell,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import {
	TRANSITION_SPRING,
	ICON_BUTTON_HOVER,
	ICON_BUTTON_TAP,
} from '@/lib/motion'
import type { LucideIcon } from 'lucide-react'
import { useNotificationStore } from '@/store/notificationStore'

interface NavItem {
	href: string | ((userId?: string) => string)
	icon: LucideIcon
	label: string
	showBadge?: boolean // Whether this item can show a notification badge
}

const navItems: NavItem[] = [
	{ href: '/dashboard', icon: Home, label: 'Home' },
	{ href: '/explore', icon: Compass, label: 'Explore' },
	{ href: '/challenges', icon: Target, label: 'Challenges' },
	{ href: '/community', icon: Users, label: 'Community' },
	{ href: '/create', icon: PlusSquare, label: 'Create' },
	{ href: '/messages', icon: MessageCircle, label: 'Messages' },
	{ href: '/notifications', icon: Bell, label: 'Notifs', showBadge: true },
	// NOTE: Saved removed from nav - access via Profile page's Saved tab
	// Having both "Saved" and "Profile" in nav was confusing (same destination)
	{ href: '/profile', icon: User, label: 'Profile' },
	{ href: '/settings', icon: Settings, label: 'Settings' },
]

export const LeftSidebar = () => {
	const pathname = usePathname()
	const { user, isAuthenticated } = useAuth()
	const { unreadCount, startPolling, stopPolling } = useNotificationStore()

	// Start/stop polling based on auth state
	useEffect(() => {
		if (isAuthenticated) {
			startPolling()
		} else {
			stopPolling()
		}

		return () => stopPolling()
	}, [isAuthenticated, startPolling, stopPolling])

	const getHref = (item: NavItem): string => {
		if (typeof item.href === 'function') {
			return item.href(user?.userId)
		}
		return item.href
	}

	const isActive = (item: NavItem) => {
		const href = getHref(item)
		if (href === '/dashboard') return pathname === href || pathname === '/'
		// For saved tab, check if on profile with saved tab
		if (item.label === 'Saved') {
			return (
				pathname.includes(user?.userId ?? '') && pathname.includes('tab=saved')
			)
		}
		return pathname.startsWith(href)
	}

	return (
		<nav
			className='hidden border-r border-border-subtle bg-bg-card px-3 py-6 md:flex md:w-nav md:flex-col md:items-center md:gap-4'
			aria-label='Main navigation'
		>
			{navItems.map(item => {
				const href = getHref(item)
				const active = isActive(item)
				const Icon = item.icon
				return (
					<Link
						key={item.label}
						href={href}
						className='group relative flex h-11 w-full flex-col items-center justify-center gap-1 rounded-radius px-1.5 text-xs font-semibold uppercase leading-tight tracking-[0.6px] text-text-secondary transition-colors duration-300 hover:text-text-primary data-[active=true]:text-primary'
						data-active={active}
						title={item.label}
					>
						{/* Active indicator bar */}
						<motion.div
							className='absolute left-0 top-1/2 w-0.5 -translate-y-1/2 rounded-r-sm bg-gradient-primary'
							initial={false}
							animate={{
								height: active ? '70%' : '0%',
							}}
							transition={TRANSITION_SPRING}
						/>{' '}
						{/* Background glow on active */}
						<motion.div
							className='absolute inset-0 rounded-radius bg-gradient-to-r from-primary/10 to-transparent opacity-0'
							initial={false}
							animate={{
								opacity: active ? 1 : 0,
							}}
							transition={{
								duration: 0.3,
							}}
						/>
						{/* Icon with hover animation */}
						<motion.div
							whileHover={{
								...ICON_BUTTON_HOVER,
								scale: 1.15,
								rotate: 5,
							}}
							whileTap={ICON_BUTTON_TAP}
							transition={TRANSITION_SPRING}
							className='relative'
						>
							<Icon className='size-6 transition-all duration-300 group-data-[active=true]:drop-shadow-glow' />
							{/* Unread badge for notifications */}
							{item.showBadge && unreadCount > 0 && (
								<span className='absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white'>
									{unreadCount > 9 ? '9+' : unreadCount}
								</span>
							)}
						</motion.div>
						<div>{item.label}</div>
					</Link>
				)
			})}
		</nav>
	)
}
