'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { PATHS } from '@/constants'
import {
	Bell,
	MessageCircle,
	Search,
	LogOut,
	Settings,
	ChefHat,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUiStore } from '@/store/uiStore'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { logout as logoutService } from '@/services/auth'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getMyConversations } from '@/services/chat'
import { CookingIndicator } from '@/components/cooking/CookingIndicator'
import { TRANSITION_SPRING } from '@/lib/motion'
import { Portal } from '@/components/ui/portal'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { logDevError } from '@/lib/dev-log'
import { autocompleteSearch } from '@/services/search'
import { useNotificationStore } from '@/store/notificationStore'
import Image from 'next/image'

export const Topbar = () => {
	const { user } = useAuth()
	const { toggleMessagesDrawer, toggleNotificationsPopup } = useUiStore()
	const [searchQuery, setSearchQuery] = useState('')
	const [showUserMenu, setShowUserMenu] = useState(false)

	useEscapeKey(showUserMenu, () => setShowUserMenu(false))
	const { unreadCount: unreadNotifications, fetchUnreadCount } = useNotificationStore()
	const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
	const avatarButtonRef = useRef<HTMLButtonElement>(null)
	const [unreadMessages, setUnreadMessages] = useState(0)
	const router = useRouter()
	const { logout } = useAuth()

	// Typeahead state
	const [suggestions, setSuggestions] = useState<{
		recipes: { id: string; title: string; imageUrl: string }[]
		people: {
			id: string
			username: string
			displayName: string
			avatarUrl: string
		}[]
	}>({ recipes: [], people: [] })
	const [showSuggestions, setShowSuggestions] = useState(false)
	const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false)
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const searchFormRef = useRef<HTMLFormElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	useEscapeKey(showSuggestions, () => setShowSuggestions(false))

	// Debounced typeahead search
	const fetchSuggestions = useCallback((q: string) => {
		if (debounceRef.current) clearTimeout(debounceRef.current)
		if (q.length < 2) {
			setSuggestions({ recipes: [], people: [] })
			setShowSuggestions(false)
			return
		}
		debounceRef.current = setTimeout(async () => {
			setIsFetchingSuggestions(true)
			try {
				const res = await autocompleteSearch(q, 'all', 5)
				const recipes =
					res.success && res.data?.recipes?.hits
						? res.data.recipes.hits.map(h => ({
								id: h.document.id,
								title: h.document.title,
								imageUrl: h.document.coverImageUrl || '/placeholder-recipe.svg',
							}))
						: []
				const people =
					res.success && res.data?.users?.hits
						? res.data.users.hits.map(h => ({
								id: h.document.id,
								username: h.document.username,
								displayName:
									h.document.displayName ||
									h.document.firstName ||
									h.document.username,
								avatarUrl: h.document.avatarUrl || '/placeholder-avatar.svg',
							}))
						: []
				setSuggestions({ recipes, people })
				setShowSuggestions(recipes.length > 0 || people.length > 0)
			} catch {
				// Silently fail — typeahead is an enhancement
			} finally {
				setIsFetchingSuggestions(false)
			}
		}, 300)
	}, [])

	// Close suggestions when clicking outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				searchFormRef.current &&
				!searchFormRef.current.contains(e.target as Node)
			) {
				setShowSuggestions(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	// Fetch notification count via store (WebSocket keeps it updated after mount)
	useEffect(() => {
		fetchUnreadCount()
	}, [fetchUnreadCount])

	// Fetch unread message counts on mount and periodically
	useEffect(() => {
		const fetchMessageCounts = async () => {
			try {
				const convResponse = await getMyConversations()
				if (convResponse.success && convResponse.data) {
					const totalUnread = convResponse.data.reduce(
						(sum, conv) => sum + (conv.unreadCount || 0),
						0,
					)
					setUnreadMessages(totalUnread)
				}
			} catch (err) {
				logDevError('Failed to fetch unread message counts:', err)
			}
		}

		fetchMessageCounts()
		const interval = setInterval(fetchMessageCounts, 30000)
		return () => clearInterval(interval)
	}, [])

	const handleLogout = async () => {
		try {
			// Call backend logout to invalidate session/cookies
			await logoutService()
		} catch (error) {
			logDevError('Logout error:', error)
			// Continue with local logout even if backend call fails
		} finally {
			// Always clear local state and redirect
			logout()
			router.push(PATHS.AUTH.SIGN_IN)
		}
	}

	// Calculate XP progress if we have user statistics - with null safety
	const xpProgress =
		user?.statistics?.currentXP != null && user?.statistics?.currentXPGoal
			? (user.statistics.currentXP / user.statistics.currentXPGoal) * 100
			: 0

	return (
		<header
			className='relative flex h-18 w-full flex-shrink-0 items-center justify-center gap-2 border-b border-border-subtle bg-bg-card px-4 md:gap-4 md:px-6'
			role='banner'
		>
			{/* Animated Logo */}
			<Link
				href='/dashboard'
				className='absolute left-4 flex items-center gap-2 md:left-6'
			>
				<motion.div
					className='flex items-center gap-2.5'
					whileHover={{ scale: 1.03 }}
					transition={TRANSITION_SPRING}
				>
					<motion.div
						className='flex size-9 items-center justify-center rounded-xl bg-gradient-hero shadow-md shadow-brand/25'
						whileHover={{ rotate: 10 }}
						transition={TRANSITION_SPRING}
					>
						<ChefHat className='size-5 text-white' />
					</motion.div>
					<div className='font-display text-2xl font-extrabold leading-none tracking-tight'>
						<span className='bg-gradient-to-r from-brand to-brand/80 bg-clip-text text-transparent'>
							Chef
						</span>
						<span className='text-text'>kix</span>
					</div>
				</motion.div>
			</Link>
			{/* Search Bar - constrained max width, with left margin to avoid overlapping the absolute logo */}
			<form
				ref={searchFormRef}
				onSubmit={e => {
					e.preventDefault()
					setShowSuggestions(false)
					const q = searchQuery.trim()
					if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
				}}
				className='group relative ml-20 flex min-w-0 max-w-2xl flex-1 items-center gap-3 rounded-full border-2 border-border-medium bg-bg-input px-3 py-2 shadow-sm transition-all duration-300 focus-within:border-primary focus-within:shadow-lg focus-within:scale-[1.02] md:ml-24 md:px-4 md:py-2.5'
			>
				<Search className='h-5 w-5 shrink-0 text-text-secondary transition-all duration-300 group-focus-within:scale-110 group-focus-within:rotate-12 group-focus-within:text-primary' />
				<input
					ref={inputRef}
					type='text'
					placeholder='Search...'
					value={searchQuery}
					onChange={e => {
						setSearchQuery(e.target.value)
						fetchSuggestions(e.target.value.trim())
					}}
					onFocus={() => {
						if (suggestions.recipes.length > 0 || suggestions.people.length > 0)
							setShowSuggestions(true)
					}}
					className='w-full min-w-0 border-0 bg-transparent text-sm text-text-primary caret-primary outline-none ring-0 placeholder:text-text-muted focus:border-0 focus:ring-0 md:text-base'
				/>
				{/* Typeahead Suggestions Dropdown */}
				{showSuggestions && (
					<div className='absolute left-0 right-0 top-full z-dropdown mt-2 overflow-hidden rounded-2xl border border-border-subtle bg-bg-card shadow-lg'>
						{suggestions.recipes.length > 0 && (
							<div>
								<div className='px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-text-muted'>
									Recipes
								</div>
								{suggestions.recipes.map(r => (
									<button
										key={r.id}
										type='button'
										onClick={() => {
											setShowSuggestions(false)
											setSearchQuery('')
											router.push(`/recipes/${r.id}`)
										}}
										className='flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-bg-elevated'
									>
										<Image
											src={r.imageUrl}
											alt={r.title}
											width={36}
											height={36}
											className='size-9 flex-shrink-0 rounded-lg object-cover'
										/>
										<span className='truncate text-sm font-medium text-text'>
											{r.title}
										</span>
									</button>
								))}
							</div>
						)}
						{suggestions.people.length > 0 && (
							<div>
								<div className='px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-text-muted'>
									People
								</div>
								{suggestions.people.map(p => (
									<button
										key={p.id}
										type='button'
										onClick={() => {
											setShowSuggestions(false)
											setSearchQuery('')
											router.push(`/profile/${p.id}`)
										}}
										className='flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-bg-elevated'
									>
										<Image
											src={p.avatarUrl}
											alt={p.username}
											width={36}
											height={36}
											className='size-9 flex-shrink-0 rounded-full object-cover'
										/>
										<div className='min-w-0'>
											<span className='block truncate text-sm font-medium text-text'>
												{p.displayName}
											</span>
											<span className='block truncate text-xs text-text-muted'>
												@{p.username}
											</span>
										</div>
									</button>
								))}
							</div>
						)}
						{searchQuery.trim().length >= 2 && (
							<button
								type='button'
								onClick={() => {
									setShowSuggestions(false)
									router.push(
										`/search?q=${encodeURIComponent(searchQuery.trim())}`,
									)
								}}
								className='flex w-full items-center gap-2 border-t border-border-subtle px-4 py-3 text-sm font-medium text-brand transition-colors hover:bg-bg-elevated'
							>
								<Search className='size-4' />
								See all results for &quot;{searchQuery.trim()}&quot;
							</button>
						)}
					</div>
				)}
			</form>

			{/* 
				Mode Toggle REMOVED (Steve Jobs Audit 2024-12-20)
				
				The player/creator toggle was purely cosmetic - local state that 
				affected nothing. "A switch that switches nothing is a lie."
				
				If ChefKix needs player vs creator modes in the future, implement
				it properly with different dashboard views and stored preference.
			*/}

			{/* Cooking Indicator - Shows when actively cooking */}
			<CookingIndicator />

			{/* Level Badge - desktop only */}
			{user && (
				<motion.div
					whileHover={{ scale: 1.05 }}
					className='relative hidden overflow-hidden rounded-xl bg-gradient-gold px-4 py-2 text-sm font-bold text-text shadow-md lg:flex lg:items-center lg:gap-2'
				>
					<span className='relative z-10'>
						Lv. {user.statistics?.currentLevel || 1}
					</span>
					{/* XP Progress bar inside */}
					<div className='relative z-10 hidden h-1.5 w-16 overflow-hidden rounded-full bg-text/10 xl:block'>
						<motion.div
							className='h-full rounded-full bg-text/25'
							initial={{ width: 0 }}
							animate={{ width: `${xpProgress}%` }}
							transition={{ duration: 1, ease: 'easeOut' }}
						/>
					</div>
					<div className='pointer-events-none absolute inset-0 animate-shine bg-gradient-to-r from-transparent via-white/30 to-transparent' />
				</motion.div>
			)}

			{/* Avatar with dropdown - visible on ALL screen sizes (Settings + Sign Out access on mobile) */}
			{user && (
				<div className='relative'>
					<motion.button
						ref={avatarButtonRef}
						onClick={() => {
							if (!showUserMenu && avatarButtonRef.current) {
								const rect = avatarButtonRef.current.getBoundingClientRect()
								setMenuPosition({
									top: rect.bottom + 8,
									right: window.innerWidth - rect.right,
								})
							}
							setShowUserMenu(!showUserMenu)
						}}
						whileHover={{ scale: 1.05, y: -2 }}
						whileTap={{ scale: 0.98 }}
						transition={TRANSITION_SPRING}
						className='group relative cursor-pointer'
					>
						{/* XP Progress Ring - hidden on mobile for compactness */}
						<svg
							className='absolute -inset-1 hidden size-14 md:block'
							viewBox='0 0 56 56'
						>
							<circle
								cx='28'
								cy='28'
								r='26'
								fill='none'
								stroke='currentColor'
								strokeWidth='3'
								className='text-border-subtle'
							/>
							<motion.circle
								cx='28'
								cy='28'
								r='26'
								fill='none'
								stroke='url(#xpGradient)'
								strokeWidth='3'
								strokeLinecap='round'
								strokeDasharray={`${2 * Math.PI * 26}`}
								initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
								animate={{
									strokeDashoffset: 2 * Math.PI * 26 * (1 - xpProgress / 100),
								}}
								transition={{ duration: 1.5, ease: 'easeOut' }}
								style={{
									transform: 'rotate(-90deg)',
									transformOrigin: 'center',
								}}
							/>
							<defs>
								<linearGradient
									id='xpGradient'
									x1='0%'
									y1='0%'
									x2='100%'
									y2='100%'
								>
									<stop offset='0%' stopColor='#8b5cf6' />
									<stop offset='100%' stopColor='#a855f7' />
								</linearGradient>
							</defs>
						</svg>
						{/* Smaller avatar on mobile, larger on desktop */}
						<Avatar size='lg' className='hidden shadow-lg md:flex'>
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
						<Avatar size='sm' className='shadow-md md:hidden'>
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

					{/* Dropdown Menu - Portaled to escape overflow:hidden clipping */}
					{showUserMenu && (
						<Portal>
							{/* Click outside to close */}
							<div
								className='fixed inset-0 z-dropdown'
								onClick={() => setShowUserMenu(false)}
							/>
							<div
								className='fixed z-dropdown w-48 overflow-hidden rounded-lg border border-border-subtle bg-bg-card shadow-lg animate-in fade-in-0 zoom-in-95'
								style={{
									top: `${menuPosition.top}px`,
									right: `${menuPosition.right}px`,
								}}
							>
								<Link
									href={PATHS.SETTINGS}
									onClick={() => setShowUserMenu(false)}
									className='flex h-11 items-center gap-3 rounded-t-lg px-4 text-sm text-text-primary transition-colors hover:bg-bg-hover'
								>
									<Settings className='size-4' />
									<span>Settings</span>
								</Link>
								<button
									onClick={handleLogout}
									className='flex h-11 w-full items-center gap-3 rounded-b-lg px-4 text-left text-sm text-destructive transition-colors hover:bg-destructive/10'
								>
									<LogOut className='size-4' />
									<span>Sign Out</span>
								</button>
							</div>
						</Portal>
					)}
				</div>
			)}
			{/* Communication Icons */}
			<div className='flex gap-2 md:gap-3'>
				<motion.button
					onClick={toggleNotificationsPopup}
					whileHover={{ scale: 1.1 }}
					whileTap={{ scale: 0.95 }}
					className='relative grid size-11 cursor-pointer place-items-center rounded-xl text-text-secondary transition-colors hover:bg-bg-elevated hover:text-brand'
					aria-label='Notifications'
				>
					<Bell className='size-5' />
					{unreadNotifications > 0 && (
						<motion.span
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={TRANSITION_SPRING}
							className='absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-brand px-1.5 py-0.5 text-xs font-bold text-white shadow-sm'
						>
							{unreadNotifications > 99 ? '99+' : unreadNotifications}
						</motion.span>
					)}
				</motion.button>
				<motion.button
					onClick={toggleMessagesDrawer}
					whileHover={{ scale: 1.1 }}
					whileTap={{ scale: 0.95 }}
					className='relative grid size-11 cursor-pointer place-items-center rounded-xl text-text-secondary transition-colors hover:bg-bg-elevated hover:text-xp'
					aria-label='Messages'
				>
					<MessageCircle className='size-5' />
					{unreadMessages > 0 && (
						<motion.span
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={TRANSITION_SPRING}
							className='absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-xp px-1.5 py-0.5 text-xs font-bold text-white shadow-sm'
						>
							{unreadMessages > 99 ? '99+' : unreadMessages}
						</motion.span>
					)}
				</motion.button>
			</div>
		</header>
	)
}
