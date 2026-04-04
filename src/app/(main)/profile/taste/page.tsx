'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
	ArrowLeft,
	Sparkles,
	ChefHat,
	Flame,
	Heart,
	Trophy,
	Utensils,
	Globe,
	Clock,
	Zap,
	Calendar,
	ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyStateGamified } from '@/components/shared'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { getCookingPreferences } from '@/services/settings'
import { getTasteProfile } from '@/services/post'
import { TRANSITION_SPRING, CARD_HOVER, BUTTON_SUBTLE_TAP } from '@/lib/motion'
import type { CookingPreferences } from '@/lib/types/settings'
import type { Profile, Statistics } from '@/lib/types/profile'
import type { TasteProfileResponse } from '@/lib/types/social'
import { TasteDNAShareCard } from '@/components/profile/TasteDNAShareCard'
import { LearningNarrative } from '@/components/profile/LearningNarrative'

// ── Taste dimensions derived from user activity + preferences ──
interface TasteDimension {
	label: string
	value: number // 0-100
	icon: React.ReactNode
	description: string
}

function computeTasteDimensions(
	profile: Profile,
	stats: Statistics | null | undefined,
	prefs: CookingPreferences | null,
): TasteDimension[] {
	const hasPrefs = !!prefs
	const cuisineCount = prefs?.preferredCuisines?.length ?? 0
	const interestCount = profile.preferences?.length ?? 0

	// Safe stat accessors — all fields should exist but BE may return 0/missing
	const completionCount = stats?.completionCount ?? 0
	const streakCount = stats?.streakCount ?? 0
	const currentLevel = stats?.currentLevel ?? 1
	const postCount = stats?.postCount ?? 0
	const followerCount = stats?.followerCount ?? 0
	const recipeCount = stats?.recipeCount ?? 0

	// Speed Cook: scale 120min → 0 score, 0min → 100 score (clamped to [0,100])
	// maxCookingTimeMinutes is typically 15-120. We treat 120+ as "not speed-focused".
	const rawMaxTime = prefs?.maxCookingTimeMinutes
	const speedCookValue = hasPrefs && rawMaxTime
		? Math.max(0, Math.min(100, Math.round((1 - rawMaxTime / 120) * 100)))
		: 50

	return [
		{
			label: 'Adventurousness',
			value: Math.min(100, cuisineCount * 15 + interestCount * 8 + (completionCount > 10 ? 20 : 0)),
			icon: <Globe className='size-4' />,
			description: `${cuisineCount} cuisines explored`,
		},
		{
			label: 'Dedication',
			value: Math.min(100, streakCount * 8 + completionCount * 3),
			icon: <Flame className='size-4' />,
			description: `${streakCount} day streak`,
		},
		{
			label: 'Skill Level',
			value: hasPrefs
				? { beginner: 20, intermediate: 45, advanced: 70, expert: 95 }[prefs?.skillLevel ?? 'beginner'] ?? 20
				: Math.min(100, currentLevel * 10),
			icon: <ChefHat className='size-4' />,
			description: prefs?.skillLevel ?? `Level ${currentLevel}`,
		},
		{
			label: 'Social Chef',
			value: Math.min(100, postCount * 5 + followerCount * 2),
			icon: <Heart className='size-4' />,
			description: `${postCount} posts shared`,
		},
		{
			label: 'Recipe Creator',
			value: Math.min(100, recipeCount * 12),
			icon: <Utensils className='size-4' />,
			description: `${recipeCount} recipes created`,
		},
		{
			label: 'Speed Cook',
			value: speedCookValue,
			icon: <Clock className='size-4' />,
			description: rawMaxTime
				? `Prefers under ${rawMaxTime}min`
				: 'Flexible timing',
		},
	]
}

