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
	UserPlus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	ICON_BUTTON_HOVER,
	ICON_BUTTON_TAP,
	BUTTON_SUBTLE_TAP,
} from '@/lib/motion'
import { Portal } from '@/components/ui/portal'
import { useTranslations } from '@/i18n/hooks'
import { useAuth } from '@/hooks/useAuth'

interface NavItem {
	href: string
	icon: React.ComponentType<{ className?: string }>
	labelKey: string
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
		labelKey: 'home',
	},
	{
		href: '/explore',
		icon: Compass,
		labelKey: 'explore',
	},
	{
		href: '/create',
		icon: PlusSquare,
		labelKey: 'create',
		isCreate: true,
	},
	{
		href: '/profile',
		icon: User,
		labelKey: 'profile',
	},
]

// Guest bottom nav: only public routes + sign-in CTA
const guestNavItems: NavItem[] = [
	{
		href: '/explore',
		icon: Compass,
		labelKey: 'explore',
	},
	{
		href: '/community',
		icon: Users,
		labelKey: 'community',
	},
	{
		href: '/auth/sign-up',
		icon: UserPlus,
		labelKey: 'getStarted',
	},
]

const moreMenuItems: NavItem[] = [
	{ href: '/challenges', icon: Target, labelKey: 'challenges' },
	{ href: '/community', icon: Users, labelKey: 'community' },
	{ href: '/cook-together', icon: ChefHat, labelKey: 'cookTogether' },
	{ href: '/messages', icon: MessageCircle, labelKey: 'messages' },
	{ href: '/pantry', icon: Package, labelKey: 'pantry' },
	{ href: '/meal-planner', icon: CalendarDays, labelKey: 'mealPlan' },
	{ href: '/shopping-lists', icon: ShoppingCart, labelKey: 'shopping' },
	{ href: '/settings', icon: Settings, labelKey: 'settings' },
]

export const MobileBottomNav = () => {
	const pathname = usePathname()
	const router = useRouter()
	const [showMore, setShowMore] = useState(false)
	const t = useTranslations('nav')
	const { isAuthenticated } = useAuth()

	// Use different nav items for guests vs authenticated users
	const activeNavItems = isAuthenticated ? navItems : guestNavItems

	const isActive = (href: string) => {
		if (href === '/dashboard') return pathname === '/dashboard'
		return pathname === href || pathname?.startsWith(href + '/')
	}

	// Check if any "more" route is active (highlight More icon)
	const isMoreActive = moreMenuItems.some(
		item => pathname === item.href || pathname?.startsWith(item.href + '/'),
	)

	return (
		<>
			<nav
				className='fixed bottom-0 left-0 right-0 z-sticky flex min-h-16 items-start justify-around border-t border-border-subtle bg-bg-card px-1.5 pb-[calc(6px+env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl md:hidden'
				aria-label={t('ariaMobileNavigation')}
			>
				{activeNavItems.map(item => {
					const Icon = item.icon
					const active = isActive(item.href)
					const label = t(item.labelKey)

					// Special handling for the Create button (center elevated button)
					if (item.isCreate) {
						return (
							<Link
								key={item.href}
								href={item.href}
								className='relative -mt-3 flex max-w-20 flex-1 flex-col items-center justify-center gap-1 self-start'
							>
								<motion.div
									whileHover={ICON_BUTTON_HOVER}
									whileTap={ICON_BUTTON_TAP}
									transition={TRANSITION_SPRING}
									className='grid size-12 place-items-center rounded-full bg-gradient-primary text-white shadow-warm shadow-brand/30'
								>
									<Icon className='size-6' />
								</motion.div>
								<span className='text-xs font-semibold leading-tight text-brand'>
									{label}
								</span>
							</Link>
						)
					}

					return (
						<Link
							key={item.href}
							href={item.href}
							aria-current={active ? 'page' : undefined}
							className={cn(
								'group relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-radius px-2 py-1.5 text-center',
								isAuthenticated && 'max-w-20',
								active ? 'text-brand' : 'text-text-secondary',
							)}
						>
							{/* Active indicator dot */}
							<motion.div
								className='absolute -top-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-brand'
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
										'size-5 transition-all duration-300',
										active && 'drop-shadow-glow',
									)}
								/>
							</motion.div>
							<span className='max-w-full truncate text-xs font-semibold leading-tight'>
								{label}
							</span>
						</Link>
					)
				})}

				{/* More button — only for authenticated users (guests have minimal nav) */}
				{isAuthenticated && (
					<button
						type='button'
						onClick={() => setShowMore(true)}
						className={cn(
							'group relative flex max-w-20 flex-1 flex-col items-center justify-center gap-0.5 rounded-radius px-2 py-1.5 text-center',
							isMoreActive ? 'text-brand' : 'text-text-secondary',
						)}
					>
						<motion.div
							className='absolute -top-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-brand'
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
									'size-5 transition-all duration-300',
									isMoreActive && 'drop-shadow-glow',
								)}
							/>
						</motion.div>
						<span className='text-xs font-semibold leading-tight'>
							{t('more')}
						</span>
					</button>
				)}
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
							className='fixed inset-x-0 bottom-0 z-modal rounded-t-2xl border-t border-border-subtle bg-bg-card pb-[calc(16px+env(safe-area-inset-bottom))] shadow-warm md:hidden'
						>
							{/* Handle */}
							<div className='flex items-center justify-between px-5 py-4'>
								<span className='text-lg font-bold text-text'>{t('more')}</span>
								<button
									type='button'
									onClick={() => setShowMore(false)}
									aria-label={t('ariaCloseMenu')}
									className='grid size-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-bg-elevated hover:text-text focus-visible:ring-2 focus-visible:ring-brand/50'
								>
									<X className='size-5' />
								</button>
							</div>
							{/* Menu items grid - 3 cols on small, 4 on wider */}
							<div className='grid grid-cols-3 gap-2 px-4 sm:grid-cols-4'>
								{moreMenuItems.map(item => {
									const Icon = item.icon
									const active = isActive(item.href)
									return (
										<button
											type='button'
											key={item.href}
											aria-current={active ? 'page' : undefined}
											onClick={() => {
												setShowMore(false)
												router.push(item.href)
											}}
											className={cn(
												'flex flex-col items-center gap-2 rounded-xl p-3 transition-colors focus-visible:ring-2 focus-visible:ring-brand/50',
												active
													? 'bg-brand/10 text-brand'
													: 'text-text-secondary hover:bg-bg-elevated',
											)}
										>
											<Icon className='size-6' />
											<span className='text-xs font-medium'>
												{t(item.labelKey)}
											</span>
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
						type='button'
						key={tab.id}
						onClick={() => onTabChange(tab.id)}
						whileTap={BUTTON_SUBTLE_TAP}
						transition={TRANSITION_SPRING}
						className={cn(
							'flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand/50',
							activeTab === tab.id
								? 'bg-brand text-white'
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
