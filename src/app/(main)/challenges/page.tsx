'use client'

import { useTranslations } from 'next-intl'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Trophy,
	Sparkles,
	Users,
	Leaf,
	Clock,
	ChevronRight,
	History,
	Loader2,
} from 'lucide-react'
import { DuelsSection } from '@/components/duels/DuelsSection'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PageHeader } from '@/components/layout/PageHeader'
import { DailyChallengeBanner, ActiveBattlesSection } from '@/components/challenges'
import { EmptyStateGamified } from '@/components/shared'
import { ErrorState } from '@/components/ui/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import {
	getTodaysChallenge,
	getWeeklyChallenge,
	getCommunityChallenges,
	getSeasonalChallenges,
	DailyChallenge,
	WeeklyChallenge,
	CommunityChallenge,
	SeasonalChallenge,
} from '@/services/challenge'
import { TRANSITION_SPRING, DURATION_S } from '@/lib/motion'
import { formatEventTimeRemaining } from '@/lib/challenge-time'
import { logDevError } from '@/lib/dev-log' 

// ============================================
// PAGE
// ============================================

export default function ChallengesPage() {
	const t = useTranslations('challenges')
	const router = useRouter()
	const [isNavigating, startNavigationTransition] = useTransition()
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
	const [communityChallenges, setCommunityChallenges] = useState<
		CommunityChallenge[]
	>([])
	const [seasonalChallenges, setSeasonalChallenges] = useState<
		SeasonalChallenge[]
	>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(false)
	const [retryKey, setRetryKey] = useState(0)

	useEffect(() => {
		let cancelled = false

		const fetchChallenges = async () => {
			setLoading(true)
			// Fetch each independently so one failure doesn't kill the others
			const [dailyRes, weeklyRes, communityRes, seasonalRes] =
				await Promise.all([
					getTodaysChallenge().catch(err => {
						logDevError('Daily challenge failed:', err)
						return null
					}),
					getWeeklyChallenge().catch(err => {
						logDevError('Weekly challenge failed:', err)
						return null
					}),
					getCommunityChallenges().catch(err => {
						logDevError('Community challenges failed:', err)
						return null
					}),
					getSeasonalChallenges().catch(err => {
						logDevError('Seasonal challenges failed:', err)
						return null
					}),
				])
			if (cancelled) return
			if (dailyRes?.success && dailyRes.data) {
				const data = dailyRes.data
				setDailyChallenge({
					id: data.id,
					title: data.title,
					description: data.description,
					icon: data.icon || '🎯',
					bonusXp: data.bonusXp,
					endsAt: new Date(data.endsAt),
				})
			}
			if (weeklyRes?.success && weeklyRes.data) {
				setWeeklyChallenge(weeklyRes.data)
			}
			if (communityRes?.success && communityRes.data) {
				setCommunityChallenges(communityRes.data)
			}
			if (seasonalRes?.success && seasonalRes.data) {
				setSeasonalChallenges(seasonalRes.data)
			}
			// Only show global error if ALL calls failed or returned nothing
			if (
				!dailyRes?.success &&
				!weeklyRes?.success &&
				!communityRes?.success &&
				!seasonalRes?.success
			) {
				setError(true)
			}
			setLoading(false)
		}

		fetchChallenges()
		return () => {
			cancelled = true
		}
	}, [retryKey])

	const hasNoChallenges =
		communityChallenges.length === 0 &&
		seasonalChallenges.length === 0 &&
		!dailyChallenge &&
		!weeklyChallenge &&
		!loading

	if (error) {
		return (
			<PageContainer maxWidth='lg'>
				<ErrorState
					title={t('failedToLoad')}
					message={t('failedToLoadDesc')}
					onRetry={() => {
						setError(false)
						setRetryKey(k => k + 1)
					}}
				/>
			</PageContainer>
		)
	}

	return (
		<PageTransition>
			{/* Global navigation loading indicator */}
			<AnimatePresence>
				{isNavigating && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed top-20 left-1/2 z-toast -translate-x-1/2'
					>
						<div className='flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-warm'>
							<Loader2 className='size-4 animate-spin' />
							{t('loading')}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<PageContainer maxWidth='lg'>
				{/* Header */}
				<PageHeader
					icon={Trophy}
					title={t("title")}
					subtitle={t("subtitle")}
					gradient="yellow"
				/>

				{/* Cooking Duels — 1v1 friend challenges */}
				<DuelsSection />

				{/* Active Recipe Battles — community voting */}
				<ActiveBattlesSection />

				{loading ? (
					<div className='space-y-6'>
						{/* Daily challenge skeleton */}
						<div className='rounded-2xl border border-border-subtle bg-bg-card p-6 shadow-card'>
							<div className='flex items-center gap-4'>
								<Skeleton className='size-12 shrink-0 rounded-2xl' />
								<div className='flex-1 space-y-2'>
									<Skeleton className='h-5 w-1/3' />
									<Skeleton className='h-4 w-2/3' />
								</div>
								<Skeleton className='h-8 w-20 rounded-full' />
							</div>
						</div>
						{/* Weekly + community skeletons */}
						{Array.from({ length: 3 }).map((_, i) => (
							<div
								key={i}
								className='rounded-2xl border border-border-subtle bg-bg-card p-5 shadow-card'
							>
								<div className='flex items-center gap-3'>
									<Skeleton className='size-11 shrink-0 rounded-xl' />
									<div className='flex-1 space-y-1.5'>
										<Skeleton className='h-4 w-2/5' />
										<Skeleton className='h-3 w-3/5' />
									</div>
								</div>
							</div>
						))}
					</div>
				) : hasNoChallenges ? (
					<EmptyStateGamified
						variant='challenges'
						title={t('noChallenges')}
						description={t('noChallengesDesc')}
						primaryAction={{
							label: t('refresh'),
							onClick: () => router.refresh(),
						}}
						secondaryActions={[
							{
								label: t('viewHistory'),
								href: '/challenges/history',
							},
							{
								label: t('exploreRecipes'),
								href: '/explore',
							},
						]}
					/>
				) : (
					<>
						{/* Daily Challenge Banner - Featured */}
						{dailyChallenge && (
							<DailyChallengeBanner
								variant='active'
								challenge={dailyChallenge}
								onFindRecipe={() =>
									startNavigationTransition(() => {
										router.push(
											`/explore?q=${encodeURIComponent(dailyChallenge.title)}`,
										)
									})
								}
							/>
						)}

						{/* Weekly Challenge Section */}
						{weeklyChallenge && (
							<section className='mb-8'>
								<h2 className='mb-4 text-lg font-bold text-text-primary'>
									{t('weeklyChallenge')}
								</h2>
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.1, ...TRANSITION_SPRING }}
									className='rounded-2xl border border-border-subtle bg-bg-card p-5 shadow-card'
								>
									<div className='mb-3 flex items-center justify-between'>
										<div className='flex items-center gap-3'>
											<div className='flex size-11 items-center justify-center rounded-xl bg-gradient-indigo shadow-card shadow-accent-purple/25'>
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
											<span className='tabular-nums text-lg font-bold text-xp'>
												+{weeklyChallenge.bonusXp} XP
											</span>
											{weeklyChallenge.completed && (
												<p className='text-xs font-semibold text-success'>
													✓ +{weeklyChallenge.bonusXp} {t('xpAwarded')}
												</p>
											)}
										</div>
									</div>

									{/* Progress bar */}
									<div className='mb-2'>
										<div className='mb-1 flex justify-between tabular-nums text-xs text-text-muted'>
											<span>
												{t('progressCount', { progress: weeklyChallenge.progress, target: weeklyChallenge.target })}
											</span>
											<span>
												{weeklyChallenge.target > 0
													? Math.round(
															(weeklyChallenge.progress /
																weeklyChallenge.target) *
																100,
														)
													: 0}
												%
											</span>
										</div>
										<div className='h-2.5 overflow-hidden rounded-full bg-bg-elevated'>
											<motion.div
												initial={{ width: 0 }}
												animate={{
													width: `${weeklyChallenge.target > 0 ? Math.min((weeklyChallenge.progress / weeklyChallenge.target) * 100, 100) : 0}%`,
												}}
												transition={{ duration: DURATION_S.verySlow, ease: 'easeOut' }}
												className='h-full rounded-full bg-gradient-indigo'
											/>
										</div>
									</div>

									{/* Time remaining */}
									<p className='text-xs text-text-muted'>
										{t('endsOn', { date: new Date(weeklyChallenge.endsAt).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) })}
									</p>

									{/* CTA: Find matching recipes */}
									{!weeklyChallenge.completed &&
										weeklyChallenge.matchingRecipes &&
										weeklyChallenge.matchingRecipes.length > 0 && (
											<button
												type='button'
												onClick={() =>
													startNavigationTransition(() => {
														router.push(
															`/explore?q=${encodeURIComponent(weeklyChallenge.title)}`,
														)
													})
												}
												disabled={isNavigating}
												className='mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand transition-colors hover:text-brand/80 disabled:opacity-50'
											>
												{t("findMatchingRecipes")}
												<ChevronRight className='size-4' />
											</button>
										)}
								</motion.div>
							</section>
						)}

						{/* Community Challenges Section */}
						{communityChallenges.length > 0 && (
							<section className='mb-8'>
								<div className='mb-4 flex items-center gap-2'>
									<Users className='size-5 text-combo' />
									<h2 className='text-lg font-bold text-text'>
										{t("communityChallenges")}
									</h2>
								</div>
								<div className='space-y-4'>
									{communityChallenges.map((ch, i) => (
										<motion.div
											key={ch.id}
											initial={{ opacity: 0, y: 12 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{
												delay: 0.15 + i * 0.08,
												...TRANSITION_SPRING,
											}}
											className='group rounded-2xl border border-border-subtle bg-bg-card p-5 shadow-card transition-all duration-300 hover:shadow-warm'
										>
											<div className='mb-3 flex items-center justify-between'>
												<div className='flex items-center gap-3'>
													<div className='flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-combo to-brand text-xl shadow-card shadow-combo/25'>
														{ch.emoji || '👥'}
													</div>
													<div>
														<h3 className='text-lg font-bold text-text'>
															{ch.title}
														</h3>
														<p className='text-sm text-text-secondary'>
															{ch.description}
														</p>
													</div>
												</div>
												<div className='text-right'>
													<span className='tabular-nums text-lg font-bold text-xp'>
														+{ch.rewardXpPerUser} XP
													</span>
													<p className='text-xs text-text-muted'>
														{formatEventTimeRemaining(ch.endsAt, t)}
													</p>
												</div>
											</div>

											{/* Global progress bar */}
											<div className='mb-2'>
												<div className='mb-1 flex justify-between tabular-nums text-xs text-text-muted'>
													<span>
														{ch.currentProgress.toLocaleString()} /{' '}
														{ch.targetCount.toLocaleString()} {ch.targetUnit}
													</span>
													<span className='tabular-nums'>{Math.round(ch.progressPercent)}%</span>
												</div>
												<div className='h-2.5 overflow-hidden rounded-full bg-bg-elevated'>
													<motion.div
														initial={{ width: 0 }}
														animate={{
															width: `${Math.min(ch.progressPercent, 100)}%`,
														}}
														transition={{
															duration: DURATION_S.dramatic,
															ease: 'easeOut',
														}}
														className='h-full rounded-full bg-gradient-to-r from-combo to-brand'
													/>
												</div>
											</div>

											{/* Footer: participants + contribution status */}
											<div className='flex items-center justify-between text-xs text-text-muted'>
												<span className='flex items-center gap-1'>
													<Users className='size-3.5' />
													{t('participantsCount', { count: ch.participantCount })}
												</span>
												{ch.hasContributed ? (
													<span className='font-medium text-success'>
														✓ {t('youContributed')}
													</span>
												) : (
													<button
														type='button'
														onClick={() =>
															startNavigationTransition(() => {
																router.push(
																	`/explore?q=${encodeURIComponent(ch.title)}`,
																)
															})
														}
														disabled={isNavigating}
														className='flex items-center gap-1 font-medium text-brand transition-colors hover:text-brand/80 disabled:opacity-50'
													>
														{t('cookToContribute')}
														<ChevronRight className='size-3.5' />
													</button>
												)}
											</div>
										</motion.div>
									))}
								</div>
							</section>
						)}

						{/* Seasonal Challenges Section */}
						{seasonalChallenges.length > 0 && (
							<section className='mb-8'>
								<div className='mb-4 flex items-center gap-2'>
									<Leaf className='size-5 text-streak' />
									<h2 className='text-lg font-bold text-text'>
										{t("seasonalEvents")}
									</h2>
								</div>
								<div className='space-y-4'>
									{seasonalChallenges.map((ev, i) => (
										<motion.div
											key={ev.id}
											initial={{ opacity: 0, y: 12 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{
												delay: 0.2 + i * 0.08,
												...TRANSITION_SPRING,
											}}
											className='group overflow-hidden rounded-2xl border border-border-subtle bg-bg-card shadow-card transition-all duration-300 hover:shadow-warm'
										>
											{/* Hero header — accent color or image */}
											{ev.heroImageUrl ? (
												<div
													className='relative h-28 bg-cover bg-center'
													style={{
														backgroundImage: `url(${ev.heroImageUrl})`,
													}}
												>
													<div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent' />
													<div className='absolute bottom-3 left-4 text-xl font-bold text-white'>
														{ev.emoji} {ev.title}
													</div>
												</div>
											) : (
												<div
													className='flex h-20 items-center gap-3 px-5'
													style={{
														background: ev.accentColor
															? `linear-gradient(135deg, ${ev.accentColor}30, ${ev.accentColor}10)`
															: undefined,
													}}
												>
													<span className='text-3xl'>{ev.emoji || '🌿'}</span>
													<h3 className='text-lg font-bold text-text'>
														{ev.title}
													</h3>
												</div>
											)}

											<div className='p-5'>
												<p className='mb-3 text-sm text-text-secondary'>
													{ev.description}
												</p>

												{/* Per-user progress */}
												<div className='mb-2'>
													<div className='mb-1 flex justify-between tabular-nums text-xs text-text-muted'>
														<span>
															{ev.userProgress} / {ev.targetCount}{' '}
															{ev.targetUnit}
														</span>
														<span>
															{ev.targetCount > 0
																? Math.round(
																		(ev.userProgress / ev.targetCount) * 100,
																	)
																: 0}
															%
														</span>
													</div>
													<div className='h-2.5 overflow-hidden rounded-full bg-bg-elevated'>
														<motion.div
															initial={{ width: 0 }}
															animate={{
																width: `${ev.targetCount > 0 ? Math.min((ev.userProgress / ev.targetCount) * 100, 100) : 0}%`,
															}}
															transition={{
																duration: DURATION_S.dramatic,
																ease: 'easeOut',
															}}
															className='h-full rounded-full bg-gradient-to-r from-streak to-brand'
														/>
													</div>
												</div>

												{/* Footer */}
												<div className='flex items-center justify-between text-xs text-text-muted'>
													<span className='flex items-center gap-1'>
														<Clock className='size-3.5' />
														{formatEventTimeRemaining(ev.endsAt, t)}
													</span>
													<div className='flex items-center gap-2'>
														{ev.rewardBadgeName && (
															<span className='rounded-full bg-warning/15 px-2 py-0.5 text-2xs font-semibold text-warning'>
																🏅 {ev.rewardBadgeName}
															</span>
														)}
														<span className='tabular-nums font-bold text-xp'>
															+{ev.rewardXp} XP
														</span>
													</div>
												</div>

												{/* Featured recipes link */}
												{ev.featuredRecipes &&
													ev.featuredRecipes.length > 0 && (
														<button
															type='button'
															onClick={() =>
																startNavigationTransition(() => {
																	router.push(`/explore?seasonal=${ev.id}`)
																})
															}
															disabled={isNavigating}
															className='mt-3 flex items-center gap-1 text-xs font-semibold text-brand transition-colors hover:text-brand/80 disabled:opacity-50'
														>
															{t('featuredRecipesCount', { count: ev.featuredRecipes.length })}
															<ChevronRight className='size-3.5' />
														</button>
													)}

												{ev.userCompleted && (
													<div className='mt-3 rounded-lg bg-success/10 px-3 py-2 text-center text-sm font-semibold text-success'>
														✓ +{ev.rewardXp} {t('xpAwarded')}
													</div>
												)}
											</div>
										</motion.div>
									))}
								</div>
							</section>
						)}

						{/* Past Challenges link */}
						<section>
							<Link
								href='/challenges/history'
								className='group flex items-center justify-between rounded-2xl border border-border-subtle bg-bg-card p-5 shadow-card transition-all duration-300 hover:shadow-warm'
							>
								<div className='flex items-center gap-3'>
									<div className='flex size-11 items-center justify-center rounded-xl bg-bg-elevated transition-colors group-hover:bg-brand/10'>
										<History className='size-5 text-text-secondary transition-colors group-hover:text-brand' />
									</div>
									<div>
										<h3 className='font-semibold text-text'>
											{t("challengeHistory")}
										</h3>
										<p className='text-sm text-text-muted'>
											{t("challengeHistoryDesc")}
										</p>
									</div>
								</div>
								<ChevronRight className='size-5 text-text-muted transition-colors group-hover:text-brand' />
							</Link>
						</section>
					</>
				)}
			</PageContainer>
		</PageTransition>
	)
}
