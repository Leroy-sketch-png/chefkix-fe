'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Home,
	Compass,
	PlusSquare,
	User,
	Menu,
	Search,
	Target,
	Users,
	Trophy,
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
import { PATHS, isUserProfileRoutePath } from '@/constants'
import { Portal } from '@/components/ui/portal'
import { useTranslations } from '@/i18n/hooks'
import { useAuth } from '@/hooks/useAuth'

interface NavItem {
	href: string
	icon: React.ComponentType<{ className?: string }>
	labelKey: string
	isCreate?: boolean
	isGetStarted?: boolean
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
		href: PATHS.LEADERBOARD,
		icon: Trophy,
		labelKey: 'leaderboard',
	},
	{
		href: PATHS.AUTH.SIGN_UP,
		icon: UserPlus,
		labelKey: 'getStarted',
		isGetStarted: true,
	},
]

const moreMenuItems: NavItem[] = [
	{ href: '/challenges', icon: Target, labelKey: 'challenges' },
	{ href: '/community', icon: Users, labelKey: 'community' },
	{ href: PATHS.LEADERBOARD, icon: Trophy, labelKey: 'leaderboard' },
	{ href: '/cook-together', icon: ChefHat, labelKey: 'cookTogether' },
	{ href: '/messages', icon: MessageCircle, labelKey: 'messages' },
	{ href: '/pantry', icon: Package, labelKey: 'pantry' },
	{ href: '/meal-planner', icon: CalendarDays, labelKey: 'mealPlan' },
	{ href: '/shopping-lists', icon: ShoppingCart, labelKey: 'shopping' },
	{ href: '/settings', icon: Settings, labelKey: 'settings' },
]

