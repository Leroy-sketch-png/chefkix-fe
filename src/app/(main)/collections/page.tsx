'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FolderHeart, Plus, Trash2, Globe, Lock, Image } from 'lucide-react'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { toast } from 'sonner'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PageHeader } from '@/components/layout/PageHeader'
import { ErrorState } from '@/components/ui/error-state'
import { Portal } from '@/components/ui/portal'
import { TRANSITION_SPRING, CARD_HOVER } from '@/lib/motion'
import { Collection, CreateCollectionRequest } from '@/lib/types/collection'
import {
	getMyCollections,
	createCollection,
	deleteCollection,
} from '@/services/collection'

export default function CollectionsPage() {
	const router = useRouter()
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
			toast.error('Collection name is required')
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
			toast.success('Collection created!')
		} else {
			toast.error(response.message || 'Failed to create collection')
		}
		setIsCreating(false)
	}

	const handleDelete = async (id: string) => {
		setIsDeleting(true)
		const response = await deleteCollection(id)
		if (response.success) {
			setCollections(prev => prev.filter(c => c.id !== id))
			toast.success('Collection deleted')
		} else {
			toast.error(response.message || 'Failed to delete collection')
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
						title='Failed to load collections'
						message='Something went wrong loading your collections. Please try again.'
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
						title='My Collections'
						subtitle='Organize your saved posts into collections'
						gradient='pink'
						rightAction={
							<motion.button
								onClick={() => setShowCreateModal(true)}
								className='flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-warm'
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
							>
								<Plus className='size-4' />
								New Collection
							</motion.button>
						}
						marginBottom='sm'
					/>

					{/* Collections Grid */}
					{collections.length === 0 ? (
						<div className='rounded-xl border border-border-subtle bg-bg-card py-20 text-center shadow-card'>
							<FolderHeart className='mx-auto mb-4 size-16 text-text-muted/30' />
							<h2 className='mb-2 text-lg font-semibold text-text'>
								No collections yet
							</h2>
							<p className='mb-6 text-sm text-text-muted'>
								Create a collection to organize your saved posts
							</p>
							<button
								onClick={() => setShowCreateModal(true)}
								className='rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-warm transition-colors hover:bg-brand/90'
							>
								Create Your First Collection
							</button>
						</div>
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
											<img
												src={collection.coverImageUrl}
												alt={collection.name}
												className='size-full object-cover'
											/>
										) : (
											<div className='flex size-full items-center justify-center'>
												<Image className='size-10 text-text-muted/20' />
											</div>
										)}
										<div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent' />
										{/* Visibility badge */}
										<div className='absolute left-3 top-3'>
											<span
												className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
													collection.isPublic
														? 'bg-green-500/20 text-green-200'
														: 'bg-white/20 text-white'
												}`}
											>
												{collection.isPublic ? (
													<Globe className='size-3' />
												) : (
													<Lock className='size-3' />
												)}
												{collection.isPublic ? 'Public' : 'Private'}
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
												onClick={e => {
													e.stopPropagation()
													setConfirmingDeleteId(collection.id)
												}}
												className='ml-2 flex-shrink-0 rounded-md p-1 text-text-muted transition-all hover:bg-destructive/10 hover:text-destructive md:opacity-0 md:group-hover:opacity-100'
											>
												<Trash2 className='size-4' />
											</button>
										</div>
										<p className='mt-2 text-xs text-text-muted'>
											{collection.itemCount}{' '}
											{collection.itemCount === 1 ? 'post' : 'posts'}
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
									New Collection
								</h2>
								<div className='space-y-4'>
									<div>
										<label className='mb-1 block text-sm font-medium text-text-secondary'>
											Name
										</label>
										<input
											type='text'
											value={newName}
											onChange={e => setNewName(e.target.value)}
											placeholder='e.g. Weeknight Dinners'
											maxLength={60}
											className='w-full rounded-xl border border-border-subtle bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none'
											autoFocus
										/>
									</div>
									<div>
										<label className='mb-1 block text-sm font-medium text-text-secondary'>
											Description{' '}
											<span className='text-text-muted'>(optional)</span>
										</label>
										<input
											type='text'
											value={newDescription}
											onChange={e => setNewDescription(e.target.value)}
											placeholder='What is this collection about?'
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
											Make this collection public
										</span>
									</label>
								</div>
								<div className='mt-6 flex justify-end gap-3'>
									<button
										onClick={() => setShowCreateModal(false)}
										className='rounded-xl px-4 py-2.5 text-sm font-medium text-text-muted hover:bg-bg-elevated'
									>
										Cancel
									</button>
									<button
										onClick={handleCreate}
										disabled={isCreating || !newName.trim()}
										className='rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-warm transition-colors hover:bg-brand/90 disabled:opacity-50'
									>
										{isCreating ? 'Creating...' : 'Create'}
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
									Delete Collection?
								</h3>
								<p className='mb-6 text-sm text-text-muted'>
									This will permanently delete this collection. Posts inside
									won&apos;t be affected.
								</p>
								<div className='flex justify-end gap-3'>
									<button
										onClick={() => setConfirmingDeleteId(null)}
										className='rounded-xl px-4 py-2.5 text-sm font-medium text-text-muted hover:bg-bg-elevated'
									>
										Cancel
									</button>
									<button
										onClick={() => handleDelete(confirmingDeleteId)}
										disabled={isDeleting}
										className='rounded-xl bg-destructive px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-destructive/90 disabled:opacity-50'
									>
										{isDeleting ? 'Deleting...' : 'Delete'}
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
