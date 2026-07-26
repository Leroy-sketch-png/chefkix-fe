'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { GroupsExploreGrid } from '@/components/groups'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PATHS } from '@/constants'

export default function MyGroupsPage() {
	const { user, isAuthenticated, isHydrated, isLoading } = useAuth()
	const router = useRouter()

	useEffect(() => {
		if (isHydrated && !isLoading && !isAuthenticated) {
			router.replace(PATHS.AUTH.SIGN_IN)
		}
	}, [isAuthenticated, isHydrated, isLoading, router])

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