// ── Radar Chart (SVG) ──
function TasteRadar({ dimensions }: { dimensions: TasteDimension[] }) {
	const size = 280
	const center = size / 2
	const radius = (size - 60) / 2
	const angleStep = (2 * Math.PI) / dimensions.length

	const getPoint = (index: number, value: number) => {
		const angle = index * angleStep - Math.PI / 2
		const r = (value / 100) * radius
		return {
			x: center + r * Math.cos(angle),
			y: center + r * Math.sin(angle),
		}
	}

	const dataPath = dimensions
		.map((d, i) => {
			const { x, y } = getPoint(i, d.value)
			return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
		})
		.join(' ')
		+ ' Z'

	const gridLevels = [25, 50, 75, 100]

	return (
		<div className='flex items-center justify-center'>
			<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
				{/* Grid rings */}
				{gridLevels.map((level) => {
					const r = (level / 100) * radius
					return (
						<circle
							key={level}
							cx={center}
							cy={center}
							r={r}
							fill='none'
							stroke='currentColor'
							strokeOpacity={0.08}
							strokeWidth={1}
						/>
					)
				})}

				{/* Axis lines */}
				{dimensions.map((_, i) => {
					const { x, y } = getPoint(i, 100)
					return (
						<line
							key={i}
							x1={center}
							y1={center}
							x2={x}
							y2={y}
							stroke='currentColor'
							strokeOpacity={0.1}
							strokeWidth={1}
						/>
					)
				})}

				{/* Data polygon */}
				<motion.path
					d={dataPath}
					fill='var(--color-brand)'
					fillOpacity={0.15}
					stroke='var(--color-brand)'
					strokeWidth={2}
					initial={{ opacity: 0, scale: 0.5 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.6, ease: 'easeOut' }}
					style={{ transformOrigin: `${center}px ${center}px` }}
				/>

				{/* Data points */}
				{dimensions.map((d, i) => {
					const { x, y } = getPoint(i, d.value)
					return (
						<motion.circle
							key={i}
							cx={x}
							cy={y}
							r={4}
							fill='var(--color-brand)'
							initial={{ opacity: 0, scale: 0 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ delay: 0.3 + i * 0.1 }}
						/>
					)
				})}

				{/* Labels */}
				{dimensions.map((d, i) => {
					const { x, y } = getPoint(i, 120)
					return (
						<text
							key={i}
							x={x}
							y={y}
							textAnchor='middle'
							dominantBaseline='middle'
							className='fill-text-secondary text-xs font-medium'
						>
							{d.label}
						</text>
					)
				})}
			</svg>
		</div>
	)
}

