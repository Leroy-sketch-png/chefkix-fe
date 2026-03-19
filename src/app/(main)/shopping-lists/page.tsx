'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Plus,
	ShoppingCart,
	Trash2,
	ArrowLeft,
	Copy,
	Share2,
	Check,
	X,
	CalendarDays,
	UtensilsCrossed,
	FileText,
	CheckCircle2,
	Circle,
	Package,
} from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { TRANSITION_SPRING, CARD_HOVER } from '@/lib/motion'
import {
	getUserShoppingLists,
	getShoppingListById,
	createFromMealPlan,
	createFromRecipe,
	createCustomList,
	toggleShoppingItem,
	addCustomItem,
	removeShoppingItem,
	deleteShoppingList,
	regenerateShareToken,
} from '@/services/shoppingList'
import { getCurrentMealPlan } from '@/services/mealplan'
import type {
	ShoppingListSummary,
	ShoppingListResponse,
	ShoppingListItem,
	AddCustomItemRequest,
} from '@/lib/types/shoppingList'
import { CATEGORY_CONFIG } from '@/lib/types/shoppingList'
import { toast } from 'sonner'

// ── Source badge colors ──────────────────────────────────────────────

const SOURCE_CONFIG: Record<
	string,
	{ icon: typeof CalendarDays; color: string; bg: string }
> = {
	'Meal Plan': { icon: CalendarDays, color: 'text-info', bg: 'bg-info/10' },
	Recipe: { icon: UtensilsCrossed, color: 'text-brand', bg: 'bg-brand/10' },
	Custom: { icon: FileText, color: 'text-success', bg: 'bg-success/10' },
}

