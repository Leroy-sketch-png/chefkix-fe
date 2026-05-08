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
import { PremiumSurface, SurfaceSectionHeader } from '@/components/layout/PremiumSurface'

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
				<PremiumSurface
					eyebrow='Community Hubs'
					chipText='Group Discovery'
					tone='success'
					className='mb-6 p-3 md:p-4'
				>
					<PageHeader
						icon={Users}
						title={t('groupsTitle')}
						subtitle={t('groupsSubtitle')}
						gradient='green'
						marginBottom='sm'
					/>
				</PremiumSurface>

				<PremiumSurface
					eyebrow='Available Groups'
					chipText='Join or Create'
					className='p-3 md:p-4'
				>
					<SurfaceSectionHeader
						eyebrow='Social Spaces'
						chipText='Live'
						className='mb-3'
					/>
					<GroupsExploreGrid currentUserId={user?.userId} />
				</PremiumSurface>

				{/* Bottom breathing room for MobileBottomNav */}
				<div className='pb-40 md:pb-8' />
			</PageContainer>
		</PageTransition>
	)
}
