'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, TrendingUp, Star, Zap, Flame, Award } from 'lucide-react'
import { TRANSITION_SPRING } from '@/lib/motion'
import type { Statistics } from '@/lib/types/profile'

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
			text: `${name} joined ChefKix ${timeText} ago`,
			highlight: timeText,
		})
	}

	// 2. Title progression
	const titleMap: Record<string, string> = {
		BEGINNER: "started as a curious Beginner, learning the basics",
		AMATEUR: "has grown into an Amateur, building confidence in the kitchen",
		SEMIPRO: "has reached Semi-Pro status — serious skills!",
		PRO: "has achieved Pro status — a true culinary master",
	}
	steps.push({
		icon: <Award className='size-4' />,
		text: `${name} ${titleMap[stats.title] ?? 'is on a cooking journey'}`,
		highlight: stats.title,
	})

	// 3. Volume
	if (stats.completionCount > 0) {
		const adj = stats.completionCount >= 50
			? 'an incredible'
			: stats.completionCount >= 20
				? 'an impressive'
				: stats.completionCount >= 5
					? 'a solid'
					: 'a growing'
		steps.push({
			icon: <TrendingUp className='size-4' />,
			text: `Completed ${adj} ${stats.completionCount} cooking session${stats.completionCount > 1 ? 's' : ''}`,
			highlight: `${stats.completionCount}`,
		})
	}

	// 4. Level
	if (stats.currentLevel > 1) {
		steps.push({
			icon: <Zap className='size-4' />,
			text: `Climbed to Level ${stats.currentLevel} with ${stats.currentXP.toLocaleString()} XP`,
			highlight: `Level ${stats.currentLevel}`,
		})
	}

	// 5. Streak story
	if (stats.streakCount > 0) {
		const streakAdj = stats.streakCount >= 30
			? 'legendary'
			: stats.streakCount >= 14
				? 'remarkable'
				: stats.streakCount >= 7
					? 'impressive'
					: 'growing'
		steps.push({
			icon: <Flame className='size-4' />,
			text: `Built a ${streakAdj} ${stats.streakCount}-day cooking streak`,
			highlight: `${stats.streakCount}-day`,
		})
	}

	// 6. Recipe creation
	if (stats.recipeCount > 0) {
		steps.push({
			icon: <Star className='size-4' />,
			text: `Created ${stats.recipeCount} original recipe${stats.recipeCount > 1 ? 's' : ''} for the community`,
			highlight: `${stats.recipeCount}`,
		})
	}

	// 7. Badges
	if (stats.badges && stats.badges.length > 0) {
		steps.push({
			icon: <Award className='size-4' />,
			text: `Earned ${stats.badges.length} badge${stats.badges.length > 1 ? 's' : ''} along the way`,
			highlight: `${stats.badges.length} badge${stats.badges.length > 1 ? 's' : ''}`,
		})
	}

	return steps
}

export function LearningNarrative({ statistics, displayName, memberSince }: LearningNarrativeProps) {
	const steps = useMemo(
		() => buildNarrative(statistics, displayName, memberSince),
		[statistics, displayName, memberSince],
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
				Cooking Journey
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
												<span className='font-semibold text-text'>{step.highlight}</span>
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
