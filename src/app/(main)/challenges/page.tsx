'use client'

import { useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import {
	ChallengeCard,
	ChallengeCardGrid,
	DailyChallengeBanner,
} from '@/components/challenges'
import { EmptyStateGamified } from '@/components/shared'

// ============================================
// MOCK DATA - TODO: Replace with API integration (MSW ready)
// ============================================

// Empty arrays for MSW preparation - will be replaced with API calls
const mockChallenges: Array<{
	id: string
	type: 'weekly' | 'community' | 'seasonal'
	title: string
	description: string
	icon: string
	bonusXp: number
	progress?: { current: number; total: number }
	participants: number
	endsAt: Date
	status: 'active' | 'completed' | 'expired'
	isJoined: boolean
}> = []

// Null daily challenge for MSW preparation
const dailyChallenge: {
	id: string
	title: string
	description: string
	icon: string
	bonusXp: number
	endsAt: Date
} | null = null

// ============================================
// PAGE
// ============================================

export default function ChallengesPage() {
	const [challenges, setChallenges] = useState(mockChallenges)
	const [loading] = useState(false)

	const handleJoin = (challengeId: string) => {
		setChallenges(prev =>
			prev.map(c => (c.id === challengeId ? { ...c, isJoined: true } : c)),
		)
	}

	const hasNoChallenges = challenges.length === 0 && !dailyChallenge

	return (
		<PageTransition>
			<PageContainer maxWidth='lg'>
				{/* Header */}
				<div className='mb-8 animate-fadeIn'>
					<h1 className='mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-3xl font-bold text-transparent'>
						Challenges
					</h1>
					<p className='text-muted-foreground'>
						Test your skills, earn bonus XP, and unlock exclusive badges!
					</p>
				</div>

				{hasNoChallenges ? (
					<EmptyStateGamified
						variant='challenges'
						title='No Active Challenges'
						description='Check back soon for new cooking challenges!'
						primaryAction={{
							label: 'Explore Recipes',
							href: '/explore',
						}}
					/>
				) : (
					<>
						{/* Daily Challenge Banner - Featured */}
						{dailyChallenge && (
							<DailyChallengeBanner
								variant='active'
								challenge={dailyChallenge}
								onFindRecipe={() => console.log('Find quick recipes')}
							/>
						)}

						{/* Active Challenges Section */}
						<section className='mb-8'>
							<h2 className='mb-4 text-lg font-bold text-text-primary'>
								Active Challenges
							</h2>
							{challenges.length > 0 ? (
								<ChallengeCardGrid
									challenges={challenges.map(c => ({
										...c,
										onJoin: () => handleJoin(c.id),
										onView: () => console.log('View challenge:', c.id),
									}))}
									loading={loading}
								/>
							) : (
								<p className='text-sm text-muted-foreground'>
									No active challenges at the moment.
								</p>
							)}
						</section>

						{/* Completed Challenges (placeholder) */}
						<section>
							<h2 className='mb-4 text-lg font-bold text-text-secondary'>
								Past Challenges
							</h2>
							<p className='text-sm text-muted-foreground'>
								Your completed challenges will appear here.
							</p>
						</section>
					</>
				)}
			</PageContainer>
		</PageTransition>
	)
}