export const MobileBottomNav = () => {
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const router = useRouter()
	const [showMore, setShowMore] = useState(false)
	const [drawerQuery, setDrawerQuery] = useState('')
	const t = useTranslations('nav')
	const { isAuthenticated } = useAuth()
	const currentPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
	const guestSignUpHref = `${PATHS.AUTH.SIGN_UP}?returnTo=${encodeURIComponent(currentPath)}`

	// Use different nav items for guests vs authenticated users
	const activeNavItems = isAuthenticated ? navItems : guestNavItems

	const isActive = (href: string) => {
		if (href === '/dashboard') return pathname === '/dashboard'
		if (href === '/explore') {
			return (
				pathname === '/explore' ||
				pathname?.startsWith('/explore/') ||
				pathname === '/search' ||
				pathname?.startsWith('/search/')
			)
		}
		if (href === '/profile') {
			return (
				pathname === href ||
				pathname?.startsWith(href + '/') ||
				isUserProfileRoutePath(pathname)
			)
		}
		return pathname === href || pathname?.startsWith(href + '/')
	}

	// Check if any "more" route is active (highlight More icon)
	const isMoreActive = moreMenuItems.some(
		item => pathname === item.href || pathname?.startsWith(item.href + '/'),
	)

	const groupedMoreMenu = [
		{
			headingKey: 'moreGroupSocial',
			items: moreMenuItems.filter(item =>
				['/community', '/challenges', PATHS.LEADERBOARD, '/messages'].includes(
					item.href,
				),
			),
		},
		{
			headingKey: 'moreGroupCooking',
			items: moreMenuItems.filter(item =>
				[
					'/cook-together',
					'/pantry',
					'/meal-planner',
					'/shopping-lists',
				].includes(item.href),
			),
		},
		{
			headingKey: 'moreGroupAccount',
			items: moreMenuItems.filter(item => ['/settings'].includes(item.href)),
		},
	]

	const normalizedQuery = drawerQuery.trim().toLowerCase()
	const filteredGroupedMenu = groupedMoreMenu
		.map(group => ({
			...group,
			items: group.items.filter(item => {
				if (!normalizedQuery) return true
				return t(item.labelKey).toLowerCase().includes(normalizedQuery)
			}),
		}))
		.filter(group => group.items.length > 0)

	return (
		<>
			<nav
				className='fixed bottom-0 left-0 right-0 z-sticky flex min-h-16 items-start justify-around border-t border-border-subtle bg-bg-card/95 px-2 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden'
				aria-label={t('ariaMobileNavigation')}
			>
				{activeNavItems.map(item => {
					const Icon = item.icon
					const href =
						!isAuthenticated && item.href === PATHS.AUTH.SIGN_UP
							? guestSignUpHref
							: item.href
					const active = isActive(item.href)
					const label = t(item.labelKey)

					// Special handling for the Create button (center elevated button)
					if (item.isCreate) {
						return (
							<Link
								key={item.href}
								href={href}
								className='relative -mt-1.5 flex max-w-20 flex-1 flex-col items-center justify-center gap-1 self-start'
							>
								<motion.div
									whileHover={ICON_BUTTON_HOVER}
									whileTap={ICON_BUTTON_TAP}
									transition={TRANSITION_SPRING}
									className='grid size-11 place-items-center rounded-[1.35rem] border border-brand/20 bg-gradient-primary text-white shadow-card ring-1 ring-brand/10'
								>
									<Icon className='size-5' />
								</motion.div>
								<span className='text-[11px] font-semibold leading-tight text-text-secondary'>
									{label}
								</span>
							</Link>
						)
					}

					// Special handling for the Get Started CTA (guest conversion button)
					if (item.isGetStarted) {
						return (
							<Link
								key={item.href}
								href={href}
								className='relative -mt-1 flex flex-1 items-center justify-center self-start'
							>
								<motion.div
									whileHover={ICON_BUTTON_HOVER}
									whileTap={ICON_BUTTON_TAP}
									transition={TRANSITION_SPRING}
									className='flex min-h-10 items-center gap-1.5 rounded-2xl border border-brand/20 bg-gradient-primary px-3 py-2 text-white shadow-card ring-1 ring-brand/10'
								>
									<Icon className='size-3.5' />
									<span className='text-[11px] font-semibold'>{label}</span>
								</motion.div>
							</Link>
						)
					}

					return (
						<Link
							key={item.href}
							href={href}
							aria-current={active ? 'page' : undefined}
							className={cn(
								'group relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-center transition-all duration-200',
								isAuthenticated && 'max-w-20',
								active
									? 'bg-brand/10 text-brand shadow-[0_2px_10px_rgba(255,90,54,0.18)]'
									: 'text-text-secondary hover:bg-bg-elevated/70',
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
						onClick={() => {
							setDrawerQuery('')
							setShowMore(true)
						}}
						className={cn(
							'group relative flex max-w-20 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-center transition-all duration-200',
							isMoreActive
								? 'bg-brand/10 text-brand shadow-[0_2px_10px_rgba(255,90,54,0.18)]'
								: 'text-text-secondary hover:bg-bg-elevated/70',
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
							className='relative'
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
							className='fixed inset-x-0 bottom-0 z-modal overflow-hidden rounded-t-3xl border-t border-border-subtle/80 bg-gradient-to-b from-bg-card via-bg-card to-bg-elevated/70 pb-[calc(16px+env(safe-area-inset-bottom))] shadow-warm ring-1 ring-white/10 backdrop-blur-xl md:hidden'
						>
							<div className='pointer-events-none absolute -left-8 -top-16 size-28 rounded-full bg-brand/10 blur-3xl' />
							<div className='pointer-events-none absolute -right-8 -bottom-14 size-28 rounded-full bg-xp/10 blur-3xl' />
							{/* Handle */}
							<div className='relative flex items-center justify-between px-5 py-4'>
								<span className='text-lg font-bold text-text-primary'>
									{t('more')}
								</span>
								<button
									type='button'
									onClick={() => setShowMore(false)}
									aria-label={t('ariaCloseMenu')}
									className='grid size-8 place-items-center rounded-xl text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary focus-visible:ring-2 focus-visible:ring-brand/50'
								>
									<X className='size-5' />
								</button>
							</div>
							<div className='px-4 pb-3'>
								<div className='relative'>
									<Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted' />
									<input
										type='text'
										value={drawerQuery}
										onChange={event => setDrawerQuery(event.target.value)}
										placeholder={t('moreQuickJumpPlaceholder')}
										className='h-10 w-full rounded-xl border border-border-medium bg-bg-elevated pl-9 pr-3 text-sm text-text-primary outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/30'
									/>
								</div>
							</div>
							<div className='relative max-h-[60vh] space-y-4 overflow-y-auto px-4'>
								{filteredGroupedMenu.length === 0 && (
									<div className='rounded-xl border border-border-subtle bg-bg-elevated/60 p-3 text-sm text-text-muted'>
										{t('moreNoMatches')}
									</div>
								)}
								{filteredGroupedMenu.map(group => (
									<section key={group.headingKey}>
										<p className='mb-2 text-xs font-bold uppercase tracking-[0.14em] text-text-muted'>
											{t(group.headingKey)}
										</p>
										<div className='grid grid-cols-3 gap-2 sm:grid-cols-4'>
											{group.items.map(item => {
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
															'flex flex-col items-center gap-2 rounded-xl border border-transparent p-3 transition-all focus-visible:ring-2 focus-visible:ring-brand/50',
															active
																? 'border-brand/20 bg-brand/10 text-brand shadow-card'
																: 'text-text-secondary hover:border-border-subtle hover:bg-bg-elevated/70',
														)}
													>
														<Icon className='size-5' />
														<span className='text-xs font-medium'>
															{t(item.labelKey)}
														</span>
													</button>
												)
											})}
										</div>
									</section>
								))}
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
