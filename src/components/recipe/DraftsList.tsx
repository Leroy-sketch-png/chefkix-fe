'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Recipe, RecipeSummary } from '@/lib/types/recipe'
import { getDraftRecipes } from '@/services/recipe'
import { Skeleton } from '@/components/ui/skeleton'
import { Clock, FileText, Trash2, Edit3, AlertCircle, Copy } from 'lucide-react'
import { EmptyStateGamified } from '@/components/shared'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	ICON_BUTTON_HOVER,
	ICON_BUTTON_TAP,
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
import { discardDraft, duplicateRecipe } from '@/services/recipe'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface DraftsListProps {
	/**
	 * Called when user selects a draft to edit.
	 * Receives draft ID — caller is responsible for fetching full recipe data.
	 */
	onSelectDraft: (draftId: string) => void
	onNewRecipe: () => void
	/** Called after a draft is successfully duplicated. Receives the new draft ID. */
	onDuplicated?: (newDraftId: string) => void
	className?: string
}

function recipeToSummary(recipe: Recipe): RecipeSummary {
	return {
		id: recipe.id,
		createdAt: recipe.createdAt,
		updatedAt: recipe.updatedAt,
		recipeStatus: recipe.recipeStatus,
		title: recipe.title,
		description: recipe.description,
		coverImageUrl: recipe.coverImageUrl,
		difficulty: recipe.difficulty,
		totalTimeMinutes: recipe.totalTimeMinutes,
		servings: recipe.servings,
		cuisineType: recipe.cuisineType,
		xpReward: recipe.xpReward,
		badges: recipe.rewardBadges,
		likeCount: recipe.likeCount,
		saveCount: recipe.saveCount,
		viewCount: recipe.viewCount,
		author: recipe.author,
		isLiked: recipe.isLiked,
		isSaved: recipe.isSaved,
	}
}

