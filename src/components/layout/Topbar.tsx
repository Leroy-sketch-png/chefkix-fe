'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
	Bell,
	ChefHat,
	Compass,
	Flame,
	Home,
	LogOut,
	Menu,
	MessageSquare,
	PenSquare,
	MessageCircle,
	Search,
	Settings,
	User,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { PATHS } from '@/constants'
import { useAuth } from '@/hooks/useAuth'
import { useUiStore } from '@/store/uiStore'
import { useNotificationStore } from '@/store/notificationStore'
import { getMyConversations } from '@/services/chat'
import { logout as logoutService } from '@/services/auth'
import { logDevError } from '@/lib/dev-log'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Portal } from '@/components/ui/portal'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { StickyHeader } from '@/components/layout/StickyHeader'
import { getHeaderRoutePolicy } from '@/components/layout/topbar-route-policy'
import {
	CommandMenu,
	type CommandMenuGroup,
} from '@/components/ui/command-menu'
import { getModifierSymbol } from '@/hooks/useKeyboardShortcuts'
import {
	BUTTON_SUBTLE_HOVER,
	BUTTON_SUBTLE_TAP,
	ICON_BUTTON_HOVER,
	ICON_BUTTON_TAP,
	TRANSITION_SPRING,
} from '@/lib/motion'

