'use client'

import { useState } from 'react'
import { Post } from '@/lib/types'
import { toggleLike, deletePost, updatePost } from '@/services/post'
import { toast } from 'sonner'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Heart,
	MessageSquare,
	Send,
	Bookmark,
	MoreVertical,
	Pencil,
	Trash2,
	X,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface PostCardProps {
	post: Post
	onUpdate?: (post: Post) => void
	onDelete?: (postId: string) => void
	currentUserId?: string
}

export const PostCard = ({
	post: initialPost,
	onUpdate,
	onDelete,
	currentUserId,
}: PostCardProps) => {
	const [post, setPost] = useState<Post>(initialPost)
	const [isLiking, setIsLiking] = useState(false)
	const [showMenu, setShowMenu] = useState(false)
	const [showComments, setShowComments] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const [editContent, setEditContent] = useState(post.content)
	const [editTags, setEditTags] = useState(post.tags.join(', '))
	const [isSaved, setIsSaved] = useState(false)

	const isOwner = currentUserId === post.userId
	const createdAt = new Date(post.createdAt)
	const canEdit =
		isOwner &&
		Date.now() - createdAt.getTime() < 60 * 60 * 1000 && // Within 1 hour
		!post.updatedAt

	const handleLike = async () => {
		if (isLiking) return

		setIsLiking(true)
		const wasLiked = post.isLiked
		const previousLikes = post.likes

		// Optimistic UI update
		setPost(prev => ({
			...prev,
			isLiked: !prev.isLiked,
			likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1,
		}))

		const response = await toggleLike(post.id)

		if (response.success && response.data) {
			// Update with server response
			setPost(prev => ({
				...prev,
				likes: response.data.likes,
				isLiked: !wasLiked,
			}))
			onUpdate?.({ ...post, likes: response.data.likes, isLiked: !wasLiked })
		} else {
			// Revert on error
			setPost(prev => ({
				...prev,
				isLiked: wasLiked,
				likes: previousLikes,
			}))
			toast.error(response.message || 'Failed to like post')
		}

		setIsLiking(false)
	}

	const handleSave = () => {
		setIsSaved(!isSaved)
		toast.success(isSaved ? 'Removed from saved' : 'Saved successfully!')
	}

	const handleDelete = async () => {
		if (!window.confirm('Are you sure you want to delete this post?')) return

		const response = await deletePost(post.id)
		if (response.success) {
			toast.success('Post deleted successfully')
			onDelete?.(post.id)
		} else {
			toast.error(response.message || 'Failed to delete post')
		}
		setShowMenu(false)
	}

	const handleEdit = async () => {
		if (!editContent.trim()) {
			toast.error('Content cannot be empty')
			return
		}

		const tags = editTags
			.split(',')
			.map(t => t.trim())
			.filter(t => t.length > 0)

		const response = await updatePost(post.id, {
			content: editContent,
			tags,
		})

		if (response.success && response.data) {
			setPost(response.data)
			onUpdate?.(response.data)
			setIsEditing(false)
			toast.success('Post updated successfully')
		} else {
			toast.error(response.message || 'Failed to update post')
		}
	}

	return (
		<motion.article
			layout
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.95 }}
			className='group relative mb-6 overflow-hidden rounded-radius border-l-[3px] border-l-transparent bg-panel-bg shadow-md transition-all duration-[400ms] hover:-translate-y-1 hover:border-l-primary hover:shadow-[0_12px_40px_rgba(31,38,135,0.2),0_0_0_1px_rgba(102,126,234,0.1)]'
		>
			{/* Header */}
			<div className='flex items-center justify-between p-4'>
				<Link
					href={`/${post.displayName}`}
					className='flex items-center gap-3 transition-opacity hover:opacity-80'
				>
					<div className='relative h-12 w-12'>
						<Image
							src={post.avatarUrl || 'https://i.pravatar.cc/48'}
							alt={post.displayName}
							fill
							className='rounded-full object-cover shadow-[0_0_0_2px_var(--panel-bg),0_0_0_3px_#667eea,0_4px_12px_rgba(0,0,0,0.12)] transition-all group-hover:scale-105 group-hover:shadow-[0_0_0_2px_var(--panel-bg),0_0_0_3px_#667eea,0_6px_16px_rgba(102,126,234,0.3)]'
						/>
					</div>
					<div>
						<div className='text-[16px] font-bold text-text'>
							{post.displayName}
						</div>
						<div className='text-[13px] text-muted'>
							{formatDistanceToNow(new Date(post.createdAt), {
								addSuffix: true,
							})}
						</div>
					</div>
				</Link>

				{isOwner && (
					<div className='relative'>
						<button
							onClick={() => setShowMenu(!showMenu)}
							className='rounded-full p-2 transition-colors hover:bg-gray-100'
						>
							<MoreVertical className='h-5 w-5 text-gray-600' />
						</button>

						<AnimatePresence>
							{showMenu && (
								<motion.div
									initial={{ opacity: 0, scale: 0.95, y: -10 }}
									animate={{ opacity: 1, scale: 1, y: 0 }}
									exit={{ opacity: 0, scale: 0.95, y: -10 }}
									className='absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-border bg-card py-1 shadow-lg'
								>
									{canEdit && (
										<button
											onClick={() => {
												setIsEditing(true)
												setShowMenu(false)
											}}
											className='flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50'
										>
											<Pencil className='h-4 w-4' />
											Edit post
										</button>
									)}
									<button
										onClick={handleDelete}
										className='flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50'
									>
										<Trash2 className='h-4 w-4' />
										Delete post
									</button>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				)}
			</div>

			{/* Content */}
			{isEditing ? (
				<div className='space-y-3 border-t border-gray-100 p-4'>
					<textarea
						value={editContent}
						onChange={e => setEditContent(e.target.value)}
						className='min-h-[100px] w-full resize-none rounded-lg border border-gray-300 p-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
						placeholder='Edit your post...'
					/>
					<input
						value={editTags}
						onChange={e => setEditTags(e.target.value)}
						className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
						placeholder='Tags (comma-separated)'
					/>
					<div className='flex gap-2'>
						<button
							onClick={handleEdit}
							className='flex-1 rounded-lg bg-primary px-4 py-2 font-medium text-white transition-colors hover:bg-primary/90'
						>
							Save
						</button>
						<button
							onClick={() => {
								setIsEditing(false)
								setEditContent(post.content)
								setEditTags(post.tags.join(', '))
							}}
							className='flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50'
						>
							Cancel
						</button>
					</div>
				</div>
			) : (
				<>
					<div className='px-4 pb-3'>
						<p className='whitespace-pre-wrap text-gray-800'>{post.content}</p>
						{post.tags.length > 0 && (
							<div className='mt-2 flex flex-wrap gap-2'>
								{post.tags.map(tag => (
									<span
										key={tag}
										className='rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary'
									>
										#{tag}
									</span>
								))}
							</div>
						)}
					</div>

					{/* Media */}
					{post.photoUrls && post.photoUrls.length > 0 && (
						<div className='relative aspect-video w-full overflow-hidden bg-gray-100'>
							<Image
								src={post.photoUrls[0]}
								alt='Post media'
								fill
								className='object-cover transition-transform duration-500 group-hover:scale-105'
							/>
							{post.photoUrls.length > 1 && (
								<div className='absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white'>
									+{post.photoUrls.length - 1} more
								</div>
							)}
						</div>
					)}

					{post.videoUrl && (
						<div className='relative aspect-video w-full overflow-hidden bg-gray-100'>
							<video src={post.videoUrl} controls className='h-full w-full' />
						</div>
					)}
				</>
			)}

			{/* Actions */}
			<div className='flex justify-around border-t border-border bg-[#fafbff] p-2'>
				<button
					onClick={handleLike}
					disabled={isLiking}
					className={`group/btn flex flex-1 items-center justify-center gap-2 rounded-[20px] px-3 py-2 text-[14px] font-semibold transition-all ${
						post.isLiked
							? 'text-primary'
							: 'text-muted hover:bg-bg hover:text-primary'
					}`}
				>
					<Heart
						className={`h-5 w-5 transition-all duration-300 group-hover/btn:scale-125 ${
							post.isLiked
								? 'animate-heart-beat fill-[#e74c3c] stroke-[#e74c3c]'
								: 'group-hover/btn:fill-[#e74c3c] group-hover/btn:stroke-[#e74c3c]'
						}`}
					/>
					<span>{post.likes}</span>
				</button>

				<button
					onClick={() => setShowComments(!showComments)}
					className='group/btn flex flex-1 items-center justify-center gap-2 rounded-[20px] px-3 py-2 text-[14px] font-semibold text-muted transition-all hover:bg-bg hover:text-primary'
				>
					<MessageSquare className='h-5 w-5 transition-all duration-300 group-hover/btn:scale-125 group-hover/btn:fill-primary group-hover/btn:stroke-primary' />
					<span>{post.commentCount}</span>
				</button>

				<button className='group/btn flex flex-1 items-center justify-center gap-2 rounded-[20px] px-3 py-2 text-[14px] font-semibold text-muted transition-all hover:bg-bg hover:text-primary'>
					<Send className='h-5 w-5 transition-all duration-300 group-hover/btn:scale-125' />
					<span>Share</span>
				</button>

				<button
					onClick={handleSave}
					className={`group/btn flex flex-1 items-center justify-center gap-2 rounded-[20px] px-3 py-2 text-[14px] font-semibold transition-all ${
						isSaved
							? 'text-primary'
							: 'text-muted hover:bg-bg hover:text-primary'
					}`}
				>
					<Bookmark
						className={`h-5 w-5 transition-all duration-300 group-hover/btn:scale-125 ${
							isSaved
								? 'fill-[#f39c12] stroke-[#f39c12]'
								: 'group-hover/btn:fill-[#f39c12] group-hover/btn:stroke-[#f39c12]'
						}`}
					/>
					<span>Save</span>
				</button>
			</div>

			{/* Comments Section */}
			<AnimatePresence>
				{showComments && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						className='overflow-hidden border-t border-border bg-card'
					>
						<div className='flex gap-2 p-4'>
							<input
								className='flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
								placeholder='Add a comment...'
							/>
							<button className='rounded-lg bg-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-primary/90'>
								Post
							</button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.article>
	)
}
