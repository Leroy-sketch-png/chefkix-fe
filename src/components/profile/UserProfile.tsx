'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Profile, Post, getProfileDisplayName } from '@/lib/types'
import {
	Clock,
	Heart,
	MessageCircle,
	Bookmark,
	ImageOff,
	Trophy,
	Award,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toggleFollow, blockUser, unblockUser } from '@/services/social'
import {
	getSessionHistory,
	SessionHistoryItem,
} from '@/services/cookingSession'
import { getRecipesByUserId, getSavedRecipes } from '@/services/recipe'
import { getPostsByUser, getSavedPosts } from '@/services/post'
import { Recipe, getRecipeImage, getTotalTime } from '@/lib/types/recipe'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/toaster'
import { ProfileHeaderGamified } from './ProfileHeaderGamified'
import { CookingHistoryTab, type PendingSession } from '@/components/pending'
import type { Badge as GamificationBadge } from '@/lib/types/gamification'
import {
	resolveBadgesWithFallback,
	getAllBadges,
} from '@/lib/data/badgeRegistry'
import { PostCard } from '@/components/social/PostCard'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

// ============================================
// ADAPTER: Profile → ProfileUser
// ============================================

interface ProfileUser {
	id: string
	displayName: string
	username: string
	avatarUrl: string
	coverUrl?: string
	bio?: string
	isVerified?: boolean
	stats: {
		followers: number
		following: number
		recipesCooked: number
		recipesCreated: number
		mastered?: number
	}
	gamification: {
		currentLevel: number
		currentXP: number
		currentXPGoal: number
		xpToNextLevel: number
		progressPercent: number
		streakCount: number
		title: 'BEGINNER' | 'AMATEUR' | 'SEMIPRO' | 'PRO'
	}
	badges: GamificationBadge[]
	totalBadges: number
}

const transformProfileToProfileUser = (profile: Profile): ProfileUser => {
	const { statistics } = profile
	const progressPercent =
		statistics.currentXPGoal > 0
			? Math.min(
					100,
					Math.round((statistics.currentXP / statistics.currentXPGoal) * 100),
				)
			: 0
	const xpToNextLevel = Math.max(
		0,
		statistics.currentXPGoal - statistics.currentXP,
	)

	// Resolve badge IDs from statistics to full Badge objects
	const badgeIds = statistics.badges ?? []
	const badges = resolveBadgesWithFallback(badgeIds)

	return {
		id: profile.userId,
		displayName: getProfileDisplayName(profile),
		username: profile.username || 'user',
		avatarUrl:
			profile.avatarUrl ||
			`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username || profile.userId}`,
		coverUrl: profile.coverImageUrl, // Cover photo from profile
		bio: profile.bio,
		isVerified:
			profile.accountType === 'chef' || profile.accountType === 'admin',
		stats: {
			followers: statistics.followerCount,
			following: statistics.followingCount,
			recipesCooked: statistics.recipesCooked ?? statistics.postCount, // Prefer actual count, fallback to posts
			recipesCreated: statistics.recipeCount,
			mastered: statistics.recipesMastered ?? 0, // From BE when user cooks recipe 5+ times
		},
		gamification: {
			currentLevel: Math.max(1, statistics.currentLevel), // Min level 1
			currentXP: statistics.currentXP,
			currentXPGoal: statistics.currentXPGoal,
			xpToNextLevel,
			progressPercent,
			streakCount: statistics.streakCount,
			title: statistics.title,
		},
		badges,
		totalBadges: badges.length,
	}
}

type UserProfileProps = {
	profile: Profile
	currentUserId?: string // Make currentUserId optional
	initialTab?: string // Support deep linking via ?tab= query param
}

// ============================================
// HELPER: Calculate XP decay multiplier based on time since completion
// Business rules:
// - Days 0-7: 100% of pendingXp
// - Days 8-14: 50% of pendingXp
// - Days 15+: 0% (expired, but shown in expired section)
// ============================================
function calculateDecayMultiplier(completedAt: string | undefined): number {
	if (!completedAt) return 1.0

	const completedDate = new Date(completedAt)
	const now = new Date()
	const daysSinceCompletion = Math.floor(
		(now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24),
	)

	if (daysSinceCompletion <= 7) return 1.0
	if (daysSinceCompletion <= 14) return 0.5
	return 0.0
}

