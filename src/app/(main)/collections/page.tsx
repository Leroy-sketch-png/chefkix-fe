'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
	FolderHeart,
	BookOpen,
	Plus,
	Sparkles,
	Trash2,
	Globe,
	Lock,
	Image as ImageIcon,
} from 'lucide-react'
import NextImage from 'next/image'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { toast } from 'sonner'
import {
	CollectionBuilder,
	type CollectionBuilderData,
} from '@/components/collections'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PageHeader } from '@/components/layout/PageHeader'
import {
	PremiumSurface,
	SurfaceSectionHeader,
} from '@/components/layout/PremiumSurface'
import { ErrorState } from '@/components/ui/error-state'
import { EmptyState } from '@/components/shared/EmptyStateGamified'
import { Portal } from '@/components/ui/portal'
import { MagicCard } from '@/components/ui/magic-card'
import {
	TRANSITION_SPRING,
	CARD_HOVER,
	BUTTON_SUBTLE_HOVER,
	BUTTON_SUBTLE_TAP,
} from '@/lib/motion'
import { Collection, CreateCollectionRequest } from '@/lib/types/collection'
import {
	getMyCollections,
	createCollection,
	deleteCollection,
} from '@/services/collection'
import { useTranslations } from 'next-intl'
import { GridPattern } from '@/components/ui/grid-pattern'

