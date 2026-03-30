'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import {
	getGroupDetails,
	getGroupMembers,
	getGroupPosts,
} from '@/services/group'
import { Group, GroupMember } from '@/lib/types/group'
import { Post } from '@/lib/types'
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
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'

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

	// Get current user from auth store
	const user = useAuthStore(state => state.user)
	const isAuthenticated = useAuthStore(state => state.isAuthenticated)

	// Component state
	const [group, setGroup] = useState<Group | null>(null)
	const [members, setMembers] = useState<GroupMember[]>([])
	const [posts, setPosts] = useState<Post[]>([])
	const [isLoadingGroup, setIsLoadingGroup] = useState(true)
	const [isLoadingMembers, setIsLoadingMembers] = useState(false)
	const [isLoadingPosts, setIsLoadingPosts] = useState(false)
	const [activeTab, setActiveTab] = useState('about')
	const [showSettings, setShowSettings] = useState(false)

	// Check authentication
	useEffect(() => {
		if (!isAuthenticated) {
			router.push('/auth/sign-in')
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
				toast.error('Failed to load group')
				router.push('/groups')
			} finally {
				if (!cancelled) setIsLoadingGroup(false)
			}
		}

		loadGroup()
		return () => { cancelled = true }
	}, [groupId, isAuthenticated, router])

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
				if (!cancelled) toast.error('Failed to load members')
			} finally {
				if (!cancelled) setIsLoadingMembers(false)
			}
		}

		loadMembers()
		return () => {
			cancelled = true
		}
	}, [activeTab, group, groupId])

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
					toast.error('Failed to load posts')
					console.error('Post loading error:', error)
				}
			} finally {
				if (!cancelled) setIsLoadingPosts(false)
			}
		}

		loadPosts()
		return () => {
			cancelled = true
		}
	}, [activeTab, group, groupId])

	// Show loading spinner
	if (isLoadingGroup) {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<Loader2 className='w-8 h-8 animate-spin text-brand' />
			</div>
		)
	}

	// Show not found
	if (!group) {
		return (
			<div className='flex flex-col items-center justify-center min-h-screen gap-4'>
				<p className='text-text-secondary'>Group not found</p>
				<Link href='/groups'>
					<Button>Back to Groups</Button>
				</Link>
			</div>
		)
	}

	// Check if current user is admin
	const isAdmin = group.myRole === 'ADMIN' || group.myRole === 'OWNER'
	const isMember = group.myStatus === 'ACTIVE'

	return (
		<main className='min-h-screen py-8 pb-48'>
			<div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12'>
				{/* Group Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
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
					transition={{ duration: 0.3, delay: 0.1 }}
					className='mb-20'
				>
					<Tabs
						value={activeTab}
						onValueChange={setActiveTab}
						className='w-full'
					>
						{/* Tab Navigation */}
						<TabsList className='mb-6 grid w-full grid-cols-3'>
							<TabsTrigger value='about'>About</TabsTrigger>
							<TabsTrigger value='members'>
								Members ({group.memberCount})
							</TabsTrigger>
							<TabsTrigger value='posts'>Posts</TabsTrigger>
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
												console.error('Failed to reload posts:', error)
											} finally {
												setIsLoadingPosts(false)
											}
										}}
									/>

									{/* Posts list */}
									{isLoadingPosts ? (
										<div className='flex items-center justify-center py-12'>
											<Loader2 className='w-8 h-8 animate-spin text-brand' />
										</div>
									) : posts.length > 0 ? (
										<div className='space-y-4'>
											{posts.map(post => (
												<motion.div
													key={post.id}
													initial={{ opacity: 0, y: 10 }}
													animate={{ opacity: 1, y: 0 }}
													transition={{ duration: 0.2 }}
												>
													<PostCard
														post={post}
														currentUserId={user?.userId}
														onDelete={deletedPostId => {
															setPosts(prev =>
																prev.filter(p => p.id !== deletedPostId),
															)
														}}
														onUpdate={updatedPost => {
															setPosts(prev =>
																prev.map(p =>
																	p.id === updatedPost.id ? updatedPost : p,
																),
															)
														}}
													/>
												</motion.div>
											))}
										</div>
									) : (
										<div className='bg-bg-card rounded-lg p-8 border border-border text-center'>
											<p className='text-text-secondary mb-4'>
												No posts yet. Be the first to share something!
											</p>
											<Button
												onClick={() => {
													// Focus on post box when clicked
												}}
												className='bg-brand hover:bg-brand/90 text-white'
											>
												Create First Post
											</Button>
										</div>
									)}
								</>
							) : (
								<div className='bg-bg-card rounded-lg p-8 border border-border text-center'>
									<p className='text-text-secondary'>
										Join the group to see and create posts
									</p>
								</div>
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
							toast.success('Group updated!')
						}}
					/>
				)}
			</div>
		</main>
	)
}
