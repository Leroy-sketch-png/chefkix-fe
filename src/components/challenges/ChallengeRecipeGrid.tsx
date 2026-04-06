'use client'

import { useTranslations } from 'next-intl'

import { motion } from 'framer-motion'
import {
	ArrowLeft,
	ArrowUpDown,
	CheckCircle,
	Clock,
	Play,
	Star,
	Users,
	Zap,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	CARD_FEED_HOVER,
} from '@/lib/motion'
import { StaggerContainer } from '@/components/ui/stagger-animation'

// ============================================
// TYPES
// ============================================

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
type FilterOption = 'all' | 'quick' | 'beginner' | 'popular'
type SortOption = 'xp' | 'time' | 'rating'

interface ChallengeRecipe {
	id: string
	title: string
	description: string
	imageUrl: string
	baseXp: number
	bonusXp: number
	cookTime: string
	cookTimeMinutes: number
	rating: number
	cookCount: number
	difficulty: Difficulty
	author: {
		name: string
		avatarUrl: string
	}
	isQuickPick?: boolean
}

interface TodayChallenge {
	emoji: string
	type: string
	title: string
	description: string
	bonusXp: number
	timeRemaining: {
		hours: number
		minutes: number
	}
}

interface ChallengeRecipeGridProps {
	challenge: TodayChallenge
	recipes: ChallengeRecipe[]
	onBack?: () => void
	onCook?: (recipeId: string) => void
	className?: string
}

// ============================================
// DIFFICULTY CONFIG
// ============================================

const difficultyConfig: Record<Difficulty, { bg: string; text: string }> = {
	Beginner: { bg: 'bg-success', text: 'text-white' },
	Intermediate: { bg: 'bg-warning', text: 'text-white' },
	Advanced: { bg: 'bg-error', text: 'text-white' },
	Expert: { bg: 'bg-accent-purple', text: 'text-white' },
}

// ============================================
// FILTER CHIP
// ============================================

const FilterChip = ({
	label,
	isActive,
	onClick,
}: {
	label: string
	isActive: boolean
	onClick: () => void
}) => (
	<button
		type='button'
		onClick={onClick}
		className={cn(
			'rounded-full border px-4 py-2 text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
			isActive
				? 'border-brand bg-brand text-white'
				: 'border-border bg-bg text-text-secondary hover:bg-muted/30 hover:text-text',
		)}
	>
		{label}
	</button>
)

// ============================================
// RECIPE CARD
// ============================================

