import { getMyProfile } from '@/services/profile'
import { ErrorState } from '@/components/ui/error-state'
import { EmptyState } from '@/components/ui/empty-state'
import { PageContainer } from '@/components/layout/PageContainer'
import { Users, UserPlus } from 'lucide-react'

const FriendsPage = async () => {
	const { success, data: profile } = await getMyProfile()

	if (!success || !profile) {
		return (
			<ErrorState
				title='Failed to load profile'
				message='We could not load your profile data. Please try again.'
			/>
		)
	}

	// TODO: We need to get the full profiles of the friend requests, not just the IDs.
	// The current API returns `friends: [{ userId: string, friendedAt: string }]`
	// We will need a new endpoint or to modify the existing one to get more details.

	const hasFriends = profile.statistics && profile.statistics.friendCount > 0
	const hasFriendRequests = false // TODO: Get from actual API endpoint

	return (
		<PageContainer maxWidth='2xl'>
			<div className='mb-6 space-y-2'>
				<h1 className='text-3xl font-bold text-text-primary'>Friends</h1>
				<p className='text-text-secondary'>
					Connect with fellow cooking enthusiasts
				</p>
			</div>

			{/* Friend Requests Section */}
			<div className='mb-8'>
				<h2 className='mb-4 text-xl font-semibold text-text-primary'>
					Friend Requests
				</h2>
				{hasFriendRequests ? (
					<div className='space-y-4'>
						{/* TODO: Render actual friend requests */}
					</div>
				) : (
					<EmptyState
						title='No friend requests'
						description='When someone sends you a friend request, it will appear here.'
						icon={UserPlus}
					/>
				)}
			</div>

			{/* Friends List Section */}
			<div>
				<h2 className='mb-4 text-xl font-semibold text-text-primary'>
					My Friends ({profile.statistics?.friendCount ?? 0})
				</h2>
				{hasFriends ? (
					<div className='space-y-4'>
						{/* TODO: Render actual friends list */}
					</div>
				) : (
					<EmptyState
						title='No friends yet'
						description='Start connecting with other chefs! Search for users in the discover page and send them friend requests.'
						icon={Users}
						actionLabel='Discover Chefs'
						actionHref='/discover'
					/>
				)}
			</div>
		</PageContainer>
	)
}

export default FriendsPage
