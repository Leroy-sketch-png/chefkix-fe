'use client'

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
}

// ============================================
// NAVIGATION ITEMS
// ============================================

function useNavigationItems(): CommandItem[] {
	const router = useRouter()
	const nav = useCallback((path: string) => () => router.push(path), [router])

	return [
		{
			id: 'nav-dashboard',
			label: 'Dashboard',
			description: 'Home feed and activity',
			icon: <Home className='size-4' />,
			action: nav(PATHS.DASHBOARD),
			keywords: ['home', 'feed', 'main'],
			group: 'Navigation',
		},
		{
			id: 'nav-explore',
			label: 'Explore',
			description: 'Discover recipes and creators',
			icon: <Compass className='size-4' />,
			action: nav(PATHS.EXPLORE),
			keywords: ['discover', 'browse', 'find'],
			group: 'Navigation',
		},
		{
			id: 'nav-community',
			label: 'Community',
			description: 'Leaderboards and people',
			icon: <Users className='size-4' />,
			action: nav(PATHS.COMMUNITY),
			keywords: ['leaderboard', 'people', 'social'],
			group: 'Navigation',
		},
		{
			id: 'nav-challenges',
			label: 'Challenges',
			description: 'Daily, weekly and seasonal challenges',
			icon: <Trophy className='size-4' />,
			action: nav('/challenges'),
			keywords: ['daily', 'weekly', 'seasonal', 'quest'],
			group: 'Navigation',
		},
		{
			id: 'nav-messages',
			label: 'Messages',
			description: 'Chat with other cooks',
			icon: <MessageSquare className='size-4' />,
			action: nav(PATHS.MESSAGES),
			keywords: ['chat', 'dm', 'inbox'],
			group: 'Navigation',
		},
		{
			id: 'nav-notifications',
			label: 'Notifications',
			description: 'Activity alerts',
			icon: <Bell className='size-4' />,
			action: nav('/notifications'),
			keywords: ['alerts', 'updates'],
			group: 'Navigation',
		},
		{
			id: 'nav-profile',
			label: 'My Profile',
			description: 'View your profile and stats',
			icon: <User className='size-4' />,
			action: nav('/profile'),
			keywords: ['me', 'account', 'stats'],
			group: 'Navigation',
		},
		{
			id: 'nav-settings',
			label: 'Settings',
			description: 'Account and preferences',
			icon: <Settings className='size-4' />,
			action: nav(PATHS.SETTINGS),
			keywords: ['preferences', 'account', 'config'],
			group: 'Navigation',
		},
		{
			id: 'nav-pantry',
			label: 'My Pantry',
			description: 'Manage your ingredients',
			icon: <ShoppingBag className='size-4' />,
			action: nav('/pantry'),
			keywords: ['ingredients', 'fridge', 'inventory'],
			group: 'Navigation',
		},
		{
			id: 'nav-meal-planner',
			label: 'Meal Planner',
			description: 'Plan your weekly meals',
			icon: <CalendarDays className='size-4' />,
			action: nav('/meal-planner'),
			keywords: ['plan', 'schedule', 'weekly'],
			group: 'Navigation',
		},
		{
			id: 'nav-shopping-lists',
			label: 'Shopping Lists',
			description: 'Your grocery lists',
			icon: <BookOpen className='size-4' />,
			action: nav('/shopping-lists'),
			keywords: ['grocery', 'buy', 'list'],
			group: 'Navigation',
		},
		{
			id: 'nav-creator',
			label: 'Creator Studio',
			description: 'Analytics and recipe management',
			icon: <BarChart2 className='size-4' />,
			action: nav('/creator'),
			keywords: ['analytics', 'studio', 'manage'],
			group: 'Navigation',
		},
	]
}

// ============================================
// ACTION ITEMS
// ============================================

