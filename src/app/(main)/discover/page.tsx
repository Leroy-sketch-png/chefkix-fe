import { getAllProfiles } from '@/services/profile'
import { UserDiscoveryClient } from '@/components/discover/UserDiscoveryClient'

const DiscoverPage = async () => {
	const { success, data: profiles } = await getAllProfiles()

	if (!success || !profiles) {
		// TODO: Handle error case
		return <div>Could not load users.</div>
	}

	return <UserDiscoveryClient profiles={profiles} />
}

export default DiscoverPage