export default function CollectionsPage() {
	const router = useRouter()
	const t = useTranslations('collections')
	const [collections, setCollections] = useState<Collection[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [showCreateModal, setShowCreateModal] = useState(false)
	const [showLearningPathModal, setShowLearningPathModal] = useState(false)
	const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
		null,
	)
	const [isCreating, setIsCreating] = useState(false)
	const [isCreatingLearningPath, setIsCreatingLearningPath] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [fetchError, setFetchError] = useState(false)

	useEscapeKey(showCreateModal, () => setShowCreateModal(false))
	useEscapeKey(showLearningPathModal, () => setShowLearningPathModal(false))
	useEscapeKey(!!confirmingDeleteId && !showCreateModal, () =>
		setConfirmingDeleteId(null),
	)

	// Create form state
	const [newName, setNewName] = useState('')
	const [newDescription, setNewDescription] = useState('')
	const [newIsPublic, setNewIsPublic] = useState(false)

	const isMountedRef = useRef(true)
	useEffect(() => {
		isMountedRef.current = true
		return () => {
			isMountedRef.current = false
		}
	}, [])

	const fetchCollections = useCallback(async () => {
		try {
			const response = await getMyCollections()
			if (!isMountedRef.current) return
			if (response.success && response.data) {
				setCollections(response.data)
				setFetchError(false)
			} else {
				setFetchError(true)
			}
		} catch {
			if (!isMountedRef.current) return
			setFetchError(true)
			toast.error(t('failedToLoadCollections'))
		} finally {
			if (isMountedRef.current) setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchCollections()
	}, [fetchCollections])

	const getCollectionItemCount = (collection: Collection) => {
		const derivedCount =
			(collection.postIds?.length ?? 0) + (collection.recipeIds?.length ?? 0)
		return Math.max(collection.itemCount, derivedCount)
	}

	const getCollectionTypeMeta = (collection: Collection) => {
		switch (collection.collectionType) {
			case 'LEARNING_PATH':
				return {
					label: t('typeLearningPath'),
					icon: BookOpen,
					className: 'bg-xp/10 text-xp',
				}
			case 'SEASONAL':
				return {
					label: t('typeSeasonal'),
					icon: Sparkles,
					className: 'bg-brand/10 text-brand',
				}
			default:
				return {
					label: t('typeCollection'),
					icon: FolderHeart,
					className: 'bg-pink/10 text-pink',
				}
		}
	}

	const getCollectionCountLabel = (collection: Collection) => {
		const totalItems = getCollectionItemCount(collection)
		const recipeCount = collection.recipeIds?.length ?? 0
		const postCount = collection.postIds?.length ?? 0

		if (collection.collectionType === 'LEARNING_PATH') {
			return t('recipeCount', { count: totalItems })
		}

		if (recipeCount > 0 && postCount === 0) {
			return t('recipeCount', { count: totalItems })
		}

		if (postCount > 0 && recipeCount === 0) {
			return t('postCount', { count: totalItems })
		}

		return t('itemCount', { count: totalItems })
	}

	const handleCreate = async () => {
		if (!newName.trim()) {
			toast.error(t('nameRequired'))
			return
		}
		setIsCreating(true)
		const data: CreateCollectionRequest = {
			name: newName.trim(),
			description: newDescription.trim() || undefined,
			isPublic: newIsPublic,
		}
		const response = await createCollection(data)
		if (response.success && response.data) {
			setCollections(prev => [response.data!, ...prev])
			setShowCreateModal(false)
			setNewName('')
			setNewDescription('')
			setNewIsPublic(false)
			toast.success(t('created'))
		} else {
			toast.error(t('createFailed'))
		}
		setIsCreating(false)
	}

	const handleCreateLearningPath = async (data: CollectionBuilderData) => {
		if (isCreatingLearningPath) return

		setIsCreatingLearningPath(true)
		const response = await createCollection({
			name: data.name,
			description: data.description || undefined,
			isPublic: data.isPublic,
			collectionType: data.collectionType,
			recipeIds: data.recipeIds,
			difficulty: data.difficulty,
			totalXp: data.totalXp,
			difficultyProgression: data.difficultyProgression,
		})

		if (response.success && response.data) {
			setCollections(prev => [response.data!, ...prev])
			setShowLearningPathModal(false)
			toast.success(t('learningPathCreated'))
			router.push(`/collections/${response.data.id}`)
			return
		}

		toast.error(response.message || t('learningPathCreateFailed'))
		setIsCreatingLearningPath(false)
	}

	const handleDelete = async (id: string) => {
		setIsDeleting(true)
		const response = await deleteCollection(id)
		if (response.success) {
			setCollections(prev => prev.filter(c => c.id !== id))
			toast.success(t('deleted'))
		} else {
			toast.error(t('deleteFailed'))
		}
		setConfirmingDeleteId(null)
		setIsDeleting(false)
	}

	if (isLoading) {
		return (
			<PageTransition>
				<PageContainer maxWidth='xl'>
					<div className='space-y-6 py-6'>
						<div className='h-8 w-48 animate-pulse rounded-xl bg-bg-elevated' />
						<div className='grid gap-4 sm:grid-cols-2'>
							{[1, 2, 3, 4].map(i => (
								<div
									key={i}
									className='h-32 animate-pulse rounded-xl bg-bg-elevated'
								/>
							))}
						</div>
					</div>
				</PageContainer>
			</PageTransition>
		)
	}

	if (fetchError) {
		return (
			<PageTransition>
				<PageContainer maxWidth='xl'>
					<ErrorState
						title={t('loadFailed')}
						message={t('loadFailedMessage')}
						onRetry={() => {
							setIsLoading(true)
							setFetchError(false)
							fetchCollections()
						}}
					/>
				</PageContainer>
			</PageTransition>
		)
	}

	return (
		<PageTransition>
			<PageContainer maxWidth='xl'>
				<div className='space-y-6 py-6'>
					{/* Header */}
					<PageHeader
						icon={FolderHeart}
						title={t('myCollections')}
						subtitle={t('myCollectionsSubtitle')}
						gradient='pink'
						rightAction={
							<div className='flex flex-wrap items-center justify-end gap-2'>
								<motion.button
									type='button'
									onClick={() => setShowLearningPathModal(true)}
									className='flex items-center gap-1.5 rounded-xl border border-border-subtle bg-bg-card px-3 py-1.5 text-sm font-semibold text-text-primary shadow-card focus-visible:ring-2 focus-visible:ring-brand/50'
									whileHover={BUTTON_SUBTLE_HOVER}
									whileTap={BUTTON_SUBTLE_TAP}
								>
									<BookOpen className='size-4' />
									{t('newLearningPath')}
								</motion.button>
								<motion.button
									type='button'
									onClick={() => setShowCreateModal(true)}
									className='flex items-center gap-1.5 rounded-xl bg-brand px-3 py-1.5 text-sm font-semibold text-white shadow-warm focus-visible:ring-2 focus-visible:ring-brand/50'
									whileHover={BUTTON_SUBTLE_HOVER}
									whileTap={BUTTON_SUBTLE_TAP}
								>
									<Plus className='size-4' />
									{t('newCollection')}
								</motion.button>
							</div>
						}
						marginBottom='sm'
					/>

					{collections.length === 0 && (
						<SurfaceSectionHeader
							eyebrow={t('libraryEyebrow')}
							chipText={t('libraryCount', { count: collections.length })}
							className='mb-4'
						/>
					)}

					{/* Collections Grid */}
					{collections.length === 0 ? (
						<MagicCard
							mode='orb'
							glowFrom='var(--color-brand)'
							glowTo='var(--color-xp)'
							className='rounded-2xl border border-border-subtle bg-bg-card/75 backdrop-blur-md overflow-hidden shadow-card p-1'
						>
							<div className='relative z-10 w-full'>
								<EmptyState
									variant='saved'
									title={t('noCollections')}
									description={t('noCollectionsDesc')}
									emoji='📁'
									primaryAction={{
										label: t('createFirst'),
										onClick: () => setShowCreateModal(true),
										icon: <Plus className='size-4' />,
									}}
								/>
							</div>
						</MagicCard>
					) : (
						<PremiumSurface
							eyebrow={t('libraryEyebrow')}
							chipText={t('libraryCount', { count: collections.length })}
							className='p-4 md:p-5'
						>
							<div className='grid gap-4 md:grid-cols-2'>
								{collections.map(collection =>
									(() => {
										const typeMeta = getCollectionTypeMeta(collection)
										const TypeIcon = typeMeta.icon
										return (
											<motion.div
												key={collection.id}
												whileHover={CARD_HOVER}
												transition={TRANSITION_SPRING}
												className='group relative cursor-pointer'
												onClick={() =>
													router.push(`/collections/${collection.id}`)
												}
											>
												<MagicCard
													mode='orb'
													glowFrom='var(--color-brand)'
													glowTo='var(--color-pink)'
													className='overflow-hidden rounded-2xl border border-border-subtle bg-bg-card/75 backdrop-blur-md shadow-card transition-all group-hover:shadow-warm p-0'
												>
													{/* Cover image or placeholder */}
													<div className='relative h-32 bg-bg-elevated z-10'>
														{collection.coverImageUrl ? (
															<NextImage
																src={collection.coverImageUrl}
																alt={collection.name}
																fill
																sizes='(max-width: 768px) 100vw, 50vw'
																className='object-cover'
																unoptimized
															/>
														) : (
															<div className='flex size-full items-center justify-center bg-gradient-to-br from-brand/10 via-pink/5 to-xp/10 dark:from-brand/20 dark:via-pink/10 dark:to-xp/15 relative overflow-hidden'>
																<GridPattern
																	size={16}
																	color='var(--color-brand)'
																	className='absolute inset-0 opacity-20'
																/>
																<ImageIcon className='size-8 text-brand/35 relative z-10 animate-pulse' />
															</div>
														)}
														<div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent' />
														{/* Visibility badge */}
														<div className='absolute left-3 top-3'>
															<span
																className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${typeMeta.className}`}
															>
																<TypeIcon className='size-3' />
																{typeMeta.label}
															</span>
														</div>
														<div className='absolute right-3 top-3'>
															<span
																className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
																	collection.isPublic
																		? 'bg-success/10 text-success'
																		: 'bg-white/20 text-white'
																}`}
															>
																{collection.isPublic ? (
																	<Globe className='size-3' />
																) : (
																	<Lock className='size-3' />
																)}
																{collection.isPublic
																	? t('public')
																	: t('private')}
															</span>
														</div>
													</div>

													{/* Info */}
													<div className='p-4 z-10 relative'>
														<div className='flex items-start justify-between'>
															<div className='min-w-0 flex-1'>
																<h3 className='truncate font-semibold text-text-primary group-hover:text-brand transition-colors duration-300'>
																	{collection.name}
																</h3>
																{collection.description && (
																	<p className='mt-1 line-clamp-1 text-sm text-text-muted'>
																		{collection.description}
																	</p>
																)}
																<p className='mt-2 text-xs font-medium text-text-secondary'>
																	{getCollectionCountLabel(collection)}
																</p>
															</div>
															<button
																type='button'
																onClick={e => {
																	e.stopPropagation()
																	setConfirmingDeleteId(collection.id)
																}}
																className='ml-2 flex-shrink-0 rounded-md p-1 text-text-muted transition-all hover:bg-destructive/10 hover:text-destructive md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100'
																aria-label={t('deleteTitle')}
															>
																<Trash2 className='size-4' />
															</button>
														</div>
													</div>
												</MagicCard>
											</motion.div>
										)
									})(),
								)}
							</div>
						</PremiumSurface>
					)}
				</div>

				{/* Bottom breathing room for MobileBottomNav */}
				<div className='pb-[calc(var(--h-mobile-nav)+var(--space-16))] md:pb-8' />
			</PageContainer>

			{/* Create Collection Modal */}
			<AnimatePresence>
				{showCreateModal && (
					<Portal>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							role='dialog'
							aria-modal='true'
							aria-label={t('newCollection')}
							className='fixed inset-0 z-modal flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'
							onClick={() => setShowCreateModal(false)}
						>
							<motion.div
								initial={{ opacity: 0, scale: 0.95, y: 20 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.95, y: 20 }}
								transition={TRANSITION_SPRING}
								className='w-full max-w-md rounded-2xl overflow-hidden shadow-warm p-0'
								onClick={e => e.stopPropagation()}
								role='dialog'
								aria-modal='true'
								aria-labelledby='create-collection-title'
							>
								<MagicCard
									mode='orb'
									glowFrom='var(--color-brand)'
									glowTo='var(--color-pink)'
									className='w-full bg-bg-card/95 backdrop-blur-md p-6 border border-border-subtle rounded-2xl'
								>
									<div className='relative z-10 w-full'>
										<h2
											className='mb-4 text-lg font-bold text-text-primary'
											id='create-collection-title'
										>
											{t('newCollection')}
										</h2>
										<div className='space-y-4'>
											<div>
												<label className='mb-1 block text-sm font-medium text-text-secondary'>
													{t('nameLabel')}
												</label>
												<input
													type='text'
													value={newName}
													onChange={e => setNewName(e.target.value)}
													placeholder={t('namePlaceholder')}
													maxLength={60}
													className='w-full rounded-xl border border-border-subtle bg-bg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50'
													autoFocus
												/>
											</div>
											<div>
												<label className='mb-1 block text-sm font-medium text-text-secondary'>
													{t('descriptionLabel')}{' '}
													<span className='text-text-muted'>
														{t('descriptionOptional')}
													</span>
												</label>
												<input
													type='text'
													value={newDescription}
													onChange={e => setNewDescription(e.target.value)}
													placeholder={t('descriptionPlaceholder')}
													maxLength={200}
													className='w-full rounded-xl border border-border-subtle bg-bg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50'
												/>
											</div>
											<label className='flex cursor-pointer items-center gap-3'>
												<input
													type='checkbox'
													checked={newIsPublic}
													onChange={e => setNewIsPublic(e.target.checked)}
													className='size-4 rounded border-border-subtle accent-brand'
												/>
												<span className='text-sm text-text-primary'>
													{t('makePublic')}
												</span>
											</label>
										</div>
										<div className='mt-6 flex justify-end gap-3'>
											<button
												type='button'
												onClick={() => setShowCreateModal(false)}
												className='rounded-xl px-4 py-2.5 text-sm font-medium text-text-muted hover:bg-bg-elevated'
											>
												{t('cancel')}
											</button>
											<button
												type='button'
												onClick={handleCreate}
												disabled={isCreating || !newName.trim()}
												className='rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-warm transition-colors hover:bg-brand/90 disabled:opacity-50'
											>
												{isCreating ? t('creating') : t('create')}
											</button>
										</div>
									</div>
								</MagicCard>
							</motion.div>
						</motion.div>
					</Portal>
				)}
			</AnimatePresence>

			{/* Create Learning Path Modal */}
			<AnimatePresence>
				{showLearningPathModal && (
					<Portal>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							role='dialog'
							aria-modal='true'
							aria-label={t('createLearningPath')}
							className='fixed inset-0 z-modal flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'
							onClick={() => setShowLearningPathModal(false)}
						>
							<motion.div
								initial={{ opacity: 0, scale: 0.95, y: 20 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.95, y: 20 }}
								transition={TRANSITION_SPRING}
								className='w-full max-w-4xl rounded-2xl overflow-hidden shadow-warm p-0'
								onClick={e => e.stopPropagation()}
							>
								<MagicCard
									mode='orb'
									glowFrom='var(--color-brand)'
									glowTo='var(--color-xp)'
									className='w-full bg-bg-card/95 backdrop-blur-md p-6 border border-border-subtle rounded-2xl'
								>
									<div className='relative z-10 w-full'>
										<CollectionBuilder
											onSave={handleCreateLearningPath}
											onCancel={() => setShowLearningPathModal(false)}
											isSaving={isCreatingLearningPath}
										/>
									</div>
								</MagicCard>
							</motion.div>
						</motion.div>
					</Portal>
				)}
			</AnimatePresence>

			{/* Delete Confirmation Modal */}
			<AnimatePresence>
				{confirmingDeleteId && (
					<Portal>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							role='dialog'
							aria-modal='true'
							aria-label={t('deleteTitle')}
							className='fixed inset-0 z-modal flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'
							onClick={() => setConfirmingDeleteId(null)}
						>
							<motion.div
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.95 }}
								transition={TRANSITION_SPRING}
								className='w-full max-w-sm rounded-2xl overflow-hidden shadow-warm p-0'
								onClick={e => e.stopPropagation()}
								role='alertdialog'
								aria-modal='true'
								aria-labelledby='delete-collection-title'
								aria-describedby='delete-collection-desc'
							>
								<MagicCard
									mode='orb'
									glowFrom='var(--color-brand)'
									glowTo='var(--color-error)'
									className='w-full bg-bg-card/95 backdrop-blur-md p-6 border border-border-subtle rounded-2xl'
								>
									<div className='relative z-10 w-full'>
										<h3
											className='mb-2 text-lg font-bold text-text-primary'
											id='delete-collection-title'
										>
											{t('deleteTitle')}
										</h3>
										<p
											className='mb-6 text-sm text-text-muted'
											id='delete-collection-desc'
										>
											{t('deleteMessage')}
										</p>
										<div className='flex justify-end gap-3'>
											<button
												type='button'
												onClick={() => setConfirmingDeleteId(null)}
												className='rounded-xl px-4 py-2.5 text-sm font-medium text-text-muted hover:bg-bg-elevated'
											>
												{t('cancel')}
											</button>
											<button
												type='button'
												onClick={() => handleDelete(confirmingDeleteId)}
												disabled={isDeleting}
												className='rounded-xl bg-destructive px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-destructive/90 disabled:opacity-50'
											>
												{isDeleting ? t('deleting') : t('delete')}
											</button>
										</div>
									</div>
								</MagicCard>
							</motion.div>
						</motion.div>
					</Portal>
				)}
			</AnimatePresence>
		</PageTransition>
	)
}
