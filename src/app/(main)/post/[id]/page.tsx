'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Post } from '@/lib/types'
import { getPostById } from '@/services/post'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PostCard } from '@/components/social/PostCard'
import { ErrorState } from '@/components/ui/error-state'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { PostDetailSkeleton } from './PostDetailSkeleton'

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
	const { user } = useAuth()
	const t = useTranslations('post')
	const postId = params.id as string

	const [post, setPost] = useState<Post | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const requestIdRef = useRef(0)

	const fetchPost = useCallback(async () => {
		if (!postId) return
		const requestId = ++requestIdRef.current

		setIsLoading(true)
		setError(null)

		try {
			const response = await getPostById(postId)
			if (requestId !== requestIdRef.current) return
			if (response.success && response.data) {
				setPost(response.data)
			} else {
				setError(response.message || t('errorPostNotFound'))
			}
		} catch {
			if (requestId !== requestIdRef.current) return
			setError(t('errorLoadPostFailed'))
			toast.error(t('toastLoadPostFailed'))
		} finally {
			if (requestId === requestIdRef.current) setIsLoading(false)
		}
	}, [postId, t])

	useEffect(() => {
		void fetchPost()
		return () => {
			requestIdRef.current += 1
		}
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
			<PageContainer maxWidth='lg' className='py-6'>
				<PostDetailSkeleton />
			</PageContainer>
		)
	}

	if (error || !post) {
		return (
			<PageContainer maxWidth='lg' className='py-6'>
				<ErrorState
					title={t('postNotFound')}
					message={error || t('postDeleted')}
					showHomeButton
					onRetry={fetchPost}
				/>
			</PageContainer>
		)
	}

	return (
		<PageTransition>
			<PageContainer maxWidth='lg' className='py-6'>
				<div className='space-y-4'>
					<button
						type='button'
						onClick={() => router.back()}
						className='inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg'
						aria-label={t('ariaGoBack')}
					>
						<ArrowLeft className='size-4' aria-hidden='true' />
						{t('back')}
					</button>

					<PostCard
						post={post}
						contentDisplay='full'
						onUpdate={handlePostUpdate}
						onDelete={handlePostDelete}
						currentUserId={user?.userId}
					/>
				</div>

				<div className='pb-40 md:pb-8' />
			</PageContainer>
		</PageTransition>
	)
}
