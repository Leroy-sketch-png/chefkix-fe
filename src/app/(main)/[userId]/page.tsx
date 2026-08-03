import { Suspense } from 'react'
import { PageTransition } from '@/components/layout/PageTransition'
import { ProfilePageClient } from '@/components/profile/ProfilePageClient'
import { ProfilePageShell } from '@/components/profile/ProfilePageShell'
import { UserProfileSkeleton } from '@/components/profile/UserProfileSkeleton'

export default function ProfilePage() {
	return (
		<PageTransition>
			<Suspense
				fallback={
					<ProfilePageShell>
						<UserProfileSkeleton />
					</ProfilePageShell>
				}
			>
				<ProfilePageClient />
			</Suspense>
		</PageTransition>
	)
}
