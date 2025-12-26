'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Recipe } from '@/lib/types/recipe'
import { getDraftRecipes } from '@/services/recipe'
import { Skeleton } from '@/components/ui/skeleton'
import { Clock, FileText, Trash2, Edit3, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	staggerContainer,
	staggerItem,
} from '@/lib/motion'
import Image from 'next/image'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { discardDraft } from '@/services/recipe'
import { toast } from 'sonner'

interface DraftsListProps {
	onSelectDraft: (draft: Recipe) => void
	onNewRecipe: () => void
	className?: string
}

export function DraftsList({
	onSelectDraft,
	onNewRecipe,
	className,
}: DraftsListProps) {
	const [drafts, setDrafts] = useState<Recipe[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<Recipe | null>(null)
	const [isDeleting, setIsDeleting] = useState(false)

	useEffect(() => {
		const fetchDrafts = async () => {
			setIsLoading(true)
			setError(null)
			try {
				const response = await getDraftRecipes()
				if (response.success && response.data) {
					setDrafts(response.data)
				} else {
					setError(response.message || 'Failed to load drafts')
				}
			} catch (err) {
				setError('Failed to load drafts')
			} finally {
				setIsLoading(false)
			}
		}
		fetchDrafts()
	}, [])

	const handleDelete = async () => {
		if (!deleteTarget) return
		setIsDeleting(true)
		try {
			const response = await discardDraft(deleteTarget.id)
			if (response.success) {
				setDrafts(prev => prev.filter(d => d.id !== deleteTarget.id))
				toast.success('Draft deleted')
			} else {
				toast.error('Failed to delete draft')
			}
		} catch (err) {
			toast.error('Failed to delete draft')
		} finally {
			setIsDeleting(false)
			setDeleteTarget(null)
		}
	}

	if (isLoading) {
		return (
			<div className={cn('space-y-4', className)}>
				{[1, 2, 3].map(i => (
					<Skeleton key={i} className='h-24 w-full rounded-2xl' />
				))}
			</div>
		)
	}

	if (error) {
		return (
			<div
				className={cn(
					'rounded-2xl border border-error/20 bg-error/5 p-6 text-center',
					className,
				)}
			>
				<AlertCircle className='mx-auto mb-2 size-8 text-error' />
				<p className='text-error'>{error}</p>
			</div>
		)
	}

	return (
		<>
			<motion.div
				variants={staggerContainer}
				initial='hidden'
				animate='visible'
				className={cn('space-y-4', className)}
			>
				{/* New Recipe CTA */}
				<motion.button
					variants={staggerItem}
					onClick={onNewRecipe}
					whileHover={BUTTON_HOVER}
					whileTap={BUTTON_TAP}
					className='flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-brand/30 bg-brand/5 p-6 text-left transition-colors hover:border-brand hover:bg-brand/10'
				>
					<div className='flex size-12 items-center justify-center rounded-xl bg-gradient-hero text-white'>
						<Edit3 className='size-5' />
					</div>
					<div>
						<div className='font-bold text-text'>Create New Recipe</div>
						<div className='text-sm text-text-muted'>
							Start fresh with AI or manual entry
						</div>
					</div>
				</motion.button>

				{/* Drafts List */}
				{drafts.length > 0 && (
					<div className='space-y-2'>
						<h3 className='text-sm font-semibold uppercase tracking-wide text-text-muted'>
							Your Drafts ({drafts.length})
						</h3>
						<AnimatePresence mode='popLayout'>
							{drafts.map(draft => (
								<motion.div
									key={draft.id}
									variants={staggerItem}
									layout
									exit={{ opacity: 0, x: -20 }}
									className='group relative flex items-center gap-4 rounded-2xl border border-border-subtle bg-bg-card p-4 shadow-card transition-all hover:border-brand/30 hover:shadow-warm'
								>
									{/* Thumbnail */}
									<div className='flex size-16 flex-shrink-0 items-center justify-center rounded-xl bg-bg-elevated text-2xl'>
										{draft.coverImageUrl?.[0] ? (
											<Image
												src={draft.coverImageUrl[0]}
												alt={draft.title}
												width={64}
												height={64}
												className='size-full rounded-xl object-cover'
											/>
										) : (
											<FileText className='size-6 text-text-muted' />
										)}
									</div>

									{/* Content */}
									<button
										onClick={() => onSelectDraft(draft)}
										className='flex flex-1 flex-col items-start text-left'
									>
										<div className='font-semibold text-text'>
											{draft.title || 'Untitled Recipe'}
										</div>
										<div className='flex items-center gap-2 text-xs text-text-muted'>
											<Clock className='size-3' />
											<span>
												{draft.updatedAt
													? `Edited ${formatDistanceToNow(new Date(draft.updatedAt), { addSuffix: true })}`
													: 'No changes yet'}
											</span>
										</div>
										{draft.description && (
											<div className='mt-1 line-clamp-1 text-sm text-text-secondary'>
												{draft.description}
											</div>
										)}
									</button>

									{/* Delete Button */}
									<motion.button
										onClick={e => {
											e.stopPropagation()
											setDeleteTarget(draft)
										}}
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.9 }}
										className='flex size-9 items-center justify-center rounded-lg text-text-muted opacity-0 transition-all hover:bg-error/10 hover:text-error group-hover:opacity-100'
									>
										<Trash2 className='size-4' />
									</motion.button>
								</motion.div>
							))}
						</AnimatePresence>
					</div>
				)}

				{/* Empty State */}
				{drafts.length === 0 && (
					<motion.div
						variants={staggerItem}
						className='rounded-2xl border border-border-subtle bg-bg-card p-8 text-center'
					>
						<FileText className='mx-auto mb-3 size-12 text-text-muted' />
						<div className='font-semibold text-text'>No drafts yet</div>
						<div className='text-sm text-text-muted'>
							Your saved recipe drafts will appear here
						</div>
					</motion.div>
				)}
			</motion.div>

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={!!deleteTarget}
				onOpenChange={open => !open && setDeleteTarget(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Draft?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete &quot;
							{deleteTarget?.title || 'Untitled Recipe'}&quot;. This action
							cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleting}
							className='bg-error text-white hover:bg-error/90'
						>
							{isDeleting ? 'Deleting...' : 'Delete'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
