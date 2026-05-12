import { Suspense } from 'react'
import { PageTransition } from '@/components/layout/PageTransition'
import { ProfilePageClient } from '@/components/profile/ProfilePageClient'
import { UserProfileSkeleton } from '@/components/profile/UserProfileSkeleton'

export default function ProfilePage() {
	return (
		<PageTransition>
			<Suspense fallback={<UserProfileSkeleton />}>
				<ProfilePageClient />
			</Suspense>
		</PageTransition>
	)
}
