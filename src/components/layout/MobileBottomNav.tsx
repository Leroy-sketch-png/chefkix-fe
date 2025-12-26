'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, Compass, PlusSquare, Bell, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	ICON_BUTTON_HOVER,
	ICON_BUTTON_TAP,
} from '@/lib/motion'
import { useNotificationStore } from '@/store/notificationStore'

interface NavItem {
	href: string
	icon: React.ComponentType<{ className?: string }>
	label: string
	badge?: boolean
	isCreate?: boolean
}

/**
 * MobileBottomNav - 5 core items for quick access
 *
 * DESIGN DECISION: Mobile nav has 5 items (iOS/Android standard).
 * Missing items (Challenges, Community, Messages, Settings) are accessible via:
 * - Hamburger menu (to be added) OR
 * - Topbar icons (Messages, Notifications)
 * - Settings via Profile page
 *
 * Icon: PlusSquare (matches LeftSidebar, not bare Plus)
 */
const navItems: NavItem[] = [
	{
		href: '/dashboard',
		icon: Home,
		label: 'Home',
	},
	{
		href: '/explore',
		icon: Compass,
		label: 'Explore',
	},
	{
		href: '/create',
		icon: PlusSquare,
		label: 'Create',
		isCreate: true,
	},
	{
		href: '/notifications',
		icon: Bell,
		label: 'Activity',
		badge: true,
	},
	{
		href: '/profile',
		icon: User,
		label: 'Profile',
	},
]

export const MobileBottomNav = () => {
	const pathname = usePathname()
	const { unreadCount } = useNotificationStore()

	const isActive = (href: string) => {
		if (href === '/dashboard') return pathname === '/dashboard'
		return pathname?.startsWith(href)
	}

	return (
		<nav
			className='fixed bottom-0 left-0 right-0 z-sticky flex h-18 items-center justify-around border-t border-border-subtle bg-bg-card/95 px-2 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden'
			aria-label='Mobile navigation'
		>
			{navItems.map(item => {
				const Icon = item.icon
				const active = isActive(item.href)

				// Special handling for the Create button (center elevated button)
				if (item.isCreate) {
					return (
						<Link
							key={item.href}
							href={item.href}
							className='relative -mt-6 flex flex-1 max-w-20 flex-col items-center justify-center gap-1'
						>
							<motion.div
								whileHover={ICON_BUTTON_HOVER}
								whileTap={ICON_BUTTON_TAP}
								transition={TRANSITION_SPRING}
								className='grid size-14 place-items-center rounded-full bg-gradient-primary text-white shadow-lg shadow-brand/30'
							>
								<Icon className='size-7' />
							</motion.div>
						</Link>
					)
				}

				return (
					<Link
						key={item.href}
						href={item.href}
						className={cn(
							'group relative flex flex-1 max-w-20 flex-col items-center justify-center gap-1 rounded-radius px-3 py-2',
							active ? 'text-primary' : 'text-text-secondary',
						)}
					>
						{/* Active indicator dot */}
						<motion.div
							className='absolute -top-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary'
							initial={false}
							animate={{ scale: active ? 1 : 0, opacity: active ? 1 : 0 }}
							transition={TRANSITION_SPRING}
						/>

						<motion.div
							className='relative'
							whileHover={ICON_BUTTON_HOVER}
							whileTap={ICON_BUTTON_TAP}
							transition={TRANSITION_SPRING}
						>
							<Icon
								className={cn(
									'size-6 transition-all duration-300',
									active && 'drop-shadow-glow',
								)}
							/>
							{item.badge && unreadCount > 0 && (
								<motion.span
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									className='absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white'
								>
									{unreadCount > 9 ? '9+' : unreadCount}
								</motion.span>
							)}
						</motion.div>
						<span className='text-xs font-semibold'>{item.label}</span>
					</Link>
				)
			})}
		</nav>
	)
}

// ============================================================================
// Mobile Tab Bar Component (for category switching within pages)
// ============================================================================

interface TabItem {
	id: string
	icon: React.ComponentType<{ className?: string }>
	label: string
}

interface MobileTabBarProps {
	tabs: TabItem[]
	activeTab: string
	onTabChange: (tabId: string) => void
	className?: string
}

export const MobileTabBar = ({
	tabs,
	activeTab,
	onTabChange,
	className,
}: MobileTabBarProps) => {
	return (
		<div
			className={cn(
				'sticky top-mobile-header z-sticky flex flex-nowrap gap-2 overflow-x-auto border-b border-border-subtle bg-bg-card/95 p-2 backdrop-blur-xl scrollbar-hide md:hidden',
				className,
			)}
		>
			{tabs.map(tab => {
				const Icon = tab.icon
				return (
					<motion.button
						key={tab.id}
						onClick={() => onTabChange(tab.id)}
						whileTap={{ scale: 0.95 }}
						transition={TRANSITION_SPRING}
						className={cn(
							'flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition-colors',
							activeTab === tab.id
								? 'bg-primary text-white'
								: 'text-text-secondary hover:bg-bg-elevated',
						)}
					>
						<Icon className='size-4' />
						<span>{tab.label}</span>
					</motion.button>
				)
			})}
		</div>
	)
}
