'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
	ArrowLeft,
	BookOpen,
	ChefHat,
	CheckCircle2,
	Circle,
	Clock,
	Flame,
	Lock,
	Play,
	Star,
	Trophy,
	Users,
	Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from '@/i18n/hooks'
import {
	TRANSITION_SPRING,
	CARD_HOVER,
	BUTTON_SUBTLE_HOVER,
	BUTTON_SUBTLE_TAP,
	DURATION_S,
} from '@/lib/motion'
import {
	Collection,
	CollectionProgress,
	DifficultyStep,
} from '@/lib/types/collection'
import {
	enrollInCollection,
	getCollectionProgress,
} from '@/services/collection'
import { getRecipeById } from '@/services/recipe'

interface LearningPathViewProps {
	collection: Collection
	isOwner: boolean
}

/**
 * Learning Path View for LEARNING_PATH type collections.
 * Shows progress, difficulty stages, enrolled users, and recipes to complete.
 * @see PLAN-AGENT-BRAVO.md D-FE.3
 */
export function LearningPathView({
	collection,
	isOwner,
}: LearningPathViewProps) {
	const router = useRouter()
	const t = useTranslations('collections')
	const [progress, setProgress] = useState<CollectionProgress | null>(null)
	const [isLoadingProgress, setIsLoadingProgress] = useState(true)
	const [isEnrolling, setIsEnrolling] = useState(false)
	const [expandedStage, setExpandedStage] = useState<number | null>(null)
	const [recipeSummaries, setRecipeSummaries] = useState<
		Record<
			string,
			{ title: string; difficulty?: string; coverImageUrl?: string }
		>
	>({})

	const isEnrolled = progress !== null

	const fetchProgress = useCallback(async () => {
		setIsLoadingProgress(true)
		const res = await getCollectionProgress(collection.id)
		if (res.success && res.data) {
			setProgress(res.data)
		}
		setIsLoadingProgress(false)
	}, [collection.id])

	useEffect(() => {
		fetchProgress()
	}, [fetchProgress])

	// Fetch recipe titles/summaries for all recipes in the learning path
	useEffect(() => {
		const allRecipeIds = [...(collection.recipeIds ?? [])]
		// Also collect from difficultyProgression stages
		if (collection.difficultyProgression) {
			for (const stage of collection.difficultyProgression) {
				for (const id of stage.recipeIds) {
					if (!allRecipeIds.includes(id)) allRecipeIds.push(id)
				}
			}
		}
		if (allRecipeIds.length === 0) return

		const fetchSummaries = async () => {
			const results = await Promise.allSettled(
				allRecipeIds.map(id => getRecipeById(id)),
			)
			const summaries: Record<
				string,
				{ title: string; difficulty?: string; coverImageUrl?: string }
			> = {}
			results.forEach((result, idx) => {
				if (
					result.status === 'fulfilled' &&
					result.value.success &&
					result.value.data
				) {
					const r = result.value.data
					summaries[allRecipeIds[idx]] = {
						title: r.title,
						difficulty: r.difficulty,
						coverImageUrl: r.coverImageUrl?.[0],
					}
				}
			})
			setRecipeSummaries(summaries)
		}
		fetchSummaries()
	}, [collection.recipeIds, collection.difficultyProgression])

	const handleEnroll = async () => {
		setIsEnrolling(true)
		const res = await enrollInCollection(collection.id)
		if (res.success && res.data) {
			setProgress(res.data)
			toast.success(t('toastEnrolled'))
		} else {
			toast.error(res.message || t('toastEnrollFailed'))
		}
		setIsEnrolling(false)
	}

	const handleStartRecipe = (recipeId: string) => {
		router.push(`/recipes/${recipeId}`)
	}

	const getDifficultyColor = (difficulty: string) => {
		switch (difficulty.toLowerCase()) {
			case 'beginner':
				return 'text-success bg-success/10 border-success/30'
			case 'intermediate':
				return 'text-warning bg-warning/10 border-warning/30'
			case 'advanced':
				return 'text-streak bg-streak/10 border-streak/30'
			case 'expert':
				return 'text-error bg-error/10 border-error/30'
			default:
				return 'text-text-muted bg-bg-elevated border-border-subtle'
		}
	}

	const isRecipeCompleted = (recipeId: string) =>
		progress?.completedRecipeIds.includes(recipeId) ?? false

	const totalRecipes = collection.recipeIds?.length ?? 0
	const completedCount = progress?.completedRecipeIds.length ?? 0
	const progressPercent = progress?.progressPercent ?? 0

	return (
		<div className='space-y-6'>
			{/* Header with stats */}
			<div className='rounded-2xl border border-border-subtle bg-bg-card p-6 shadow-card'>
				{/* Collection info */}
				<div className='mb-4 flex items-start justify-between'>
					<div>
						<div className='mb-2 flex items-center gap-2'>
							<BookOpen className='size-5 text-brand' />
							<span className='text-xs font-medium uppercase tracking-wide text-brand'>
								Learning Path
							</span>
						</div>
						<h1 className='text-2xl font-bold text-text'>{collection.name}</h1>
						{collection.description && (
							<p className='mt-1 text-sm text-text-muted'>
								{collection.description}
							</p>
						)}
					</div>
					{collection.difficulty && (
						<span
							className={`rounded-full border px-3 py-1 text-xs font-medium ${getDifficultyColor(collection.difficulty)}`}
						>
							{collection.difficulty}
						</span>
					)}
				</div>

				{/* Stats row */}
				<div className='mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4'>
					<div className='flex items-center gap-2'>
						<ChefHat className='size-4 text-text-muted' />
						<span className='text-sm tabular-nums text-text-secondary'>
							{totalRecipes} recipes
						</span>
					</div>
					{collection.estimatedTotalMinutes && (
						<div className='flex items-center gap-2'>
							<Clock className='size-4 text-text-muted' />
							<span className='text-sm tabular-nums text-text-secondary'>
								{Math.round(collection.estimatedTotalMinutes / 60)}h total
							</span>
						</div>
					)}
					{collection.totalXp != null && collection.totalXp > 0 && (
						<div className='flex items-center gap-2'>
							<Zap className='size-4 text-xp' />
							<span className='text-sm tabular-nums text-text-secondary'>
								{collection.totalXp.toLocaleString()} XP
							</span>
						</div>
					)}
					{collection.enrolledCount !== undefined && (
						<div className='flex items-center gap-2'>
							<Users className='size-4 text-text-muted' />
							<span className='text-sm tabular-nums text-text-secondary'>
								{collection.enrolledCount.toLocaleString()} enrolled
							</span>
						</div>
					)}
				</div>

				{/* Rating and completion rate */}
				{(collection.averageRating ||
					collection.completionRate !== undefined) && (
					<div className='mb-6 flex items-center gap-6'>
						{collection.averageRating && (
							<div className='flex items-center gap-1.5'>
								<Star className='size-4 fill-warning text-warning' />
								<span className='text-sm font-medium text-text'>
									{collection.averageRating.toFixed(1)}
								</span>
							</div>
						)}
						{collection.completionRate !== undefined && (
							<div className='flex items-center gap-1.5'>
								<Trophy className='size-4 text-success' />
								<span className='text-sm text-text-secondary'>
									{Math.round(collection.completionRate * 100)}% completion rate
								</span>
							</div>
						)}
					</div>
				)}

				{/* Enrollment / Progress section */}
				{isLoadingProgress ? (
					<div className='h-20 animate-pulse rounded-xl bg-bg-elevated' />
				) : isEnrolled ? (
					<div className='rounded-xl bg-bg-elevated p-4'>
						<div className='mb-3 flex items-center justify-between'>
							<span className='text-sm font-medium text-text'>
								{t('yourProgress')}
							</span>
							<span className='text-sm tabular-nums text-text-muted'>
								{completedCount} of {totalRecipes} complete
							</span>
						</div>
						{/* Progress bar */}
						<div className='relative mb-3 h-3 overflow-hidden rounded-full bg-border-subtle'>
							<motion.div
								initial={{ width: 0 }}
								animate={{ width: `${progressPercent}%` }}
								transition={{ duration: DURATION_S.slow, ease: 'easeOut' }}
								className='absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand to-brand-hover'
							/>
						</div>
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-2'>
								<Flame className='size-4 text-xp' />
								<span className='text-sm font-medium tabular-nums text-xp'>
									{progress?.totalXpEarned.toLocaleString() ?? 0} XP earned
								</span>
							</div>
							{progressPercent === 100 ? (
								<div className='flex items-center gap-1.5 text-success'>
									<CheckCircle2 className='size-4' />
									<span className='text-sm font-medium'>{t('completed')}</span>
								</div>
							) : (
								<span className='text-xs text-text-muted'>
									{Math.round(progressPercent)}% complete
								</span>
							)}
						</div>
					</div>
				) : (
					<motion.button
						type='button'
						whileHover={BUTTON_SUBTLE_HOVER}
						whileTap={BUTTON_SUBTLE_TAP}
						onClick={handleEnroll}
						disabled={isEnrolling}
						className='w-full rounded-xl bg-brand px-6 py-3.5 text-sm font-semibold text-white shadow-warm transition-colors hover:bg-brand-hover disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand/50'
					>
						{isEnrolling ? 'Enrolling...' : 'Start Learning Path'}
					</motion.button>
				)}
			</div>

			{/* Difficulty Progression Stages */}
			{collection.difficultyProgression &&
				collection.difficultyProgression.length > 0 && (
					<div className='space-y-3'>
						<h2 className='text-lg font-semibold text-text'>
							{t('learningStages')}
						</h2>
						<div className='space-y-3'>
							{collection.difficultyProgression
								.sort((a, b) => a.order - b.order)
								.map((stage, idx) => (
									<StageCard
										key={stage.order}
										stage={stage}
										stageIndex={idx}
										isExpanded={expandedStage === idx}
										onToggle={() =>
											setExpandedStage(expandedStage === idx ? null : idx)
										}
										isEnrolled={isEnrolled}
										isRecipeCompleted={isRecipeCompleted}
										onStartRecipe={handleStartRecipe}
										getDifficultyColor={getDifficultyColor}
										recipeSummaries={recipeSummaries}
									/>
								))}
						</div>
					</div>
				)}

			{/* Flat recipe list (no stages) */}
			{(!collection.difficultyProgression ||
				collection.difficultyProgression.length === 0) &&
				collection.recipeIds &&
				collection.recipeIds.length > 0 && (
					<div className='space-y-3'>
						<h2 className='text-lg font-semibold text-text'>
							{t('recipesLabel')}
						</h2>
						<div className='space-y-2'>
							{collection.recipeIds.map((recipeId, idx) => (
								<RecipeRow
									key={recipeId}
									recipeId={recipeId}
									index={idx}
									isCompleted={isRecipeCompleted(recipeId)}
									isLocked={!isEnrolled && idx > 0}
									onStart={() => handleStartRecipe(recipeId)}
									recipeName={recipeSummaries[recipeId]?.title}
								/>
							))}
						</div>
					</div>
				)}
		</div>
	)
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface StageCardProps {
	stage: DifficultyStep
	stageIndex: number
	isExpanded: boolean
	onToggle: () => void
	isEnrolled: boolean
	isRecipeCompleted: (recipeId: string) => boolean
	onStartRecipe: (recipeId: string) => void
	getDifficultyColor: (difficulty: string) => string
	recipeSummaries: Record<
		string,
		{ title: string; difficulty?: string; coverImageUrl?: string }
	>
}

function StageCard({
	stage,
	stageIndex,
	isExpanded,
	onToggle,
	isEnrolled,
	isRecipeCompleted,
	onStartRecipe,
	getDifficultyColor,
	recipeSummaries,
}: StageCardProps) {
	const completedInStage = stage.recipeIds.filter(isRecipeCompleted).length
	const totalInStage = stage.recipeIds.length
	const stageComplete = completedInStage === totalInStage && totalInStage > 0

	return (
		<motion.div
			{...CARD_HOVER}
			className='overflow-hidden rounded-xl border border-border-subtle bg-bg-card shadow-card'
		>
			{/* Stage header */}
			<button
				type='button'
				onClick={onToggle}
				className='flex w-full items-center justify-between p-4 text-left'
			>
				<div className='flex items-center gap-3'>
					<div
						className={`flex size-8 items-center justify-center rounded-full text-sm font-bold ${
							stageComplete
								? 'bg-success/10 text-success'
								: 'bg-bg-elevated text-text-muted'
						}`}
					>
						{stageComplete ? (
							<CheckCircle2 className='size-5' />
						) : (
							stageIndex + 1
						)}
					</div>
					<div>
						<h3 className='font-semibold text-text'>{stage.label}</h3>
						<div className='flex items-center gap-2'>
							<span
								className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getDifficultyColor(stage.difficulty)}`}
							>
								{stage.difficulty}
							</span>
							<span className='text-xs text-text-muted'>
								{completedInStage}/{totalInStage} recipes
							</span>
						</div>
					</div>
				</div>
				<motion.div
					animate={{ rotate: isExpanded ? 180 : 0 }}
					className='text-text-muted'
				>
					<ArrowLeft className='size-4 -rotate-90' />
				</motion.div>
			</button>

			{/* Expanded recipe list */}
			<AnimatePresence>
				{isExpanded && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={TRANSITION_SPRING}
						className='border-t border-border-subtle'
					>
						<div className='space-y-1 p-3'>
							{stage.recipeIds.map((recipeId, idx) => (
								<RecipeRow
									key={recipeId}
									recipeId={recipeId}
									index={idx}
									isCompleted={isRecipeCompleted(recipeId)}
									isLocked={!isEnrolled && idx > 0}
									onStart={() => onStartRecipe(recipeId)}
									recipeName={recipeSummaries[recipeId]?.title}
								/>
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	)
}

interface RecipeRowProps {
	recipeId: string
	index: number
	isCompleted: boolean
	isLocked: boolean
	onStart: () => void
	recipeName?: string
}

function RecipeRow({
	recipeId,
	index,
	isCompleted,
	isLocked,
	onStart,
	recipeName,
}: RecipeRowProps) {
	const displayName = recipeName || `Recipe ${index + 1}`
	return (
		<motion.div
			whileHover={!isLocked ? { backgroundColor: 'var(--bg-elevated)' } : {}}
			className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors ${
				isLocked ? 'opacity-50' : 'cursor-pointer'
			}`}
			onClick={isLocked ? undefined : onStart}
		>
			<div className='flex items-center gap-3'>
				{isCompleted ? (
					<CheckCircle2 className='size-5 text-success' />
				) : isLocked ? (
					<Lock className='size-5 text-text-muted' />
				) : (
					<Circle className='size-5 text-text-muted' />
				)}
				<span
					className={`text-sm ${
						isCompleted
							? 'text-text-muted line-through'
							: isLocked
								? 'text-text-muted'
								: 'text-text'
					}`}
				>
					{displayName}
				</span>
			</div>
			{!isLocked && !isCompleted && (
				<button
					type='button'
					onClick={e => {
						e.stopPropagation()
						onStart()
					}}
					className='flex items-center gap-1.5 rounded-lg bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand transition-colors hover:bg-brand/20'
				>
					<Play className='size-3' />
					Start
				</button>
			)}
		</motion.div>
	)
}

export default LearningPathView
