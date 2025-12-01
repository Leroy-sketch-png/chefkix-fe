'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Profile, RelationshipStatus } from '@/lib/types'
import { Clock, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	toggleFollow,
	toggleFriendRequest,
	unfriendUser,
	acceptFriendRequest,
	declineFriendRequest,
} from '@/services/social'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/toaster'
import { triggerFriendConfetti } from '@/lib/confetti'
import { SOCIAL_MESSAGES } from '@/constants/messages'
import { ProfileHeaderGamified } from './ProfileHeaderGamified'
import { CookingHistoryTab, type PendingSession } from '@/components/pending'
import type { Badge as GamificationBadge } from '@/lib/types/gamification'

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
		friends?: number
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

	// TODO: Fetch real badges from API - /api/v1/badges/user/{userId}
	const badges: GamificationBadge[] = []

	return {
		id: profile.userId,
		displayName:
			profile.displayName ||
			`${profile.firstName} ${profile.lastName}`.trim() ||
			'Unknown User',
		username: profile.username || 'user',
		avatarUrl: profile.avatarUrl || 'https://i.pravatar.cc/150',
		coverUrl: undefined, // TODO: Add cover photo support
		bio: profile.bio,
		isVerified:
			profile.accountType === 'chef' || profile.accountType === 'admin',
		stats: {
			followers: statistics.followerCount,
			following: statistics.followingCount,
			friends: statistics.friendCount,
			recipesCooked: statistics.postCount, // Approximate: posts = cooked recipes
			recipesCreated: statistics.recipeCount,
			mastered: 0, // TODO: Add mastered recipes count
		},
		gamification: {
			currentLevel: statistics.currentLevel,
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
}

// ============================================
// MOCK DATA - TODO: Replace with API integration (MSW ready)
// ============================================

// Empty array for MSW preparation - will be replaced with API call
const mockCookingSessions: PendingSession[] = []

const mockCookingStats = {
	totalSessions: 0,
	uniqueRecipes: 0,
	pendingPosts: 0,
	totalXPEarned: 0,
}

// ============================================
// COMPONENT
// ============================================

export const UserProfile = ({
	profile: initialProfile,
	currentUserId,
}: UserProfileProps) => {
	const [profile, setProfile] = useState<Profile>(initialProfile)
	const [isLoading, setIsLoading] = useState(false)
	const [activeTab, setActiveTab] = useState('recipes')
	const router = useRouter()
	const isOwnProfile = profile.userId === currentUserId

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
			toast.success(
				wasFollowing
					? `Unfollowed ${profile.displayName}`
					: `Now following ${profile.displayName}`,
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

	const handleFriendRequest = async () => {
		setIsLoading(true)
		const previousStatus = profile.relationshipStatus
		const previousRequestCount = profile.statistics.friendRequestCount

		// Optimistic UI update
		const newStatus: RelationshipStatus =
			previousStatus === 'PENDING_SENT' ? 'NOT_FRIENDS' : 'PENDING_SENT'

		// Update relationshipStatus AND friendRequestCount according to API spec
		setProfile(prev => ({
			...prev,
			relationshipStatus: newStatus,
			statistics: {
				...prev.statistics,
				// Increment if sending request, decrement if cancelling
				friendRequestCount:
					newStatus === 'PENDING_SENT'
						? prev.statistics.friendRequestCount + 1
						: prev.statistics.friendRequestCount - 1,
			},
		}))

		const response = await toggleFriendRequest(profile.userId)

		if (response.success && response.data) {
			// Server returns the full profile with updated statistics
			setProfile(response.data)
			toast.success(
				previousStatus === 'PENDING_SENT'
					? 'Friend request cancelled'
					: 'Friend request sent!',
			)
		} else {
			// Revert on error
			setProfile(prev => ({
				...prev,
				relationshipStatus: previousStatus,
				statistics: {
					...prev.statistics,
					friendRequestCount: previousRequestCount,
				},
			}))
			toast.error(response.message || 'Failed to send friend request')
		}

		setIsLoading(false)
	}

	const handleUnfriend = async () => {
		setIsLoading(true)
		const previousFriendCount = profile.statistics.friendCount

		// Optimistic UI update
		setProfile(prev => ({
			...prev,
			relationshipStatus: 'NOT_FRIENDS' as RelationshipStatus,
			statistics: {
				...prev.statistics,
				friendCount: prev.statistics.friendCount - 1,
			},
		}))

		const response = await unfriendUser(profile.userId)

		if (response.success && response.data) {
			// The unfriend response is smaller, so we merge it manually
			setProfile(prev => ({
				...prev,
				relationshipStatus: response.data.relationshipStatus,
				statistics: {
					...prev.statistics,
					friendCount: response.data.statistics.friendCount,
				},
			}))
			toast.success(`Removed ${profile.displayName} from friends`)
		} else {
			// Revert on error
			setProfile(prev => ({
				...prev,
				relationshipStatus: 'FRIENDS' as RelationshipStatus,
				statistics: {
					...prev.statistics,
					friendCount: previousFriendCount,
				},
			}))
			toast.error(response.message || 'Failed to unfriend user')
		}

		setIsLoading(false)
	}

	const handleAcceptFriend = async () => {
		setIsLoading(true)
		const previousStatus = profile.relationshipStatus
		const previousFriendCount = profile.statistics.friendCount
		const previousRequestCount = profile.statistics.friendRequestCount

		// Optimistic UI update
		// According to API spec: accepting increments friendCount for both users
		setProfile(prev => ({
			...prev,
			relationshipStatus: 'FRIENDS' as RelationshipStatus,
			statistics: {
				...prev.statistics,
				friendCount: prev.statistics.friendCount + 1,
				// The request is consumed, so decrement friendRequestCount
				friendRequestCount: Math.max(0, prev.statistics.friendRequestCount - 1),
			},
		}))

		const response = await acceptFriendRequest(profile.userId)

		if (response.success && response.data) {
			// Server returns full profile with updated statistics
			setProfile(response.data)
			toast.success(`You and ${profile.displayName} are now friends!`)
			// Celebrate with confetti! 🎉
			triggerFriendConfetti()
		} else {
			// Revert on error
			setProfile(prev => ({
				...prev,
				relationshipStatus: previousStatus,
				statistics: {
					...prev.statistics,
					friendCount: previousFriendCount,
					friendRequestCount: previousRequestCount,
				},
			}))
			toast.error(response.message || 'Failed to accept friend request')
		}

		setIsLoading(false)
	}

	const handleDeclineFriend = async () => {
		setIsLoading(true)
		const previousStatus = profile.relationshipStatus
		const previousRequestCount = profile.statistics.friendRequestCount

		// Optimistic UI update
		// According to API spec: declining decrements friendRequestCount
		setProfile(prev => ({
			...prev,
			relationshipStatus: 'NOT_FRIENDS' as RelationshipStatus,
			statistics: {
				...prev.statistics,
				// The request is consumed, so decrement friendRequestCount
				friendRequestCount: Math.max(0, prev.statistics.friendRequestCount - 1),
			},
		}))

		const response = await declineFriendRequest(profile.userId)

		if (response.success && response.data) {
			// Decline response is smaller, merge manually
			setProfile(prev => ({
				...prev,
				relationshipStatus: response.data.relationshipStatus,
				isFollowing: response.data.isFollowing,
				statistics: {
					...prev.statistics,
					...response.data.statistics,
				},
			}))
			toast.success(SOCIAL_MESSAGES.FRIEND_REQUEST_DECLINED)
		} else {
			// Revert on error
			setProfile(prev => ({
				...prev,
				relationshipStatus: previousStatus,
				statistics: {
					...prev.statistics,
					friendRequestCount: previousRequestCount,
				},
			}))
			toast.error(response.message || 'Failed to decline friend request')
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
		if (navigator.share) {
			navigator.share({
				title: `${profile.displayName}'s Profile`,
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

	const handleCompare = () => {
		// TODO: Implement comparison feature
		toast.info('Coming soon: Compare your cooking history!')
	}

	return (
		<div className='mx-auto my-8 max-w-4xl'>
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
					isFriend={profile.relationshipStatus === 'FRIENDS'}
					onFollow={handleFollow}
					onAddFriend={
						profile.relationshipStatus === 'FRIENDS'
							? handleUnfriend
							: profile.relationshipStatus === 'PENDING_SENT'
								? handleFriendRequest
								: profile.relationshipStatus === 'PENDING_RECEIVED'
									? handleAcceptFriend
									: handleFriendRequest
					}
					onMessage={handleMessage}
					onCompare={handleCompare}
					recipesYouCooked={0} // TODO: Fetch actual count
					activeTab={activeTab}
					onTabChange={setActiveTab}
				/>
			)}

			{/* Profile Content Grid - Tab Content */}
			<div className='mt-8'>
				{activeTab === 'recipes' && (
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
						{/* Template: Recipe Card */}
						<div className='overflow-hidden rounded-lg border border-border-subtle bg-bg-card shadow-sm'>
							<div className='relative h-48 w-full'>
								<Image
									src='https://i.imgur.com/v8SjYfT.jpeg'
									alt='Spicy Ramen'
									fill
									className='object-cover'
								/>
							</div>
							<div className='p-4'>
								<h3 className='mb-2 text-lg font-semibold leading-tight text-text-primary'>
									Spicy Tomato Ramen
								</h3>
								<div className='mb-4 flex items-center gap-4 text-sm leading-normal text-text-secondary'>
									<span className='flex items-center gap-1'>
										<Clock className='h-4 w-4' /> 25 min
									</span>
									<span className='flex items-center gap-1'>
										<Heart className='h-4 w-4' /> 1.2k
									</span>
								</div>
								<Button className='h-11 w-full'>Cook Now</Button>
							</div>
						</div>
					</div>
				)}

				{activeTab === 'posts' && (
					<div className='flex h-48 items-center justify-center rounded-lg border border-dashed border-border'>
						<p className='text-text-muted'>Posts coming soon...</p>
					</div>
				)}

				{activeTab === 'cooking' && (
					<CookingHistoryTab
						sessions={mockCookingSessions}
						stats={mockCookingStats}
						onPost={sessionId => {
							router.push(`/create?session=${sessionId}`)
						}}
						onViewPost={postId => {
							router.push(`/posts/${postId}`)
						}}
						onRetry={sessionId => {
							// Navigate to retry cooking this recipe
							const session = mockCookingSessions.find(s => s.id === sessionId)
							if (session) {
								router.push(`/recipes/${session.recipeId}/cook`)
							}
						}}
					/>
				)}

				{activeTab === 'saved' && (
					<div className='flex h-48 items-center justify-center rounded-lg border border-dashed border-border'>
						<p className='text-text-muted'>Saved recipes coming soon...</p>
					</div>
				)}

				{activeTab === 'achievements' && (
					<div className='flex h-48 items-center justify-center rounded-lg border border-dashed border-border'>
						<p className='text-text-muted'>Achievements coming soon...</p>
					</div>
				)}
			</div>
		</div>
	)
}