const ChallengeRecipeCard = ({
	recipe,
	onCook,
}: {
	recipe: ChallengeRecipe
	onCook?: (id: string) => void
}) => {
	const difficulty = difficultyConfig[recipe.difficulty]
	const totalXp = recipe.baseXp + recipe.bonusXp
	const t = useTranslations('challenge')

	return (
		<motion.article
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			whileHover={CARD_FEED_HOVER}
			transition={TRANSITION_SPRING}
			className='group overflow-hidden rounded-2xl border-2 border-transparent bg-bg-card shadow-card transition-all hover:border-brand/30 hover:shadow-xl'
		>
			<Link href={`/recipes/${recipe.id}`} className='block'>
				{/* Image Container */}
				<div className='relative aspect-[16/10] overflow-hidden'>
					<Image
						src={recipe.imageUrl}
						alt={recipe.title}
						fill
						sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
						className='object-cover transition-transform duration-300 group-hover:scale-105'
					/>

					{/* Qualifies Badge */}
					<div className='absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-success px-3 py-1.5 text-xs font-bold text-white shadow-lg'>
						<CheckCircle className='size-3.5' />
						{t('qualifies')}
					</div>

					{/* XP Badge */}
					<div className='absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1.5 backdrop-blur-sm'>
						<span className='tabular-nums text-xs font-bold text-white'>
							{recipe.baseXp} XP
						</span>
						<span className='tabular-nums rounded-lg bg-success/20 px-1.5 py-0.5 text-2xs font-bold text-success'>
							+{recipe.bonusXp}
						</span>
					</div>

					{/* Quick Pick Ribbon */}
					{recipe.isQuickPick && (
						<div className='absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-gradient-gold px-3 py-1.5 text-2xs font-bold text-white'>
							<Zap className='size-3' />
							{t('quickPick')}
						</div>
					)}

					{/* Difficulty */}
					<div
						className={cn(
							'absolute bottom-3 right-3 rounded-full px-3 py-1.5 text-2xs font-semibold',
							difficulty.bg,
							difficulty.text,
						)}
					>
						{recipe.difficulty}
					</div>
				</div>

				{/* Content */}
				<div className='p-4'>
					<h3 className='mb-1.5 text-base font-serif font-bold text-text'>
						{recipe.title}
					</h3>
					<p className='mb-3 line-clamp-1 text-xs leading-relaxed text-text-secondary'>
						{recipe.description}
					</p>

					{/* Meta */}
					<div className='mb-3.5 flex gap-3.5'>
						<span
							className={cn(
								'flex items-center gap-1 text-xs',
								recipe.isQuickPick
									? 'font-semibold text-success'
									: 'text-text-secondary',
							)}
						>
							<Clock className='size-3.5' />
							{recipe.cookTime}
						</span>
						<span className='flex items-center gap-1 text-xs text-text-secondary'>
							<Star className='size-3.5 fill-warning text-warning' />
							{recipe.rating}
						</span>
						<span className='flex items-center gap-1 text-xs text-text-secondary'>
							<Users className='size-3.5' />
							{recipe.cookCount >= 1000
								? `${(recipe.cookCount / 1000).toFixed(1)}k`
								: recipe.cookCount}
						</span>
					</div>

					{/* Footer */}
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-2'>
							<Image
								src={recipe.author.avatarUrl}
								alt={recipe.author.name}
								width={28}
								height={28}
								className='rounded-full'
							/>
							<span className='text-xs text-text'>{recipe.author.name}</span>
						</div>
						<motion.button
							type='button'
							onClick={e => {
								e.preventDefault()
								onCook?.(recipe.id)
							}}
							whileHover={BUTTON_HOVER}
							whileTap={BUTTON_TAP}
							className='flex items-center gap-1.5 rounded-lg bg-gradient-brand px-4 py-2.5 text-xs font-semibold text-white shadow-card transition-shadow hover:shadow-lg focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-2 focus-visible:ring-brand/50'
						>
							<Play className='size-4' />
							{t('cook')}
						</motion.button>
					</div>
				</div>
			</Link>
		</motion.article>
	)
}

// ============================================
// CHALLENGE RECIPE GRID
// ============================================