// ── Main Page ──
export default function TasteProfilePage() {
	const router = useRouter()
	const { user: profile } = useAuth()
	const [cookingPrefs, setCookingPrefs] = useState<CookingPreferences | null>(null)
	const [tasteProfile, setTasteProfile] = useState<TasteProfileResponse | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		let cancelled = false
		Promise.all([
			getCookingPreferences(),
			getTasteProfile(),
		])
			.then(([prefsRes, tasteRes]) => {
				if (!cancelled) {
					if (prefsRes.success && prefsRes.data) setCookingPrefs(prefsRes.data)
					if (tasteRes.success && tasteRes.data) setTasteProfile(tasteRes.data)
				}
			})
			.catch(() => {})
			.finally(() => {
				if (!cancelled) setIsLoading(false)
			})
		return () => { cancelled = true }
	}, [])

	const dimensions = useMemo(() => {
		if (!profile) return []
		return computeTasteDimensions(profile, profile.statistics ?? null, cookingPrefs)
	}, [profile, cookingPrefs])

	const topDimension = useMemo(
		() => dimensions.length > 0 ? dimensions.reduce((a, b) => (a.value > b.value ? a : b)) : null,
		[dimensions],
	)

	if (isLoading) {
		return (
			<PageTransition>
				<PageContainer maxWidth='lg'>
					<div className='mb-6 flex items-center gap-3'>
						<Skeleton className='size-10 rounded-xl' />
						<Skeleton className='h-8 w-48' />
					</div>
					<Skeleton className='mx-auto size-72 rounded-full' />
					<div className='mt-8 space-y-3'>
						{[0, 1, 2, 3, 4, 5].map(i => (
							<Skeleton key={i} className='h-16 rounded-xl' />
						))}
					</div>
				</PageContainer>
			</PageTransition>
		)
	}

	if (!profile) {
		return (
			<PageTransition>
				<PageContainer maxWidth='lg'>
					<EmptyStateGamified
						variant='custom'
						emoji='🧑‍🍳'
						title='Sign in to see your Taste DNA'
						description='Your taste profile is built from your cooking activity, preferences, and social engagement.'
						primaryAction={{ label: 'Sign In', href: '/auth/login' }}
					/>
				</PageContainer>
			</PageTransition>
		)
	}

	// True zero state — new user with no cooking activity whatsoever
	const isBlankProfile = dimensions.every(d => d.value === 0)

	return (
		<PageTransition>
			<PageContainer maxWidth='lg'>
				{/* Header with back button */}
				<div className='mb-8 flex items-center gap-3'>
					<motion.button
						onClick={() => router.back()}
						whileTap={BUTTON_SUBTLE_TAP}
						className='flex size-10 items-center justify-center rounded-xl border border-border bg-bg-card text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text'
						aria-label='Go back'
					>
						<ArrowLeft className='size-5' />
					</motion.button>
					<div className='flex-1'>
						<PageHeader
							icon={Sparkles}
							title='Your Taste DNA'
							subtitle='Your unique cooking personality, built from everything you do on ChefKix'
							gradient='purple'
							marginBottom='sm'
							className='mb-0'
						/>
					</div>
				</div>

				{/* Blank-slate state — new user, no data yet */}
				{isBlankProfile && (
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: 0.2 }}
						className='mb-8'
					>
						<EmptyStateGamified
							variant='cooking'
							title='Your Taste DNA is forming…'
							description='Cook your first recipe, follow some chefs, or add cuisine preferences to reveal your unique cooking personality.'
							primaryAction={{ label: 'Explore Recipes', href: '/explore' }}
							secondaryActions={[{ label: 'Set Preferences', href: '/settings' }]}
						/>
					</motion.div>
				)}

				{/* Radar Chart — only show when user has actual data */}
				{!isBlankProfile && (
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.2, ...TRANSITION_SPRING }}
					className='mx-auto mb-8 max-w-sm rounded-2xl border border-border-subtle bg-bg-card p-6 shadow-card'
				>
					<TasteRadar dimensions={dimensions} />
					{topDimension && (
						<p className='mt-4 text-center text-sm text-text-secondary'>
							Your strongest trait:{' '}
							<span className='font-semibold text-brand'>{topDimension.label}</span>
						</p>
					)}
				</motion.div>
				)}

				{/* Shareable Card */}
				{!isBlankProfile && (
					<TasteDNAShareCard
						dimensions={dimensions}
						displayName={profile.displayName || profile.username || 'Chef'}
						topTrait={topDimension?.label ?? 'Explorer'}
						level={profile.statistics?.currentLevel ?? 1}
						title={profile.statistics?.title ?? 'BEGINNER'}
					/>
				)}

				{/* Dimension Breakdown */}
				{!isBlankProfile && (
				<div className='space-y-3'>
					{dimensions.map((dim, i) => (
						<motion.div
							key={dim.label}
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.4 + i * 0.08 }}
							whileHover={CARD_HOVER}
							className='rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card'
						>
							<div className='mb-2 flex items-center justify-between'>
								<div className='flex items-center gap-2'>
									<div className='grid size-8 place-items-center rounded-lg bg-brand/10 text-brand'>
										{dim.icon}
									</div>
									<span className='font-semibold text-text'>{dim.label}</span>
								</div>
								<span className='text-sm font-bold text-brand'>{dim.value}%</span>
							</div>
							{/* Progress bar */}
							<div className='h-2 overflow-hidden rounded-full bg-bg-elevated'>
								<motion.div
									className='h-full rounded-full bg-gradient-to-r from-brand to-brand/70'
									initial={{ width: 0 }}
									animate={{ width: `${dim.value}%` }}
									transition={{ delay: 0.6 + i * 0.08, duration: 0.5, ease: 'easeOut' }}
								/>
							</div>
							<p className='mt-1 text-xs text-text-muted'>{dim.description}</p>
						</motion.div>
					))}
				</div>
				)}

				{/* Cuisine DNA — Real behavioral data from 5-signal taste vector */}
				{tasteProfile && tasteProfile.cuisineDistribution && tasteProfile.cuisineDistribution.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.7 }}
						className='mt-8 rounded-2xl border border-border-subtle bg-bg-card p-6 shadow-card'
					>
						<h2 className='mb-4 flex items-center gap-2 font-semibold text-text'>
							<Globe className='size-5 text-brand' />
							Your Cuisine DNA
						</h2>
						<p className='mb-4 text-xs text-text-muted'>
							Based on {tasteProfile.totalInteractions ?? 0} interactions — likes, saves, views, and cooks
						</p>
						<div className='space-y-3'>
							{tasteProfile.cuisineDistribution.map((item, i) => (
								<motion.div
									key={item.cuisine}
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.8 + i * 0.05 }}
									className='flex items-center gap-3'
								>
									<span className='w-24 shrink-0 text-sm font-medium text-text'>
										{item.cuisine}
									</span>
									<div className='h-2.5 flex-1 overflow-hidden rounded-full bg-bg-elevated'>
										<motion.div
											className='h-full rounded-full bg-gradient-to-r from-brand to-brand/60'
											initial={{ width: 0 }}
											animate={{ width: `${item.percentage}%` }}
											transition={{ delay: 0.9 + i * 0.05, duration: 0.5, ease: 'easeOut' }}
										/>
									</div>
									<span className='w-12 shrink-0 text-right text-xs font-bold text-brand'>
										{item.percentage.toFixed(0)}%
									</span>
								</motion.div>
							))}
						</div>
					</motion.div>
				)}

				{/* Learning Narrative */}
				{!isBlankProfile && profile.statistics && (
					<div className='mt-8'>
						<LearningNarrative
							statistics={profile.statistics}
							displayName={profile.displayName || profile.username || 'Chef'}
							memberSince={profile.createdAt}
						/>
					</div>
				)}

				{/* Interests */}
				{profile.preferences && profile.preferences.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.8 }}
						className='mt-8 rounded-2xl border border-border-subtle bg-bg-card p-6 shadow-card'
					>
						<h2 className='mb-3 flex items-center gap-2 font-semibold text-text'>
							<Zap className='size-5 text-gaming-xp' />
							Your Interests
						</h2>
						<div className='flex flex-wrap gap-2'>
							{profile.preferences.map(pref => (
								<span
									key={pref}
									className='rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand'
								>
									{pref}
								</span>
							))}
						</div>
					</motion.div>
				)}

				{/* Dietary & Cuisines from cooking prefs */}
				{cookingPrefs && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.9 }}
						className='mt-4 grid gap-4 sm:grid-cols-2'
					>
						{cookingPrefs.preferredCuisines.length > 0 && (
							<div className='rounded-2xl border border-border-subtle bg-bg-card p-6 shadow-card'>
								<h3 className='mb-3 flex items-center gap-2 text-sm font-semibold text-text'>
									<Globe className='size-4 text-brand' />
									Favorite Cuisines
								</h3>
								<div className='flex flex-wrap gap-2'>
									{cookingPrefs.preferredCuisines.map(c => (
										<span key={c} className='rounded-full bg-bg-elevated px-3 py-1 text-xs font-medium text-text-secondary'>
											{c}
										</span>
									))}
								</div>
							</div>
						)}
						{cookingPrefs.dietaryRestrictions.length > 0 && (
							<div className='rounded-2xl border border-border-subtle bg-bg-card p-6 shadow-card'>
								<h3 className='mb-3 flex items-center gap-2 text-sm font-semibold text-text'>
									<Trophy className='size-4 text-gaming-xp' />
									Dietary Preferences
								</h3>
								<div className='flex flex-wrap gap-2'>
									{cookingPrefs.dietaryRestrictions.map(d => (
										<span key={d} className='rounded-full bg-gaming-xp/10 px-3 py-1 text-xs font-medium text-gaming-xp'>
											{d}
										</span>
									))}
								</div>
							</div>
						)}
					</motion.div>
				)}

				{/* Year in Cooking CTA */}
				{!isBlankProfile && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 1.0 }}
						className='mt-8'
					>
						<Link href='/profile/year-in-cooking'>
							<motion.div
								whileHover={{ scale: 1.01 }}
								whileTap={BUTTON_SUBTLE_TAP}
								className='group flex items-center gap-4 rounded-2xl border border-border-subtle bg-gradient-to-r from-brand/5 to-gaming-xp/5 p-5 shadow-card transition-all hover:shadow-warm'
							>
								<div className='grid size-12 place-items-center rounded-xl bg-brand/10 text-brand transition-colors group-hover:bg-brand/20'>
									<Calendar className='size-6' />
								</div>
								<div className='flex-1'>
									<h3 className='font-semibold text-text'>Your Year in Cooking</h3>
									<p className='text-sm text-text-muted'>
										See your Spotify-Wrapped-style cooking recap
									</p>
								</div>
								<ChevronRight className='size-5 text-text-muted transition-transform group-hover:translate-x-1' />
							</motion.div>
						</Link>
					</motion.div>
				)}
			</PageContainer>
		</PageTransition>
	)
}
