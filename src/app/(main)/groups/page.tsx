'use client'

import { useAuth } from '@/hooks/useAuth'
import { GroupsExploreGrid } from '@/components/groups'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { PATHS } from '@/constants'
import { Users } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PageHeader } from '@/components/layout/PageHeader'

/**
 * Groups explore page
 * Allows users to discover and create groups
 */
export default function GroupsExplorePage() {
	const { user, isAuthenticated } = useAuth()
	const router = useRouter()

	useEffect(() => {
		if (!isAuthenticated) {
			router.push(PATHS.AUTH.SIGN_IN)
		}
	}, [isAuthenticated, router])

	if (!isAuthenticated) {
		return null
	}

	return (
		<PageTransition>
			<PageContainer maxWidth='xl'>
				{/* Header */}
				<PageHeader
					icon={Users}
					title='Groups'
					subtitle='Discover cooking groups and cook together with others'
					gradient='green'
				/>

				<GroupsExploreGrid currentUserId={user?.userId} />
			</PageContainer>
		</PageTransition>
	)
}
