'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Home,
	Compass,
	Target,
	PlusSquare,
	Users,
	Trophy,
	ChefHat,
	MessageCircle,
	Settings,
	User,
	Bell,
	Package,
	CalendarDays,
	ShoppingCart,
	Shield,
	MoreHorizontal,
	FolderHeart,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { PATHS, isUserProfileRoutePath } from '@/constants'
import {
	TRANSITION_SPRING,
	ICON_BUTTON_HOVER,
	ICON_BUTTON_TAP,
} from '@/lib/motion'
import type { LucideIcon } from 'lucide-react'
import { useNotificationStore } from '@/store/notificationStore'
import { useTranslations } from '@/i18n/hooks'
import { cn } from '@/lib/utils'

interface NavItem {
	href: string | ((userId?: string) => string)
	icon: LucideIcon
	labelKey: string
	showBadge?: boolean // Whether this item can show a notification badge
	requiresAuth?: boolean // True if this item needs authentication
}

// Primary nav: the 7 items users need most (serves 80% scrollers + 15% cooks)
const primaryNavItems: NavItem[] = [
	{ href: '/dashboard', icon: Home, labelKey: 'home', requiresAuth: true },
	{ href: '/explore', icon: Compass, labelKey: 'explore' },
	{ href: '/create', icon: PlusSquare, labelKey: 'create', requiresAuth: true },
	{
		href: '/messages',
		icon: MessageCircle,
		labelKey: 'messages',
		requiresAuth: true,
	},
	{
		href: '/notifications',
		icon: Bell,
		labelKey: 'notifications',
		showBadge: true,
		requiresAuth: true,
	},
	{ href: '/profile', icon: User, labelKey: 'profile', requiresAuth: true },
]

const guestPrimaryNavItems: NavItem[] = [
	{ href: '/explore', icon: Compass, labelKey: 'explore' },
	{ href: '/community', icon: Users, labelKey: 'community' },
	{ href: PATHS.LEADERBOARD, icon: Trophy, labelKey: 'leaderboard' },
]

// Secondary nav: kitchen tools, social features, settings (under "More")
const secondaryNavItems: NavItem[] = [
	{
		href: '/challenges',
		icon: Target,
		labelKey: 'challenges',
		requiresAuth: true,
	},
	{ href: '/community', icon: Users, labelKey: 'community' },
	{ href: PATHS.LEADERBOARD, icon: Trophy, labelKey: 'leaderboard' },
	{
		href: '/cook-together',
		icon: ChefHat,
		labelKey: 'cookTogether',
		requiresAuth: true,
	},
	{ href: '/pantry', icon: Package, labelKey: 'pantry', requiresAuth: true },
	{
		href: '/meal-planner',
		icon: CalendarDays,
		labelKey: 'mealPlan',
		requiresAuth: true,
	},
	{
		href: '/shopping-lists',
		icon: ShoppingCart,
		labelKey: 'shopping',
		requiresAuth: true,
	},
	{
		href: '/collections',
		icon: FolderHeart,
		labelKey: 'collections',
		requiresAuth: true,
	},
	{
		href: '/settings',
		icon: Settings,
		labelKey: 'settings',
		requiresAuth: true,
	},
]

const adminNavItem: NavItem = {
	href: '/admin',
	icon: Shield,
	labelKey: 'admin',
}

