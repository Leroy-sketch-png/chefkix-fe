'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Home,
	Compass,
	PlusSquare,
	User,
	Menu,
	Target,
	Users,
	ChefHat,
	Package,
	CalendarDays,
	ShoppingCart,
	MessageCircle,
	Settings,
	X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	ICON_BUTTON_HOVER,
	ICON_BUTTON_TAP,
} from '@/lib/motion'
import { Portal } from '@/components/ui/portal'

interface NavItem {
	href: string
	icon: React.ComponentType<{ className?: string }>
	label: string
	isCreate?: boolean
}

/**
 * MobileBottomNav - 5 core items for quick access
 *
 * DESIGN DECISION: Mobile nav has 5 items (iOS/Android standard).
 * Home, Explore, Create, Profile, More.
 * "More" opens a drawer with secondary nav: Challenges, Community,
 * Cook Together, Messages, Pantry, Meal Plan, Shopping, Settings.
 * Notifications are accessible via the Topbar bell icon.
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
		href: '/profile',
		icon: User,
		label: 'Profile',
	},
]

const moreMenuItems: NavItem[] = [
	{ href: '/challenges', icon: Target, label: 'Challenges' },
	{ href: '/community', icon: Users, label: 'Community' },
	{ href: '/cook-together', icon: ChefHat, label: 'Cook Together' },
	{ href: '/messages', icon: MessageCircle, label: 'Messages' },
	{ href: '/pantry', icon: Package, label: 'Pantry' },
	{ href: '/meal-planner', icon: CalendarDays, label: 'Meal Plan' },
	{ href: '/shopping-lists', icon: ShoppingCart, label: 'Shopping' },
	{ href: '/settings', icon: Settings, label: 'Settings' },
]

export const MobileBottomNav = () => {
	const pathname = usePathname()
	const router = useRouter()
	const [showMore, setShowMore] = useState(false)

	const isActive = (href: string) => {
		if (href === '/dashboard') return pathname === '/dashboard'
		return pathname?.startsWith(href)
	}

	// Check if any "more" route is active (highlight More icon)
	const isMoreActive = moreMenuItems.some(item =>
		pathname?.startsWith(item.href),
	)

	return (
		<>
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
							aria-current={active ? 'page' : undefined}
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
							</motion.div>
							<span className='text-xs font-semibold'>{item.label}</span>
						</Link>
					)
				})}

				{/* More button */}
				<button
					onClick={() => setShowMore(true)}
					className={cn(
						'group relative flex flex-1 max-w-20 flex-col items-center justify-center gap-1 rounded-radius px-3 py-2',
						isMoreActive ? 'text-primary' : 'text-text-secondary',
					)}
				>
					<motion.div
						className='absolute -top-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary'
						initial={false}
						animate={{
							scale: isMoreActive ? 1 : 0,
							opacity: isMoreActive ? 1 : 0,
						}}
						transition={TRANSITION_SPRING}
					/>
					<motion.div
						whileHover={ICON_BUTTON_HOVER}
						whileTap={ICON_BUTTON_TAP}
						transition={TRANSITION_SPRING}
					>
						<Menu
							className={cn(
								'size-6 transition-all duration-300',
								isMoreActive && 'drop-shadow-glow',
							)}
						/>
					</motion.div>
					<span className='text-xs font-semibold'>More</span>
				</button>
			</nav>

			{/* More drawer */}
			<AnimatePresence>
				{showMore && (
					<Portal>
						{/* Backdrop */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='fixed inset-0 z-modal bg-black/50 md:hidden'
							onClick={() => setShowMore(false)}
						/>
						{/* Drawer */}
						<motion.div
							initial={{ y: '100%' }}
							animate={{ y: 0 }}
							exit={{ y: '100%' }}
							transition={{ type: 'spring', damping: 25, stiffness: 300 }}
							className='fixed inset-x-0 bottom-0 z-modal rounded-t-2xl border-t border-border-subtle bg-bg-card pb-[calc(16px+env(safe-area-inset-bottom))] shadow-lg md:hidden'
						>
							{/* Handle */}
							<div className='flex items-center justify-between px-5 py-4'>
								<span className='text-lg font-bold text-text'>More</span>
								<button
									onClick={() => setShowMore(false)}
									aria-label='Close menu'
									className='grid size-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-bg-elevated hover:text-text'
								>
									<X className='size-5' />
								</button>
							</div>
							{/* Menu items - 2 column grid */}
							<div className='grid grid-cols-4 gap-1 px-4'>
								{moreMenuItems.map(item => {
									const Icon = item.icon
									const active = isActive(item.href)
									return (
										<button
											key={item.href}
											onClick={() => {
												setShowMore(false)
												router.push(item.href)
											}}
											className={cn(
												'flex flex-col items-center gap-2 rounded-xl p-3 transition-colors',
												active
													? 'bg-brand/10 text-brand'
													: 'text-text-secondary hover:bg-bg-elevated',
											)}
										>
											<Icon className='size-6' />
											<span className='text-xs font-medium'>{item.label}</span>
										</button>
									)
								})}
							</div>
						</motion.div>
					</Portal>
				)}
			</AnimatePresence>
		</>
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
