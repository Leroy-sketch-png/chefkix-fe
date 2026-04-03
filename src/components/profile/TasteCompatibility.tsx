'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Heart } from 'lucide-react'
import { TRANSITION_SPRING } from '@/lib/motion'
import type { Profile, Statistics } from '@/lib/types/profile'

interface TasteCompatibilityProps {
	myProfile: Profile
	theirProfile: Profile
}

// Lightweight dimension computation from profile-only data (no CookingPreferences needed)
function computeDimensions(profile: Profile): number[] {
	const stats = profile.statistics
	if (!stats) return [0, 0, 0, 0, 0, 0]

	const prefs = profile.preferences ?? []

	// Adventurousness — diversity of interests / cuisines
	const adventurousness = Math.min(100, prefs.length * 12 + (stats.completionCount ?? 0) * 2)

	// Dedication — consistency & volume
	const dedication = Math.min(100, (stats.streakCount ?? 0) * 8 + (stats.completionCount ?? 0) * 3)

	// Skill Level — level-based
	const skill = Math.min(100, (stats.currentLevel ?? 1) * 10)

	// Social Chef — posts & followers
	const social = Math.min(100, (stats.postCount ?? 0) * 5 + (stats.followerCount ?? 0) * 2)

	// Recipe Creator — recipes created
	const creator = Math.min(100, (stats.recipeCount ?? 0) * 12)

	// Speed Cook — placeholder from completions (no cookTime data without CookingPrefs)
	const speed = Math.min(100, (stats.completionCount ?? 0) * 4)

	return [adventurousness, dedication, skill, social, creator, speed]
}

function cosineSimilarity(a: number[], b: number[]): number {
	let dot = 0
	let magA = 0
	let magB = 0
	for (let i = 0; i < a.length; i++) {
		dot += a[i] * b[i]
		magA += a[i] * a[i]
		magB += b[i] * b[i]
	}
	if (magA === 0 || magB === 0) return 0
	return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

function preferenceOverlap(a: string[], b: string[]): number {
	if (a.length === 0 && b.length === 0) return 1
	if (a.length === 0 || b.length === 0) return 0
	const setA = new Set(a.map((s) => s.toLowerCase()))
	const setB = new Set(b.map((s) => s.toLowerCase()))
	let overlap = 0
	for (const item of setA) {
		if (setB.has(item)) overlap++
	}
	const union = new Set([...setA, ...setB]).size
	return union > 0 ? overlap / union : 0
}

function getCompatibilityLabel(score: number): { text: string; emoji: string; color: string } {
	if (score >= 85) return { text: 'Kitchen Soulmates', emoji: '💕', color: 'text-pink-500' }
	if (score >= 70) return { text: 'Great Match', emoji: '🔥', color: 'text-brand' }
	if (score >= 50) return { text: 'Compatible', emoji: '👍', color: 'text-emerald-500' }
	if (score >= 30) return { text: 'Different Styles', emoji: '🌶️', color: 'text-amber-500' }
	return { text: 'Opposites Attract', emoji: '🎭', color: 'text-purple-500' }
}

export function TasteCompatibility({ myProfile, theirProfile }: TasteCompatibilityProps) {
	const { score, label } = useMemo(() => {
		const myDims = computeDimensions(myProfile)
		const theirDims = computeDimensions(theirProfile)

		// Weighted: 60% dimension similarity, 40% preference overlap
		const dimScore = cosineSimilarity(myDims, theirDims) * 100
		const prefScore =
			preferenceOverlap(
				myProfile.preferences ?? [],
				theirProfile.preferences ?? [],
			) * 100

		const finalScore = Math.round(dimScore * 0.6 + prefScore * 0.4)
		return { score: finalScore, label: getCompatibilityLabel(finalScore) }
	}, [myProfile, theirProfile])

	// Don't render if either user has zero cooking activity
	const myStats = myProfile.statistics
	const theirStats = theirProfile.statistics
	if (
		(!myStats || (myStats.completionCount === 0 && (myProfile.preferences?.length ?? 0) === 0)) ||
		(!theirStats || (theirStats.completionCount === 0 && (theirProfile.preferences?.length ?? 0) === 0))
	) {
		return null
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={TRANSITION_SPRING}
			className='rounded-2xl border border-border-subtle bg-gradient-to-r from-brand/5 via-bg-card to-gaming-xp/5 p-4 shadow-card'
		>
			<div className='flex items-center gap-3'>
				<div className='relative grid size-12 place-items-center'>
					{/* Animated ring */}
					<svg className='absolute inset-0 size-12' viewBox='0 0 48 48'>
						<circle
							cx='24'
							cy='24'
							r='20'
							fill='none'
							stroke='currentColor'
							strokeWidth='3'
							className='text-border'
						/>
						<motion.circle
							cx='24'
							cy='24'
							r='20'
							fill='none'
							stroke='currentColor'
							strokeWidth='3'
							strokeLinecap='round'
							className='text-brand'
							strokeDasharray={`${(score / 100) * 125.6} 125.6`}
							initial={{ strokeDashoffset: 125.6 }}
							animate={{ strokeDashoffset: 0 }}
							transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
							transform='rotate(-90 24 24)'
						/>
					</svg>
					<span className='text-xs font-bold text-text'>{score}%</span>
				</div>

				<div className='flex-1'>
					<div className='flex items-center gap-1.5'>
						<Sparkles className='size-3.5 text-gaming-xp' />
						<span className='text-sm font-semibold text-text'>Taste Compatibility</span>
					</div>
					<p className={`text-sm font-medium ${label.color}`}>
						{label.emoji} {label.text}
					</p>
				</div>

				<Heart className='size-5 text-brand/30' />
			</div>
		</motion.div>
	)
}