function useActionItems(): CommandItem[] {
	const router = useRouter()

	return [
		{
			id: 'action-create-recipe',
			label: 'Create Recipe',
			description: 'Start a new recipe',
			icon: <PlusCircle className='size-4' />,
			action: () => router.push('/create'),
			keywords: ['new', 'add', 'write'],
			group: 'Actions',
		},
		{
			id: 'action-new-post',
			label: 'New Post',
			description: 'Share something with the community',
			icon: <Utensils className='size-4' />,
			action: () => router.push('/post/new'),
			keywords: ['share', 'publish', 'post'],
			group: 'Actions',
		},
		{
			id: 'action-search',
			label: 'Search Recipes',
			description: 'Find recipes by name or ingredient',
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

				const recipes = recipeRes.data?.data?.content ?? recipeRes.data?.data ?? []
				const recipeResults: SearchResult[] = (Array.isArray(recipes) ? recipes : [])
					.slice(0, 5)
					.map((r: { id: string; title: string; difficulty?: string }) => ({
						id: `recipe-${r.id}`,
						label: r.title,
						description: r.difficulty ? `${r.difficulty} recipe` : 'Recipe',
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
				// Silently handle abort and network errors
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
	}, [query, isOpen, router])

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
		return []
	}
}

function addRecentItem(id: string) {
	if (typeof localStorage === 'undefined') return
	const items = getRecentItems().filter(i => i !== id)
	items.unshift(id)
	localStorage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, MAX_RECENT)))
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CommandPalette() {
	const [open, setOpen] = useState(false)
	const [query, setQuery] = useState('')
	const isAuthenticated = useAuthStore(s => s.isAuthenticated)

	const navItems = useNavigationItems()
	const actionItems = useActionItems()
	const { results: searchResults, isSearching } = useSearchResults(query, open)

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
			addRecentItem(id)
			setOpen(false)
			setQuery('')
			action()
		},
		[],
	)

	// Reset query when closing
	useEffect(() => {
		if (!open) setQuery('')
	}, [open])

	if (!isAuthenticated) return null

	const isMac =
		typeof navigator !== 'undefined' && navigator.platform?.includes('Mac')

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
				label='Command Palette'
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
				<div className='mx-4 w-full max-w-lg overflow-hidden rounded-2xl border border-border-subtle bg-bg-card shadow-xl'>
					{/* Search Input */}
					<div className='flex items-center gap-3 border-b border-border-subtle px-4'>
						<Search className='size-5 text-text-muted' />
						<Command.Input
							value={query}
							onValueChange={setQuery}
							placeholder='Search pages, recipes, people, actions...'
							className='flex-1 bg-transparent py-4 text-base text-text outline-none placeholder:text-text-muted'
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
									Searching...
								</span>
							) : query.length > 0 ? (
								'No results found.'
							) : (
								'Start typing to search...'
							)}
						</Command.Empty>

						{/* Recent */}
						{recentItems.length > 0 && !query && (
							<Command.Group heading='Recent'>
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
										<Command.Group key={group} heading={group}>
											{items.map(item => (
												<CommandRow
													key={item.id}
													item={item}
													onSelect={() =>
														handleSelect(item.id, item.action)
													}
												/>
											))}
										</Command.Group>
									)
								})}
							</>
						)}

						{/* Navigation */}
						{!query && (
							<Command.Group heading='Go to'>
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
						<Command.Group heading='Actions'>
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
							<kbd className='mr-1 rounded border border-border-subtle bg-bg-elevated px-1.5 py-0.5'>↑↓</kbd>
							Navigate
						</span>
						<span>
							<kbd className='mr-1 rounded border border-border-subtle bg-bg-elevated px-1.5 py-0.5'>↵</kbd>
							Select
						</span>
						<span>
							<kbd className='mr-1 rounded border border-border-subtle bg-bg-elevated px-1.5 py-0.5'>Esc</kbd>
							Close
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
	item: { id: string; label: string; description?: string; icon: React.ReactNode }
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
