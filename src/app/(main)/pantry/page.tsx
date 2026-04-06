'use client'
import { useTranslations } from 'next-intl'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Plus,
	Trash2,
	Search,
	AlertTriangle,
	ChefHat,
	Clock,
	Pencil,
	X,
	Check,
	Package,
	Sparkles,
	Filter,
	ShoppingCart,
	Loader2,
} from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyStateGamified } from '@/components/shared'
import { Portal } from '@/components/ui/portal'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { TRANSITION_SPRING, CARD_HOVER, BUTTON_SUBTLE_TAP, BUTTON_TAP } from '@/lib/motion'
import {
	getPantryItems,
	addPantryItem,
	updatePantryItem,
	deletePantryItem,
	clearExpiredItems,
	getMatchingRecipes,
} from '@/services/pantry'
import type {
	PantryItem,
	PantryItemRequest,
	PantryRecipeMatch,
} from '@/lib/types/pantry'
import { toast } from 'sonner'
import { ErrorState } from '@/components/ui/error-state'
import {
	AsyncCombobox,
	AsyncComboboxRef,
	AsyncComboboxOption,
} from '@/components/ui/async-combobox'
import { autocompleteSearch } from '@/services/search'
import { suggestCategory } from '@/lib/data/ingredients'
import { createFromRecipe } from '@/services/shoppingList'
import { useOnboardingOrchestrator } from '@/hooks/useOnboardingOrchestrator'

// ── Category Config ─────────────────────────────────────

const CATEGORIES = [
	{ key: 'produce', labelKey: 'catProduce', emoji: '🥬' },
	{ key: 'protein', labelKey: 'catProtein', emoji: '🥩' },
	{ key: 'dairy', labelKey: 'catDairy', emoji: '🧀' },
	{ key: 'grains', labelKey: 'catGrains', emoji: '🌾' },
	{ key: 'spices', labelKey: 'catSpices', emoji: '🌶️' },
	{ key: 'condiments', labelKey: 'catCondiments', emoji: '🫙' },
	{ key: 'frozen', labelKey: 'catFrozen', emoji: '🧊' },
	{ key: 'other', labelKey: 'catOther', emoji: '📦' },
] as const

const FRESHNESS_KEYS: Record<
	string,
	{ bg: string; text: string; labelKey: string }
> = {
	fresh: { bg: 'bg-success/10', text: 'text-success', labelKey: 'fresh' },
	expiring_soon: {
		bg: 'bg-warning/10',
		text: 'text-warning',
		labelKey: 'expiringSoon',
	},
	expired: {
		bg: 'bg-destructive/10',
		text: 'text-destructive',
		labelKey: 'expired',
	},
}

// ── Main Page ───────────────────────────────────────────