export const Topbar = () => {
	const t = useTranslations('topbar')
	const tCommon = useTranslations('common')
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const router = useRouter()
	const { user, logout } = useAuth()
	const { toggleMessagesDrawer, toggleNotificationsPopup } = useUiStore()
	const { unreadCount, startPolling, stopPolling } = useNotificationStore()

	const [query, setQuery] = useState('')
	const [showUserMenu, setShowUserMenu] = useState(false)
	const [commandOpen, setCommandOpen] = useState(false)
	const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
	const [unreadMessages, setUnreadMessages] = useState(0)
	const avatarRef = useRef<HTMLButtonElement>(null)

	useEscapeKey(showUserMenu, () => setShowUserMenu(false))

	const currentPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
	const guestSignInHref = `${PATHS.AUTH.SIGN_IN}?returnTo=${encodeURIComponent(currentPath)}`
	const brandHref = user ? PATHS.DASHBOARD : PATHS.EXPLORE
	const routePolicy = useMemo(() => getHeaderRoutePolicy(pathname), [pathname])
	const headerActionButtonClass =
		'relative grid size-10 place-items-center rounded-2xl border border-border-subtle bg-bg-card text-text-secondary shadow-card transition-colors hover:border-brand/35 hover:bg-bg-elevated hover:text-brand md:size-11'
	const counterBadgeClass =
		'absolute right-1 top-1 inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-white md:h-5 md:min-w-5 md:px-1.5'
	const modifierSymbol = getModifierSymbol()

	useEffect(() => {
		const handler = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement | null
			const tag = target?.tagName?.toLowerCase()
			const isTextInput =
				tag === 'input' || tag === 'textarea' || target?.isContentEditable
			if (isTextInput) return

			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault()
				setCommandOpen(prev => !prev)
			}
		}

		window.addEventListener('keydown', handler)
		return () => window.removeEventListener('keydown', handler)
	}, [])

	const commandGroups = useMemo<CommandMenuGroup[]>(
		() => [
			{
				heading: tCommon('quickActions'),
				items: [
					{
						id: 'create-post',
						label: tCommon('createPost'),
						icon: <PenSquare className='size-4' />,
						action: () => router.push(PATHS.CREATE_POST),
						shortcut: `${modifierSymbol}N`,
					},
					{
						id: 'start-cooking',
						label: tCommon('startCooking'),
						icon: <ChefHat className='size-4' />,
						action: () => router.push(PATHS.COOK),
						shortcut: 'C',
					},
					{
						id: 'search-recipes',
						label: tCommon('searchRecipes'),
						icon: <Search className='size-4' />,
						action: () => router.push(PATHS.EXPLORE),
						shortcut: '/',
					},
				],
			},
			{
				heading: tCommon('navigate'),
				items: [
					{
						id: 'nav-dashboard',
						label: tCommon('dashboard'),
						icon: <Home className='size-4' />,
						action: () => router.push(PATHS.DASHBOARD),
					},
					{
						id: 'nav-feed',
						label: tCommon('feed'),
						icon: <Flame className='size-4' />,
						action: () => router.push(PATHS.FEED),
					},
					{
						id: 'nav-explore',
						label: tCommon('explore'),
						icon: <Compass className='size-4' />,
						action: () => router.push(PATHS.EXPLORE),
					},
					{
						id: 'nav-messages',
						label: tCommon('messages'),
						icon: <MessageSquare className='size-4' />,
						action: () => router.push(PATHS.MESSAGES),
					},
					{
						id: 'nav-profile',
						label: tCommon('profile'),
						icon: <User className='size-4' />,
						action: () => router.push(PATHS.PROFILE),
					},
					{
						id: 'nav-settings',
						label: tCommon('settings'),
						icon: <Settings className='size-4' />,
						action: () => router.push(PATHS.SETTINGS),
					},
				],
			},
		],
		[router, tCommon],
	)

	useEffect(() => {
		if (user) {
			startPolling()
		} else {
			stopPolling()
		}

		return () => stopPolling()
	}, [startPolling, stopPolling, user])

	useEffect(() => {
		if (!user) return
		let cancelled = false

		const fetchUnreadMessages = async () => {
			try {
				const response = await getMyConversations()
				if (!cancelled && response.success && response.data) {
					const total = response.data.reduce(
						(sum, conv) => sum + (conv.unreadCount || 0),
						0,
					)
					setUnreadMessages(total)
				}
			} catch (error) {
				logDevError('Failed to fetch unread message count:', error)
			}
		}

		fetchUnreadMessages()
		const interval = setInterval(fetchUnreadMessages, 60000)

		return () => {
			cancelled = true
			clearInterval(interval)
		}
	}, [user])

	const handleLogout = useCallback(async () => {
		try {
			await logoutService()
		} catch (error) {
			logDevError('Logout service failed:', error)
		} finally {
			logout()
			router.push(PATHS.AUTH.SIGN_IN)
		}
	}, [logout, router])

	const handleSearchSubmit = useCallback(
		(event: React.FormEvent) => {
			event.preventDefault()
			const trimmed = query.trim()
			if (!trimmed) {
				router.push('/search')
				return
			}
			router.push(`/search?q=${encodeURIComponent(trimmed)}`)
		},
		[query, router],
	)

	const leftSlot = (
		<>
			<Link href={brandHref} className='flex items-center gap-2'>
				<motion.div
					className='flex size-8 items-center justify-center rounded-xl bg-gradient-hero text-white shadow-card md:size-9'
					whileHover={{ rotate: 8 }}
					transition={TRANSITION_SPRING}
				>
					<ChefHat className='size-4 md:size-5' />
				</motion.div>
				<div className='font-display text-lg font-bold leading-none tracking-tight md:text-2xl'>
					<span className='bg-gradient-to-r from-brand to-brand/80 bg-clip-text text-transparent'>
						Chef
					</span>
					<span className='text-text-primary'>kix</span>
				</div>
			</Link>

			{routePolicy.showMobileSearchShortcut && (
				<Link
					href='/search'
					className={cn(headerActionButtonClass, 'md:hidden')}
					aria-label={t('tbSearchLabel')}
				>
					<Search className='size-4' />
				</Link>
			)}
		</>
	)

	const centerSlot = (
		<form
			onSubmit={handleSearchSubmit}
			role='search'
			className='group flex min-w-0 items-center gap-3 rounded-full border border-border-medium bg-bg-input px-3 py-2 shadow-card transition-colors focus-within:border-brand md:px-4'
		>
			<Search className='size-4 shrink-0 text-text-secondary md:size-5' />
			<input
				type='text'
				value={query}
				onChange={event => setQuery(event.target.value)}
				placeholder={t('tbSearch')}
				aria-label={t('tbSearchLabel')}
				className='w-full min-w-0 border-none bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted md:text-base'
			/>
		</form>
	)

	const rightSlot = (
		<>
			<motion.button
				type='button'
				onClick={() => setCommandOpen(true)}
				whileHover={ICON_BUTTON_HOVER}
				whileTap={ICON_BUTTON_TAP}
				transition={TRANSITION_SPRING}
				className={headerActionButtonClass}
				aria-label={tCommon('search')}
				title={`${modifierSymbol}K`}
			>
				<Search className='size-4 md:size-5' />
			</motion.button>

			{!user ? (
				<Link
					href={guestSignInHref}
					className='hidden h-9 items-center rounded-xl border border-border-subtle px-3 text-xs font-semibold text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary md:inline-flex md:h-10 md:px-4 md:text-sm'
				>
					{t('tbSignIn')}
				</Link>
			) : (
				<>
					{routePolicy.showNotificationsButton && (
						<motion.button
							type='button'
							onClick={toggleNotificationsPopup}
							whileHover={ICON_BUTTON_HOVER}
							whileTap={ICON_BUTTON_TAP}
							transition={TRANSITION_SPRING}
							className={cn(
								headerActionButtonClass,
								unreadCount > 0 && 'border-brand/20 bg-brand/6 text-brand',
							)}
							aria-label={t('tbNotifications')}
						>
							<Bell className='size-4 md:size-5' />
							{unreadCount > 0 && (
								<span className={cn(counterBadgeClass, 'bg-brand')}>
									{unreadCount > 99 ? '99+' : unreadCount}
								</span>
							)}
						</motion.button>
					)}

					{routePolicy.showMessagesButton && (
						<motion.button
							type='button'
							onClick={toggleMessagesDrawer}
							whileHover={ICON_BUTTON_HOVER}
							whileTap={ICON_BUTTON_TAP}
							transition={TRANSITION_SPRING}
							className={cn(
								headerActionButtonClass,
								unreadMessages > 0 && 'border-xp/20 bg-xp/8 text-xp',
							)}
							aria-label={t('tbMessages')}
						>
							<MessageCircle className='size-4 md:size-5' />
							{unreadMessages > 0 && (
								<span className={cn(counterBadgeClass, 'bg-xp')}>
									{unreadMessages > 99 ? '99+' : unreadMessages}
								</span>
							)}
						</motion.button>
					)}

					<div className='relative'>
						<motion.button
							type='button'
							ref={avatarRef}
							onClick={() => {
								if (!showUserMenu && avatarRef.current) {
									const rect = avatarRef.current.getBoundingClientRect()
									setMenuPosition({
										top: rect.bottom + 8,
										right: window.innerWidth - rect.right,
									})
								}
								setShowUserMenu(prev => !prev)
							}}
							whileHover={BUTTON_SUBTLE_HOVER}
							whileTap={BUTTON_SUBTLE_TAP}
							transition={TRANSITION_SPRING}
							className='rounded-full focus-visible:ring-2 focus-visible:ring-brand/50'
							aria-label={t('profileMenu')}
							aria-expanded={showUserMenu}
						>
							<Avatar size='xs' className='shadow-card md:hidden'>
								<AvatarImage
									src={user.avatarUrl || '/placeholder-avatar.svg'}
									alt={user.displayName || 'User'}
								/>
								<AvatarFallback>
									{user.displayName
										?.split(' ')
										.map(n => n[0])
										.join('')
										.toUpperCase()
										.slice(0, 2) || 'U'}
								</AvatarFallback>
							</Avatar>
							<Avatar size='sm' className='hidden shadow-card md:flex'>
								<AvatarImage
									src={user.avatarUrl || '/placeholder-avatar.svg'}
									alt={user.displayName || 'User'}
								/>
								<AvatarFallback>
									{user.displayName
										?.split(' ')
										.map(n => n[0])
										.join('')
										.toUpperCase()
										.slice(0, 2) || 'U'}
								</AvatarFallback>
							</Avatar>
						</motion.button>

						{showUserMenu && (
							<Portal>
								<div
									className='fixed inset-0 z-dropdown'
									onClick={() => setShowUserMenu(false)}
								/>
								<div
									className='fixed z-dropdown min-w-48 overflow-hidden rounded-radius border border-border-subtle bg-bg-card shadow-warm'
									style={{
										top: `${menuPosition.top}px`,
										right: `${menuPosition.right}px`,
									}}
								>
									<Link
										href={PATHS.SETTINGS}
										onClick={() => setShowUserMenu(false)}
										className='flex h-11 items-center gap-3 px-4 text-sm text-text-primary transition-colors hover:bg-bg-hover'
									>
										<Settings className='size-4' />
										<span>{t('tbSettings')}</span>
									</Link>
									<button
										type='button'
										onClick={handleLogout}
										className='flex h-11 w-full items-center gap-3 px-4 text-left text-sm text-destructive transition-colors hover:bg-destructive/10'
									>
										<LogOut className='size-4' />
										<span>{t('tbSignOut')}</span>
									</button>
								</div>
							</Portal>
						)}
					</div>
				</>
			)}
		</>
	)

	return (
		<>
			<StickyHeader
				height='h-16 md:h-18'
				left={leftSlot}
				center={routePolicy.showDesktopSearchBar ? centerSlot : undefined}
				right={rightSlot}
				className={cn(
					'relative overflow-hidden',
					'before:pointer-events-none before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-brand/25 before:to-transparent',
				)}
			/>

			<CommandMenu
				open={commandOpen}
				onOpenChange={setCommandOpen}
				groups={commandGroups}
			/>
		</>
	)
}
