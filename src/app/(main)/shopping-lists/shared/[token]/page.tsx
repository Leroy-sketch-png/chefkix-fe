'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
	ShoppingCart,
	Check,
	Circle,
	Package,
	UserPlus,
	AlertCircle,
} from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PageHeader } from '@/components/layout/PageHeader'
import { ErrorState } from '@/components/ui/error-state'
import { Button } from '@/components/ui/button'
import { TRANSITION_SPRING, LIST_ITEM_TAP, DURATION_S } from '@/lib/motion'
import { getSharedShoppingList } from '@/services/shoppingList'
import type {
	ShoppingListResponse,
	ShoppingListItem,
} from '@/lib/types/shoppingList'
import { CATEGORY_CONFIG } from '@/lib/types/shoppingList'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { PATHS } from '@/constants/paths'

// ── Skeleton ─────────────────────────────────────────────────────

function SharedListSkeleton() {
	return (
		<PageContainer>
			<div className='mx-auto max-w-lg animate-pulse'>
				{/* Header skeleton */}
				<div className='mb-6'>
					<div className='mb-2 h-8 w-48 rounded-radius bg-bg-elevated' />
					<div className='h-5 w-32 rounded-radius bg-bg-elevated' />
				</div>

				{/* Progress bar skeleton */}
				<div className='mb-8 rounded-radius-lg bg-bg-card p-4 shadow-card'>
					<div className='mb-2 flex justify-between'>
						<div className='h-4 w-24 rounded bg-bg-elevated' />
						<div className='h-4 w-16 rounded bg-bg-elevated' />
					</div>
					<div className='h-2 w-full rounded-full bg-bg-elevated' />
				</div>

				{/* Category group skeletons */}
				{[1, 2, 3].map(g => (
					<div key={g} className='mb-6'>
						<div className='mb-3 h-5 w-28 rounded bg-bg-elevated' />
						<div className='space-y-2'>
							{[1, 2, 3].map(i => (
								<div
									key={i}
									className='h-12 rounded-radius bg-bg-card shadow-card'
								/>
							))}
						</div>
					</div>
				))}
			</div>
		</PageContainer>
	)
}

// ── Page ─────────────────────────────────────────────────────────