export default function ShoppingListsPage() {
	// ── State ──────────────────────────────────────────────────────────
	const [lists, setLists] = useState<ShoppingListSummary[]>([])
	const [selectedList, setSelectedList] = useState<ShoppingListResponse | null>(
		null,
	)
	const [isLoading, setIsLoading] = useState(true)
	const [isDetailLoading, setIsDetailLoading] = useState(false)
	const [showCreateMenu, setShowCreateMenu] = useState(false)
	const [showAddItem, setShowAddItem] = useState(false)
	const [newItemForm, setNewItemForm] = useState<AddCustomItemRequest>({
		ingredient: '',
	})
	const [isCreating, setIsCreating] = useState(false)
	const [copySuccess, setCopySuccess] = useState(false)
	const [shareSuccess, setShareSuccess] = useState(false)
	const [customListName, setCustomListName] = useState('')
	const [showCustomNameInput, setShowCustomNameInput] = useState(false)
	const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
		null,
	)

	// ── Fetch lists ────────────────────────────────────────────────────

	const fetchLists = useCallback(async () => {
		try {
			const data = await getUserShoppingLists()
			setLists(data)
		} catch {
			toast.error('Failed to load shopping lists')
		} finally {
			setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchLists()
	}, [fetchLists])

	// ── List operations ────────────────────────────────────────────────

	const handleOpenList = async (id: string) => {
		setIsDetailLoading(true)
		try {
			const data = await getShoppingListById(id)
			setSelectedList(data)
		} catch {
			toast.error('Failed to open shopping list')
		} finally {
			setIsDetailLoading(false)
		}
	}

	const handleDeleteList = async (id: string) => {
		try {
			await deleteShoppingList(id)
			setLists(prev => prev.filter(l => l.id !== id))
			if (selectedList?.id === id) setSelectedList(null)
			setConfirmingDeleteId(null)
			toast.success('Shopping list deleted')
		} catch {
			toast.error('Failed to delete shopping list')
		}
	}

	const handleCreateFromMealPlan = async () => {
		setIsCreating(true)
		try {
			const plan = await getCurrentMealPlan()
			const list = await createFromMealPlan({ mealPlanId: plan.id })
			setSelectedList(list)
			setShowCreateMenu(false)
			fetchLists()
			toast.success('Shopping list created from meal plan!')
		} catch {
			toast.error('No meal plan found — generate one first')
		} finally {
			setIsCreating(false)
		}
	}

	const handleCreateCustom = async () => {
		if (!customListName.trim()) return
		setIsCreating(true)
		try {
			const list = await createCustomList({ name: customListName.trim() })
			setSelectedList(list)
			setShowCreateMenu(false)
			setShowCustomNameInput(false)
			setCustomListName('')
			fetchLists()
			toast.success('Custom list created!')
		} catch {
			toast.error('Failed to create custom list')
		} finally {
			setIsCreating(false)
		}
	}

	// ── Item operations ────────────────────────────────────────────────

	const handleToggleItem = async (itemId: string) => {
		if (!selectedList) return
		// Optimistic update
		setSelectedList(prev => {
			if (!prev) return prev
			return {
				...prev,
				items: prev.items.map(item =>
					item.itemId === itemId ? { ...item, checked: !item.checked } : item,
				),
				checkedItems: prev.items.find(i => i.itemId === itemId)?.checked
					? prev.checkedItems - 1
					: prev.checkedItems + 1,
			}
		})
		try {
			await toggleShoppingItem(selectedList.id, itemId)
		} catch {
			// Revert on failure
			try {
				const fresh = await getShoppingListById(selectedList.id)
				setSelectedList(fresh)
			} catch {
				// If revert also fails, toggle back locally
				setSelectedList(prev => {
					if (!prev) return prev
					return {
						...prev,
						items: prev.items.map(item =>
							item.itemId === itemId
								? { ...item, checked: !item.checked }
								: item,
						),
					}
				})
			}
			toast.error('Failed to update item')
		}
	}

	const handleAddItem = async () => {
		if (!selectedList || !newItemForm.ingredient.trim()) return
		try {
			const updated = await addCustomItem(selectedList.id, {
				...newItemForm,
				ingredient: newItemForm.ingredient.trim(),
			})
			setSelectedList(updated)
			setNewItemForm({ ingredient: '' })
			setShowAddItem(false)
			fetchLists()
		} catch {
			toast.error('Failed to add item')
		}
	}

	const handleRemoveItem = async (itemId: string) => {
		if (!selectedList) return
		try {
			const updated = await removeShoppingItem(selectedList.id, itemId)
			setSelectedList(updated)
			fetchLists()
		} catch {
			toast.error('Failed to remove item')
		}
	}

	// ── Copy & Share ───────────────────────────────────────────────────

	const handleCopyList = async () => {
		if (!selectedList) return
		const text = selectedList.items
			.map(item => {
				const qty = item.quantity ? ` (${item.quantity})` : ''
				const check = item.checked ? '✓' : '○'
				return `${check} ${item.ingredient}${qty}`
			})
			.join('\n')
		try {
			await navigator.clipboard.writeText(
				`${selectedList.name}\n${'─'.repeat(30)}\n${text}`,
			)
			setCopySuccess(true)
			setTimeout(() => setCopySuccess(false), 2000)
		} catch {
			toast.error('Failed to copy to clipboard')
		}
	}

	const handleShare = async () => {
		if (!selectedList) return
		try {
			const updated = await regenerateShareToken(selectedList.id)
			setSelectedList(updated)
			const url = `${window.location.origin}/shopping-lists/shared/${updated.shareToken}`
			await navigator.clipboard.writeText(url)
			setShareSuccess(true)
			setTimeout(() => setShareSuccess(false), 2000)
		} catch {
			toast.error('Failed to generate share link')
		}
	}

	// ── Group items by category ────────────────────────────────────────

	const groupedItems = useMemo(() => {
		if (!selectedList) return {}
		const groups: Record<string, ShoppingListItem[]> = {}
		for (const item of selectedList.items) {
			const cat = item.category || 'Other'
			if (!groups[cat]) groups[cat] = []
			groups[cat].push(item)
		}
		// Sort categories: non-empty first, then alphabetical
		const sorted: Record<string, ShoppingListItem[]> = {}
		Object.keys(groups)
			.sort((a, b) => a.localeCompare(b))
			.forEach(key => {
				sorted[key] = groups[key]
			})
		return sorted
	}, [selectedList])

	// ── Progress ───────────────────────────────────────────────────────

	const progress = selectedList
		? selectedList.totalItems > 0
			? Math.round(
					(selectedList.items.filter(i => i.checked).length /
						selectedList.totalItems) *
						100,
				)
			: 0
		: 0

	// ── Loading skeleton ───────────────────────────────────────────────

	if (isLoading) {
		return (
			<PageTransition>
				<PageContainer maxWidth='lg'>
					<div className='space-y-6 py-6'>
						<div className='h-8 w-48 animate-pulse rounded-lg bg-bg-elevated' />
						<div className='grid gap-4 sm:grid-cols-2'>
							{[1, 2, 3, 4].map(i => (
								<div
									key={i}
									className='h-28 animate-pulse rounded-xl bg-bg-elevated'
								/>
							))}
						</div>
					</div>
				</PageContainer>
			</PageTransition>
		)
	}

	// ── Detail View ────────────────────────────────────────────────────

	if (selectedList) {
		return (
			<PageTransition>
				<PageContainer maxWidth='lg'>
					<div className='space-y-6 py-6'>
						{/* Header */}
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-3'>
								<button
									onClick={() => {
										setSelectedList(null)
										fetchLists()
									}}
									className='rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text'
								>
									<ArrowLeft className='size-5' />
								</button>
								<div>
									<h1 className='text-xl font-bold text-text'>
										{selectedList.name}
									</h1>
									<p className='text-sm text-text-muted'>
										{selectedList.items.filter(i => i.checked).length}/
										{selectedList.totalItems} items checked
									</p>
								</div>
							</div>
							<div className='flex items-center gap-2'>
								<button
									onClick={handleCopyList}
									className='flex items-center gap-1.5 rounded-lg border border-border-subtle px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-elevated'
									title='Copy list'
								>
									{copySuccess ? (
										<Check className='size-4 text-success' />
									) : (
										<Copy className='size-4' />
									)}
									{copySuccess ? 'Copied!' : 'Copy'}
								</button>
								<button
									onClick={handleShare}
									className='flex items-center gap-1.5 rounded-lg border border-border-subtle px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-elevated'
									title='Share list'
								>
									{shareSuccess ? (
										<Check className='size-4 text-success' />
									) : (
										<Share2 className='size-4' />
									)}
									{shareSuccess ? 'Link copied!' : 'Share'}
								</button>
							</div>
						</div>

						{/* Progress bar */}
						{selectedList.totalItems > 0 && (
							<div className='overflow-hidden rounded-full bg-bg-elevated'>
								<motion.div
									className='h-2 rounded-full bg-gradient-primary'
									initial={{ width: 0 }}
									animate={{ width: `${progress}%` }}
									transition={TRANSITION_SPRING}
								/>
							</div>
						)}

						{/* Add custom item */}
						<AnimatePresence>
							{showAddItem ? (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									className='overflow-hidden rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card'
								>
									<div className='flex items-end gap-3'>
										<div className='flex-1 space-y-2'>
											<label
												htmlFor='shopping-item-name'
												className='text-xs font-medium text-text-muted'
											>
												Item name
											</label>
											<input
												id='shopping-item-name'
												value={newItemForm.ingredient}
												onChange={e =>
													setNewItemForm(prev => ({
														...prev,
														ingredient: e.target.value,
													}))
												}
												placeholder='e.g. Paper towels'
												className='w-full rounded-lg border border-border-subtle bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand'
												onKeyDown={e => e.key === 'Enter' && handleAddItem()}
												autoFocus
											/>
										</div>
										<div className='w-24 space-y-2'>
											<label
												htmlFor='shopping-quantity'
												className='text-xs font-medium text-text-muted'
											>
												Quantity
											</label>
											<input
												id='shopping-quantity'
												value={newItemForm.quantity || ''}
												onChange={e =>
													setNewItemForm(prev => ({
														...prev,
														quantity: e.target.value,
													}))
												}
												placeholder='2 lbs'
												className='w-full rounded-lg border border-border-subtle bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand'
											/>
										</div>
										<button
											onClick={handleAddItem}
											disabled={!newItemForm.ingredient.trim()}
											className='rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90 disabled:opacity-50'
										>
											Add
										</button>
										<button
											onClick={() => {
												setShowAddItem(false)
												setNewItemForm({ ingredient: '' })
											}}
											className='rounded-lg p-2 text-text-muted transition-colors hover:bg-bg-elevated'
										>
											<X className='size-4' />
										</button>
									</div>
								</motion.div>
							) : (
								<motion.button
									onClick={() => setShowAddItem(true)}
									className='flex w-full items-center gap-2 rounded-xl border border-dashed border-border-subtle p-3 text-sm text-text-muted transition-colors hover:border-brand hover:text-brand'
									whileHover={{ scale: 1.01 }}
									whileTap={{ scale: 0.99 }}
								>
									<Plus className='size-4' />
									Add custom item
								</motion.button>
							)}
						</AnimatePresence>

						{/* Items grouped by category */}
						{selectedList.items.length === 0 ? (
							<div className='rounded-xl border border-border-subtle bg-bg-card py-16 text-center shadow-card'>
								<Package className='mx-auto mb-3 size-12 text-text-muted/40' />
								<p className='text-text-muted'>Empty list — add items above</p>
							</div>
						) : (
							<div className='space-y-4'>
								{Object.entries(groupedItems).map(([category, items]) => {
									const config =
										CATEGORY_CONFIG[category] || CATEGORY_CONFIG.Other
									return (
										<motion.div
											key={category}
											layout
											className='rounded-xl border border-border-subtle bg-bg-card shadow-card'
										>
											{/* Category header */}
											<div className='flex items-center gap-2 border-b border-border-subtle px-4 py-3'>
												<span className='text-lg'>{config.icon}</span>
												<span className='text-sm font-semibold text-text'>
													{category}
												</span>
												<span className='ml-auto text-xs text-text-muted'>
													{items.filter(i => i.checked).length}/{items.length}
												</span>
											</div>
											{/* Items */}
											<div className='divide-y divide-border-subtle'>
												{items.map(item => (
													<motion.div
														key={item.itemId}
														layout
														className='group flex items-center gap-3 px-4 py-3'
													>
														{/* Checkbox */}
														<button
															onClick={() => handleToggleItem(item.itemId)}
															className='flex-shrink-0'
														>
															{item.checked ? (
																<CheckCircle2 className='size-5 text-success' />
															) : (
																<Circle className='size-5 text-text-muted transition-colors hover:text-brand' />
															)}
														</button>
														{/* Content */}
														<div className='flex-1 min-w-0'>
															<span
																className={`text-sm transition-all ${
																	item.checked
																		? 'text-text-muted line-through'
																		: 'text-text'
																}`}
															>
																{item.ingredient}
															</span>
															{item.quantity && (
																<span className='ml-2 text-xs text-text-muted'>
																	({item.quantity})
																</span>
															)}
															{item.recipes.length > 0 && (
																<div className='mt-0.5 flex flex-wrap gap-1'>
																	{item.recipes.map(recipe => (
																		<span
																			key={recipe}
																			className='inline-block rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand'
																		>
																			{recipe}
																		</span>
																	))}
																</div>
															)}
															{item.addedManually && (
																<span className='ml-1 text-[10px] text-text-muted'>
																	(custom)
																</span>
															)}
														</div>
														{/* Remove */}
														<button
															onClick={() => handleRemoveItem(item.itemId)}
															className='flex-shrink-0 rounded-md p-1 text-text-muted md:opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive md:group-hover:opacity-100 focus-visible:opacity-100'
															aria-label='Remove item'
														>
															<Trash2 className='size-4' />
														</button>
													</motion.div>
												))}
											</div>
										</motion.div>
									)
								})}
							</div>
						)}
					</div>
				</PageContainer>
			</PageTransition>
		)
	}

	// ── List View (default) ────────────────────────────────────────────

	return (
		<PageTransition>
			<PageContainer maxWidth='lg'>
				<div className='space-y-6 py-6'>
					{/* Header */}
					<div className='flex items-center justify-between'>
						<div>
							<h1 className='text-2xl font-bold text-text'>Shopping Lists</h1>
							<p className='text-sm text-text-muted'>
								{lists.length} {lists.length === 1 ? 'list' : 'lists'}
							</p>
						</div>
						<div className='relative'>
							<motion.button
								onClick={() => setShowCreateMenu(!showCreateMenu)}
								className='flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-warm transition-colors hover:bg-brand/90'
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
							>
								<Plus className='size-4' />
								New List
							</motion.button>

							{/* Create dropdown */}
							<AnimatePresence>
								{showCreateMenu && (
									<>
										<div
											className='fixed inset-0 z-10'
											onClick={() => {
												setShowCreateMenu(false)
												setShowCustomNameInput(false)
												setCustomListName('')
											}}
										/>
										<motion.div
											initial={{ opacity: 0, y: -8, scale: 0.95 }}
											animate={{ opacity: 1, y: 0, scale: 1 }}
											exit={{ opacity: 0, y: -8, scale: 0.95 }}
											transition={{ duration: 0.15 }}
											className='absolute right-0 top-full z-20 mt-2 w-64 rounded-xl border border-border-subtle bg-bg-card p-2 shadow-warm'
										>
											<button
												onClick={handleCreateFromMealPlan}
												disabled={isCreating}
												className='flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-text transition-colors hover:bg-bg-elevated disabled:opacity-50'
											>
												<CalendarDays className='size-4 text-info' />
												<div>
													<div className='font-medium'>From Meal Plan</div>
													<div className='text-xs text-text-muted'>
														Current week&apos;s ingredients
													</div>
												</div>
											</button>
											<button
												onClick={() => setShowCustomNameInput(true)}
												disabled={isCreating}
												className='flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-text transition-colors hover:bg-bg-elevated disabled:opacity-50'
											>
												<FileText className='size-4 text-success' />
												<div>
													<div className='font-medium'>Custom List</div>
													<div className='text-xs text-text-muted'>
														Start with an empty list
													</div>
												</div>
											</button>
											{showCustomNameInput && (
												<div className='mt-2 flex gap-2 border-t border-border-subtle px-3 pt-2'>
													<input
														value={customListName}
														onChange={e => setCustomListName(e.target.value)}
														placeholder='List name...'
														className='flex-1 rounded-lg border border-border-subtle bg-bg px-2 py-1.5 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none'
														onKeyDown={e =>
															e.key === 'Enter' && handleCreateCustom()
														}
														autoFocus
													/>
													<button
														onClick={handleCreateCustom}
														disabled={!customListName.trim() || isCreating}
														className='rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50'
													>
														Create
													</button>
												</div>
											)}
										</motion.div>
									</>
								)}
							</AnimatePresence>
						</div>
					</div>

					{/* Empty state */}
					{lists.length === 0 ? (
						<div className='rounded-xl border border-border-subtle bg-bg-card py-20 text-center shadow-card'>
							<ShoppingCart className='mx-auto mb-4 size-16 text-text-muted/30' />
							<h2 className='mb-2 text-lg font-semibold text-text'>
								No shopping lists yet
							</h2>
							<p className='mb-6 text-sm text-text-muted'>
								Create one from your meal plan or start a custom list
							</p>
							<button
								onClick={() => setShowCreateMenu(true)}
								className='rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-warm transition-colors hover:bg-brand/90'
							>
								Create Your First List
							</button>
						</div>
					) : (
						<div className='grid gap-4 sm:grid-cols-2'>
							{lists.map(list => {
								const sourceConf =
									SOURCE_CONFIG[list.source] || SOURCE_CONFIG.Custom
								const SourceIcon = sourceConf.icon
								const listProgress =
									list.totalItems > 0
										? Math.round((list.checkedItems / list.totalItems) * 100)
										: 0
								return (
									<motion.div
										key={list.id}
										className='group relative cursor-pointer rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card transition-all hover:shadow-warm md:p-5'
										whileHover={CARD_HOVER}
										transition={TRANSITION_SPRING}
										onClick={() => handleOpenList(list.id)}
									>
										{/* Source badge */}
										<div className='mb-3 flex items-center justify-between'>
											<span
												className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${sourceConf.color} ${sourceConf.bg}`}
											>
												<SourceIcon className='size-3' />
												{list.source}
											</span>
											<button
												onClick={e => {
													e.stopPropagation()
													setConfirmingDeleteId(list.id)
												}}
												className='rounded-md p-1 text-text-muted md:opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive md:group-hover:opacity-100 focus-visible:opacity-100'
												aria-label='Delete list'
											>
												<Trash2 className='size-4' />
											</button>
										</div>

										{/* Title */}
										<h3 className='mb-1 text-base font-semibold text-text'>
											{list.name}
										</h3>

										{/* Stats */}
										<p className='mb-3 text-xs text-text-muted'>
											{list.checkedItems}/{list.totalItems} items ·{' '}
											{new Date(list.createdAt).toLocaleDateString()}
										</p>

										{/* Mini progress bar */}
										{list.totalItems > 0 && (
											<div className='overflow-hidden rounded-full bg-bg-elevated'>
												<div
													className='h-1.5 rounded-full bg-gradient-primary transition-all duration-500'
													style={{ width: `${listProgress}%` }}
												/>
											</div>
										)}

										{/* Completion indicator */}
										{listProgress === 100 && list.totalItems > 0 && (
											<div className='mt-2 flex items-center gap-1 text-xs font-medium text-success'>
												<Check className='size-3' />
												Complete!
											</div>
										)}
									</motion.div>
								)
							})}
						</div>
					)}
				</div>

				{/* ── Delete Confirmation Dialog ── */}
				<AnimatePresence>
					{confirmingDeleteId && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'
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
									Delete Shopping List?
								</h3>
								<p className='mb-6 text-sm text-text-muted'>
									This action cannot be undone. All items in this list will be
									permanently removed.
								</p>
								<div className='flex justify-end gap-3'>
									<button
										onClick={() => setConfirmingDeleteId(null)}
										className='rounded-lg px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-elevated'
									>
										Cancel
									</button>
									<button
										onClick={() => handleDeleteList(confirmingDeleteId)}
										className='rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90'
									>
										Delete
									</button>
								</div>
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>
			</PageContainer>
		</PageTransition>
	)
}
