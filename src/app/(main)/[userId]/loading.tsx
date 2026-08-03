import { ProfilePageShell } from '@/components/profile/ProfilePageShell'
import { UserProfileSkeleton } from '@/components/profile/UserProfileSkeleton'

export default function Loading() {
	return (
		<ProfilePageShell>
			<UserProfileSkeleton />
		</ProfilePageShell>
	)
}
