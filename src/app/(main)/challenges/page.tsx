'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Trophy, Sparkles } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import {
	ChallengeCard,
	ChallengeCardGrid,
	DailyChallengeBanner,
} from '@/components/challenges'
import { EmptyStateGamified } from '@/components/shared'
import { getTodaysChallenge, DailyChallenge } from '@/services/challenge'
import { TRANSITION_SPRING } from '@/lib/motion'

// ============================================
// TYPES
// ============================================

interface ChallengeUIItem {
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
}

// ============================================
// PAGE
// ============================================

export default function ChallengesPage() {
	const router = useRouter()
	const [challenges, setChallenges] = useState<ChallengeUIItem[]>([])
	const [dailyChallenge, setDailyChallenge] = useState<{
		id: string
		title: string
		description: string
		icon: string
		bonusXp: number
		endsAt: Date
	} | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const fetchChallenges = async () => {
			setLoading(true)
			try {
				const response = await getTodaysChallenge()
				if (response.success && response.data) {
					const data = response.data
					setDailyChallenge({
						id: data.id,
						title: data.title,
						description: data.description,
						icon: data.icon,
						bonusXp: data.bonusXp,
						endsAt: new Date(data.endsAt),
					})
				}
				// TODO: Fetch weekly/community challenges when endpoint is available
			} catch (err) {
				console.error('Failed to fetch challenges:', err)
			} finally {
				setLoading(false)
			}
		}

		fetchChallenges()
	}, [])

	const handleJoin = (challengeId: string) => {
		setChallenges(prev =>
			prev.map(c => (c.id === challengeId ? { ...c, isJoined: true } : c)),
		)
	}

	const hasNoChallenges = challenges.length === 0 && !dailyChallenge && !loading

	return (
		<PageTransition>
			<PageContainer maxWidth='lg'>
				{/* Header - Unified with Dashboard/Explore pattern */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={TRANSITION_SPRING}
					className='mb-8'
				>
					<div className='mb-2 flex items-center gap-3'>
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 0.2, ...TRANSITION_SPRING }}
							className='flex size-12 items-center justify-center rounded-2xl bg-gradient-streak shadow-md shadow-streak/25'
						>
							<Trophy className='size-6 text-white' />
						</motion.div>
						<h1 className='text-3xl font-bold text-text'>Challenges</h1>
					</div>
					<p className='flex items-center gap-2 text-text-secondary'>
						<Sparkles className='size-4 text-streak' />
						Test your skills, earn bonus XP, and unlock exclusive badges!
					</p>
				</motion.div>

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
								onFindRecipe={() => router.push('/discover?quick=true')}
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
										onView: () => router.push(`/challenges/${c.id}`),
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