export const ChallengeRecipeGrid = ({
	challenge,
	recipes,
	onBack,
	onCook,
	className,
}: ChallengeRecipeGridProps) => {
	const [activeFilter, setActiveFilter] = useState<FilterOption>('all')
	const [sortBy, setSortBy] = useState<SortOption>('xp')
	const t = useTranslations('challenge')

	// Filter recipes
	const filteredRecipes = recipes.filter(recipe => {
		switch (activeFilter) {
			case 'quick':
				return recipe.cookTimeMinutes <= 30
			case 'beginner':
				return recipe.difficulty === 'Beginner'
			case 'popular':
				return recipe.cookCount >= 1000
			default:
				return true
		}
	})

	// Sort recipes
	const sortedRecipes = [...filteredRecipes].sort((a, b) => {
		switch (sortBy) {
			case 'xp':
				return b.baseXp + b.bonusXp - (a.baseXp + a.bonusXp)
			case 'time':
				return a.cookTimeMinutes - b.cookTimeMinutes
			case 'rating':
				return b.rating - a.rating
			default:
				return 0
		}
	})

	// Find top pick
	const topPick = sortedRecipes[0]
	const topPickTotalXp = topPick ? topPick.baseXp + topPick.bonusXp : 0

	return (
		<div className={cn('space-y-5', className)}>
			{/* Header */}
			<div className='rounded-2xl bg-bg-card p-5'>
				{onBack && (
					<button
						type='button'
						onClick={onBack}
						className='mb-4 flex items-center gap-1.5 text-xs text-text-secondary transition-colors hover:text-text'
					>
						<ArrowLeft className='size-4' />
						{t('backToFeed')}
					</button>
				)}

				<div className='mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-start'>
					{/* Challenge Info */}
					<div className='flex items-start gap-4'>
						<span className='text-5xl'>{challenge.emoji}</span>
						<div>
							<span className='text-2xs font-bold uppercase tracking-wide text-brand'>
								{challenge.type}
							</span>
							<h1 className='my-1 text-2xl font-display font-extrabold text-text md:text-3xl'>
								{challenge.title}
							</h1>
							<p className='text-sm text-text-secondary'>
								{challenge.description}
							</p>
						</div>
					</div>

					{/* Reward */}
					<div className='text-right'>
						<div className='mb-2 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-4 py-2.5'>
							<span className='text-lg'>⚡</span>
							<span className='text-xl font-display font-extrabold text-success'>
								+{challenge.bonusXp} XP
							</span>
							<span className='text-xs text-text-secondary'>bonus</span>
						</div>
						<div className='flex items-center justify-end gap-1.5 text-xs text-text-secondary'>
							<Clock className='size-3.5' />
						{t('hoursMinutes', { hours: challenge.timeRemaining.hours, mins: challenge.timeRemaining.minutes })} {t('remaining')}
						</div>
					</div>
				</div>

				{/* Filter/Sort */}
				<div className='flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4'>
					<div className='flex flex-wrap gap-2'>
						<FilterChip
							label={t('filterAll')}
							isActive={activeFilter === 'all'}
							onClick={() => setActiveFilter('all')}
						/>
						<FilterChip
							label={t('filterQuick')}
							isActive={activeFilter === 'quick'}
							onClick={() => setActiveFilter('quick')}
						/>
						<FilterChip
							label={t('filterBeginner')}
							isActive={activeFilter === 'beginner'}
							onClick={() => setActiveFilter('beginner')}
						/>
						<FilterChip
							label={t('filterPopular')}
							isActive={activeFilter === 'popular'}
							onClick={() => setActiveFilter('popular')}
						/>
					</div>

					<button
						type='button'
						onClick={() =>
							setSortBy(prev =>
								prev === 'xp' ? 'time' : prev === 'time' ? 'rating' : 'xp',
							)
						}
						className='flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-xs text-text-secondary transition-colors hover:bg-bg hover:text-text focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2'
					>
						<ArrowUpDown className='size-3.5' />
						{sortBy === 'xp'
							? t('sortXp')
							: sortBy === 'time'
								? t('sortCookTime')
								: t('sortRating')}
					</button>
				</div>
			</div>

			{/* Recipe Grid */}
			<StaggerContainer staggerDelay={0.05}>
				<div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
					{sortedRecipes.map(recipe => (
						<ChallengeRecipeCard
							key={recipe.id}
							recipe={recipe}
							onCook={onCook}
						/>
					))}
				</div>
			</StaggerContainer>

			{/* XP Potential Footer */}
			{topPick && (
				<div className='rounded-xl bg-bg-card px-5 py-4'>
					<div className='flex flex-wrap items-center justify-center gap-2 text-sm'>
						<span className='text-text-secondary'>
							{t('topPickXp')}
						</span>
						<span className='tabular-nums font-semibold text-text'>
							{topPick.baseXp} XP base
						</span>
						<span className='text-text-secondary'>+</span>
						<span className='tabular-nums font-semibold text-success'>
							{topPick.bonusXp} XP bonus
						</span>
						<span className='text-text-secondary'>=</span>
						<span className='tabular-nums rounded-full bg-brand/10 px-3 py-1 text-lg font-display font-extrabold text-brand'>
							{topPickTotalXp} XP
						</span>
					</div>
				</div>
			)}
		</div>
	)
}

// ============================================
// EXPORTS
// ============================================

export type {
	ChallengeRecipe,
	TodayChallenge,
	ChallengeRecipeGridProps,
	Difficulty,
	FilterOption,
	SortOption,
}