export function DraftsList({
	onSelectDraft,
	onNewRecipe,
	onDuplicated,
	className,
}: DraftsListProps) {
	const [drafts, setDrafts] = useState<RecipeSummary[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<RecipeSummary | null>(null)
	const [isDeleting, setIsDeleting] = useState(false)
	const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
	const t = useTranslations('recipe')

	useEffect(() => {
		const fetchDrafts = async () => {
			setIsLoading(true)
			setError(null)
			try {
				const response = await getDraftRecipes()
				if (response.success && response.data) {
					setDrafts(response.data)
				} else {
					setError(response.message || t('failedToLoadDrafts'))
				}
			} catch (err) {
				setError(t('failedToLoadDrafts'))
			} finally {
				setIsLoading(false)
			}
		}
		fetchDrafts()
	}, [t])

	const handleDuplicate = async (draftId: string) => {
		if (duplicatingId) return
		setDuplicatingId(draftId)
		try {
			const response = await duplicateRecipe(draftId)
			if (response.success && response.data) {
				// Add the new draft to the top of the list
				const newDraft = recipeToSummary(response.data)
				setDrafts(prev => [newDraft, ...prev])
				toast.success(t('draftDuplicated'))
				onDuplicated?.(response.data.id)
			} else {
				toast.error(response.message || t('failedToDuplicate'))
			}
		} catch {
			toast.error(t('failedToDuplicateDraft'))
		} finally {
			setDuplicatingId(null)
		}
	}

	const handleDelete = async () => {
		if (!deleteTarget) return
		setIsDeleting(true)
		try {
			const response = await discardDraft(deleteTarget.id)
			if (response.success) {
				setDrafts(prev => prev.filter(d => d.id !== deleteTarget.id))
				toast.success(t('draftDeleted'))
			} else {
				toast.error(t('failedToDeleteDraft'))
			}
		} catch (err) {
			toast.error(t('failedToDeleteDraft'))
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
					type='button'
					variants={staggerItem}
					onClick={onNewRecipe}
					whileHover={BUTTON_HOVER}
					whileTap={BUTTON_TAP}
					className='flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-brand/30 bg-brand/5 p-6 text-left transition-colors hover:border-brand hover:bg-brand/10 focus-visible:ring-2 focus-visible:ring-brand/50'
				>
					<div className='flex size-12 items-center justify-center rounded-xl bg-gradient-hero text-white'>
						<Edit3 className='size-5' />
					</div>
					<div>
						<div className='font-bold text-text'>{t('createNewRecipe')}</div>
						<div className='text-sm text-text-muted'>
							{t('startFreshSubtitle')}
						</div>
					</div>
				</motion.button>

				{/* Drafts List */}
				{drafts.length > 0 && (
					<div className='space-y-2'>
						<h3 className='text-sm font-semibold uppercase tracking-wide text-text-muted'>
							{t('yourDraftsCount', { count: drafts.length })}
						</h3>
						<AnimatePresence mode='popLayout'>
							{drafts.map(draft => (
								<motion.div
									key={draft.id}
									variants={staggerItem}
									layout
									exit={{ opacity: 0, x: -20 }}
									className='group relative flex items-center gap-4 rounded-2xl border border-border-subtle bg-bg-card p-4 transition-all hover:border-brand/50 hover:bg-bg-elevated'
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
										type='button'
										onClick={() => onSelectDraft(draft.id)}
										className='flex flex-1 flex-col items-start text-left'
									>
										<div className='font-semibold text-text'>
										{draft.title || t('untitledRecipe')}
										</div>
										<div className='flex items-center gap-2 text-xs text-text-muted'>
											<Clock className='size-3' />
											<span>
												{draft.createdAt
												? t('createdAgo', { time: formatDistanceToNow(new Date(draft.createdAt), { addSuffix: true }) })
												: t('draft')}
											</span>
										</div>
										{draft.description && (
											<div className='mt-1 line-clamp-1 text-sm text-text-secondary'>
												{draft.description}
											</div>
										)}
									</button>

									{/* Action Buttons */}
									<div className='flex items-center gap-1 md:opacity-0 transition-opacity md:group-hover:opacity-100 focus-within:opacity-100'>
										{/* Duplicate Button */}
										<motion.button
											type='button'
											onClick={e => {
												e.stopPropagation()
												handleDuplicate(draft.id)
											}}
											whileHover={ICON_BUTTON_HOVER}
											whileTap={ICON_BUTTON_TAP}
											disabled={duplicatingId === draft.id}
											title={t('duplicateDraft')}
											className='flex size-9 items-center justify-center rounded-lg text-text-muted transition-all hover:bg-brand/10 hover:text-brand disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand/50'
										>
											<Copy
												className={cn(
													'size-4',
													duplicatingId === draft.id && 'animate-pulse',
												)}
											/>
										</motion.button>
										{/* Delete Button */}
										<motion.button
											type='button'
											onClick={e => {
												e.stopPropagation()
												setDeleteTarget(draft)
											}}
											whileHover={ICON_BUTTON_HOVER}
											whileTap={ICON_BUTTON_TAP}
											title={t('deleteDraft')}
											className='flex size-9 items-center justify-center rounded-lg text-text-muted transition-all hover:bg-error/10 hover:text-error focus-visible:ring-2 focus-visible:ring-brand/50'
										>
											<Trash2 className='size-4' />
										</motion.button>
									</div>
								</motion.div>
							))}
						</AnimatePresence>
					</div>
				)}

				{/* Empty State */}
				{drafts.length === 0 && (
					<EmptyStateGamified
						variant='custom'
						title={t('noDraftsYet')}
						description={t('noDraftsDescription')}
						emoji='📝'
						primaryAction={{ label: t('createRecipe'), href: '/create' }}
					/>
				)}
			</motion.div>

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={!!deleteTarget}
				onOpenChange={open => !open && setDeleteTarget(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t('deleteDraftTitle')}</AlertDialogTitle>
						<AlertDialogDescription>
							{t('deleteDraftDescription', { title: deleteTarget?.title || t('untitledRecipe') })}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>{t('cancel')}</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleting}
							className='bg-error text-white hover:bg-error/90'
						>
							{isDeleting ? t('deleting') : t('delete')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
