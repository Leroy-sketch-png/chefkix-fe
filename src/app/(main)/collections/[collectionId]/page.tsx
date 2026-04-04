'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
	ArrowLeft,
	Globe,
	Lock,
	Pencil,
	Trash2,
	FolderHeart,
} from 'lucide-react'
import { toast } from 'sonner'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { Portal } from '@/components/ui/portal'
import { PostCard } from '@/components/social/PostCard'
import { LearningPathView } from '@/components/collections'
import { TRANSITION_SPRING } from '@/lib/motion'
import { Collection, UpdateCollectionRequest } from '@/lib/types/collection'
import { Post } from '@/lib/types'
import {
	getCollectionById,
	getCollectionPosts,
	updateCollection,
	deleteCollection,
	removePostFromCollection,
} from '@/services/collection'
import { useAuthStore } from '@/store/authStore'

export default function CollectionDetailPage({
	params,
}: {
	params: Promise<{ collectionId: string }>
}) {
	const { collectionId } = use(params)
	const router = useRouter()
	const currentUser = useAuthStore(state => state.user)
	const [collection, setCollection] = useState<Collection | null>(null)
	const [posts, setPosts] = useState<Post[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [showEditModal, setShowEditModal] = useState(false)
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
	const [isUpdating, setIsUpdating] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)

	// Edit form state
	const [editName, setEditName] = useState('')
	const [editDescription, setEditDescription] = useState('')
	const [editIsPublic, setEditIsPublic] = useState(false)

	const isOwner = currentUser?.userId === collection?.userId

	useEscapeKey(showEditModal, () => setShowEditModal(false))
	useEscapeKey(showDeleteConfirm && !showEditModal, () => setShowDeleteConfirm(false))

	const fetchData = useCallback(async () => {
		try {
			const [colRes, postsRes] = await Promise.all([
				getCollectionById(collectionId),
				getCollectionPosts(collectionId),
			])
			if (colRes.success && colRes.data) {
				setCollection(colRes.data)
				setEditName(colRes.data.name)
				setEditDescription(colRes.data.description || '')
				setEditIsPublic(colRes.data.isPublic)
			}
			if (postsRes.success && postsRes.data) {
				setPosts(postsRes.data)
			}
		} catch {
			toast.error('Failed to load collection')
		} finally {
			setIsLoading(false)
		}
	}, [collectionId])

	useEffect(() => {
		fetchData()
	}, [fetchData])

	const handleUpdate = async () => {
		if (!editName.trim()) {
			toast.error('Collection name is required')
			return
		}
		setIsUpdating(true)
		const data: UpdateCollectionRequest = {
			name: editName.trim(),
			description: editDescription.trim() || undefined,
			isPublic: editIsPublic,
		}
		const response = await updateCollection(collectionId, data)
		if (response.success && response.data) {
			setCollection(response.data)
			setShowEditModal(false)
			toast.success('Collection updated')
		} else {
			toast.error(response.message || 'Failed to update')
		}
		setIsUpdating(false)
	}

	const handleDelete = async () => {
		setIsDeleting(true)
		const response = await deleteCollection(collectionId)
		if (response.success) {
			toast.success('Collection deleted')
			router.push('/collections')
		} else {
			toast.error(response.message || 'Failed to delete')
			setIsDeleting(false)
		}
	}

	const handleRemovePost = async (postId: string) => {
		const response = await removePostFromCollection(collectionId, postId)
		if (response.success) {
			setPosts(prev => prev.filter(p => p.id !== postId))
			setCollection(prev =>
				prev
					? {
							...prev,
							itemCount: prev.itemCount - 1,
							postIds: prev.postIds.filter(id => id !== postId),
						}
					: null,
			)
			toast.success('Post removed from collection')
		} else {
			toast.error(response.message || 'Failed to remove post')
		}
	}

	if (isLoading) {
		return (
			<PageTransition>
				<PageContainer maxWidth='lg'>
					<div className='space-y-6 py-6'>
						<div className='h-8 w-48 animate-pulse rounded-lg bg-bg-elevated' />
						<div className='h-5 w-32 animate-pulse rounded-lg bg-bg-elevated' />
						<div className='space-y-4'>
							{[1, 2, 3].map(i => (
								<div
									key={i}
									className='h-48 animate-pulse rounded-xl bg-bg-elevated'
								/>
							))}
						</div>
					</div>
				</PageContainer>
			</PageTransition>
		)
	}

	if (!collection) {
		return (
			<PageTransition>
				<PageContainer maxWidth='lg'>
					<div className='py-20 text-center'>
						<FolderHeart className='mx-auto mb-4 size-16 text-text-muted/30' />
						<h2 className='text-lg font-semibold text-text'>
							Collection not found
						</h2>
						<button
							onClick={() => router.push('/collections')}
							className='mt-4 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white'
						>
							Back to Collections
						</button>
					</div>
				</PageContainer>
			</PageTransition>
		)
	}

	const isLearningPath = collection.collectionType === 'LEARNING_PATH'

	return (
		<PageTransition>
			<PageContainer maxWidth='lg'>
				<div className='space-y-6 py-6'>
					{/* Back button */}
					<button
						onClick={() => router.back()}
						className='flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text'
					>
						<ArrowLeft className='size-4' />
						Back
					</button>

					{/* Learning Path View - completely different layout */}
					{isLearningPath ? (
						<LearningPathView collection={collection} isOwner={isOwner} />
					) : (
						<>
							{/* BOOKMARK Collection Header */}
							<div className='flex items-start justify-between'>
								<div>
									<div className='flex items-center gap-2'>
										<h1 className='text-2xl font-bold text-text'>
											{collection.name}
										</h1>
										<span
											className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
												collection.isPublic
													? 'bg-success/100/10 text-success'
													: 'bg-text-muted/10 text-text-muted'
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
									{collection.description && (
										<p className='mt-1 text-sm text-text-muted'>
											{collection.description}
										</p>
									)}
									<p className='mt-1 text-xs text-text-muted'>
										{collection.itemCount}{' '}
										{collection.itemCount === 1 ? 'post' : 'posts'}
									</p>
								</div>
								{isOwner && (
									<div className='flex gap-2'>
										<button
											onClick={() => setShowEditModal(true)}
											className='rounded-xl border border-border-subtle p-2.5 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text'
										>
											<Pencil className='size-4' />
										</button>
										<button
											onClick={() => setShowDeleteConfirm(true)}
											className='rounded-xl border border-border-subtle p-2.5 text-text-muted transition-colors hover:bg-destructive/10 hover:text-destructive'
										>
											<Trash2 className='size-4' />
										</button>
									</div>
								)}
							</div>

							{/* Posts */}
							{posts.length === 0 ? (
								<div className='rounded-xl border border-border-subtle bg-bg-card py-16 text-center shadow-card'>
									<FolderHeart className='mx-auto mb-4 size-12 text-text-muted/30' />
									<h2 className='mb-1 text-base font-semibold text-text'>
										No posts in this collection
									</h2>
									<p className='text-sm text-text-muted'>
										Save posts and add them to this collection
									</p>
								</div>
							) : (
								<div className='space-y-4'>
									{posts.map(post => (
										<div key={post.id} className='relative'>
											<PostCard
												post={post}
												currentUserId={currentUser?.userId}
											/>
											{isOwner && (
												<button
													onClick={() => handleRemovePost(post.id)}
													className='absolute right-2 top-2 rounded-lg bg-bg-card/80 p-1.5 text-text-muted shadow-sm backdrop-blur-sm transition-colors hover:bg-destructive/10 hover:text-destructive'
													title='Remove from collection'
												>
													<Trash2 className='size-3.5' />
												</button>
											)}
										</div>
									))}
								</div>
							)}
						</>
					)}
				</div>
			</PageContainer>

			{/* Edit Modal */}
			<AnimatePresence>
				{showEditModal && (
					<Portal>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-4'
							onClick={() => setShowEditModal(false)}
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
									Edit Collection
								</h2>
								<div className='space-y-4'>
									<div>
										<label className='mb-1 block text-sm font-medium text-text-secondary'>
											Name
										</label>
										<input
											type='text'
											value={editName}
											onChange={e => setEditName(e.target.value)}
											maxLength={60}
											className='w-full rounded-xl border border-border-subtle bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none'
											autoFocus
										/>
									</div>
									<div>
										<label className='mb-1 block text-sm font-medium text-text-secondary'>
											Description
										</label>
										<input
											type='text'
											value={editDescription}
											onChange={e => setEditDescription(e.target.value)}
											maxLength={200}
											className='w-full rounded-xl border border-border-subtle bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none'
										/>
									</div>
									<label className='flex cursor-pointer items-center gap-3'>
										<input
											type='checkbox'
											checked={editIsPublic}
											onChange={e => setEditIsPublic(e.target.checked)}
											className='size-4 rounded border-border-subtle accent-brand'
										/>
										<span className='text-sm text-text'>
											Make this collection public
										</span>
									</label>
								</div>
								<div className='mt-6 flex justify-end gap-3'>
									<button
										onClick={() => setShowEditModal(false)}
										className='rounded-xl px-4 py-2.5 text-sm font-medium text-text-muted hover:bg-bg-elevated'
									>
										Cancel
									</button>
									<button
										onClick={handleUpdate}
										disabled={isUpdating || !editName.trim()}
										className='rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-warm transition-colors hover:bg-brand/90 disabled:opacity-50'
									>
										{isUpdating ? 'Saving...' : 'Save Changes'}
									</button>
								</div>
							</motion.div>
						</motion.div>
					</Portal>
				)}
			</AnimatePresence>

			{/* Delete Confirmation */}
			<AnimatePresence>
				{showDeleteConfirm && (
					<Portal>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-4'
							onClick={() => setShowDeleteConfirm(false)}
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
									This will permanently delete &ldquo;{collection.name}&rdquo;.
									Posts inside won&apos;t be affected.
								</p>
								<div className='flex justify-end gap-3'>
									<button
										onClick={() => setShowDeleteConfirm(false)}
										className='rounded-xl px-4 py-2.5 text-sm font-medium text-text-muted hover:bg-bg-elevated'
									>
										Cancel
									</button>
									<button
										onClick={handleDelete}
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
