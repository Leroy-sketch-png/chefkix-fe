'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Post } from '@/lib/types'
import { getPostById } from '@/services/post'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PostCard } from '@/components/social/PostCard'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ui/error-state'
import { useAuthStore } from '@/store/authStore'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { TRANSITION_SPRING } from '@/lib/motion'

/**
 * Post Detail Page
 *
 * Route: /post/[id]
 *
 * Accessed from:
 * - Notification clicks (likes, comments, etc.)
 * - Direct links
 * - Share functionality
 *
 * Displays a single post with full comments section expanded.
 */
export default function PostDetailPage() {
	const params = useParams()
	const router = useRouter()
	const { user } = useAuthStore()
	const postId = params.id as string

	const [post, setPost] = useState<Post | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchPost = useCallback(async () => {
		if (!postId) return

		setIsLoading(true)
		setError(null)

		try {
			const response = await getPostById(postId)
			if (response.success && response.data) {
				setPost(response.data)
			} else {
				setError(response.message || 'Post not found')
			}
		} catch {
			setError('Failed to load post. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}, [postId])

	useEffect(() => {
		fetchPost()
	}, [fetchPost])

	const handlePostUpdate = useCallback((updatedPost: Post) => {
		setPost(updatedPost)
	}, [])

	const handlePostDelete = useCallback(() => {
		// Navigate back to dashboard after deletion
		router.push('/dashboard')
	}, [router])

	if (isLoading) {
		return (
			<PageContainer maxWidth='md' className='py-6'>
				<PostDetailSkeleton />
			</PageContainer>
		)
	}

	if (error || !post) {
		return (
			<PageContainer maxWidth='md' className='py-6'>
				<ErrorState
					title='Post not found'
					message={
						error || 'This post may have been deleted or is not available.'
					}
					showHomeButton={false}
					onRetry={() => router.push('/dashboard')}
				/>
			</PageContainer>
		)
	}

	return (
		<PageTransition>
			<PageContainer maxWidth='md' className='py-6'>
				{/* Back Navigation - This is a SECONDARY page, so back button is appropriate */}
				<motion.div
					initial={{ opacity: 0, x: -10 }}
					animate={{ opacity: 1, x: 0 }}
					transition={TRANSITION_SPRING}
					className='mb-4'
				>
					<Button
						variant='ghost'
						size='sm'
						onClick={() => router.back()}
						className='gap-2 text-text-secondary hover:text-text'
					>
						<ArrowLeft className='size-4' />
						<span>Back</span>
					</Button>
				</motion.div>

				{/* Post Card */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ ...TRANSITION_SPRING, delay: 0.1 }}
				>
					<PostCard
						post={post}
						onUpdate={handlePostUpdate}
						onDelete={handlePostDelete}
						currentUserId={user?.userId}
					/>
				</motion.div>
			</PageContainer>
		</PageTransition>
	)
}

/**
 * Loading skeleton that matches PostCard dimensions
 */
function PostDetailSkeleton() {
	return (
		<div className='space-y-4'>
			{/* Back button skeleton */}
			<Skeleton className='h-9 w-20' />

			{/* Post card skeleton */}
			<div className='rounded-radius border border-border-subtle bg-bg-card p-4 shadow-card md:p-6'>
				{/* Header */}
				<div className='mb-4 flex items-center gap-3'>
					<Skeleton className='size-10 rounded-full' />
					<div className='flex-1'>
						<Skeleton className='mb-1 h-4 w-32' />
						<Skeleton className='h-3 w-24' />
					</div>
				</div>

				{/* Content */}
				<div className='mb-4 space-y-2'>
					<Skeleton className='h-4 w-full' />
					<Skeleton className='h-4 w-3/4' />
					<Skeleton className='h-4 w-1/2' />
				</div>

				{/* Image placeholder */}
				<Skeleton className='mb-4 aspect-video w-full rounded-lg' />

				{/* Actions */}
				<div className='flex gap-4'>
					<Skeleton className='h-8 w-16' />
					<Skeleton className='h-8 w-16' />
					<Skeleton className='h-8 w-16' />
				</div>
			</div>
		</div>
	)
}
