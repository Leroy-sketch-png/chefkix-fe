import { getMyProfile } from '@/services/profile'
import { ErrorState } from '@/components/ui/error-state'

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

	return (
		<div className='container mx-auto p-4'>
			<h1 className='text-3xl font-bold'>Friends</h1>
			<div className='mt-8'>
				<h2 className='text-2xl font-semibold'>Friend Requests</h2>
				{/* {profile.friendRequests.length > 0 ? ( */}
				{/* 	<ul> */}
				{/* 		{profile.friendRequests.map(request => ( */}
				{/* 			<li key={request.userId}> */}
				{/* 				<span>{request.displayName}</span> */}
				{/* 				<button>Accept</button> */}
				{/* 				<button>Decline</button> */}
				{/* 			</li> */}
				{/* 		))} */}
				{/* 	</ul> */}
				{/* ) : ( */}
				<p>No new friend requests.</p>
				{/* )} */}
			</div>
		</div>
	)
}

export default FriendsPage
