'use client'

import { useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import {
	ChallengeCard,
	ChallengeCardGrid,
	DailyChallengeBanner,
} from '@/components/challenges'

// Mock data - in production, fetch from API
const mockChallenges = [
	{
		id: 'weekly-pasta',
		type: 'weekly' as const,
		title: 'The Ultimate Pasta-Off',
		description:
			'Create an original pasta dish using only 5 ingredients. Most creative recipe wins!',
		icon: '🍝',
		bonusXp: 150,
		progress: { current: 0, total: 3 },
		participants: 1204,
		endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
		status: 'active' as const,
		isJoined: false,
	},
	{
		id: 'community-comfort',
		type: 'community' as const,
		title: 'Comfort Food Week',
		description: 'Share your favorite comfort food recipe with the community.',
		icon: '🥘',
		bonusXp: 75,
		participants: 3542,
		endsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
		status: 'active' as const,
		isJoined: true,
	},
	{
		id: 'seasonal-spring',
		type: 'seasonal' as const,
		title: 'Spring Fresh',
		description: 'Cook dishes featuring fresh spring vegetables and herbs.',
		icon: '🌸',
		bonusXp: 200,
		progress: { current: 2, total: 5 },
		participants: 892,
		endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
		status: 'active' as const,
		isJoined: true,
	},
]

// Mock daily challenge
const dailyChallenge = {
	id: 'daily-quick',
	title: '15-Minute Meals',
	description: 'Cook any dish in 15 minutes or less. Speed and flavor!',
	icon: '⚡',
	bonusXp: 25,
	endsAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
}

export default function ChallengesPage() {
	const [challenges, setChallenges] = useState(mockChallenges)
	const [loading] = useState(false)

	const handleJoin = (challengeId: string) => {
		setChallenges(prev =>
			prev.map(c => (c.id === challengeId ? { ...c, isJoined: true } : c)),
		)
	}

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

				{/* Daily Challenge Banner - Featured */}
				<DailyChallengeBanner
					variant='active'
					challenge={dailyChallenge}
					onFindRecipe={() => console.log('Find quick recipes')}
				/>

				{/* Active Challenges Section */}
				<section className='mb-8'>
					<h2 className='mb-4 text-lg font-bold text-text-primary'>
						Active Challenges
					</h2>
					<ChallengeCardGrid
						challenges={challenges.map(c => ({
							...c,
							onJoin: () => handleJoin(c.id),
							onView: () => console.log('View challenge:', c.id),
						}))}
						loading={loading}
					/>
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
			</PageContainer>
		</PageTransition>
	)
}
