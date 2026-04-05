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
import { useTranslations } from 'next-intl'

/**
 * Groups explore page
 * Allows users to discover and create groups
 */
export default function GroupsExplorePage() {
	const { user, isAuthenticated } = useAuth()
	const router = useRouter()
	const t = useTranslations('groups')

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
					title={t('groupsTitle')}
					subtitle={t('groupsSubtitle')}
					gradient='green'
				/>

				<GroupsExploreGrid currentUserId={user?.userId} />
			</PageContainer>
		</PageTransition>
	)
}
