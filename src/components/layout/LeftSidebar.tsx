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
import {
	TRANSITION_SPRING,
	ICON_BUTTON_HOVER,
	ICON_BUTTON_TAP,
} from '@/lib/motion'
import type { LucideIcon } from 'lucide-react'
import { useNotificationStore } from '@/store/notificationStore'
import { useTranslations } from '@/i18n/hooks'

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
		labelKey: 'notifs',
		showBadge: true,
		requiresAuth: true,
	},
	{ href: '/profile', icon: User, labelKey: 'profile', requiresAuth: true },
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
	const [showMore, setShowMore] = useState(false)
	const t = useTranslations('nav')

	// Filter nav items based on auth state — guests only see public routes
	const visiblePrimaryItems = useMemo(
		() =>
			isAuthenticated
				? primaryNavItems
				: primaryNavItems.filter(item => !item.requiresAuth),
		[isAuthenticated],
	)

	// Check if any secondary route is active (auto-expand "More" when on a secondary page)
	const isSecondaryActive = useMemo(() => {
		const allSecondary = [...secondaryNavItems]
		if (user?.accountType === 'admin') allSecondary.push(adminNavItem)
		return allSecondary.some(item => {
			const href =
				typeof item.href === 'function' ? item.href(user?.userId) : item.href
			return pathname.startsWith(href)
		})
	}, [pathname, user?.accountType, user?.userId])

	// Auto-expand when on a secondary route
	useEffect(() => {
		if (isSecondaryActive) setShowMore(true)
	}, [isSecondaryActive])

	// Build the secondary items list (including admin if applicable), filtered for auth
	const secondaryItems = useMemo(() => {
		let items = [...secondaryNavItems]
		if (user?.accountType === 'admin') items.push(adminNavItem)
		if (!isAuthenticated) items = items.filter(item => !item.requiresAuth)
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
				className='group relative flex h-11 w-full flex-col items-center justify-center gap-1 rounded-radius px-1.5 text-xs font-semibold uppercase leading-tight tracking-wide text-text-secondary transition-colors duration-300 hover:text-text-primary data-[active=true]:text-brand'
				data-active={active}
				aria-current={active ? 'page' : undefined}
				title={label}
			>
				{/* Active indicator bar */}
				<motion.div
					className='absolute left-0 top-1/2 w-0.5 -translate-y-1/2 rounded-r-sm bg-brand'
					initial={false}
					animate={{
						height: active ? '70%' : '0%',
					}}
					transition={TRANSITION_SPRING}
				/>
				{/* Background glow on active */}
				<motion.div
					className='absolute inset-0 rounded-radius bg-gradient-to-r from-brand/10 to-transparent opacity-0'
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
					}}
					whileTap={ICON_BUTTON_TAP}
					transition={TRANSITION_SPRING}
					className='relative'
				>
					<Icon className='size-6 transition-all duration-300' />
					{/* Unread badge for notifications */}
					{item.showBadge && unreadCount > 0 && (
						<span className='absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-brand text-2xs font-bold text-white'>
							{unreadCount > 9 ? '9+' : unreadCount}
						</span>
					)}
				</motion.div>
				<div>{label}</div>
			</Link>
		)
	}

	return (
		<nav
			className='hidden border-r border-border-subtle bg-bg-card px-3 py-6 md:flex md:w-nav md:flex-col md:items-center md:gap-4'
			aria-label={t('ariaMainNavigation')}
		>
			{/* Primary navigation — filtered for auth state */}
			{visiblePrimaryItems.map(renderNavItem)}

			{/* More toggle — only show if there are secondary items */}
			{secondaryItems.length > 0 && (
				<button
					type='button'
					onClick={() => setShowMore(prev => !prev)}
					className='group relative flex h-11 w-full flex-col items-center justify-center gap-1 rounded-radius px-1.5 text-xs font-semibold uppercase leading-tight tracking-wide text-text-secondary transition-colors duration-300 hover:text-text-primary'
					title={showMore ? t('showLess') : t('more')}
					aria-expanded={showMore}
				>
					<motion.div
						whileHover={{
							...ICON_BUTTON_HOVER,
							scale: 1.15,
						}}
						whileTap={ICON_BUTTON_TAP}
						transition={TRANSITION_SPRING}
					>
						<MoreHorizontal className='size-6' />
					</motion.div>
					<div>{showMore ? t('less') : t('more')}</div>
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
						className='flex w-full flex-col items-center gap-4 overflow-hidden'
					>
						<div className='mx-auto h-px w-8 bg-border-subtle' />
						{secondaryItems.map(renderNavItem)}
					</motion.div>
				)}
			</AnimatePresence>

			{/* Guest CTA — sign in / get started at the bottom of sidebar */}
			{!isAuthenticated && (
				<div className='mt-auto flex w-full flex-col items-center gap-2 pt-4'>
					<div className='mx-auto mb-2 h-px w-8 bg-border-subtle' />
					<Link
						href='/auth/sign-in'
						className='flex h-9 w-full items-center justify-center rounded-radius text-xs font-semibold text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text'
					>
						{t('signIn')}
					</Link>
					<Link
						href='/auth/sign-up'
						className='flex h-9 w-full items-center justify-center rounded-radius bg-brand text-xs font-bold text-white shadow-card transition-all hover:shadow-warm'
					>
						{t('getStarted')}
					</Link>
				</div>
			)}
		</nav>
	)
}