// ============================================
// HELPER: Transform session history to pending sessions
// ============================================

function transformToPendingSession(item: SessionHistoryItem): PendingSession {
	// Calculate status based on deadline
	let status: PendingSession['status'] = 'normal'
	let expiresAt = new Date()

	if (item.postDeadline) {
		expiresAt = new Date(item.postDeadline)
		const now = new Date()
		const hoursLeft = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)

		if (hoursLeft <= 0) {
			status = 'expired'
		} else if (hoursLeft <= 24) {
			status = 'urgent'
		} else if (hoursLeft <= 48) {
			status = 'warning'
		}
	}

	if (item.status === 'abandoned') {
		status = 'abandoned'
	} else if (item.status === 'expired') {
		status = 'expired'
	}

	// Posted sessions should be filtered out upstream, but handle gracefully
	if (item.postId) {
		status = 'normal' // Already posted
	}

	// XP calculation for pending posts:
	// - baseXP = the ORIGINAL post bonus (pendingXp stored at completion)
	// - currentXP = post bonus with decay applied based on days since completion
	//
	// IMPORTANT: baseXP here is NOT "total XP ever possible", it's specifically
	// the post bonus. The cooking completion XP (baseXpAwarded) was already given
	// and is NOT shown here — that's "XP Earned" in the stats.
	const isPending = !item.postId && item.status === 'completed'
	const isPosted = !!item.postId

	const decayMultiplier = calculateDecayMultiplier(item.completedAt)
	const originalPostBonus = item.pendingXp ?? 0
	const currentPostBonus = Math.round(originalPostBonus * decayMultiplier)

	// For pending: show post bonus (with decay)
	// For posted: show total XP earned (base + post bonus that was actually awarded)
	// For abandoned/expired: 0
	const baseXP = isPending ? originalPostBonus : (item.baseXpAwarded ?? 0)
	const currentXP = isPending
		? currentPostBonus
		: isPosted
			? (item.xpEarned ?? item.baseXpAwarded ?? 0)
			: 0

	// Calculate duration from startedAt to completedAt (or now if not completed)
	const startTime = new Date(item.startedAt).getTime()
	const endTime = item.completedAt
		? new Date(item.completedAt).getTime()
		: Date.now()
	const durationMinutes = Math.max(
		0,
		Math.round((endTime - startTime) / (1000 * 60)),
	)

	return {
		id: item.sessionId,
		recipeId: item.recipeId,
		recipeName: item.recipeTitle,
		recipeImage:
			(Array.isArray(item.coverImageUrl)
				? item.coverImageUrl[0]
				: item.coverImageUrl) || '/placeholder-recipe.jpg',
		cookedAt: item.completedAt
			? new Date(item.completedAt)
			: new Date(item.startedAt),
		duration: durationMinutes,
		baseXP,
		currentXP,
		expiresAt,
		status,
		postId: item.postId ?? undefined,
	}
}

// ============================================
// COMPONENT
// ============================================

