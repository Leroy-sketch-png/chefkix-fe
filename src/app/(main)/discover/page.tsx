import { getAllProfiles } from '@/services/profile'
import { UserDiscoveryClient } from '@/components/discover/UserDiscoveryClient'
import { ErrorState } from '@/components/ui/error-state'

const DiscoverPage = async () => {
	const { success, data: profiles } = await getAllProfiles()

	if (!success || !profiles) {
		return (
			<ErrorState
				title='Failed to load users'
				message='We could not load the user discovery feed. Please check your connection and try again.'
			/>
		)
	}

	return <UserDiscoveryClient profiles={profiles} />
}

export default DiscoverPage
