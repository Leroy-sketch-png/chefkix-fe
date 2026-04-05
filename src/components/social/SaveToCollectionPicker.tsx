'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Collection, CreateCollectionRequest } from '@/lib/types/collection'
import {
	getMyCollections,
	addPostToCollection,
	createCollection,
} from '@/services/collection'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
	FolderHeart,
	Plus,
	Check,
	Loader2,
	X,
} from 'lucide-react'
import { Portal } from '@/components/ui/portal'
import { TRANSITION_SPRING } from '@/lib/motion'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { logDevError } from '@/lib/dev-log'

interface SaveToCollectionPickerProps {
	postId: string
	isOpen: boolean
	onClose: () => void
	anchorPosition: { top: number; right: number }
}

export const SaveToCollectionPicker = ({
	postId,
	isOpen,
	onClose,
	anchorPosition,
}: SaveToCollectionPickerProps) => {
	const t = useTranslations('social')
	const [collections, setCollections] = useState<Collection[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [addingToId, setAddingToId] = useState<string | null>(null)
	const [showCreate, setShowCreate] = useState(false)
	const [newName, setNewName] = useState('')
	const [isCreating, setIsCreating] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)

	useEscapeKey(isOpen, onClose)

	// Fetch collections when picker opens
	useEffect(() => {
		if (!isOpen) return

		const fetch = async () => {
			setIsLoading(true)
			try {
				const response = await getMyCollections()
				if (response.success && response.data) {
					setCollections(response.data)
				}
			} catch (error) {
				logDevError('Failed to load collections:', error)
				toast.error(t('failedLoadCollections'))
			} finally {
				setIsLoading(false)
			}
		}
		fetch()
	}, [isOpen])

	// Focus input when create mode is shown
	useEffect(() => {
		if (showCreate && inputRef.current) {
			inputRef.current.focus()
		}
	}, [showCreate])

	const handleAddToCollection = async (collectionId: string) => {
		if (addingToId) return
		setAddingToId(collectionId)

		try {
			const response = await addPostToCollection(collectionId, postId)
			if (response.success) {
				const col = collections.find((c) => c.id === collectionId)
				toast.success(t('addedToCollection', { name: col?.name ?? 'collection' }))
				onClose()
			} else {
				toast.error(response.message || t('failedAddToCollection'))
			}
		} catch (error) {
			logDevError('Failed to add post to collection:', error)
			toast.error(t('failedAddToCollection'))
		} finally {
			setAddingToId(null)
		}
	}

	const handleCreateAndAdd = async () => {
		const trimmed = newName.trim()
		if (!trimmed || isCreating) return

		setIsCreating(true)
		try {
			const request: CreateCollectionRequest = {
				name: trimmed,
				isPublic: false,
			}
			const createResponse = await createCollection(request)
			if (createResponse.success && createResponse.data) {
				// Now add the post to the new collection
				const addResponse = await addPostToCollection(
					createResponse.data.id,
					postId,
				)
				if (addResponse.success) {
					toast.success(t('createdCollection', { name: trimmed }))
					onClose()
				} else {
					// Collection was created but add failed — still close
					toast.success(t('createdCollectionOnly', { name: trimmed }))
					toast.error(t('couldNotAddPost'))
					onClose()
				}
			} else {
				toast.error(createResponse.message || t('failedCreateCollection'))
			}
		} catch (error) {
			logDevError('Failed to create collection:', error)
			toast.error(t('failedCreateCollection'))
		} finally {
			setIsCreating(false)
			setNewName('')
			setShowCreate(false)
		}
	}

	if (!isOpen) return null

	const alreadySaved = (col: Collection) => col.postIds?.includes(postId)

	return (
		<Portal>
			{/* Backdrop */}
			<div
				className='fixed inset-0 z-dropdown'
				onClick={onClose}
			/>
			<AnimatePresence>
				<motion.div
					initial={{ opacity: 0, scale: 0.95, y: 10 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.95, y: 10 }}
					transition={TRANSITION_SPRING}
					className='fixed z-dropdown w-64 rounded-radius border border-border-subtle bg-bg-card shadow-card'
					style={{
						bottom: `${window.innerHeight - anchorPosition.top}px`,
						right: `${anchorPosition.right}px`,
					}}
				>
					{/* Header */}
					<div className='flex items-center justify-between border-b border-border-subtle px-3 py-2'>
						<span className='text-sm font-semibold text-text'>
							{t('saveToCollection')}
						</span>
						<button
							type='button'
							onClick={onClose}
							aria-label={t('close')}
							className='rounded p-0.5 text-text-muted hover:bg-bg-hover hover:text-text'
						>
							<X className='size-4' />
						</button>
					</div>

					{/* Content */}
					<div className='max-h-52 overflow-y-auto'>
						{isLoading ? (
							<div className='flex items-center justify-center py-6'>
								<Loader2 className='size-5 animate-spin text-text-muted' />
							</div>
						) : collections.length === 0 && !showCreate ? (
							<div className='px-3 py-4 text-center text-sm text-text-muted'>
								{t('noCollectionsYet')}
							</div>
						) : (
							collections.map((col) => {
								const saved = alreadySaved(col)
								return (
									<button
										key={col.id}
										type='button'
										disabled={saved || addingToId === col.id}
										onClick={() => handleAddToCollection(col.id)}
										className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors ${
											saved
												? 'cursor-default bg-success/5 text-success'
												: 'text-text hover:bg-bg-hover'
										}`}
									>
										{addingToId === col.id ? (
											<Loader2 className='size-4 flex-shrink-0 animate-spin' />
										) : saved ? (
											<Check className='size-4 flex-shrink-0' />
										) : (
											<FolderHeart className='size-4 flex-shrink-0 text-text-muted' />
										)}
										<span className='truncate'>{col.name}</span>
										<span className='ml-auto flex-shrink-0 text-xs text-text-muted'>
											{col.itemCount}
										</span>
									</button>
								)
							})
						)}
					</div>

					{/* Create new collection inline */}
					<div className='border-t border-border-subtle'>
						{showCreate ? (
							<div className='flex items-center gap-1 p-2'>
								<input
									ref={inputRef}
									type='text'
									value={newName}
									onChange={(e) => setNewName(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter') handleCreateAndAdd()
										if (e.key === 'Escape') {
											e.stopPropagation()
											setShowCreate(false)
											setNewName('')
										}
									}}
									placeholder={t('collectionNamePlaceholder')}
									maxLength={60}
									className='flex-1 rounded border border-border-subtle bg-bg px-2 py-1.5 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none'
								/>
								<button
									type='button'
									disabled={!newName.trim() || isCreating}
									onClick={handleCreateAndAdd}
									className='rounded bg-brand px-2 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-50'
								>
									{isCreating ? (
										<Loader2 className='size-3.5 animate-spin' />
									) : (
										<Check className='size-3.5' />
									)}
								</button>
							</div>
						) : (
							<button
								type='button'
								onClick={() => setShowCreate(true)}
								className='flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-brand transition-colors hover:bg-bg-hover'
							>
								<Plus className='size-4' />
								<span>{t('newCollection')}</span>
							</button>
						)}
					</div>
				</motion.div>
			</AnimatePresence>
		</Portal>
	)
}
