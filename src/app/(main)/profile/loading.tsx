import { ProfilePageShell } from '@/components/profile/ProfilePageShell'
import { UserProfileSkeleton } from '@/components/profile/UserProfileSkeleton'

export default function ProfileLoading() {
	return (
		<ProfilePageShell>
			<UserProfileSkeleton />
		</ProfilePageShell>
	)
}
