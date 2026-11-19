'use client'

import { useAuth } from '@/hooks/useAuth'
import { GroupsExploreGrid } from '@/components/groups'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'

/**
 * Groups explore page
 * Allows users to discover and create groups
 */
export default function GroupsExplorePage() {
	const { user, isAuthenticated, isHydrated, isLoading } = useAuth()

	if (!isHydrated || isLoading || !isAuthenticated) {
		return null
	}

	return (
		<PageTransition>
			<PageContainer maxWidth='xl'>
				<GroupsExploreGrid currentUserId={user?.userId} />

				{/* Bottom breathing room for MobileBottomNav */}
				<div className='pb-[calc(var(--h-mobile-nav)+var(--space-16))] md:pb-8' />
			</PageContainer>
		</PageTransition>
	)
}