export default function PantryPage() {
	const router = useRouter()
	const [items, setItems] = useState<PantryItem[]>([])
	const t = useTranslations('pantry')
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(false)
	const [filterCategory, setFilterCategory] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState('')

	// Onboarding hints
	useOnboardingOrchestrator({ delay: 1000, condition: !loading })

	// Quick-add state
	const [quickAddName, setQuickAddName] = useState('')
	const [quickAddQty, setQuickAddQty] = useState('')
	const [quickAddUnit, setQuickAddUnit] = useState('')
	const [quickAddCategory, setQuickAddCategory] = useState('other')
	const [quickAddExpiry, setQuickAddExpiry] = useState('')
	const [isAdding, setIsAdding] = useState(false)
	const quickAddRef = useRef<AsyncComboboxRef>(null)

	// Ingredient autocomplete via Typesense knowledge graph
	const fetchIngredientOptions = useCallback(
		async (query: string): Promise<AsyncComboboxOption[]> => {
			const res = await autocompleteSearch(query, 'ingredients', 8)
			if (res.success && res.data?.ingredients?.hits) {
				return res.data.ingredients.hits.map(h => ({
					value: h.document.id,
					label: h.document.name,
					category: h.document.category,
				}))
			}
			return []
		},
		[],
	)

	// Edit state
	const [editingId, setEditingId] = useState<string | null>(null)
	const [editForm, setEditForm] = useState<PantryItemRequest>({
		ingredientName: '',
	})

	// Recipe matching
	const [matchedRecipes, setMatchedRecipes] = useState<PantryRecipeMatch[]>([])
	const [showSuggestions, setShowSuggestions] = useState(false)
	const [loadingRecipes, setLoadingRecipes] = useState(false)
	const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
		null,
	)
	const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
	const [showClearExpiredConfirm, setShowClearExpiredConfirm] = useState(false)
	const [isClearingExpired, setIsClearingExpired] = useState(false)
	useEscapeKey(!!confirmingDeleteId, () => setConfirmingDeleteId(null))
	useEscapeKey(showClearExpiredConfirm, () => setShowClearExpiredConfirm(false))
	const [addingToListId, setAddingToListId] = useState<string | null>(null)
	// ── Fetch ─────────────────────────────────────────────

	const fetchItems = useCallback(async () => {
		try {
			const data = await getPantryItems(filterCategory ?? undefined)
			setItems(data)
		} catch {
			setError(true)
			toast.error(t('failedToLoadItems'), {
				action: {
					label: t('retry'),
					onClick: () => {
						void fetchItems()
					},
				},
			})
		} finally {
			setLoading(false)
		}
	}, [filterCategory, t])

	useEffect(() => {
		fetchItems()
	}, [fetchItems])

	// ── Quick Add ─────────────────────────────────────────

	const handleQuickAdd = async () => {
		if (!quickAddName.trim() || isAdding) return
		setIsAdding(true)
		try {
			const req: PantryItemRequest = {
				ingredientName: quickAddName.trim(),
				quantity: quickAddQty ? Number(quickAddQty) : undefined,
				unit: quickAddUnit || undefined,
				category: quickAddCategory,
				expiryDate: quickAddExpiry || undefined,
			}
			// Validate parsed number
			if (req.quantity !== undefined && isNaN(req.quantity)) {
				toast.error(t('invalidQuantity'))
				setIsAdding(false)
				return
			}
			const newItem = await addPantryItem(req)
			setItems(prev => [newItem, ...prev])
			setQuickAddName('')
			setQuickAddQty('')
			setQuickAddUnit('')
			setQuickAddExpiry('')
			quickAddRef.current?.focus()
			toast.success(t('addedToPantry'))
		} catch {
			toast.error(t('failedToAdd'), {
				action: {
					label: t('retry'),
					onClick: () => {
						void handleQuickAdd()
					},
				},
			})
		} finally {
			setIsAdding(false)
		}
	}

	// ── Edit ──────────────────────────────────────────────

	const startEdit = (item: PantryItem) => {
		setEditingId(item.id)
		setEditForm({
			ingredientName: item.ingredientName,
			quantity: item.quantity ?? undefined,
			unit: item.unit ?? undefined,
			category: item.category,
			expiryDate: item.expiryDate ?? undefined,
		})
	}

	const saveEdit = async () => {
		if (!editingId) return
		try {
			const updated = await updatePantryItem(editingId, editForm)
			setItems(prev => prev.map(i => (i.id === editingId ? updated : i)))
			setEditingId(null)
			toast.success(t('itemUpdated'))
		} catch {
			toast.error(t('failedToUpdate'), {
				action: {
					label: t('retry'),
					onClick: () => {
						void saveEdit()
					},
				},
			})
		}
	}

	// ── Delete ────────────────────────────────────────────

	const handleDelete = async (id: string) => {
		setIsDeletingId(id)
		try {
			await deletePantryItem(id)
			setItems(prev => prev.filter(i => i.id !== id))
			setConfirmingDeleteId(null)
		} catch {
			toast.error(t('failedToDelete'))
		} finally {
			setIsDeletingId(null)
		}
	}

	const handleClearExpired = async () => {
		setIsClearingExpired(true)
		try {
			const count = await clearExpiredItems()
			if (count > 0) {
				setItems(prev => prev.filter(i => i.freshness !== 'expired'))
				toast.success(t('removedExpired', { count }))
			}
			setShowClearExpiredConfirm(false)
		} catch {
			toast.error(t('failedToClearExpired'), {
				action: {
					label: t('retry'),
					onClick: () => {
						void handleClearExpired()
					},
				},
			})
		} finally {
			setIsClearingExpired(false)
		}
	}

	// ── Recipe Suggestions ────────────────────────────────

	const loadSuggestions = async () => {
		setShowSuggestions(true)
		setLoadingRecipes(true)
		try {
			const data = await getMatchingRecipes(0.3, true)
			setMatchedRecipes(data)
		} catch {
			setShowSuggestions(false)
			toast.error(t('failedToLoadSuggestions'), {
				action: {
					label: t('retry'),
					onClick: () => {
						void loadSuggestions()
					},
				},
			})
		} finally {
			setLoadingRecipes(false)
		}
	}

	const handleAddToShoppingList = async (recipeId: string, e: React.MouseEvent) => {
		e.stopPropagation()
		if (addingToListId) return
		setAddingToListId(recipeId)
		try {
			const shoppingList = await createFromRecipe({ recipeId })
			toast.success(t('shoppingListCreated'), {
				description: t('missingIngredients', { count: shoppingList.totalItems }),
				action: {
					label: t('viewShoppingList'),
					onClick: () => router.push('/shopping-lists'),
				},
			})
		} catch {
			toast.error(t('failedToCreateShoppingList'))
		} finally {
			setAddingToListId(null)
		}
	}

	// ── Derived ───────────────────────────────────────────

	const expiredCount = items.filter(i => i.freshness === 'expired').length
	const expiringCount = items.filter(
		i => i.freshness === 'expiring_soon',
	).length
	const filtered = items.filter(i =>
		searchQuery
			? i.ingredientName.toLowerCase().includes(searchQuery.toLowerCase())
			: true,
	)
	const grouped = CATEGORIES.map(cat => ({
		...cat,
		items: filtered.filter(i => i.category === cat.key),
	})).filter(g => g.items.length > 0)

	// ── Error state ───────────────────────────────────────

	if (error) {
		return (
			<PageTransition>
				<PageContainer maxWidth='lg'>
					<ErrorState
						title={t('failedToLoad')}
						message={t('failedToLoadDesc')}
						onRetry={() => {
							setError(false)
							setLoading(true)
							fetchItems()
						}}
					/>
				</PageContainer>
			</PageTransition>
		)
	}

	// ── Skeleton ──────────────────────────────────────────

	if (loading) {
		return (
			<PageTransition>
				<PageContainer maxWidth='lg'>
					<div className='space-y-6 py-6'>
						<div className='h-10 w-48 animate-pulse rounded-lg bg-bg-elevated' />
						<div className='h-14 animate-pulse rounded-xl bg-bg-elevated' />
						<div className='grid gap-3'>
							{Array.from({ length: 6 }).map((_, i) => (
								<div
									key={i}
									className='h-16 animate-pulse rounded-xl bg-bg-elevated'
								/>
							))}
						</div>
					</div>
				</PageContainer>
			</PageTransition>
		)
	}

	return (
		<PageTransition>
			<PageContainer maxWidth='lg'>
				<div className='space-y-6 py-6'>
					{/* ── Header ────────────────────────── */}
					<PageHeader
						icon={Package}
						title={t('title')}
						subtitle={t('subtitle')}
						gradient="green"
						marginBottom="sm"
						rightAction={
							<div className='flex items-center gap-2'>
								<span className='rounded-full bg-bg-elevated px-2.5 py-0.5 text-sm text-text-secondary'>
									{t('itemCount', { count: items.length })}
								</span>
								{expiredCount > 0 && (
									<motion.button
										type='button'
										onClick={() => setShowClearExpiredConfirm(true)}
										whileTap={BUTTON_SUBTLE_TAP}
										className='flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 focus-visible:ring-2 focus-visible:ring-brand/50'
									>
										<Trash2 className='size-4' />
										{t('clearExpired', { count: expiredCount })}
									</motion.button>
								)}
								<motion.button
									type='button'
									onClick={loadSuggestions}
									whileTap={BUTTON_SUBTLE_TAP}
									className='flex items-center gap-1.5 rounded-lg bg-brand/10 px-3 py-1.5 text-sm font-medium text-brand transition-colors hover:bg-brand/20 focus-visible:ring-2 focus-visible:ring-brand/50'
								>
									<Sparkles className='size-4' />
									{t('whatCanICook')}
								</motion.button>
							</div>
						}
					/>

					{/* ── Expiry Warning Banner ─────────── */}
					{expiringCount > 0 && (
						<motion.div
							initial={{ opacity: 0, y: -8 }}
							animate={{ opacity: 1, y: 0 }}
							className='flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 p-3'
						>
							<AlertTriangle className='size-5 text-warning' />
							<p className='text-sm text-warning'>
								<strong>
									{t('expiringItems', { count: expiringCount })}
								</strong>{' '}
								{t('expiringSoonMessage')}
								<motion.button
									type='button'
									onClick={loadSuggestions}
									whileTap={BUTTON_TAP}
									className='ml-1 font-semibold text-brand underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-brand/50'
								>
									{t('findRecipesToUse')}
								</motion.button>
							</p>
						</motion.div>
					)}

					{/* ── Quick Add Bar ─────────────────── */}
					<motion.div className='rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card'>
						<div className='flex flex-wrap items-end gap-3'>
							<div className='flex-1 min-w-[180px]'>
								<label
									htmlFor='pantry-ingredient'
									className='mb-1 block text-xs font-medium text-text-secondary'
								>
									{t('labelIngredient')}
								</label>
								<AsyncCombobox
									id='pantry-ingredient'
									ref={quickAddRef}
									value={quickAddName}
									onChange={setQuickAddName}
									onSelect={option => {
										setQuickAddName(option.label)
										const cat = option.category || suggestCategory(option.label)
										if (cat !== 'other') setQuickAddCategory(cat)
									}}
									fetchOptions={fetchIngredientOptions}
									minChars={1}
									onKeyDown={e => {
										if (e.key === 'Enter') handleQuickAdd()
									}}
									placeholder={t('ingredientPlaceholder')}
								/>
							</div>
							<div className='w-20'>
								<label
									htmlFor='pantry-qty'
									className='mb-1 block text-xs font-medium text-text-secondary'
								>
									{t('labelQty')}
								</label>
								<input
									id='pantry-qty'
									value={quickAddQty}
									onChange={e => setQuickAddQty(e.target.value)}
									onKeyDown={e => e.key === 'Enter' && handleQuickAdd()}
									placeholder='2'
									type='number'
									className='w-full rounded-lg border border-border-subtle bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand'
								/>
							</div>
							<div className='w-24'>
								<label
									htmlFor='pantry-unit'
									className='mb-1 block text-xs font-medium text-text-secondary'
								>
									{t('labelUnit')}
								</label>
								<input
									id='pantry-unit'
									value={quickAddUnit}
									onChange={e => setQuickAddUnit(e.target.value)}
									onKeyDown={e => e.key === 'Enter' && handleQuickAdd()}
									placeholder={t('unitPlaceholder')}
									className='w-full rounded-lg border border-border-subtle bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand'
								/>
							</div>
							<div className='w-32'>
								<label
									htmlFor='pantry-category'
									className='mb-1 block text-xs font-medium text-text-secondary'
								>
									{t('labelCategory')}
								</label>
								<select
									id='pantry-category'
									value={quickAddCategory}
									onChange={e => setQuickAddCategory(e.target.value)}
									className='w-full rounded-lg border border-border-subtle bg-bg-card px-3 py-2 text-sm text-text focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand'
								>
									{CATEGORIES.map(c => (
										<option
											key={c.key}
											value={c.key}
											className='bg-bg-card text-text'
										>
											{c.emoji} {t(c.labelKey)}
										</option>
									))}
								</select>
							</div>
							<div className='w-36'>
								<label
									htmlFor='pantry-expiry'
									className='mb-1 block text-xs font-medium text-text-secondary'
								>
									{t('labelExpiry')}
								</label>
								<input
									id='pantry-expiry'
									type='date'
									value={quickAddExpiry}
									onChange={e => setQuickAddExpiry(e.target.value)}
									className='w-full rounded-lg border border-border-subtle bg-bg-card px-3 py-2 text-sm text-text focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand'
								/>
							</div>
							<motion.button
								type='button'
								onClick={handleQuickAdd}
								whileTap={BUTTON_TAP}
								disabled={!quickAddName.trim() || isAdding}
								className='flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand/50'
							>
								<Plus className='size-4' />
								{t('addButton')}
							</motion.button>
						</div>
					</motion.div>

					{/* ── Search + Category Filter ──────── */}
					<div className='flex flex-wrap items-center gap-3'>
						<div className='relative flex-1 min-w-[200px]'>
							<Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted' />
							<input
								value={searchQuery}
								onChange={e => setSearchQuery(e.target.value)}
								placeholder={t('searchPlaceholder')}
								className='w-full rounded-lg border border-border-subtle bg-bg py-2 pl-10 pr-3 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand'
							/>
						</div>
						<div className='flex items-center gap-1.5'>
							<Filter className='size-4 text-text-muted' />
							<motion.button
								type='button'
								onClick={() => setFilterCategory(null)}
								whileTap={BUTTON_SUBTLE_TAP}
								className={`rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand/50 ${
									!filterCategory
										? 'bg-brand text-white'
										: 'bg-bg-elevated text-text-secondary hover:bg-bg-elevated/80'
								}`}
								aria-label={t('showAllCategories')}
							>
								{t('all')}
							</motion.button>
							{CATEGORIES.map(c => (
								<motion.button
									type='button'
									key={c.key}
									onClick={() =>
										setFilterCategory(filterCategory === c.key ? null : c.key)
									}
									whileTap={BUTTON_SUBTLE_TAP}
									className={`rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand/50 ${
										filterCategory === c.key
											? 'bg-brand text-white'
											: 'bg-bg-elevated text-text-secondary hover:bg-bg-elevated/80'
									}`}
									aria-label={t('filterBy', { category: t(c.labelKey) })}
								>
									{c.emoji}
								</motion.button>
							))}
						</div>
					</div>

					{/* ── Items by Category ─────────────── */}
					{items.length === 0 ? (
						<EmptyStateGamified
							variant='custom'
							emoji='🧅'
							title={t('emptyTitle')}
							description={t('emptyDescription')}
							primaryAction={{
								label: t('addFirstIngredient'),
								onClick: () => {
									const input = document.querySelector<HTMLInputElement>('[data-pantry-input]')
									input?.focus()
								},
								icon: <Plus className='size-4' />,
							}}
						/>
					) : (
						<div className='space-y-4'>
							{grouped.map(group => (
								<motion.div
									key={group.key}
									initial={{ opacity: 0, y: 8 }}
									animate={{ opacity: 1, y: 0 }}
									className='rounded-xl border border-border-subtle bg-bg-card shadow-card'
								>
									<div className='flex items-center gap-2 border-b border-border-subtle px-4 py-3'>
										<span className='text-lg'>{group.emoji}</span>
										<h3 className='text-sm font-semibold text-text'>
											{t(group.labelKey)}
										</h3>
										<span className='text-xs text-text-muted'>
											({group.items.length})
										</span>
									</div>
									<ul className='divide-y divide-border-subtle'>
										{group.items.map(item => (
											<li
												key={item.id}
												className='group flex items-center gap-3 px-4 py-3'
											>
												{editingId === item.id ? (
													/* ── Inline Edit Row ─── */
													<div className='flex flex-1 flex-wrap items-center gap-2'>
														<input
															value={editForm.ingredientName}
															onChange={e =>
																setEditForm(f => ({
																	...f,
																	ingredientName: e.target.value,
																}))
															}
															className='flex-1 min-w-[120px] rounded-md border border-border-subtle bg-bg px-2 py-1 text-sm text-text focus:border-brand focus:outline-none'
														/>
														<input
															type='number'
															value={editForm.quantity ?? ''}
															onChange={e =>
																setEditForm(f => ({
																	...f,
																	quantity: e.target.value
																		? Number(e.target.value)
																		: undefined,
																}))
															}
															className='w-16 rounded-md border border-border-subtle bg-bg px-2 py-1 text-sm text-text [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none focus:border-brand focus:outline-none'
														placeholder={t('labelQty')}
														/>
														<input
															value={editForm.unit ?? ''}
															onChange={e =>
																setEditForm(f => ({
																	...f,
																	unit: e.target.value,
																}))
															}
															className='w-16 rounded-md border border-border-subtle bg-bg px-2 py-1 text-sm text-text focus:border-brand focus:outline-none'
														placeholder={t('labelUnit')}
														/>
														<input
															type='date'
															value={editForm.expiryDate ?? ''}
															onChange={e =>
																setEditForm(f => ({
																	...f,
																	expiryDate: e.target.value || undefined,
																}))
															}
															className='w-36 rounded-md border border-border-subtle bg-bg-card px-2 py-1 text-sm text-text focus:border-brand focus:outline-none'
														/>
															<motion.button
															type='button'
															onClick={saveEdit}
																whileTap={BUTTON_SUBTLE_TAP}
															className='rounded-md bg-success/10 p-1.5 text-success hover:bg-success/20 focus-visible:ring-2 focus-visible:ring-brand/50'
															aria-label={t('saveChanges')}
														>
															<Check className='size-4' />
															</motion.button>
															<motion.button
															type='button'
															onClick={() => setEditingId(null)}
																whileTap={BUTTON_SUBTLE_TAP}
															className='rounded-md bg-bg-elevated p-1.5 text-text-secondary hover:bg-bg-elevated/80 focus-visible:ring-2 focus-visible:ring-brand/50'
														>
															<X className='size-4' />
															</motion.button>
													</div>
												) : (
													/* ── Normal Row ─────── */
													<>
														<div className='flex-1'>
															<span className='font-medium text-text'>
																{item.ingredientName}
															</span>
															{(item.quantity || item.unit) && (
																<span className='ml-2 text-sm text-text-secondary'>
																	{item.quantity}
																	{item.unit ? ` ${item.unit}` : ''}
																</span>
															)}
														</div>
														{item.expiryDate && (
															<div className='flex items-center gap-1.5'>
																<Clock className='size-3.5 text-text-muted' />
																<span className='text-xs text-text-muted'>
																	{new Date(
																		item.expiryDate,
																	).toLocaleDateString()}
																</span>
															</div>
														)}
														<span
															className={`rounded-full px-2 py-0.5 text-xs font-medium ${
															FRESHNESS_KEYS[item.freshness]?.bg
														} ${FRESHNESS_KEYS[item.freshness]?.text}`}
													>
														{FRESHNESS_KEYS[item.freshness]?.labelKey ? t(FRESHNESS_KEYS[item.freshness].labelKey) : item.freshness}
														</span>
														<div className='flex items-center gap-1 md:opacity-0 transition-opacity md:group-hover:opacity-100 focus-within:opacity-100'>
															<motion.button
																type='button'
																onClick={() => startEdit(item)}
																whileTap={BUTTON_SUBTLE_TAP}
																className='rounded-md p-1.5 text-text-muted hover:bg-bg-elevated hover:text-text focus-visible:ring-2 focus-visible:ring-brand/50'
																aria-label={t('editItem')}
															>
																<Pencil className='size-3.5' />
															</motion.button>
															<motion.button
																type='button'
																onClick={() => setConfirmingDeleteId(item.id)}
																whileTap={BUTTON_SUBTLE_TAP}
																className='rounded-md p-1.5 text-text-muted hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-brand/50'
																aria-label={t('deleteItem')}
															>
																<Trash2 className='size-3.5' />
															</motion.button>
														</div>
													</>
												)}
											</li>
										))}
									</ul>
								</motion.div>
							))}
						</div>
					)}

					{/* ── Recipe Suggestions Drawer ─────── */}
					<AnimatePresence>
						{showSuggestions && (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 20 }}
								transition={TRANSITION_SPRING}
								className='rounded-xl border border-border-subtle bg-bg-card p-5 shadow-warm'
							>
								<div className='mb-4 flex items-center justify-between'>
									<div className='flex items-center gap-2'>
										<ChefHat className='size-5 text-brand' />
										<h2 className='text-lg font-semibold text-text'>
											{t('recipesYouCanCook')}
										</h2>
									</div>
									<motion.button
										type='button'
										onClick={() => setShowSuggestions(false)}
										whileTap={BUTTON_SUBTLE_TAP}
										className='rounded-md p-1.5 text-text-muted hover:bg-bg-elevated focus-visible:ring-2 focus-visible:ring-brand/50'
									>
										<X className='size-4' />
									</motion.button>
								</div>

								{loadingRecipes ? (
									<div className='grid gap-3'>
										{Array.from({ length: 3 }).map((_, i) => (
											<div
												key={i}
												className='h-20 animate-pulse rounded-lg bg-bg-elevated'
											/>
										))}
									</div>
								) : matchedRecipes.length === 0 ? (
									<p className='py-8 text-center text-sm text-text-muted'>
										{t('noMatchingRecipes')}
									</p>
								) : (
									<div className='grid gap-3'>
										{matchedRecipes.slice(0, 10).map(match => (
											<motion.button
												type='button'
												key={match.recipeId}
												whileHover={CARD_HOVER}
												onClick={() =>
													router.push(`/recipes/${match.recipeId}`)
												}
												className='flex items-center gap-4 rounded-lg border border-border-subtle bg-bg p-3 text-left transition-colors hover:bg-bg-elevated focus-visible:ring-2 focus-visible:ring-brand/50'
											>
												{match.coverImageUrl && (
													<Image
														src={match.coverImageUrl}
														alt={match.recipeTitle}
														width={56}
														height={56}
														unoptimized
														className='size-14 rounded-lg object-cover'
													/>
												)}
												<div className='flex-1'>
													<p className='font-medium text-text'>
														{match.recipeTitle}
													</p>
													<div className='mt-1 flex items-center gap-3 text-xs text-text-secondary'>
														<span>{match.difficulty}</span>
														<span>{match.totalTimeMinutes} {t('min')}</span>
													</div>
													<div className='mt-1.5 flex items-center gap-2'>
														<div className='h-1.5 flex-1 overflow-hidden rounded-full bg-bg-elevated'>
															<div
																className='h-full rounded-full bg-brand transition-all'
																style={{
																	width: `${match.matchPercentage * 100}%`,
																}}
															/>
														</div>
														<span className='text-xs font-semibold text-brand'>
															{Math.round(match.matchPercentage * 100)}%
														</span>
													</div>
													{match.expiringIngredientsUsed.length > 0 && (
														<p className='mt-1 text-xs text-warning'>
													{t('usesExpiring')}{' '}
															{match.expiringIngredientsUsed.join(', ')}
														</p>
													)}
												</div>													<span
														role='button'
														tabIndex={0}
														onClick={(e) => handleAddToShoppingList(match.recipeId, e)}
														onKeyDown={(e) => { if (e.key === 'Enter') handleAddToShoppingList(match.recipeId, e as unknown as React.MouseEvent) }}
														className='grid size-10 flex-shrink-0 place-items-center rounded-lg border border-border-subtle transition-colors hover:border-success hover:bg-success/10'
														title={t('addToShoppingList')}
													>
														{addingToListId === match.recipeId ? (
															<Loader2 className='size-4 animate-spin text-text-muted' />
														) : (
															<ShoppingCart className='size-4 text-text-secondary' />
														)}
													</span>											</motion.button>
										))}
									</div>
								)}
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* ── Delete Confirmation Dialog ── */}
				<AnimatePresence>
					{confirmingDeleteId && (
						<Portal>
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className='fixed inset-0 z-modal flex items-center justify-center bg-black/40 p-4'
								onClick={() => setConfirmingDeleteId(null)}
							>
								<motion.div
									initial={{ scale: 0.95, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ scale: 0.95, opacity: 0 }}
									onClick={e => e.stopPropagation()}
									className='w-full max-w-sm rounded-xl bg-bg-card p-6 shadow-warm'
								>
									<h3 className='mb-2 text-lg font-bold text-text'>
										{t('deleteItem')}
									</h3>
									<p className='mb-6 text-sm text-text-muted'>
										{t('deleteConfirm', { name: items.find(i => i.id === confirmingDeleteId)?.ingredientName ?? '' })}
									</p>
									<div className='flex justify-end gap-3'>
										<motion.button
											type='button'
											onClick={() => setConfirmingDeleteId(null)}
											whileTap={BUTTON_SUBTLE_TAP}
											className='rounded-lg px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-elevated focus-visible:ring-2 focus-visible:ring-brand/50'
										>
											{t('cancelEdit')}
										</motion.button>
										<motion.button
											type='button'
											onClick={() => handleDelete(confirmingDeleteId)}
											whileTap={BUTTON_SUBTLE_TAP}
											disabled={isDeletingId === confirmingDeleteId}
											className='rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-brand/50'
										>
											{isDeletingId === confirmingDeleteId
												? t('deleting')
												: t('deleteItem')}
										</motion.button>
									</div>
								</motion.div>
							</motion.div>
						</Portal>
					)}
				</AnimatePresence>

				{/* ── Clear Expired Confirmation Dialog ── */}
				<AnimatePresence>
					{showClearExpiredConfirm && (
						<Portal>
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className='fixed inset-0 z-modal flex items-center justify-center bg-black/40 p-4'
								onClick={() => setShowClearExpiredConfirm(false)}
							>
								<motion.div
									initial={{ scale: 0.95, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ scale: 0.95, opacity: 0 }}
									onClick={e => e.stopPropagation()}
									className='w-full max-w-sm rounded-xl bg-bg-card p-6 shadow-warm'
								>
									<h3 className='mb-2 text-lg font-bold text-text'>
										{t('clearExpiredTitle')}
									</h3>
									<p className='mb-6 text-sm text-text-muted'>
										{t('clearExpiredConfirm', { count: expiredCount })}
									</p>
									<div className='flex justify-end gap-3'>
										<motion.button
											type='button'
											onClick={() => setShowClearExpiredConfirm(false)}
											whileTap={BUTTON_SUBTLE_TAP}
											className='rounded-lg px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-elevated focus-visible:ring-2 focus-visible:ring-brand/50'
										>
											{t('cancelEdit')}
										</motion.button>
										<motion.button
											type='button'
											onClick={handleClearExpired}
											whileTap={BUTTON_SUBTLE_TAP}
											disabled={isClearingExpired}
											className='rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand/50'
										>
											{isClearingExpired ? t('clearing') : t('clearAll')}
										</motion.button>
									</div>
								</motion.div>
							</motion.div>
						</Portal>
					)}
				</AnimatePresence>
			</PageContainer>
		</PageTransition>
	)
}