export default function SharedShoppingListPage() {
	const params = useParams<{ token: string }>()
	const t = useTranslations('sharedShoppingList')
	const tCommon = useTranslations('common')

	const [list, setList] = useState<ShoppingListResponse | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<'not-found' | 'network' | null>(null)

	// ── Fetch shared list ────────────────────────────────────────

	useEffect(() => {
		async function fetchList() {
			try {
				setIsLoading(true)
				setError(null)
				const data = await getSharedShoppingList(params.token)
				setList(data)
			} catch (err: unknown) {
				const status =
					err && typeof err === 'object' && 'response' in err
						? (err as { response?: { status?: number } }).response?.status
						: undefined
				setError(status === 404 || status === 410 ? 'not-found' : 'network')
			} finally {
				setIsLoading(false)
			}
		}
		if (params.token) {
			fetchList()
		}
	}, [params.token])

	// ── Group items by category ──────────────────────────────────

	const groupedItems = useMemo(() => {
		if (!list) return {}
		const groups: Record<string, ShoppingListItem[]> = {}
		for (const item of list.items) {
			const cat = item.category || 'Other'
			if (!groups[cat]) groups[cat] = []
			groups[cat].push(item)
		}
		const sorted: Record<string, ShoppingListItem[]> = {}
		Object.keys(groups)
			.sort((a, b) => a.localeCompare(b))
			.forEach(key => {
				sorted[key] = groups[key]
			})
		return sorted
	}, [list])

	const categoryKeys = Object.keys(groupedItems)

	// ── Loading ──────────────────────────────────────────────────

	if (isLoading) {
		return <SharedListSkeleton />
	}

	// ── Error: Not Found / Expired ───────────────────────────────

	if (error === 'not-found') {
		return (
			<PageContainer>
				<PageTransition>
					<div className='flex min-h-content-tall flex-col items-center justify-center px-4'>
						<div className='mx-auto max-w-md text-center'>
							<div className='mb-6 flex justify-center'>
								<div className='rounded-full bg-warning/10 p-6'>
									<AlertCircle className='size-16 text-warning' />
								</div>
							</div>
							<h1 className='mb-2 text-2xl font-bold text-text'>
								{t('notFoundTitle')}
							</h1>
							<p className='mb-8 text-text-secondary'>{t('notFoundDesc')}</p>
							<Link href={PATHS.EXPLORE}>
								<Button variant='default' size='lg'>
									{t('browseRecipes')}
								</Button>
							</Link>
						</div>
					</div>
				</PageTransition>
			</PageContainer>
		)
	}

	// ── Error: Network ───────────────────────────────────────────

	if (error === 'network' || !list) {
		return (
			<PageContainer>
				<PageTransition>
					<ErrorState
						title={t('networkErrorTitle')}
						message={t('networkErrorDesc')}
						onRetry={() => {
							setError(null)
							setIsLoading(true)
							getSharedShoppingList(params.token)
								.then(data => setList(data))
								.catch(() => setError('network'))
								.finally(() => setIsLoading(false))
						}}
					/>
				</PageTransition>
			</PageContainer>
		)
	}

	// ── Progress ─────────────────────────────────────────────────

	const checkedCount = list.items.filter(i => i.checked).length
	const totalCount = list.items.length
	const progressPct = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0
	const isComplete = totalCount > 0 && checkedCount === totalCount

	// ── Render ───────────────────────────────────────────────────

	return (
		<PageContainer>
			<PageTransition>
				<div className='mx-auto max-w-lg'>
					{/* Header */}
					<PageHeader
						title={list.name}
						subtitle={t('sharedSubtitle', { count: totalCount })}
						showBack
						gradient='warm'
						icon={ShoppingCart}
					/>

					{/* Progress bar */}
					<motion.div
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ ...TRANSITION_SPRING, delay: 0.1 }}
						className='mb-8 rounded-radius-lg bg-bg-card p-4 shadow-card'
					>
						<div className='mb-2 flex items-center justify-between text-sm'>
							<span className='text-text-secondary'>{t('progress')}</span>
							<span
								className={`font-semibold ${isComplete ? 'text-success' : 'text-text'}`}
							>
								{isComplete
									? t('allDone')
									: t('itemsOf', {
											checked: checkedCount,
											total: totalCount,
										})}
							</span>
						</div>
						<div className='h-2 w-full overflow-hidden rounded-full bg-bg-elevated'>
							<motion.div
								className={`h-full rounded-full ${isComplete ? 'bg-success' : 'bg-brand'}`}
								initial={{ width: 0 }}
								animate={{ width: `${progressPct}%` }}
								transition={{
									duration: DURATION_S.smooth,
									ease: 'easeOut',
								}}
							/>
						</div>
					</motion.div>

					{/* Empty list */}
					{totalCount === 0 && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className='flex flex-col items-center justify-center py-16 text-center'
						>
							<Package className='mb-4 size-12 text-text-muted' />
							<p className='text-lg font-medium text-text'>{t('emptyTitle')}</p>
							<p className='mt-1 text-sm text-text-secondary'>
								{t('emptyDesc')}
							</p>
						</motion.div>
					)}

					{/* Item groups by category */}
					{categoryKeys.map((category, groupIdx) => {
						const items = groupedItems[category]
						const config = CATEGORY_CONFIG[category] || {
							icon: '📦',
							color: 'text-text-muted',
						}

						return (
							<motion.div
								key={category}
								initial={{ opacity: 0, y: 16 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{
									...TRANSITION_SPRING,
									delay: 0.15 + groupIdx * 0.05,
								}}
								className='mb-6'
							>
								{/* Category header */}
								<div className='mb-3 flex items-center gap-2'>
									<span className='text-lg'>{config.icon}</span>
									<h3
										className={`text-sm font-semibold uppercase tracking-wide ${config.color}`}
									>
										{category}
									</h3>
									<span className='text-xs text-text-muted'>
										({items.length})
									</span>
								</div>

								{/* Items */}
								<div className='space-y-1'>
									{items.map(item => (
										<motion.div
											key={item.itemId}
											whileTap={LIST_ITEM_TAP}
											className={`flex items-center gap-3 rounded-radius bg-bg-card px-4 py-3 shadow-card transition-colors ${
												item.checked ? 'opacity-60' : ''
											}`}
										>
											{/* Check indicator (read-only) */}
											{item.checked ? (
												<Check className='size-4 flex-shrink-0 text-success' />
											) : (
												<Circle className='size-4 flex-shrink-0 text-text-muted' />
											)}

											{/* Ingredient */}
											<span
												className={`flex-1 text-sm ${
													item.checked
														? 'text-text-muted line-through'
														: 'text-text'
												}`}
											>
												{item.ingredient}
											</span>

											{/* Quantity + unit */}
											{(item.quantity || item.unit) && (
												<span className='flex-shrink-0 text-xs font-medium text-text-secondary'>
													{[item.quantity, item.unit].filter(Boolean).join(' ')}
												</span>
											)}
										</motion.div>
									))}
								</div>
							</motion.div>
						)
					})}

					{/* CTA — Sign Up / Create your own */}
					<motion.div
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							...TRANSITION_SPRING,
							delay: 0.15 + categoryKeys.length * 0.05 + 0.1,
						}}
						className='mt-8 rounded-radius-lg border border-border-subtle bg-bg-card p-6 text-center shadow-card'
					>
						<UserPlus className='mx-auto mb-3 size-8 text-brand' />
						<h3 className='mb-1 text-lg font-semibold text-text'>
							{t('ctaTitle')}
						</h3>
						<p className='mb-4 text-sm text-text-secondary'>{t('ctaDesc')}</p>
						<div className='flex justify-center gap-3'>
							<Link href={PATHS.AUTH.SIGN_UP}>
								<Button variant='default' size='lg'>
									{t('ctaSignUp')}
								</Button>
							</Link>
							<Link href={PATHS.EXPLORE}>
								<Button variant='outline' size='lg'>
									{t('ctaBrowse')}
								</Button>
							</Link>
						</div>
					</motion.div>
				</div>
			</PageTransition>

			<div className='pb-40 md:pb-8' />
		</PageContainer>
	)
}
