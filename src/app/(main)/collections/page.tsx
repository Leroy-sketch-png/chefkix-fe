'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FolderHeart, Plus, Trash2, Globe, Lock, Image as ImageIcon } from 'lucide-react'
import NextImage from 'next/image'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { toast } from 'sonner'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PageHeader } from '@/components/layout/PageHeader'
import { ErrorState } from '@/components/ui/error-state'
import { EmptyState } from '@/components/shared/EmptyStateGamified'
import { Portal } from '@/components/ui/portal'
import { TRANSITION_SPRING, CARD_HOVER, BUTTON_SUBTLE_HOVER, BUTTON_SUBTLE_TAP } from '@/lib/motion'
import { Collection, CreateCollectionRequest } from '@/lib/types/collection'
import {
	getMyCollections,
	createCollection,
	deleteCollection,
} from '@/services/collection'
import { useTranslations } from 'next-intl'

export default function CollectionsPage() {
	const router = useRouter()
	const t = useTranslations('collections')
	const [collections, setCollections] = useState<Collection[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [showCreateModal, setShowCreateModal] = useState(false)
	const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
		null,
	)
	const [isCreating, setIsCreating] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [fetchError, setFetchError] = useState(false)

	useEscapeKey(showCreateModal, () => setShowCreateModal(false))
	useEscapeKey(!!confirmingDeleteId && !showCreateModal, () => setConfirmingDeleteId(null))

	// Create form state
	const [newName, setNewName] = useState('')
	const [newDescription, setNewDescription] = useState('')
	const [newIsPublic, setNewIsPublic] = useState(false)

	const fetchCollections = useCallback(async () => {
		try {
			const response = await getMyCollections()
			if (response.success && response.data) {
				setCollections(response.data)
				setFetchError(false)
			} else {
				setFetchError(true)
			}
		} catch {
			setFetchError(true)
		} finally {
			setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchCollections()
	}, [fetchCollections])

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
			toast.error(response.message || t('createFailed'))
		}
		setIsCreating(false)
	}

	const handleDelete = async (id: string) => {
		setIsDeleting(true)
		const response = await deleteCollection(id)
		if (response.success) {
			setCollections(prev => prev.filter(c => c.id !== id))
			toast.success(t('deleted'))
		} else {
			toast.error(response.message || t('deleteFailed'))
		}
		setConfirmingDeleteId(null)
		setIsDeleting(false)
	}

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
				<PageContainer maxWidth='lg'>
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
			<PageContainer maxWidth='lg'>
				<div className='space-y-6 py-6'>
					{/* Header */}
					<PageHeader
						icon={FolderHeart}
						title={t('myCollections')}
						subtitle={t('myCollectionsSubtitle')}
						gradient='pink'
						rightAction={
							<motion.button
								onClick={() => setShowCreateModal(true)}
								className='flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-warm'
							whileHover={BUTTON_SUBTLE_HOVER}
							whileTap={BUTTON_SUBTLE_TAP}
							>
								<Plus className='size-4' />
								{t('newCollection')}
							</motion.button>
						}
						marginBottom='sm'
					/>

					{/* Collections Grid */}
					{collections.length === 0 ? (
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
					) : (
						<div className='grid gap-4 sm:grid-cols-2'>
							{collections.map(collection => (
								<motion.div
									key={collection.id}
									className='group relative cursor-pointer overflow-hidden rounded-xl border border-border-subtle bg-bg-card shadow-card transition-all hover:shadow-warm'
									whileHover={CARD_HOVER}
									transition={TRANSITION_SPRING}
									onClick={() =>
										router.push(`/collections/${collection.id}`)
									}
								>
									{/* Cover image or placeholder */}
									<div className='relative h-32 bg-bg-elevated'>
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
											<div className='flex size-full items-center justify-center'>
												<ImageIcon className='size-10 text-text-muted/20' />
											</div>
										)}
										<div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent' />
										{/* Visibility badge */}
										<div className='absolute left-3 top-3'>
											<span
												className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
													collection.isPublic
														? 'bg-success/100/20 text-success'
														: 'bg-white/20 text-white'
												}`}
											>
												{collection.isPublic ? (
													<Globe className='size-3' />
												) : (
													<Lock className='size-3' />
												)}
												{collection.isPublic ? t('public') : t('private')}
											</span>
										</div>
									</div>

									{/* Info */}
									<div className='p-4'>
										<div className='flex items-start justify-between'>
											<div className='min-w-0 flex-1'>
												<h3 className='truncate font-semibold text-text'>
													{collection.name}
												</h3>
												{collection.description && (
													<p className='mt-1 line-clamp-1 text-sm text-text-muted'>
														{collection.description}
													</p>
												)}
											</div>
											<button
												type='button'
												onClick={e => {
													e.stopPropagation()
													setConfirmingDeleteId(collection.id)
												}}
												className='ml-2 flex-shrink-0 rounded-md p-1 text-text-muted transition-all hover:bg-destructive/10 hover:text-destructive md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100'
											>
												<Trash2 className='size-4' />
											</button>
										</div>
										<p className='mt-2 text-xs text-text-muted'>
										{t('postCount', { count: collection.itemCount })}
									</p>
									</div>
								</motion.div>
							))}
						</div>
					)}
				</div>
			</PageContainer>

			{/* Create Collection Modal */}
			<AnimatePresence>
				{showCreateModal && (
					<Portal>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-4'
							onClick={() => setShowCreateModal(false)}
						>
							<motion.div
								initial={{ opacity: 0, scale: 0.95, y: 20 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.95, y: 20 }}
								transition={TRANSITION_SPRING}
								className='w-full max-w-md rounded-2xl bg-bg-card p-6 shadow-warm'
								onClick={e => e.stopPropagation()}
							>
								<h2 className='mb-4 text-lg font-bold text-text'>
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
											className='w-full rounded-xl border border-border-subtle bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none'
											autoFocus
										/>
									</div>
									<div>
										<label className='mb-1 block text-sm font-medium text-text-secondary'>
											{t('descriptionLabel')}{' '}
											<span className='text-text-muted'>{t('descriptionOptional')}</span>
										</label>
										<input
											type='text'
											value={newDescription}
											onChange={e => setNewDescription(e.target.value)}
											placeholder={t('descriptionPlaceholder')}
											maxLength={200}
											className='w-full rounded-xl border border-border-subtle bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none'
										/>
									</div>
									<label className='flex cursor-pointer items-center gap-3'>
										<input
											type='checkbox'
											checked={newIsPublic}
											onChange={e => setNewIsPublic(e.target.checked)}
											className='size-4 rounded border-border-subtle accent-brand'
										/>
										<span className='text-sm text-text'>
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
							className='fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-4'
							onClick={() => setConfirmingDeleteId(null)}
						>
							<motion.div
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.95 }}
								transition={TRANSITION_SPRING}
								className='w-full max-w-sm rounded-2xl bg-bg-card p-6 shadow-warm'
								onClick={e => e.stopPropagation()}
							>
								<h3 className='mb-2 text-lg font-bold text-text'>
									{t('deleteTitle')}
								</h3>
								<p className='mb-6 text-sm text-text-muted'>
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
							</motion.div>
						</motion.div>
					</Portal>
				)}
			</AnimatePresence>
		</PageTransition>
	)
}