export const UserProfile = ({
	profile: initialProfile,
	currentUserId,
	initialTab,
}: UserProfileProps) => {
	const [profile, setProfile] = useState<Profile>(initialProfile)
	const [isLoading, setIsLoading] = useState(false)
	const [activeTab, setActiveTab] = useState(initialTab || 'recipes')
	const [userRecipes, setUserRecipes] = useState<Recipe[]>([])
	const [isLoadingRecipes, setIsLoadingRecipes] = useState(false)
	const [userPosts, setUserPosts] = useState<Post[]>([])
	const [isLoadingPosts, setIsLoadingPosts] = useState(false)
	const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([])
	const [savedPosts, setSavedPosts] = useState<Post[]>([])
	const [isLoadingSaved, setIsLoadingSaved] = useState(false)
	const [isLoadingSavedPosts, setIsLoadingSavedPosts] = useState(false)
	const [savedSubTab, setSavedSubTab] = useState<'recipes' | 'posts'>('recipes')
	const [cookingSessions, setCookingSessions] = useState<PendingSession[]>([])
	const [cookingStats, setCookingStats] = useState({
		totalSessions: 0,
		uniqueRecipes: 0,
		pendingPosts: 0,
		totalXPEarned: 0,
	})
	// Block confirmation dialog state
	const [showBlockConfirm, setShowBlockConfirm] = useState(false)

	const router = useRouter()
	const isOwnProfile = profile.userId === currentUserId

	// Fetch user's recipes when recipes tab is active
	useEffect(() => {
		if (activeTab !== 'recipes') return

		const fetchRecipes = async () => {
			setIsLoadingRecipes(true)
			try {
				const response = await getRecipesByUserId(profile.userId, { limit: 20 })
				if (response.success && response.data) {
					setUserRecipes(response.data)
				}
			} catch (err) {
				console.error('Failed to fetch user recipes:', err)
			} finally {
				setIsLoadingRecipes(false)
			}
		}

		fetchRecipes()
	}, [profile.userId, activeTab])

	// Fetch cooking session history when tab is active (for own profile only)
	useEffect(() => {
		if (!isOwnProfile || activeTab !== 'cooking') return

		const fetchCookingSessions = async () => {
			try {
				const response = await getSessionHistory({ status: 'all', size: 50 })
				if (response.success && response.data?.sessions) {
					const sessions = response.data.sessions.map(transformToPendingSession)
					setCookingSessions(sessions)

					// Compute stats
					const uniqueRecipeIds = new Set(
						response.data.sessions.map(s => s.recipeId),
					)
					const pendingPosts = response.data.sessions.filter(
						s => s.status === 'completed' && !s.postId,
					).length
					// XP Earned = sum of all XP actually received:
					// - Posted sessions: xpEarned (base + post bonus)
					// - Completed (pending): baseXpAwarded (the 30% given at completion)
					// - Abandoned: 0 (no XP given)
					const totalXP = response.data.sessions.reduce((sum, s) => {
						if (s.status === 'posted' && s.postId) {
							// Posted: use xpEarned which is base + remaining
							return sum + (s.xpEarned ?? 0)
						} else if (s.status === 'completed') {
							// Completed but not posted: only base XP was awarded
							return sum + (s.baseXpAwarded ?? 0)
						}
						// Abandoned/expired: no XP
						return sum
					}, 0)

					setCookingStats({
						totalSessions: sessions.length,
						uniqueRecipes: uniqueRecipeIds.size,
						pendingPosts,
						totalXPEarned: totalXP,
					})
				}
			} catch (err) {
				console.error('Failed to fetch cooking sessions:', err)
			}
		}

		fetchCookingSessions()
	}, [isOwnProfile, activeTab])

	// Fetch user's posts when posts tab is active
	useEffect(() => {
		if (activeTab !== 'posts') return

		const fetchPosts = async () => {
			setIsLoadingPosts(true)
			try {
				const response = await getPostsByUser(profile.userId, { limit: 20 })
				if (response.success && response.data) {
					setUserPosts(response.data)
				}
			} catch (err) {
				console.error('Failed to fetch user posts:', err)
			} finally {
				setIsLoadingPosts(false)
			}
		}

		fetchPosts()
	}, [profile.userId, activeTab])

	// Fetch saved recipes when saved tab is active (own profile only)
	useEffect(() => {
		if (!isOwnProfile || activeTab !== 'saved') return

		const fetchSaved = async () => {
			setIsLoadingSaved(true)
			try {
				const response = await getSavedRecipes({ limit: 20 })
				if (response.success && response.data) {
					setSavedRecipes(response.data as Recipe[])
				}
			} catch (err) {
				console.error('Failed to fetch saved recipes:', err)
			} finally {
				setIsLoadingSaved(false)
			}
		}

		fetchSaved()
	}, [isOwnProfile, activeTab])

	// Fetch saved posts when saved tab + posts sub-tab is active
	useEffect(() => {
		if (!isOwnProfile || activeTab !== 'saved' || savedSubTab !== 'posts')
			return

		const fetchSavedPosts = async () => {
			setIsLoadingSavedPosts(true)
			try {
				const response = await getSavedPosts(0, 20)
				if (response.success && response.data?.content) {
					setSavedPosts(response.data.content)
				}
			} catch (err) {
				console.error('Failed to fetch saved posts:', err)
			} finally {
				setIsLoadingSavedPosts(false)
			}
		}

		fetchSavedPosts()
	}, [isOwnProfile, activeTab, savedSubTab])

	// Transform Profile to ProfileUser for gamified header
	const profileUser = transformProfileToProfileUser(profile)

	const handleFollow = async () => {
		setIsLoading(true)
		const wasFollowing = profile.isFollowing

		// Optimistic UI update
		setProfile(prev => ({
			...prev,
			isFollowing: !prev.isFollowing,
			statistics: {
				...prev.statistics,
				followerCount: prev.isFollowing
					? prev.statistics.followerCount - 1
					: prev.statistics.followerCount + 1,
			},
		}))

		const response = await toggleFollow(profile.userId)

		if (response.success && response.data) {
			setProfile(response.data)
			const displayName = getProfileDisplayName(profile)
			toast.success(
				wasFollowing
					? `Unfollowed ${displayName}`
					: `Now following ${displayName}`,
			)
		} else {
			// Revert optimistic update on error
			setProfile(prev => ({
				...prev,
				isFollowing: wasFollowing,
				statistics: {
					...prev.statistics,
					followerCount: wasFollowing
						? prev.statistics.followerCount + 1
						: prev.statistics.followerCount - 1,
				},
			}))
			toast.error(response.message || 'Failed to update follow status')
		}

		setIsLoading(false)
	}

	// ============================================
	// ACTION HANDLERS FOR GAMIFIED HEADER
	// ============================================

	const handleEditProfile = () => {
		router.push('/settings')
	}

	const handleShareProfile = () => {
		const displayName = getProfileDisplayName(profile)
		if (navigator.share) {
			navigator.share({
				title: `${displayName}'s Profile`,
				url: window.location.href,
			})
		} else {
			navigator.clipboard.writeText(window.location.href)
			toast.success('Profile link copied to clipboard!')
		}
	}

	const handleMessage = () => {
		router.push(`/messages?userId=${profile.userId}`)
	}

	// Initialize isBlocked from profile API response
	const [isBlocked, setIsBlocked] = useState(profile.isBlocked ?? false)

	const handleBlock = async () => {
		const wasBlocked = isBlocked
		const displayName = getProfileDisplayName(profile)

		if (wasBlocked) {
			// Unblock
			setIsBlocked(false)
			const response = await unblockUser(profile.userId)
			if (response.success) {
				toast.success(`Unblocked ${displayName}`)
			} else {
				setIsBlocked(true)
				toast.error(response.message || 'Failed to unblock user')
			}
		} else {
			// Block - show confirmation dialog
			setShowBlockConfirm(true)
		}
	}

	const handleConfirmBlock = async () => {
		setIsBlocked(true)
		const displayName = getProfileDisplayName(profile)
		const response = await blockUser(profile.userId)
		if (response.success) {
			toast.success(`Blocked ${displayName}`)
			// Update profile state to reflect the unfollow
			setProfile(prev => ({
				...prev,
				isFollowing: false,
			}))
		} else {
			setIsBlocked(false)
			toast.error(response.message || 'Failed to block user')
		}
	}

	return (
		<div className='mx-auto w-full max-w-container-xl'>
			{/* Block confirmation dialog */}
			<ConfirmDialog
				open={showBlockConfirm}
				onOpenChange={setShowBlockConfirm}
				title={`Block ${getProfileDisplayName(profile)}?`}
				description='This will remove any follow relationships between you, hide their content from you, and hide your content from them. You can unblock them later from Settings.'
				confirmLabel='Block'
				cancelLabel='Cancel'
				variant='destructive'
				onConfirm={handleConfirmBlock}
			/>

			{/* Gamified Profile Header */}
			{isOwnProfile ? (
				<ProfileHeaderGamified
					variant='own'
					user={profileUser}
					onEditProfile={handleEditProfile}
					onShareProfile={handleShareProfile}
					activeTab={activeTab}
					onTabChange={setActiveTab}
				/>
			) : (
				<ProfileHeaderGamified
					variant='other'
					user={profileUser}
					isFollowing={profile.isFollowing}
					isMutualFollow={profile.relationshipStatus === 'FRIENDS'}
					isBlocked={isBlocked}
					onFollow={handleFollow}
					onMessage={handleMessage}
					onBlock={handleBlock}
					activeTab={activeTab}
					onTabChange={setActiveTab}
				/>
			)}

			{/* Profile Content Grid - Tab Content */}
			<div className='mt-8'>
				{activeTab === 'recipes' && (
					<>
						{isLoadingRecipes ? (
							<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
								{[1, 2, 3].map(i => (
									<div
										key={i}
										className='animate-pulse overflow-hidden rounded-lg border border-border-subtle bg-bg-card'
									>
										<div className='h-48 w-full bg-muted' />
										<div className='space-y-3 p-4'>
											<div className='h-5 w-3/4 rounded bg-muted' />
											<div className='h-4 w-1/2 rounded bg-muted' />
											<div className='h-11 w-full rounded bg-muted' />
										</div>
									</div>
								))}
							</div>
						) : userRecipes.length === 0 ? (
							<div className='flex h-48 items-center justify-center rounded-lg border border-dashed border-border'>
								<p className='text-text-muted'>
									{isOwnProfile
										? "You haven't created any recipes yet"
										: 'No recipes created yet'}
								</p>
							</div>
						) : (
							<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
								{userRecipes.map(recipe => (
									<div
										key={recipe.id}
										className='overflow-hidden rounded-lg border border-border-subtle bg-bg-card shadow-sm transition-shadow hover:shadow-md'
									>
										<div className='relative h-48 w-full'>
											<Image
												src={
													getRecipeImage(recipe) || '/placeholder-recipe.jpg'
												}
												alt={recipe.title}
												fill
												className='object-cover'
											/>
										</div>
										<div className='p-4'>
											<h3 className='mb-2 line-clamp-1 text-lg font-semibold leading-tight text-text-primary'>
												{recipe.title}
											</h3>
											<div className='mb-4 flex items-center gap-4 text-sm leading-normal text-text-secondary'>
												<span className='flex items-center gap-1'>
													<Clock className='h-4 w-4' /> {getTotalTime(recipe)}{' '}
													min
												</span>
												<span className='flex items-center gap-1'>
													<Heart className='h-4 w-4' />{' '}
													{recipe.likeCount >= 1000
														? `${(recipe.likeCount / 1000).toFixed(1)}k`
														: recipe.likeCount}
												</span>
											</div>
											<Button
												className='h-11 w-full'
												onClick={() => router.push(`/recipes/${recipe.id}`)}
											>
												Cook Now
											</Button>
										</div>
									</div>
								))}
							</div>
						)}
					</>
				)}

				{activeTab === 'posts' && (
					<>
						{isLoadingPosts ? (
							<div className='space-y-4'>
								{[1, 2, 3].map(i => (
									<div
										key={i}
										className='rounded-lg border border-border-subtle bg-bg-card p-4'
									>
										<div className='flex items-center gap-3'>
											<Skeleton className='size-10 rounded-full' />
											<div className='flex-1'>
												<Skeleton className='h-4 w-32' />
												<Skeleton className='mt-1 h-3 w-24' />
											</div>
										</div>
										<Skeleton className='mt-4 h-20 w-full' />
									</div>
								))}
							</div>
						) : userPosts.length === 0 ? (
							<div className='flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border'>
								<ImageOff className='size-8 text-text-muted' />
								<p className='mt-2 text-text-muted'>
									{isOwnProfile
										? 'No posts yet. Complete a cooking session to share!'
										: 'No posts yet.'}
								</p>
								{isOwnProfile && (
									<Button
										variant='outline'
										className='mt-4'
										onClick={() => router.push('/explore')}
									>
										Find Recipes to Cook
									</Button>
								)}
							</div>
						) : (
							<div className='space-y-4'>
								{userPosts.map(post => (
									<PostCard
										key={post.id}
										post={post}
										currentUserId={currentUserId}
									/>
								))}
							</div>
						)}
					</>
				)}

				{activeTab === 'cooking' && (
					<CookingHistoryTab
						sessions={cookingSessions}
						stats={cookingStats}
						onPost={sessionId => {
							router.push(`/post/new?session=${sessionId}`)
						}}
						onViewPost={postId => {
							router.push(`/posts/${postId}`)
						}}
						onRetry={sessionId => {
							// Navigate to retry cooking this recipe
							const session = cookingSessions.find(s => s.id === sessionId)
							if (session) {
								router.push(`/recipes/${session.recipeId}/cook`)
							}
						}}
						onCookAgain={recipeId => {
							// Navigate to recipe with auto-start cooking
							router.push(`/recipes/${recipeId}?cook=true`)
						}}
					/>
				)}

				{activeTab === 'saved' && (
					<>
						{!isOwnProfile ? (
							<div className='flex h-48 items-center justify-center rounded-lg border border-dashed border-border'>
								<p className='text-text-muted'>Saved items are private</p>
							</div>
						) : (
							<div className='space-y-4'>
								{/* Sub-tabs for Recipes/Posts */}
								<div className='flex gap-2'>
									<button
										onClick={() => setSavedSubTab('recipes')}
										className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
											savedSubTab === 'recipes'
												? 'bg-brand text-white'
												: 'bg-bg-elevated text-text-secondary hover:bg-bg-card'
										}`}
									>
										Recipes ({savedRecipes.length})
									</button>
									<button
										onClick={() => setSavedSubTab('posts')}
										className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
											savedSubTab === 'posts'
												? 'bg-brand text-white'
												: 'bg-bg-elevated text-text-secondary hover:bg-bg-card'
										}`}
									>
										Posts ({savedPosts.length})
									</button>
								</div>

								{/* Saved Recipes */}
								{savedSubTab === 'recipes' && (
									<>
										{isLoadingSaved ? (
											<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
												{[1, 2, 3, 4].map(i => (
													<div
														key={i}
														className='overflow-hidden rounded-lg border border-border-subtle bg-bg-card'
													>
														<Skeleton className='h-40 w-full' />
														<div className='p-4'>
															<Skeleton className='h-5 w-3/4' />
															<Skeleton className='mt-2 h-4 w-1/2' />
														</div>
													</div>
												))}
											</div>
										) : savedRecipes.length === 0 ? (
											<div className='flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border'>
												<Bookmark className='size-8 text-text-muted' />
												<p className='mt-2 text-text-muted'>
													No saved recipes yet
												</p>
												<Button
													variant='outline'
													className='mt-4'
													onClick={() => router.push('/explore')}
												>
													Explore Recipes
												</Button>
											</div>
										) : (
											<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
												{savedRecipes.map(recipe => (
													<div
														key={recipe.id}
														className='group cursor-pointer overflow-hidden rounded-lg border border-border-subtle bg-bg-card transition-all hover:shadow-md'
														onClick={() => router.push(`/recipes/${recipe.id}`)}
													>
														<div className='relative h-40 overflow-hidden'>
															<Image
																src={
																	getRecipeImage(recipe) ||
																	'/placeholder-recipe.jpg'
																}
																alt={recipe.title}
																fill
																className='object-cover transition-transform group-hover:scale-105'
															/>
														</div>
														<div className='p-4'>
															<h3 className='font-semibold text-text line-clamp-1'>
																{recipe.title}
															</h3>
															<div className='mt-2 flex items-center gap-4 text-sm text-text-muted'>
																<span className='flex items-center gap-1'>
																	<Clock className='size-4' />
																	{getTotalTime(recipe)} min
																</span>
																<span className='flex items-center gap-1'>
																	<Heart className='size-4' />
																	{recipe.likeCount}
																</span>
															</div>
														</div>
													</div>
												))}
											</div>
										)}
									</>
								)}

								{/* Saved Posts */}
								{savedSubTab === 'posts' && (
									<>
										{isLoadingSavedPosts ? (
											<div className='space-y-4'>
												{[1, 2, 3].map(i => (
													<div
														key={i}
														className='overflow-hidden rounded-lg border border-border-subtle bg-bg-card p-4'
													>
														<div className='flex items-center gap-3'>
															<Skeleton className='size-10 rounded-full' />
															<div className='flex-1'>
																<Skeleton className='h-4 w-1/3' />
																<Skeleton className='mt-1 h-3 w-1/4' />
															</div>
														</div>
														<Skeleton className='mt-3 h-20 w-full' />
													</div>
												))}
											</div>
										) : savedPosts.length === 0 ? (
											<div className='flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border'>
												<MessageCircle className='size-8 text-text-muted' />
												<p className='mt-2 text-text-muted'>
													No saved posts yet
												</p>
												<Button
													variant='outline'
													className='mt-4'
													onClick={() => router.push('/')}
												>
													Explore Feed
												</Button>
											</div>
										) : (
											<div className='space-y-4'>
												{savedPosts.map(post => (
													<PostCard
														key={post.id}
														post={post}
														currentUserId={currentUserId}
														onDelete={id => {
															// Remove from saved list when unsaved
															setSavedPosts(prev =>
																prev.filter(p => p.id !== id),
															)
														}}
													/>
												))}
											</div>
										)}
									</>
								)}
							</div>
						)}
					</>
				)}

				{activeTab === 'achievements' && (
					<div className='space-y-6'>
						{/* Earned Badges */}
						<div>
							<h3 className='mb-4 flex items-center gap-2 text-lg font-bold text-text'>
								<Trophy className='size-5 text-xp' />
								Earned Badges ({profileUser.badges.length})
							</h3>
							{profileUser.badges.length === 0 ? (
								<div className='flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-border'>
									<Award className='size-8 text-text-muted' />
									<p className='mt-2 text-text-muted'>
										{isOwnProfile
											? 'Cook recipes to earn badges!'
											: 'No badges earned yet.'}
									</p>
								</div>
							) : (
								<div className='grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6'>
									{profileUser.badges.map((badge, index) => (
										<div
											key={badge.id || `badge-${index}`}
											className='flex flex-col items-center gap-2 rounded-xl border border-border-subtle bg-bg-card p-3 transition-all hover:shadow-md'
										>
											<span className='text-3xl'>{badge.icon}</span>
											<span className='text-center text-xs font-semibold text-text line-clamp-1'>
												{badge.name}
											</span>
											<span
												className={`rounded-full px-2 py-0.5 text-2xs font-semibold ${
													badge.rarity === 'LEGENDARY'
														? 'bg-amber-100 text-amber-700'
														: badge.rarity === 'EPIC'
															? 'bg-purple-100 text-purple-700'
															: badge.rarity === 'RARE'
																? 'bg-blue-100 text-blue-700'
																: badge.rarity === 'UNCOMMON'
																	? 'bg-green-100 text-green-700'
																	: 'bg-slate-100 text-slate-600'
												}`}
											>
												{badge.rarity}
											</span>
										</div>
									))}
								</div>
							)}
						</div>

						{/* View All Badges Link */}
						{isOwnProfile && (
							<div className='flex justify-center'>
								<Link
									href='/profile/badges'
									className='flex items-center gap-2 rounded-lg bg-brand px-6 py-3 font-semibold text-white transition-all hover:bg-brand/90 hover:shadow-md'
								>
									<Trophy className='size-5' />
									View Full Badge Catalog ({getAllBadges().length} badges)
								</Link>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	)
}
