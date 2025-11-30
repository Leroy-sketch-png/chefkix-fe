'use client'

import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { LeaderboardPage } from '@/components/leaderboard'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

export default function LeaderboardRoute() {
	const { user } = useAuth()
	const router = useRouter()

	// Mock current user data for leaderboard
	const currentUser = user
		? {
				userId: user.userId ?? 'me',
				username: user.username || 'me',
				displayName: user.displayName || user.username || 'You',
				avatarUrl: user.avatarUrl || '/images/default-avatar.png',
				level: user.statistics?.currentLevel ?? 1,
				xpThisWeek: user.statistics?.currentXP ?? 500,
				recipesCooked: 5,
				streak: user.statistics?.streakCount ?? 3,
			}
		: undefined

	return (
		<PageTransition>
			<PageContainer maxWidth='xl'>
				<LeaderboardPage
					currentUser={currentUser}
					onUserClick={userId => router.push(`/${userId}`)}
					onInviteFriends={() => router.push('/community')}
					onCookToClimb={() => router.push('/explore')}
				/>
			</PageContainer>
		</PageTransition>
	)
}
