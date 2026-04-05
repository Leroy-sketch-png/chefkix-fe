'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, TrendingUp, Star, Zap, Flame, Award } from 'lucide-react'
import { TRANSITION_SPRING } from '@/lib/motion'
import type { Statistics } from '@/lib/types/profile'
import { useTranslations } from 'next-intl'

interface LearningNarrativeProps {
	statistics: Statistics
	displayName: string
	memberSince?: string // ISO date string
}

interface NarrativeStep {
	icon: React.ReactNode
	text: string
	highlight?: string
}

function buildNarrative(
	stats: Statistics,
	displayName: string,
	t: (key: string, params?: Record<string, string | number>) => string,
	memberSince?: string,
): NarrativeStep[] {
	const steps: NarrativeStep[] = []
	const name = displayName.split(' ')[0] // First name only

	// 1. Origin story
	if (memberSince) {
		const joined = new Date(memberSince)
		const now = new Date()
		const months = Math.max(1, Math.floor((now.getTime() - joined.getTime()) / (1000 * 60 * 60 * 24 * 30)))
		const timeText = months >= 12
			? `${Math.floor(months / 12)} year${months >= 24 ? 's' : ''}`
			: `${months} month${months > 1 ? 's' : ''}`
		steps.push({
			icon: <BookOpen className='size-4' />,
			text: t('narrativeJoined', { name, time: timeText }),
			highlight: timeText,
		})
	}

	// 2. Title progression
	const titleMap: Record<string, string> = {
		BEGINNER: t('narrativeBeginner'),
		AMATEUR: t('narrativeAmateur'),
		SEMIPRO: t('narrativeSemiPro'),
		PRO: t('narrativePro'),
	}
	steps.push({
		icon: <Award className='size-4' />,
		text: `${name} ${titleMap[stats.title] ?? t('narrativeFallback')}`,
		highlight: stats.title,
	})

	// 3. Volume
	if (stats.completionCount > 0) {
		const adj = stats.completionCount >= 50
			? t('sessionsAdjIncredible')
			: stats.completionCount >= 20
				? t('sessionsAdjImpressive')
				: stats.completionCount >= 5
					? t('sessionsAdjSolid')
					: t('sessionsAdjGrowing')
		steps.push({
			icon: <TrendingUp className='size-4' />,
			text: t('narrativeSessions', { adj, count: stats.completionCount }),
			highlight: `${stats.completionCount}`,
		})
	}

	// 4. Level
	if (stats.currentLevel > 1) {
		steps.push({
			icon: <Zap className='size-4' />,
			text: t('narrativeLevel', { level: stats.currentLevel, xp: stats.currentXP.toLocaleString() }),
			highlight: `Level ${stats.currentLevel}`,
		})
	}

	// 5. Streak story
	if (stats.streakCount > 0) {
		const streakAdj = stats.streakCount >= 30
			? t('streakLegendary')
			: stats.streakCount >= 14
				? t('streakRemarkable')
				: stats.streakCount >= 7
					? t('streakImpressive')
					: t('streakGrowing')
		steps.push({
			icon: <Flame className='size-4' />,
			text: t('narrativeStreak', { adj: streakAdj, count: stats.streakCount }),
			highlight: `${stats.streakCount}-day`,
		})
	}

	// 6. Recipe creation
	if (stats.recipeCount > 0) {
		steps.push({
			icon: <Star className='size-4' />,
			text: t('narrativeRecipes', { count: stats.recipeCount }),
			highlight: `${stats.recipeCount}`,
		})
	}

	// 7. Badges
	if (stats.badges && stats.badges.length > 0) {
		steps.push({
			icon: <Award className='size-4' />,
			text: t('narrativeBadges', { count: stats.badges.length }),
			highlight: `${stats.badges.length} badge${stats.badges.length > 1 ? 's' : ''}`,
		})
	}

	return steps
}

export function LearningNarrative({ statistics, displayName, memberSince }: LearningNarrativeProps) {
	const t = useTranslations('profile')
	const steps = useMemo(
		() => buildNarrative(statistics, displayName, t, memberSince),
		[statistics, displayName, t, memberSince],
	)

	// Don't render for totally blank profiles
	if (steps.length <= 1) return null

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={TRANSITION_SPRING}
			className='rounded-2xl border border-border-subtle bg-bg-card p-6 shadow-card'
		>
			<h3 className='mb-4 flex items-center gap-2 font-semibold text-text'>
				<BookOpen className='size-5 text-gaming-xp' />
				{t('cookingJourney')}
			</h3>

			{/* Timeline */}
			<div className='relative space-y-0'>
				{steps.map((step, i) => (
					<motion.div
						key={i}
						initial={{ opacity: 0, x: -10 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.2 + i * 0.1 }}
						className='flex gap-3 pb-4 last:pb-0'
					>
						{/* Timeline line + dot */}
						<div className='flex flex-col items-center'>
							<div className='grid size-7 flex-shrink-0 place-items-center rounded-full bg-brand/10 text-brand'>
								{step.icon}
							</div>
							{i < steps.length - 1 && (
								<div className='mt-1 w-px flex-1 bg-border' />
							)}
						</div>

						{/* Text */}
						<p className='pt-0.5 text-sm leading-relaxed text-text-secondary'>
							{step.highlight
								? step.text.split(step.highlight).map((part, j, arr) =>
										j < arr.length - 1 ? (
											<span key={j}>
												{part}
												<span className='font-semibold text-text tabular-nums'>{step.highlight}</span>
											</span>
										) : (
											<span key={j}>{part}</span>
										),
									)
								: step.text}
						</p>
					</motion.div>
				))}
			</div>
		</motion.div>
	)
}
