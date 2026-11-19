'use client'

import { useAuth } from '@/hooks/useAuth'
import { GroupsExploreGrid } from '@/components/groups'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'

export default function MyGroupsPage() {
	const { user, isAuthenticated, isHydrated, isLoading } = useAuth()

	if (!isHydrated || isLoading || !isAuthenticated) return null

	return (
		<PageTransition>
			<PageContainer maxWidth='xl'>
				<GroupsExploreGrid currentUserId={user?.userId} source='mine' />
				<div className='pb-[calc(var(--h-mobile-nav)+var(--space-16))] md:pb-8' />
			</PageContainer>
		</PageTransition>
	)
}
