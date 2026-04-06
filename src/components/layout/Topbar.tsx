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
	Clock,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTranslations } from 'next-intl'
import { useUiStore } from '@/store/uiStore'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { logout as logoutService } from '@/services/auth'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getMyConversations } from '@/services/chat'
import { CookingIndicator } from '@/components/cooking/CookingIndicator'
import { TRANSITION_SPRING, BELL_SHAKE, BUTTON_SUBTLE_HOVER, BUTTON_SUBTLE_TAP, ICON_BUTTON_HOVER, ICON_BUTTON_TAP, DURATION_S } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { Portal } from '@/components/ui/portal'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { logDevError } from '@/lib/dev-log'
import { toast } from 'sonner'
import { autocompleteSearch } from '@/services/search'
import { useNotificationStore } from '@/store/notificationStore'
import Image from 'next/image'
import { getRecentSearches, addRecentSearch } from '@/lib/recentSearches'

export const Topbar = () => {
	const { user } = useAuth()
	const t = useTranslations('topbar')
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
	const [isSearching, setIsSearching] = useState(false)
	const [highlightIndex, setHighlightIndex] = useState(-1)
	const [recentSearches, setRecentSearches] = useState<string[]>([])
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const searchFormRef = useRef<HTMLFormElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)
	const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })

	useEscapeKey(showSuggestions, () => setShowSuggestions(false))

	// Debounced typeahead search
	const fetchSuggestions = useCallback((q: string) => {
		if (debounceRef.current) clearTimeout(debounceRef.current)
		if (q.length < 2) {
			setSuggestions({ recipes: [], people: [] })
			setIsSearching(false)
			// Show recent searches when query is short
			return
		}
		setIsSearching(true)
		debounceRef.current = setTimeout(async () => {
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
				setHighlightIndex(-1)
				setShowSuggestions(true)
			} catch {
				// Silently fail — typeahead is an enhancement
			} finally {
				setIsSearching(false)
			}
		}, 300)
	}, [])

	// Update dropdown position when suggestions show
	const updateDropdownPosition = useCallback(() => {
		if (searchFormRef.current) {
			const rect = searchFormRef.current.getBoundingClientRect()
			setDropdownPosition({
				top: rect.bottom + 8,
				left: rect.left,
				width: rect.width,
			})
		}
	}, [])

	// Close suggestions when clicking outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				searchFormRef.current &&
				!searchFormRef.current.contains(e.target as Node)
			) {
				// Also check if click is inside the portaled dropdown
				const dropdown = document.getElementById('search-suggestions-dropdown')
				if (dropdown && dropdown.contains(e.target as Node)) return
				setShowSuggestions(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	// Build flat list of selectable items for keyboard navigation
	type SuggestionItem =
		| { type: 'recent'; value: string }
		| { type: 'recipe'; id: string; title: string; imageUrl: string }
		| { type: 'person'; id: string; username: string; displayName: string; avatarUrl: string }
		| { type: 'seeAll' }

	const flatItems: SuggestionItem[] = (() => {
		const items: SuggestionItem[] = []
		const q = searchQuery.trim()
		if (q.length < 2) {
			// Show recent searches
			for (const term of recentSearches) {
				items.push({ type: 'recent', value: term })
			}
		} else {
			for (const r of suggestions.recipes) {
				items.push({ type: 'recipe', ...r })
			}
			for (const p of suggestions.people) {
				items.push({ type: 'person', ...p })
			}
			if (q.length >= 2) {
				items.push({ type: 'seeAll' })
			}
		}
		return items
	})()

	const selectItem = useCallback(
		(item: SuggestionItem) => {
			setShowSuggestions(false)
			switch (item.type) {
				case 'recent':
					setSearchQuery(item.value)
					addRecentSearch(item.value)
					router.push(`/search?q=${encodeURIComponent(item.value)}`)
					break
				case 'recipe':
					setSearchQuery('')
					addRecentSearch(item.title)
					router.push(`/recipes/${item.id}`)
					break
				case 'person':
					setSearchQuery('')
					addRecentSearch(item.displayName)
					router.push(`/profile/${item.id}`)
					break
				case 'seeAll':
					addRecentSearch(searchQuery.trim())
					router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
					break
			}
			setRecentSearches(getRecentSearches())
		},
		[router, searchQuery],
	)

	const handleSearchKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (!showSuggestions || flatItems.length === 0) return
			if (e.key === 'ArrowDown') {
				e.preventDefault()
				setHighlightIndex(i => (i + 1) % flatItems.length)
			} else if (e.key === 'ArrowUp') {
				e.preventDefault()
				setHighlightIndex(i => (i <= 0 ? flatItems.length - 1 : i - 1))
			} else if (e.key === 'Enter' && highlightIndex >= 0) {
				e.preventDefault()
				selectItem(flatItems[highlightIndex])
			}
		},
		[showSuggestions, flatItems, highlightIndex, selectItem],
	)

	// Fetch notification count via store (WebSocket keeps it updated after mount)
	useEffect(() => {
		if (user) fetchUnreadCount()
	}, [fetchUnreadCount, user])

	// Fetch unread message counts on mount and periodically
	useEffect(() => {
		if (!user) return

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
		const interval = setInterval(fetchMessageCounts, 60000)
		return () => clearInterval(interval)
	}, [user])

	const handleLogout = async () => {
		try {
			// Call backend logout to invalidate session/cookies
			await logoutService()
		} catch (error) {
			logDevError('Logout error:', error)
			toast.error(t('toastSignOutFailed'))
		} finally {
			// Always clear local state and redirect (security: never leave stale session)
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
						className='flex size-9 items-center justify-center rounded-xl bg-gradient-hero shadow-card shadow-brand/25'
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
			{/* Search Bar - constrained max width, with left margin to clear the absolute logo */}
			<form
				ref={searchFormRef}
				role='search'
				onSubmit={e => {
					e.preventDefault()
					setShowSuggestions(false)
					const q = searchQuery.trim()
					if (q) {
						addRecentSearch(q)
						router.push(`/search?q=${encodeURIComponent(q)}`)
					}
				}}
				className='group relative ml-36 flex min-w-0 max-w-2xl flex-1 items-center gap-3 rounded-full border-2 border-border-medium bg-bg-input px-3 py-2 shadow-card transition-all duration-300 focus-within:border-brand focus-within:shadow-card md:ml-44 md:px-4 md:py-2.5'
			>
				<Search className='size-5 shrink-0 text-text-secondary transition-all duration-300 group-focus-within:scale-110 group-focus-within:text-brand' />
				<input
					ref={inputRef}
					type='text'
					placeholder={t('tbSearch')}
					role='combobox'
					aria-label={t('tbSearchLabel')}
					aria-expanded={showSuggestions}
					aria-autocomplete='list'
					aria-controls='search-suggestions-dropdown'
					value={searchQuery}
					onChange={e => {
						setSearchQuery(e.target.value)
						fetchSuggestions(e.target.value.trim())
					}}
					onFocus={() => {
						setRecentSearches(getRecentSearches())
						updateDropdownPosition()
						const q = searchQuery.trim()
						if (q.length >= 2) {
							if (suggestions.recipes.length > 0 || suggestions.people.length > 0)
								setShowSuggestions(true)
						} else {
							// Show recent searches
							const recent = getRecentSearches()
							if (recent.length > 0) setShowSuggestions(true)
						}
					}}
					onKeyDown={handleSearchKeyDown}
					className='w-full min-w-0 border-0 bg-transparent text-sm text-text-primary caret-brand outline-none ring-0 placeholder:text-text-muted focus:border-0 focus:ring-0 md:text-base'
				/>
				{/* Typeahead Suggestions Dropdown — Portaled */}
				{showSuggestions && (
					<Portal>
						<div
							id='search-suggestions-dropdown'
							role='listbox'
							className='fixed z-dropdown overflow-hidden rounded-2xl border border-border-subtle bg-bg-card shadow-lg'
							style={{
								top: dropdownPosition.top,
								left: dropdownPosition.left,
								width: dropdownPosition.width,
							}}
						>
							{/* Loading state */}
							{isSearching && (
								<div className='flex items-center gap-2 px-4 py-3 text-sm text-text-muted'>
									<div className='size-4 animate-spin rounded-full border-2 border-text-muted border-t-brand' />
									{t('tbSearching')}
								</div>
							)}

							{/* Recent searches — when query is short */}
							{searchQuery.trim().length < 2 && recentSearches.length > 0 && !isSearching && (
								<div>
									<div className='px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-text-muted'>
										{t('tbRecent')}
									</div>
									{recentSearches.slice(0, 5).map((term, idx) => {
										const itemIdx = idx
										return (
											<button
												key={term}
												type='button'
												role='option'
												aria-selected={highlightIndex === itemIdx}
												onClick={() => selectItem({ type: 'recent', value: term })}
												className={cn(
													'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
													highlightIndex === itemIdx
														? 'bg-bg-elevated text-text'
														: 'text-text-secondary hover:bg-bg-elevated',
												)}
											>
												<Clock className='size-4 shrink-0 text-text-muted' />
												<span className='truncate'>{term}</span>
											</button>
										)
									})}
								</div>
							)}

							{/* Recipe results */}
							{searchQuery.trim().length >= 2 && !isSearching && suggestions.recipes.length > 0 && (
								<div>
									<div className='px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-text-muted'>
										{t('tbRecipes')}
									</div>
									{suggestions.recipes.map((r, idx) => {
										const itemIdx = idx
										return (
											<button
												key={r.id}
												type='button'
												role='option'
												aria-selected={highlightIndex === itemIdx}
												onClick={() => selectItem({ type: 'recipe', ...r })}
												className={cn(
													'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
													highlightIndex === itemIdx
														? 'bg-bg-elevated'
														: 'hover:bg-bg-elevated',
												)}
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
										)
									})}
								</div>
							)}

							{/* People results */}
							{searchQuery.trim().length >= 2 && !isSearching && suggestions.people.length > 0 && (
								<div>
									<div className='px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-text-muted'>
										{t('tbPeople')}
									</div>
									{suggestions.people.map((p, idx) => {
										const itemIdx = suggestions.recipes.length + idx
										return (
											<button
												key={p.id}
												type='button'
												role='option'
												aria-selected={highlightIndex === itemIdx}
												onClick={() => selectItem({ type: 'person', ...p })}
												className={cn(
													'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
													highlightIndex === itemIdx
														? 'bg-bg-elevated'
														: 'hover:bg-bg-elevated',
												)}
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
										)
									})}
								</div>
							)}

							{/* Empty state */}
							{searchQuery.trim().length >= 2 &&
								!isSearching &&
								suggestions.recipes.length === 0 &&
								suggestions.people.length === 0 && (
									<div className='px-4 py-4 text-center text-sm text-text-muted'>
									{t('tbNoResults', { query: searchQuery.trim() })}
								</div>
								)}

							{/* See all results */}
							{searchQuery.trim().length >= 2 && !isSearching && (
								<button
									type='button'
									role='option'
									aria-selected={highlightIndex === flatItems.length - 1}
									onClick={() => selectItem({ type: 'seeAll' })}
									className={cn(
										'flex w-full items-center gap-2 border-t border-border-subtle px-4 py-3 text-sm font-medium text-brand transition-colors',
										highlightIndex === flatItems.length - 1
											? 'bg-bg-elevated'
											: 'hover:bg-bg-elevated',
									)}
								>
									<Search className='size-4' />
									{t('tbSeeAll', { query: searchQuery.trim() })}
								</button>
							)}
						</div>
					</Portal>
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
					whileHover={BUTTON_SUBTLE_HOVER}
					transition={TRANSITION_SPRING}
					className='relative hidden overflow-hidden rounded-radius bg-gradient-gold px-4 py-2 text-sm font-bold text-text shadow-card lg:flex lg:items-center lg:gap-2'
				>
					<span className='relative z-10'>
						{t('tbLevel', { level: user.statistics?.currentLevel || 1 })}
					</span>
					{/* XP Progress bar inside */}
					<div className='relative z-10 hidden h-1.5 w-16 overflow-hidden rounded-full bg-text/10 xl:block'>
						<motion.div
							className='h-full rounded-full bg-text/25'
							initial={{ width: 0 }}
							animate={{ width: `${xpProgress}%` }}
							transition={{ duration: DURATION_S.dramatic, ease: 'easeOut' }}
						/>
					</div>
					<div className='pointer-events-none absolute inset-0 animate-shine bg-gradient-to-r from-transparent via-white/30 to-transparent' />
				</motion.div>
			)}

			{/* Avatar with dropdown - visible on ALL screen sizes (Settings + Sign Out access on mobile) */}
			{user && (
				<div className='relative'>
					<motion.button
						type='button'
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
						whileHover={BUTTON_SUBTLE_HOVER}
						whileTap={BUTTON_SUBTLE_TAP}
						transition={TRANSITION_SPRING}
						aria-haspopup='true'
					aria-expanded={showUserMenu}
					className='group relative cursor-pointer focus-visible:ring-2 focus-visible:ring-brand/50'
					>
						{/* XP Progress Ring - hidden on mobile for compactness */}
						<svg
							className='absolute -inset-1 hidden md:block'
							width='56'
							height='56'
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
						<Avatar size='sm' className='shadow-card md:hidden'>
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
								className='fixed z-dropdown w-48 overflow-hidden rounded-radius border border-border-subtle bg-bg-card shadow-lg animate-in fade-in-0 zoom-in-95'
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
			)}
			{/* Guest CTA - Sign In / Get Started */}
			{!user && (
				<div className='flex items-center gap-2'>
					<Link
						href={PATHS.AUTH.SIGN_IN}
						className='rounded-radius px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text'
					>
						{t('tbSignIn')}
					</Link>
					<Link
						href={PATHS.AUTH.SIGN_UP}
						className='rounded-radius bg-brand px-4 py-2 text-sm font-bold text-white shadow-card transition-all hover:shadow-warm'
					>
						{t('tbGetStarted')}
					</Link>
				</div>
			)}

			{/* Communication Icons - authenticated users only */}
			{user && (
			<div className='flex gap-2 md:gap-3'>
				<motion.button
					type='button'
					onClick={toggleNotificationsPopup}
					whileHover={ICON_BUTTON_HOVER}
					whileTap={ICON_BUTTON_TAP}
					transition={TRANSITION_SPRING}
					className='relative grid size-11 cursor-pointer place-items-center rounded-xl text-text-secondary transition-colors hover:bg-bg-elevated hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/50'
					aria-label={
						unreadNotifications > 0
							? t('tbNotificationsUnread', { count: unreadNotifications })
							: t('tbNotifications')
					}
				>
					<motion.div
						key={unreadNotifications}
						animate={unreadNotifications > 0 ? BELL_SHAKE.animate : undefined}
					>
						<Bell className='size-5' />
					</motion.div>
					{unreadNotifications > 0 && (
						<motion.span
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={TRANSITION_SPRING}
							className='absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-brand px-1.5 py-0.5 text-xs font-bold text-white shadow-card'
							aria-live='polite'
							aria-atomic='true'
						>
							{unreadNotifications > 99 ? '99+' : unreadNotifications}
						</motion.span>
					)}
				</motion.button>
				<motion.button
					type='button'
					onClick={toggleMessagesDrawer}
					whileHover={ICON_BUTTON_HOVER}
					whileTap={ICON_BUTTON_TAP}
					transition={TRANSITION_SPRING}
					className='relative grid size-11 cursor-pointer place-items-center rounded-xl text-text-secondary transition-colors hover:bg-bg-elevated hover:text-xp focus-visible:ring-2 focus-visible:ring-brand/50'
					aria-label={
						unreadMessages > 0
							? t('tbMessagesUnread', { count: unreadMessages })
							: t('tbMessages')
					}
				>
					<MessageCircle className='size-5' />
					{unreadMessages > 0 && (
						<motion.span
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={TRANSITION_SPRING}
							className='absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-xp px-1.5 py-0.5 text-xs font-bold text-white shadow-card'
							aria-live='polite'
							aria-atomic='true'
						>
							{unreadMessages > 99 ? '99+' : unreadMessages}
						</motion.span>
					)}
				</motion.button>
			</div>
			)}
		</header>
	)
}