export const LeftSidebar = () => {
	const pathname = usePathname()
	const { user, isAuthenticated } = useAuth()
	const { unreadCount, startPolling, stopPolling } = useNotificationStore()
	const t = useTranslations('nav')

	// Check if any secondary route is active (auto-expand "More" when on a secondary page)
	const isSecondaryActive = useMemo(() => {
		if (!isAuthenticated) {
			return false
		}

		const allSecondary = [...secondaryNavItems]
		if (user?.accountType === 'admin') allSecondary.push(adminNavItem)
		return allSecondary.some(item => {
			const href =
				typeof item.href === 'function' ? item.href(user?.userId) : item.href
			return pathname.startsWith(href)
		})
	}, [pathname, user?.accountType, user?.userId, isAuthenticated])

	// Initialize showMore based on whether a secondary route is already active (avoids layout shift)
	const [showMore, setShowMore] = useState(isSecondaryActive)

	// Filter nav items based on auth state — guests only see public routes
	const visiblePrimaryItems = useMemo(
		() => (isAuthenticated ? primaryNavItems : guestPrimaryNavItems),
		[isAuthenticated],
	)

	// Auto-expand when navigating to a secondary route
	useEffect(() => {
		if (isSecondaryActive) setShowMore(true)
	}, [isSecondaryActive])

	// Build the secondary items list (including admin if applicable), filtered for auth
	const secondaryItems = useMemo(() => {
		if (!isAuthenticated) {
			return []
		}

		let items = [...secondaryNavItems]
		if (user?.accountType === 'admin') items.push(adminNavItem)
		return items
	}, [user?.accountType, isAuthenticated])

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
		if (href === '/profile') {
			return pathname.startsWith(href) || isUserProfileRoutePath(pathname)
		}
		return pathname.startsWith(href)
	}

	const renderNavItem = (item: NavItem) => {
		const href = getHref(item)
		const active = isActive(item)
		const Icon = item.icon
		const label = t(item.labelKey)
		return (
			<Link
				key={item.labelKey}
				href={href}
				className='group relative flex h-11 w-full items-center gap-2 rounded-xl px-3 text-sm font-semibold leading-none text-text-secondary transition-all duration-300 hover:text-text-primary data-[active=true]:text-brand'
				data-active={active}
				aria-current={active ? 'page' : undefined}
				title={label}
			>
				{/* Pill background on active/hover */}
				<motion.div
					className='pointer-events-none absolute inset-0 rounded-xl'
					initial={false}
					animate={{
						backgroundColor: active
							? 'rgba(255,90,54,0.12)'
							: 'rgba(255,90,54,0)',
					}}
					transition={{ duration: 0.25 }}
				/>
				{/* Left accent bar */}
				<motion.div
					className='absolute left-0 top-1/2 w-0.5 -translate-y-1/2 rounded-r bg-brand'
					initial={false}
					animate={{ height: active ? '55%' : '0%' }}
					transition={TRANSITION_SPRING}
				/>
				{/* Glow halo behind icon on active */}
				{active && (
					<div className='pointer-events-none absolute inset-x-2 top-1 h-7 rounded-xl bg-brand/8 blur-md' />
				)}
				{/* Icon */}
				<motion.div
					whileHover={{ ...ICON_BUTTON_HOVER, scale: 1.15 }}
					whileTap={ICON_BUTTON_TAP}
					transition={TRANSITION_SPRING}
					className='relative grid size-5 place-items-center'
				>
					<Icon
						className={cn(
							'size-4.5 transition-all duration-300',
							active && 'drop-shadow-[0_0_6px_rgba(255,90,54,0.5)]',
						)}
					/>
					{item.showBadge && unreadCount > 0 && (
						<span className='absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-brand text-2xs font-bold text-white shadow-[0_2px_6px_rgba(255,90,54,0.5)]'>
							{unreadCount > 9 ? '9+' : unreadCount}
						</span>
					)}
				</motion.div>
				<div className='min-w-0 truncate text-left text-[13px] leading-none'>
					{label}
				</div>
			</Link>
		)
	}

	return (
		<nav
			className='relative hidden min-h-0 overflow-hidden bg-bg-card/88 px-3 py-6 backdrop-blur-xl md:flex md:w-40 md:flex-col md:items-center md:gap-4'
			aria-label={t('ariaMainNavigation')}
		>
			{/* Ambient orbs */}
			<div className='pointer-events-none absolute -left-8 -top-16 size-32 rounded-full bg-brand/8 blur-3xl' />
			<div className='pointer-events-none absolute -bottom-12 -right-8 size-28 rounded-full bg-xp/8 blur-3xl' />

			{/* Gradient right border line */}
			<div className='pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-border-subtle to-transparent' />

			{/* Top sheen */}
			<div className='pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white/20 to-transparent dark:from-white/5' />

			{/* ChefHat brand mark */}
			<motion.div
				className='relative z-10 mb-2 flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand/70 shadow-[0_4px_12px_rgba(255,90,54,0.35)]'
				whileHover={{ scale: 1.08 }}
				transition={TRANSITION_SPRING}
			>
				<ChefHat className='size-5 text-white' />
			</motion.div>

			<div className='relative z-10 flex min-h-0 w-full flex-1 flex-col items-center gap-1 overflow-y-auto overscroll-contain pb-2'>
				{/* Primary navigation — filtered for auth state */}
				{visiblePrimaryItems.map(renderNavItem)}

				{/* More toggle — only show if there are secondary items */}
				{secondaryItems.length > 0 && (
					<button
						type='button'
						onClick={() => setShowMore(prev => !prev)}
						className='group relative flex h-11 w-full items-center gap-2 rounded-xl px-3 text-sm font-semibold leading-none text-text-secondary transition-all duration-300 hover:text-text-primary data-[active=true]:text-brand'
						title={showMore ? t('showLess') : t('more')}
						aria-expanded={showMore}
						data-active={showMore}
					>
						<motion.div
							className='pointer-events-none absolute inset-0 rounded-xl'
							initial={false}
							animate={{
								backgroundColor: showMore
									? 'rgba(255,90,54,0.12)'
									: 'rgba(255,90,54,0)',
							}}
							transition={{ duration: 0.25 }}
						/>
						<motion.div
							className='absolute left-0 top-1/2 w-0.5 -translate-y-1/2 rounded-r bg-brand'
							initial={false}
							animate={{ height: showMore ? '55%' : '0%' }}
							transition={TRANSITION_SPRING}
						/>
						<motion.div
							whileHover={{ ...ICON_BUTTON_HOVER, scale: 1.15 }}
							whileTap={ICON_BUTTON_TAP}
							transition={TRANSITION_SPRING}
							className='grid size-5 place-items-center'
						>
							<MoreHorizontal
								className={cn(
									'size-4.5 transition-all duration-300',
									showMore && 'drop-shadow-[0_0_6px_rgba(255,90,54,0.5)]',
								)}
							/>
						</motion.div>
						<div className='text-[13px] leading-none'>
							{showMore ? t('less') : t('more')}
						</div>
					</button>
				)}

				{/* Secondary navigation (collapsible) */}
				<AnimatePresence>
					{showMore && secondaryItems.length > 0 && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: 'auto' }}
							exit={{ opacity: 0, height: 0 }}
							transition={TRANSITION_SPRING}
							className='flex w-full flex-col items-center gap-1 overflow-hidden'
						>
							<div className='my-1 mx-auto h-px w-8 bg-gradient-to-r from-transparent via-border-subtle to-transparent' />
							{secondaryItems.map(renderNavItem)}
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Guest CTA intentionally omitted here to avoid competing with topbar + right-rail conversion surfaces */}
		</nav>
	)
}
