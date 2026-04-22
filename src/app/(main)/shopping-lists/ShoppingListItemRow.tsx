'use client'

import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Circle, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ErrorBoundary } from '@/components/providers/ErrorBoundary'
import { LIST_ITEM_TAP } from '@/lib/motion'
import type { ShoppingListItem } from '@/lib/types/shoppingList'

interface ShoppingListItemRowProps {
	item: ShoppingListItem
	onToggle: (itemId: string) => void
	onRemove: (itemId: string) => void
	removeAriaLabel: string
}

function ShoppingListItemRowFallback({
	error,
	onReset,
}: {
	error?: Error
	onReset: () => void
}) {
	const tCommon = useTranslations('common')

	return (
		<li
			role='alert'
			className='rounded-xl border border-destructive/20 bg-bg-card p-3 shadow-card'
		>
			<div className='flex flex-col gap-2'>
				<div className='flex items-start gap-2'>
					<div className='rounded-full bg-destructive/10 p-2 text-destructive'>
						<AlertCircle className='size-4' />
					</div>
					<div className='min-w-0'>
						<p className='text-sm font-semibold text-text-primary'>
							{tCommon('somethingWentWrong')}
						</p>
						<p className='mt-1 text-xs text-text-secondary'>
							{error?.message || tCommon('unexpectedError')}
						</p>
					</div>
				</div>
				<button
					type='button'
					onClick={onReset}
					className='inline-flex h-9 w-fit items-center justify-center rounded-lg border border-border-subtle px-3 text-xs font-medium text-text-primary transition-colors hover:bg-bg-elevated'
				>
					{tCommon('tryAgain')}
				</button>
			</div>
		</li>
	)
}

function ShoppingListItemRowContent({
	item,
	onToggle,
	onRemove,
	removeAriaLabel,
}: ShoppingListItemRowProps) {
	return (
		<motion.li layout className='group flex items-center gap-3 px-4 py-3'>
			<button
				type='button'
				onClick={() => onToggle(item.itemId)}
				role='checkbox'
				aria-checked={item.checked}
				aria-label={`${item.ingredient}`}
				className='flex-shrink-0'
			>
				{item.checked ? (
					<CheckCircle2 className='size-5 text-success' />
				) : (
					<Circle className='size-5 text-text-muted transition-colors hover:text-brand' />
				)}
			</button>
			<div className='min-w-0 flex-1'>
				<span
					className={`text-sm transition-all ${
						item.checked ? 'text-text-muted line-through' : 'text-text'
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
								className='inline-block rounded-full bg-brand/10 px-2 py-0.5 text-2xs font-medium text-brand'
							>
								{recipe}
							</span>
						))}
					</div>
				)}
				{item.addedManually && (
					<span className='ml-1 text-2xs text-text-muted'>(custom)</span>
				)}
			</div>
			<button
				type='button'
				onClick={() => onRemove(item.itemId)}
				className='flex size-10 flex-shrink-0 items-center justify-center rounded-md text-text-muted opacity-60 transition-all hover:bg-destructive/10 hover:text-destructive active:opacity-100 md:opacity-50 md:group-hover:opacity-100 focus-visible:opacity-100'
				aria-label={removeAriaLabel}
			>
				<Trash2 className='size-4' />
			</button>
		</motion.li>
	)
}

export function ShoppingListItemRow(props: ShoppingListItemRowProps) {
	return (
		<ErrorBoundary
			fallbackRender={({ error, onReset }) => (
				<ShoppingListItemRowFallback error={error} onReset={onReset} />
			)}
		>
			<ShoppingListItemRowContent {...props} />
		</ErrorBoundary>
	)
}
