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
import {
	getTodaysChallenge,
	getWeeklyChallenge,
	DailyChallenge,
	WeeklyChallenge,
} from '@/services/challenge'
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
	const [weeklyChallenge, setWeeklyChallenge] =
		useState<WeeklyChallenge | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const fetchChallenges = async () => {
			setLoading(true)
			try {
				const [dailyResponse, weeklyResponse] = await Promise.all([
					getTodaysChallenge(),
					getWeeklyChallenge(),
				])
				if (dailyResponse.success && dailyResponse.data) {
					const data = dailyResponse.data
					setDailyChallenge({
						id: data.id,
						title: data.title,
						description: data.description,
						icon: data.icon,
						bonusXp: data.bonusXp,
						endsAt: new Date(data.endsAt),
					})
				}
				if (weeklyResponse.success && weeklyResponse.data) {
					setWeeklyChallenge(weeklyResponse.data)
				}
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

	const hasNoChallenges =
		challenges.length === 0 && !dailyChallenge && !weeklyChallenge && !loading

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

						{/* Weekly Challenge Section */}
						{weeklyChallenge && (
							<section className='mb-8'>
								<h2 className='mb-4 text-lg font-bold text-text-primary'>
									Weekly Challenge
								</h2>
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.1, ...TRANSITION_SPRING }}
									className='rounded-2xl border border-border-subtle bg-bg-card p-5 shadow-card'
								>
									<div className='mb-3 flex items-center justify-between'>
										<div className='flex items-center gap-3'>
											<div className='flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md shadow-indigo-500/25'>
												<Trophy className='size-5 text-white' />
											</div>
											<div>
												<h3 className='text-lg font-bold text-text'>
													{weeklyChallenge.title}
												</h3>
												<p className='text-sm text-text-secondary'>
													{weeklyChallenge.description}
												</p>
											</div>
										</div>
										<div className='text-right'>
											<span className='text-lg font-bold text-xp'>
												+{weeklyChallenge.bonusXp} XP
											</span>
											{weeklyChallenge.completed && (
												<p className='text-xs font-semibold text-success'>
													Completed!
												</p>
											)}
										</div>
									</div>

									{/* Progress bar */}
									<div className='mb-2'>
										<div className='mb-1 flex justify-between text-xs text-text-muted'>
											<span>
												{weeklyChallenge.progress} / {weeklyChallenge.target}{' '}
												completed
											</span>
											<span>
												{Math.round(
													(weeklyChallenge.progress / weeklyChallenge.target) *
														100,
												)}
												%
											</span>
										</div>
										<div className='h-2.5 overflow-hidden rounded-full bg-bg-elevated'>
											<motion.div
												initial={{ width: 0 }}
												animate={{
													width: `${Math.min((weeklyChallenge.progress / weeklyChallenge.target) * 100, 100)}%`,
												}}
												transition={{ duration: 0.8, ease: 'easeOut' }}
												className='h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500'
											/>
										</div>
									</div>

									{/* Time remaining */}
									<p className='text-xs text-text-muted'>
										Ends{' '}
										{new Date(weeklyChallenge.endsAt).toLocaleDateString(
											'en-US',
											{ weekday: 'long', month: 'short', day: 'numeric' },
										)}
									</p>
								</motion.div>
							</section>
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
