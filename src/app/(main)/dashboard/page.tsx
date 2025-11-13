'use client'

import { useEffect, useState } from 'react'
import { Post } from '@/lib/types'
import { getFeedPosts } from '@/services/post'
import { PageContainer } from '@/components/layout/PageContainer'
import { PostCard } from '@/components/social/PostCard'
import { PostCardSkeleton } from '@/components/social/PostCardSkeleton'
import { CreatePostForm } from '@/components/social/CreatePostForm'
import { ErrorState } from '@/components/ui/error-state'
import { EmptyState } from '@/components/ui/empty-state'
import { Stories } from '@/components/social/Stories'
import lottieNotFound from '@/../public/lottie/lottie-not-found.json'
import { StaggerContainer } from '@/components/ui/stagger-animation'
import { Users, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { AnimatePresence } from 'framer-motion'

export default function DashboardPage() {
	const { user } = useAuth()
	const [posts, setPosts] = useState<Post[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const fetchFeed = async () => {
			setIsLoading(true)
			setError(null)
			try {
				const response = await getFeedPosts({ limit: 20 })
				if (response.success && response.data) {
					setPosts(response.data)
				}
			} catch (err) {
				setError('Failed to load feed')
			} finally {
				setIsLoading(false)
			}
		}

		fetchFeed()
	}, [])

	const handlePostCreated = (newPost: Post) => {
		setPosts(prev => (Array.isArray(prev) ? [newPost, ...prev] : [newPost]))
	}

	const handlePostUpdate = (updatedPost: Post) => {
		setPosts(prev =>
			Array.isArray(prev)
				? prev.map(p => (p.id === updatedPost.id ? updatedPost : p))
				: [],
		)
	}

	const handlePostDelete = (postId: string) => {
		setPosts(prev =>
			Array.isArray(prev) ? prev.filter(p => p.id !== postId) : [],
		)
	}

	return (
		<PageContainer maxWidth='lg'>
			{/* Stories Bar - Only show on mobile/tablet, hidden on desktop where RightSidebar shows it */}
			<div className='mb-4 md:mb-6 lg:hidden'>
				<Stories variant='horizontal' />
			</div>
			<div className='mb-4 md:mb-6'>
				<h1 className='mb-2 text-3xl font-bold leading-tight text-text-primary'>
					Your Feed
				</h1>
				<p className='leading-normal text-text-secondary'>
					Share your culinary journey and see what your friends are cooking
				</p>
			</div>
			{/* Create Post Form */}
			<div className='mb-4 md:mb-6'>
				<CreatePostForm
					onPostCreated={handlePostCreated}
					currentUser={
						user
							? {
									userId: user.userId ?? '',
									displayName: user.displayName || user.username || 'User',
									avatarUrl: user.avatarUrl,
								}
							: undefined
					}
				/>
			</div>
			{/* Content */}
			{isLoading && (
				<div className='space-y-4 md:space-y-6'>
					<PostCardSkeleton count={3} showImages={false} />
				</div>
			)}{' '}
			{error && (
				<ErrorState
					title='Failed to load feed'
					message={error}
					onRetry={() => window.location.reload()}
				/>
			)}
			{!isLoading && !error && posts.length === 0 && (
				<EmptyState
					title='Your feed is empty'
					description='Follow chefs and add friends to see their latest posts here!'
					icon={MessageSquare}
					lottieAnimation={lottieNotFound}
				>
					<div className='flex flex-wrap justify-center gap-3'>
						<Link href='/discover'>
							<Button>
								<Users className='mr-2 h-4 w-4' />
								Discover People
							</Button>
						</Link>
						<Link href='/explore'>
							<Button variant='outline'>
								<MessageSquare className='mr-2 h-4 w-4' />
								Explore Posts
							</Button>
						</Link>
					</div>
				</EmptyState>
			)}
			{!isLoading && !error && posts.length > 0 && (
				<StaggerContainer className='space-y-4 md:space-y-6'>
					<AnimatePresence mode='popLayout'>
						{posts.map(post => (
							<PostCard
								key={post.id}
								post={post}
								onUpdate={handlePostUpdate}
								onDelete={handlePostDelete}
								currentUserId={user?.userId}
							/>
						))}
					</AnimatePresence>
				</StaggerContainer>
			)}
		</PageContainer>
	)
}
