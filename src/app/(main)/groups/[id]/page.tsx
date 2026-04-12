'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import {
	getGroupDetails,
	getGroupMembers,
	getGroupPosts,
} from '@/services/group'
import { Group, GroupMember } from '@/lib/types/group'
import { Post } from '@/lib/types'
import { TRANSITION_SPRING } from '@/lib/motion'
import { Skeleton } from '@/components/ui/skeleton'
import {
	GroupHeader,
	GroupMembersList,
	GroupAboutSection,
	GroupCreatePostBox,
	GroupSettingsModal,
} from '@/components/groups'
import { PostCard } from '@/components/social/PostCard'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { logDevError } from '@/lib/dev-log'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { PATHS } from '@/constants'
import { PageTransition } from '@/components/layout/PageTransition'
import { PageContainer } from '@/components/layout/PageContainer'
import { EmptyState } from '@/components/shared/EmptyStateGamified'

/**
 * Group Detail Page - Facebook Style
 * Shows group header, about section, members, and posts
 *
 * Code is simple and easy to understand for beginners
 */
export default function GroupDetailPage() {
	const router = useRouter()
	const params = useParams()
	const groupId = params?.id as string
	const t = useTranslations('groups')

	// Get current user from auth hook
	const { user, isAuthenticated } = useAuth()

	// Component state
	const [group, setGroup] = useState<Group | null>(null)
	const [members, setMembers] = useState<GroupMember[]>([])
	const [posts, setPosts] = useState<Post[]>([])
	const [isLoadingGroup, setIsLoadingGroup] = useState(true)
	const [isLoadingMembers, setIsLoadingMembers] = useState(false)
	const [isLoadingPosts, setIsLoadingPosts] = useState(false)
	const [activeTab, setActiveTab] = useState('about')
	const [showSettings, setShowSettings] = useState(false)

	// Memoized post handlers to prevent unnecessary PostCard re-renders
	const handleGroupPostUpdate = useCallback((updatedPost: Post) => {
		setPosts(prev => prev.map(p => (p.id === updatedPost.id ? updatedPost : p)))
	}, [])

	const handleGroupPostDelete = useCallback((deletedPostId: string) => {
		setPosts(prev => prev.filter(p => p.id !== deletedPostId))
	}, [])

	// Check authentication
	useEffect(() => {
		if (!isAuthenticated) {
			router.push(PATHS.AUTH.SIGN_IN)
		}
	}, [isAuthenticated, router])

	// Load group details when page mounts
	useEffect(() => {
		if (!isAuthenticated || !groupId) return
		let cancelled = false
		const loadGroup = async () => {
			try {
				setIsLoadingGroup(true)
				const groupData = await getGroupDetails(groupId)
				if (cancelled) return
				setGroup(groupData)
			} catch (error) {
				if (cancelled) return
				toast.error(t('failedLoadGroup'))
				router.push('/groups')
			} finally {
				if (!cancelled) setIsLoadingGroup(false)
			}
		}

		loadGroup()
		return () => {
			cancelled = true
		}
	}, [groupId, isAuthenticated, router, t])

	// Load members when members tab is clicked
	useEffect(() => {
		if (activeTab !== 'members' || !group) return
		let cancelled = false

		const loadMembers = async () => {
			try {
				setIsLoadingMembers(true)
				const response = await getGroupMembers(groupId, 0, 50)
				if (!cancelled) setMembers(response.content)
			} catch (error) {
				if (!cancelled) toast.error(t('failedLoadMembers'))
			} finally {
				if (!cancelled) setIsLoadingMembers(false)
			}
		}

		loadMembers()
		return () => {
			cancelled = true
		}
	}, [activeTab, group, groupId, t])

	// Load posts when posts tab is clicked
	useEffect(() => {
		if (activeTab !== 'posts' || !group) return
		let cancelled = false

		const loadPosts = async () => {
			try {
				setIsLoadingPosts(true)
				const response = await getGroupPosts(groupId, 0, 20)
				if (!cancelled) setPosts(response.content || [])
			} catch (error) {
				if (!cancelled) {
					toast.error(t('failedLoadPosts'))
					logDevError('Post loading error:', error)
				}
			} finally {
				if (!cancelled) setIsLoadingPosts(false)
			}
		}

		loadPosts()
		return () => {
			cancelled = true
		}
	}, [activeTab, group, groupId, t])

	// Show loading state
	if (isLoadingGroup) {
		return (
			<PageContainer maxWidth='xl' className='py-8'>
				{/* Header skeleton */}
				<div className='mb-8 space-y-4'>
					<Skeleton className='h-48 w-full rounded-2xl' />
					<div className='flex items-center gap-4'>
						<Skeleton className='size-20 shrink-0 rounded-2xl' />
						<div className='flex-1 space-y-2'>
							<Skeleton className='h-6 w-1/3' />
							<Skeleton className='h-4 w-1/2' />
						</div>
					</div>
				</div>
				{/* Content skeleton */}
				<div className='space-y-4'>
					{Array.from({ length: 3 }).map((_, i) => (
						<div
							key={i}
							className='rounded-2xl border border-border-subtle bg-bg-card p-5'
						>
							<Skeleton className='h-4 w-3/4' />
							<Skeleton className='mt-2 h-3 w-1/2' />
						</div>
					))}
				</div>
			</PageContainer>
		)
	}

	// Show not found
	if (!group) {
		return (
			<div className='flex flex-col items-center justify-center min-h-screen gap-4'>
				<p className='text-text-secondary'>{t('groupNotFound')}</p>
				<Link href='/groups'>
					<Button>{t('backToGroups')}</Button>
				</Link>
			</div>
		)
	}

	// Check if current user is admin
	const isAdmin = group.myRole === 'ADMIN' || group.myRole === 'OWNER'
	const isMember = group.myStatus === 'ACTIVE'

	return (
		<PageTransition>
			<PageContainer maxWidth='xl' className='py-8 pb-48'>
				{/* Group Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={TRANSITION_SPRING}
					className='mb-8'
				>
					<GroupHeader
						group={group}
						currentUserId={user?.userId}
						onSettingsClick={() => setShowSettings(true)}
						onLeaveGroup={() => router.push('/groups')}
					/>
				</motion.div>

				{/* Tabs Section */}
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={TRANSITION_SPRING}
					className='mb-20'
				>
					<Tabs
						value={activeTab}
						onValueChange={setActiveTab}
						className='w-full'
					>
						{/* Tab Navigation */}
						<TabsList className='mb-6 grid w-full grid-cols-3'>
							<TabsTrigger value='about'>{t('tabAbout')}</TabsTrigger>
							<TabsTrigger value='members'>
								{t('tabMembers', { count: group.memberCount })}
							</TabsTrigger>
							<TabsTrigger value='posts'>{t('tabPosts')}</TabsTrigger>
						</TabsList>
						{/* About Tab - Shows rich group information */}
						<TabsContent value='about' className='space-y-4'>
							<GroupAboutSection
								group={group}
								onViewMembers={() => setActiveTab('members')}
							/>
						</TabsContent>{' '}
						{/* Members Tab - Shows group members */}
						<TabsContent value='members' className='space-y-4'>
							<GroupMembersList
								members={members}
								groupId={groupId}
								currentUserId={user?.userId}
								canManageMembers={isAdmin}
								isLoading={isLoadingMembers}
								onMemberRemoved={userId => {
									setMembers(prev => prev.filter(m => m.userId !== userId))
								}}
							/>
						</TabsContent>
						{/* Posts Tab - Shows group posts and create post box */}
						<TabsContent value='posts' className='space-y-4'>
							{isMember ? (
								<>
									{/* Post creation box */}
									<GroupCreatePostBox
										groupId={groupId}
										groupName={group.name}
										onPostCreated={async () => {
											// Reload posts after creating a new post
											try {
												setIsLoadingPosts(true)
												const response = await getGroupPosts(groupId, 0, 20)
												setPosts(response.content || [])
											} catch (error) {
												logDevError('Failed to reload posts:', error)
											} finally {
												setIsLoadingPosts(false)
											}
										}}
									/>

									{/* Posts list */}
									{isLoadingPosts ? (
										<div className='space-y-4'>
											{[1, 2, 3].map(i => (
												<div
													key={i}
													className='rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-3'
												>
													<div className='flex items-center gap-3'>
														<Skeleton className='size-10 rounded-full' />
														<div className='space-y-1'>
															<Skeleton className='h-4 w-24' />
															<Skeleton className='h-3 w-16' />
														</div>
													</div>
													<Skeleton className='h-4 w-full' />
													<Skeleton className='h-4 w-3/4' />
													<Skeleton className='h-48 w-full rounded-xl' />
												</div>
											))}
										</div>
									) : posts.length > 0 ? (
										<div className='space-y-4'>
											{posts.map(post => (
												<motion.div
													key={post.id}
													initial={{ opacity: 0, y: 10 }}
													animate={{ opacity: 1, y: 0 }}
													transition={TRANSITION_SPRING}
												>
													<PostCard
														post={post}
														currentUserId={user?.userId}
														onDelete={handleGroupPostDelete}
														onUpdate={handleGroupPostUpdate}
													/>
												</motion.div>
											))}
										</div>
									) : (
										<EmptyState
											variant='feed'
											title={t('noPostsYet')}
											description={t('beFirstToPost')}
											emoji='🍳'
											primaryAction={{
												label: t('createFirstPost'),
												onClick: () => {
													const postBox = document.querySelector(
														'[data-group-post-box]',
													)
													if (postBox)
														postBox.scrollIntoView({ behavior: 'smooth' })
												},
											}}
										/>
									)}
								</>
							) : (
								<EmptyState
									variant='custom'
									title={t('joinConversation')}
									description={t('joinConversationDesc')}
									emoji='👋'
								/>
							)}
						</TabsContent>
					</Tabs>
				</motion.div>

				{/* Settings Modal - Only for admins */}
				{isAdmin && (
					<GroupSettingsModal
						open={showSettings}
						onOpenChange={setShowSettings}
						group={group}
						onSettingsUpdated={updatedGroup => {
							setGroup(updatedGroup)
							toast.success(t('groupUpdated'))
						}}
					/>
				)}

				<div className='pb-40 md:pb-8' />
			</PageContainer>
		</PageTransition>
	)
}
