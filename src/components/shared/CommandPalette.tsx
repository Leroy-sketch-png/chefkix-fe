'use client'

import { useTranslations } from 'next-intl'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { Portal } from '@/components/ui/portal'
import {
	Search,
	Home,
	Compass,
	Users,
	PlusCircle,
	Settings,
	ChefHat,
	Bell,
	MessageSquare,
	Trophy,
	BarChart2,
	BookOpen,
	ShoppingBag,
	CalendarDays,
	User,
	CookingPot,
	Utensils,
	Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/axios'
import { API_ENDPOINTS } from '@/constants'
import { PATHS } from '@/constants/paths'
import { useAuthStore } from '@/store/authStore'
import { useAuthGate } from '@/hooks/useAuthGate'

// ============================================
// TYPES
// ============================================

interface CommandItem {
	id: string
	label: string
	description?: string
	icon: React.ReactNode
	action: () => void
	keywords?: string[]
	group: string
	requiresAuth?: boolean
}

// ============================================
// NAVIGATION ITEMS
// ============================================

function useNavigationItems(): CommandItem[] {
	const router = useRouter()
	const t = useTranslations('shared')
	const nav = useCallback((path: string) => () => router.push(path), [router])

	return [
		{
			id: 'nav-dashboard',
			label: t('cpDashboard'),
			description: t('cpDashboardDesc'),
			icon: <Home className='size-4' />,
			action: nav(PATHS.DASHBOARD),
			keywords: ['home', 'feed', 'main'],
			group: 'Navigation',
			requiresAuth: true,
		},
		{
			id: 'nav-explore',
			label: t('cpExplore'),
			description: t('cpExploreDesc'),
			icon: <Compass className='size-4' />,
			action: nav(PATHS.EXPLORE),
			keywords: ['discover', 'browse', 'find'],
			group: 'Navigation',
		},
		{
			id: 'nav-community',
			label: t('cpCommunity'),
			description: t('cpCommunityDesc'),
			icon: <Users className='size-4' />,
			action: nav(PATHS.COMMUNITY),
			keywords: ['leaderboard', 'people', 'social'],
			group: 'Navigation',
		},
		{
			id: 'nav-challenges',
			label: t('cpChallenges'),
			description: t('cpChallengesDesc'),
			icon: <Trophy className='size-4' />,
			action: nav('/challenges'),
			keywords: ['daily', 'weekly', 'seasonal', 'quest'],
			group: 'Navigation',
			requiresAuth: true,
		},
		{
			id: 'nav-messages',
			label: t('cpMessages'),
			description: t('cpMessagesDesc'),
			icon: <MessageSquare className='size-4' />,
			action: nav(PATHS.MESSAGES),
			keywords: ['chat', 'dm', 'inbox'],
			group: 'Navigation',
			requiresAuth: true,
		},
		{
			id: 'nav-notifications',
			label: t('cpNotifications'),
			description: t('cpNotificationsDesc'),
			icon: <Bell className='size-4' />,
			action: nav('/notifications'),
			keywords: ['alerts', 'updates'],
			group: 'Navigation',
			requiresAuth: true,
		},
		{
			id: 'nav-profile',
			label: t('cpMyProfile'),
			description: t('cpMyProfileDesc'),
			icon: <User className='size-4' />,
			action: nav('/profile'),
			keywords: ['me', 'account', 'stats'],
			group: 'Navigation',
			requiresAuth: true,
		},
		{
			id: 'nav-settings',
			label: t('cpSettings'),
			description: t('cpSettingsDesc'),
			icon: <Settings className='size-4' />,
			action: nav(PATHS.SETTINGS),
			keywords: ['preferences', 'account', 'config'],
			group: 'Navigation',
			requiresAuth: true,
		},
		{
			id: 'nav-pantry',
			label: t('cpMyPantry'),
			description: t('cpMyPantryDesc'),
			icon: <ShoppingBag className='size-4' />,
			action: nav('/pantry'),
			keywords: ['ingredients', 'fridge', 'inventory'],
			group: 'Navigation',
			requiresAuth: true,
		},
		{
			id: 'nav-meal-planner',
			label: t('cpMealPlanner'),
			description: t('cpMealPlannerDesc'),
			icon: <CalendarDays className='size-4' />,
			action: nav('/meal-planner'),
			keywords: ['plan', 'schedule', 'weekly'],
			group: 'Navigation',
			requiresAuth: true,
		},
		{
			id: 'nav-shopping-lists',
			label: t('cpShoppingLists'),
			description: t('cpShoppingListsDesc'),
			icon: <BookOpen className='size-4' />,
			action: nav('/shopping-lists'),
			keywords: ['grocery', 'buy', 'list'],
			group: 'Navigation',
			requiresAuth: true,
		},
		{
			id: 'nav-creator',
			label: t('cpCreatorStudio'),
			description: t('cpCreatorStudioDesc'),
			icon: <BarChart2 className='size-4' />,
			action: nav('/creator'),
			keywords: ['analytics', 'studio', 'manage'],
			group: 'Navigation',
			requiresAuth: true,
		},
	]
}

// ============================================
// ACTION ITEMS
// ============================================

function useActionItems(): CommandItem[] {
	const router = useRouter()
	const t = useTranslations('shared')

	return [
		{
			id: 'action-create-recipe',
			label: t('cpCreateRecipe'),
			description: t('cpCreateRecipeDesc'),
			icon: <PlusCircle className='size-4' />,
			action: () => router.push('/create'),
			keywords: ['new', 'add', 'write'],
			group: 'Actions',
			requiresAuth: true,
		},
		{
			id: 'action-new-post',
			label: t('cpNewPost'),
			description: t('cpNewPostDesc'),
			icon: <Utensils className='size-4' />,
			action: () => router.push('/post/new'),
			keywords: ['share', 'publish', 'post'],
			group: 'Actions',
			requiresAuth: true,
		},
		{
			id: 'action-search',
			label: t('cpSearchRecipes'),
			description: t('cpSearchRecipesDesc'),
			icon: <Search className='size-4' />,
			action: () => router.push('/search'),
			keywords: ['find', 'lookup', 'query'],
			group: 'Actions',
		},
	]
}

// ============================================
// SEARCH RESULTS (debounced)
// ============================================

interface SearchResult {
	id: string
	label: string
	description?: string
	icon: React.ReactNode
	action: () => void
	group: string
}

function useSearchResults(
	query: string,
	isOpen: boolean,
): { results: SearchResult[]; isSearching: boolean } {
	const router = useRouter()
	const t = useTranslations('shared')
	const [results, setResults] = useState<SearchResult[]>([])
	const [isSearching, setIsSearching] = useState(false)
	const abortRef = useRef<AbortController | null>(null)

	useEffect(() => {
		if (!isOpen || query.length < 2) {
			setResults([])
			setIsSearching(false)
			return
		}

		abortRef.current?.abort()
		const controller = new AbortController()
		abortRef.current = controller

		const timer = setTimeout(async () => {
			setIsSearching(true)
			try {
				// Search recipes
				const recipeRes = await api.get(API_ENDPOINTS.RECIPES.SEARCH, {
					params: { q: query, page: 0, size: 5 },
					signal: controller.signal,
				})

				const recipes =
					recipeRes.data?.data?.content ?? recipeRes.data?.data ?? []
				const recipeResults: SearchResult[] = (
					Array.isArray(recipes) ? recipes : []
				)
					.slice(0, 5)
					.map((r: { id: string; title: string; difficulty?: string }) => ({
						id: `recipe-${r.id}`,
						label: r.title,
						description: r.difficulty
							? `${r.difficulty} recipe`
							: t('cpRecipeFallback'),
						icon: <ChefHat className='size-4' />,
						action: () => router.push(`/recipes/${r.id}`),
						group: 'Recipes',
					}))

				// Search users
				const userRes = await api.get(API_ENDPOINTS.PROFILE.GET_ALL_PAGINATED, {
					params: { search: query, page: 0, size: 5 },
					signal: controller.signal,
				})

				const users = userRes.data?.data?.content ?? userRes.data?.data ?? []
				const userResults: SearchResult[] = (Array.isArray(users) ? users : [])
					.slice(0, 5)
					.map(
						(u: {
							userId: string
							username: string
							displayName?: string
						}) => ({
							id: `user-${u.userId}`,
							label: u.displayName || u.username,
							description: `@${u.username}`,
							icon: <User className='size-4' />,
							action: () => router.push(`/${u.userId}`),
							group: 'People',
						}),
					)

				if (!controller.signal.aborted) {
					setResults([...recipeResults, ...userResults])
				}
			} catch {
				// ignored: search abort or network error
			} finally {
				if (!controller.signal.aborted) {
					setIsSearching(false)
				}
			}
		}, 250)

		return () => {
			clearTimeout(timer)
			controller.abort()
		}
	}, [query, isOpen, router, t])

	return { results, isSearching }
}

// ============================================
// RECENT ITEMS (from localStorage)
// ============================================

const RECENT_KEY = 'chefkix-command-recent'
const MAX_RECENT = 5

function getRecentItems(): string[] {
	if (typeof localStorage === 'undefined') return []
	try {
		return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
	} catch {
		// ignored: storage access non-critical
		return []
	}
}

function addRecentItem(id: string) {
	if (typeof localStorage === 'undefined') return
	try {
		const items = getRecentItems().filter(i => i !== id)
		items.unshift(id)
		localStorage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, MAX_RECENT)))
	} catch {
		/* ignored: storage access non-critical */
	}
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CommandPalette() {
	const t = useTranslations('shared')
	const [open, setOpen] = useState(false)
	const [query, setQuery] = useState('')
	const isAuthenticated = useAuthStore(s => s.isAuthenticated)
	const { requireAuth } = useAuthGate()

	const allNavItems = useNavigationItems()
	const allActionItems = useActionItems()
	const { results: searchResults, isSearching } = useSearchResults(query, open)

	// Filter items based on auth state — guests see only public navigation + search
	const navItems = isAuthenticated
		? allNavItems
		: allNavItems.filter(item => !item.requiresAuth)
	const actionItems = isAuthenticated
		? allActionItems
		: allActionItems.filter(item => !item.requiresAuth)

	// Ctrl/Cmd + K to toggle
	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault()
				setOpen(prev => !prev)
			}
		}
		document.addEventListener('keydown', down)
		return () => document.removeEventListener('keydown', down)
	}, [])

	const handleSelect = useCallback(
		(id: string, action: () => void) => {
			// Gate auth-only items for guests (safety net — items should already be filtered)
			const item = [...allNavItems, ...allActionItems].find(i => i.id === id)
			if (item?.requiresAuth && !isAuthenticated) {
				setOpen(false)
				setQuery('')
				requireAuth(item.label.toLowerCase())
				return
			}
			addRecentItem(id)
			setOpen(false)
			setQuery('')
			action()
		},
		[allNavItems, allActionItems, isAuthenticated, requireAuth],
	)

	// Reset query when closing
	useEffect(() => {
		if (!open) setQuery('')
	}, [open])

	const isMac =
		typeof navigator !== 'undefined' &&
		/Mac|iPhone|iPad/.test(navigator.userAgent)

	// Collect recent navigation items
	const recentIds = getRecentItems()
	const allItems = [...navItems, ...actionItems]
	const recentItems = recentIds
		.map(id => allItems.find(item => item.id === id))
		.filter(Boolean) as CommandItem[]

	return (
		<Portal>
			<Command.Dialog
				open={open}
				onOpenChange={setOpen}
				label={t('cpDialogLabel')}
				className={cn(
					'fixed inset-0 z-modal flex items-start justify-center pt-[15vh]',
					// Backdrop
					open && 'bg-black/50 backdrop-blur-sm',
				)}
				filter={(value, search) => {
					// Custom filter: check label and keywords
					const item = allItems.find(i => i.id === value)
					if (!item) return 1
					const haystack = [
						item.label,
						item.description,
						...(item.keywords ?? []),
					]
						.join(' ')
						.toLowerCase()
					return haystack.includes(search.toLowerCase()) ? 1 : 0
				}}
			>
				<div className='mx-4 w-full max-w-lg overflow-hidden rounded-2xl border border-border-subtle bg-bg-card shadow-warm'>
					{/* Search Input */}
					<div className='flex items-center gap-3 border-b border-border-subtle px-4'>
						<Search className='size-5 text-text-muted' />
						<Command.Input
							value={query}
							onValueChange={setQuery}
							placeholder={t('cpPlaceholder')}
							aria-label={t('cpPlaceholder')}
							className='flex-1 bg-transparent py-4 text-base text-text outline-none focus-visible:ring-2 focus-visible:ring-brand/50 placeholder:text-text-muted'
						/>
						<kbd className='hidden rounded-md border border-border-subtle bg-bg-elevated px-2 py-0.5 text-xs text-text-muted sm:inline-block'>
							{isMac ? '⌘' : 'Ctrl'}+K
						</kbd>
					</div>

					{/* Results */}
					<Command.List className='max-h-[50vh] overflow-y-auto p-2'>
						<Command.Empty className='px-4 py-8 text-center text-sm text-text-muted'>
							{isSearching ? (
								<span className='flex items-center justify-center gap-2'>
									<Loader2 className='size-4 animate-spin' />
									{t('cpSearching')}
								</span>
							) : query.length > 0 ? (
								t('cpNoResults')
							) : (
								t('cpStartTyping')
							)}
						</Command.Empty>

						{/* Recent */}
						{recentItems.length > 0 && !query && (
							<Command.Group heading={t('cpRecent')}>
								{recentItems.map(item => (
									<CommandRow
										key={item.id}
										item={item}
										onSelect={() => handleSelect(item.id, item.action)}
									/>
								))}
							</Command.Group>
						)}

						{/* Search Results */}
						{searchResults.length > 0 && (
							<>
								{/* Group by group name */}
								{['Recipes', 'People'].map(group => {
									const items = searchResults.filter(r => r.group === group)
									if (items.length === 0) return null
									return (
										<Command.Group
											key={group}
											heading={
												group === 'Recipes'
													? t('cpRecipesGroup')
													: t('cpPeopleGroup')
											}
										>
											{items.map(item => (
												<CommandRow
													key={item.id}
													item={item}
													onSelect={() => handleSelect(item.id, item.action)}
												/>
											))}
										</Command.Group>
									)
								})}
							</>
						)}

						{/* Navigation */}
						{!query && (
							<Command.Group heading={t('cpGoTo')}>
								{navItems.map(item => (
									<CommandRow
										key={item.id}
										item={item}
										onSelect={() => handleSelect(item.id, item.action)}
									/>
								))}
							</Command.Group>
						)}

						{/* Actions */}
						<Command.Group heading={t('cpActions')}>
							{actionItems.map(item => (
								<CommandRow
									key={item.id}
									item={item}
									onSelect={() => handleSelect(item.id, item.action)}
								/>
							))}
						</Command.Group>
					</Command.List>

					{/* Footer hint */}
					<div className='flex items-center justify-between border-t border-border-subtle px-4 py-2 text-xs text-text-muted'>
						<span>
							<kbd className='mr-1 rounded border border-border-subtle bg-bg-elevated px-1.5 py-0.5'>
								↑↓
							</kbd>
							{t('cpNavigate')}
						</span>
						<span>
							<kbd className='mr-1 rounded border border-border-subtle bg-bg-elevated px-1.5 py-0.5'>
								↵
							</kbd>
							{t('cpSelect')}
						</span>
						<span>
							<kbd className='mr-1 rounded border border-border-subtle bg-bg-elevated px-1.5 py-0.5'>
								Esc
							</kbd>
							{t('cpClose')}
						</span>
					</div>
				</div>
			</Command.Dialog>
		</Portal>
	)
}

// ============================================
// COMMAND ROW
// ============================================

function CommandRow({
	item,
	onSelect,
}: {
	item: {
		id: string
		label: string
		description?: string
		icon: React.ReactNode
	}
	onSelect: () => void
}) {
	return (
		<Command.Item
			value={item.id}
			onSelect={onSelect}
			className='flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text transition-colors data-[selected=true]:bg-brand/10 data-[selected=true]:text-brand'
		>
			<span className='flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-bg-elevated text-text-secondary'>
				{item.icon}
			</span>
			<div className='min-w-0 flex-1'>
				<div className='truncate font-medium'>{item.label}</div>
				{item.description && (
					<div className='truncate text-xs text-text-muted'>
						{item.description}
					</div>
				)}
			</div>
		</Command.Item>
	)
}
