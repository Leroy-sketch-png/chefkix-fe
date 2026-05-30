'use client'

import { useState, useCallback } from 'react'
import { motion, Reorder, useDragControls } from 'framer-motion'
import {
	BookOpen,
	ChefHat,
	Clock,
	GripVertical,
	Plus,
	Save,
	Trash2,
	X,
	Zap,
	Loader2,
} from 'lucide-react'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import {
	AsyncCombobox,
	type AsyncComboboxOption,
} from '@/components/ui/async-combobox'
import { TRANSITION_SPRING } from '@/lib/motion'
import { DifficultyStep, CollectionType } from '@/lib/types/collection'
import type { RecipeSearchDoc } from '@/lib/types/search'
import { autocompleteSearch } from '@/services/search'

interface CollectionBuilderProps {
	/** Initial collection name */
	initialName?: string
	/** Initial description */
	initialDescription?: string
	/** Initial recipe IDs (ordered) */
	initialRecipeIds?: string[]
	/** Initial difficulty stages */
	initialStages?: DifficultyStep[]
	/** Initial collection type */
	initialType?: CollectionType
	/** Initial visibility */
	initialIsPublic?: boolean
	/** Callback when saving the collection */
	onSave: (data: CollectionBuilderData) => Promise<void>
	/** Callback to close/cancel builder */
	onCancel: () => void
	/** Whether save is in progress */
	isSaving?: boolean
}

export interface CollectionBuilderData {
	name: string
	description: string
	collectionType: CollectionType
	recipeIds: string[]
	difficultyProgression: DifficultyStep[]
	isPublic: boolean
	difficulty?: DifficultyStep['difficulty']
	totalXp?: number
}

type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'

const DIFFICULTY_LEVELS: DifficultyLevel[] = [
	'Beginner',
	'Intermediate',
	'Advanced',
	'Expert',
]

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

/**
 * CollectionBuilder - Creator tool for building learning path collections.
 * Features:
 * - Drag-to-reorder recipes
 * - Difficulty stage creation and management
 * - XP and time estimates
 * @see PLAN-AGENT-BRAVO.md D-FE.5
 */
export function CollectionBuilder({
	initialName = '',
	initialDescription = '',
	initialRecipeIds = [],
	initialStages = [],
	initialType = 'LEARNING_PATH',
	initialIsPublic = true,
	onSave,
	onCancel,
	isSaving = false,
}: CollectionBuilderProps) {
	const t = useTranslations('collections')
	const [name, setName] = useState(initialName)
	const [description, setDescription] = useState(initialDescription)
	const [collectionType] = useState<CollectionType>(initialType)
	const [isPublic, setIsPublic] = useState(initialIsPublic)
	const [stages, setStages] = useState<DifficultyStep[]>(
		initialStages.length > 0
			? initialStages
			: [
					{
						label: t('builderGettingStarted'),
						difficulty: 'Beginner',
						recipeIds: initialRecipeIds,
						order: 0,
					},
				],
	)
	const [showAddStage, setShowAddStage] = useState(false)
	const [newStageName, setNewStageName] = useState('')
	const [newStageDifficulty, setNewStageDifficulty] =
		useState<DifficultyLevel>('Beginner')

	// Computed stats
	const allRecipeIds = stages.flatMap(stage => stage.recipeIds)
	const totalRecipes = allRecipeIds.length
	const totalXp = totalRecipes * 50 // Estimate: 50 XP per recipe

	const handleAddStage = useCallback(() => {
		if (!newStageName.trim()) {
			toast.error(t('builderStageNameRequired'))
			return
		}
		const newStage: DifficultyStep = {
			label: newStageName.trim(),
			difficulty: newStageDifficulty,
			recipeIds: [],
			order: stages.length,
		}
		setStages([...stages, newStage])
		setNewStageName('')
		setNewStageDifficulty('Beginner')
		setShowAddStage(false)
		toast.success(t('builderStageAdded'))
	}, [newStageName, newStageDifficulty, stages, t])

	const handleRemoveStage = useCallback((stageIndex: number) => {
		setStages(prev => {
			const updated = prev.filter((_, idx) => idx !== stageIndex)
			// Re-order remaining stages
			return updated.map((s, idx) => ({ ...s, order: idx }))
		})
	}, [])

	const handleStageReorder = useCallback(
		(reorderedStages: DifficultyStep[]) => {
			setStages(reorderedStages.map((s, idx) => ({ ...s, order: idx })))
		},
		[],
	)

	const handleUpdateStageLabel = useCallback(
		(stageIndex: number, label: string) => {
			setStages(prev =>
				prev.map((s, idx) => (idx === stageIndex ? { ...s, label } : s)),
			)
		},
		[],
	)

	const handleUpdateStageDifficulty = useCallback(
		(stageIndex: number, difficulty: DifficultyLevel) => {
			setStages(prev =>
				prev.map((s, idx) => (idx === stageIndex ? { ...s, difficulty } : s)),
			)
		},
		[],
	)

	const handleRemoveRecipe = useCallback(
		(stageIndex: number, recipeId: string) => {
			setStages(prev =>
				prev.map((s, idx) =>
					idx === stageIndex
						? { ...s, recipeIds: s.recipeIds.filter(id => id !== recipeId) }
						: s,
				),
			)
		},
		[],
	)

	const handleAddRecipe = useCallback(
		(stageIndex: number, option: AsyncComboboxOption) => {
			const recipeId = option.value
			if (allRecipeIds.includes(recipeId)) {
				toast.error(t('builderRecipeDuplicate'))
				return
			}

			setStages(prev =>
				prev.map((stage, idx) =>
					idx === stageIndex
						? { ...stage, recipeIds: [...stage.recipeIds, recipeId] }
						: stage,
				),
			)
			toast.success(t('builderRecipeAdded', { name: option.label }))
		},
		[allRecipeIds, t],
	)

	const handleSave = async () => {
		if (!name.trim()) {
			toast.error(t('builderCollectionNameRequired'))
			return
		}
		if (totalRecipes === 0) {
			toast.error(t('builderAddRecipe'))
			return
		}

		const normalizedStages = stages
			.map((stage, index) => ({
				...stage,
				label:
					stage.label.trim() || t('builderStageFallback', { index: index + 1 }),
				order: index,
			}))
			.filter(stage => stage.recipeIds.length > 0)

		const orderedRecipeIds = normalizedStages.flatMap(stage => stage.recipeIds)
		const resolvedDifficulty =
			normalizedStages[normalizedStages.length - 1]?.difficulty ?? 'Beginner'
		const resolvedTotalXp = orderedRecipeIds.length * 50

		await onSave({
			name: name.trim(),
			description: description.trim(),
			collectionType,
			recipeIds: orderedRecipeIds,
			difficultyProgression: normalizedStages,
			isPublic,
			difficulty: resolvedDifficulty,
			totalXp: resolvedTotalXp,
		})
	}

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-3'>
					<BookOpen className='size-6 text-brand' />
					<h1 className='text-xl font-bold text-text-primary'>
						{initialName ? t('editLearningPath') : t('createLearningPath')}
					</h1>
				</div>
				<button
					type='button'
					onClick={onCancel}
					aria-label={t('builderClose')}
					className='rounded-xl p-2 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary'
				>
					<X className='size-5' />
				</button>
			</div>

			{/* Basic info */}
			<div className='space-y-4 rounded-2xl border border-border-subtle/80 bg-gradient-to-br from-bg-card via-bg-card to-bg-elevated/60 p-5 shadow-card'>
				<div>
					<label className='mb-1.5 block text-sm font-medium text-text-secondary'>
						{t('builderNameLabel')}
					</label>
					<input
						type='text'
						value={name}
						onChange={e => setName(e.target.value)}
						placeholder={t('builderNamePlaceholder')}
						maxLength={80}
						className='w-full rounded-xl border border-border-subtle bg-bg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50'
					/>
				</div>
				<div>
					<label className='mb-1.5 block text-sm font-medium text-text-secondary'>
						{t('builderDescriptionLabel')}
					</label>
					<textarea
						value={description}
						onChange={e => setDescription(e.target.value)}
						placeholder={t('builderDescriptionPlaceholder')}
						maxLength={500}
						rows={3}
						className='w-full resize-none rounded-xl border border-border-subtle bg-bg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50'
					/>
				</div>
				<label className='flex cursor-pointer items-center gap-3'>
					<input
						type='checkbox'
						checked={isPublic}
						onChange={e => setIsPublic(e.target.checked)}
						className='size-4 rounded border-border-subtle accent-brand'
					/>
					<span className='text-sm text-text-primary'>
						{t('builderMakePublic')}
					</span>
				</label>
			</div>

			{/* Stats preview */}
			<div className='grid grid-cols-3 gap-4'>
				<div className='rounded-xl border border-border-subtle/80 bg-gradient-to-br from-bg-card to-bg-elevated/60 p-4 text-center shadow-card'>
					<ChefHat className='mx-auto mb-1.5 size-5 text-text-muted' />
					<p className='text-xl font-bold text-text-primary'>{totalRecipes}</p>
					<p className='text-xs text-text-muted'>{t('builderRecipes')}</p>
				</div>
				<div className='rounded-xl border border-border-subtle/80 bg-gradient-to-br from-bg-card to-bg-elevated/60 p-4 text-center shadow-card'>
					<Clock className='mx-auto mb-1.5 size-5 text-text-muted' />
					<p className='text-xl font-bold text-text-primary'>{stages.length}</p>
					<p className='text-xs text-text-muted'>{t('builderStages')}</p>
				</div>
				<div className='rounded-xl border border-border-subtle/80 bg-gradient-to-br from-bg-card to-bg-elevated/60 p-4 text-center shadow-card'>
					<Zap className='mx-auto mb-1.5 size-5 text-xp' />
					<p className='text-xl font-bold text-xp'>{totalXp}</p>
					<p className='text-xs text-text-muted'>{t('builderTotalXp')}</p>
				</div>
			</div>

			{/* Stages (Reorderable) */}
			<div className='space-y-3'>
				<div className='flex items-center justify-between'>
					<h2 className='text-lg font-semibold text-text-primary'>
						{t('builderLearningStages')}
					</h2>
					<button
						type='button'
						onClick={() => setShowAddStage(true)}
						className='flex items-center gap-1.5 rounded-xl bg-brand/10 px-3 py-1.5 text-sm font-medium text-brand transition-colors hover:bg-brand/20'
					>
						<Plus className='size-4' />
						{t('builderAddStage')}
					</button>
				</div>

				<Reorder.Group
					axis='y'
					values={stages}
					onReorder={handleStageReorder}
					className='space-y-3'
				>
					{stages.map((stage, idx) => (
						<StageItem
							key={stage.order}
							stage={stage}
							stageIndex={idx}
							onUpdateLabel={handleUpdateStageLabel}
							onUpdateDifficulty={handleUpdateStageDifficulty}
							onRemove={handleRemoveStage}
							onRemoveRecipe={handleRemoveRecipe}
							onAddRecipe={handleAddRecipe}
							existingRecipeIds={allRecipeIds}
							getDifficultyColor={getDifficultyColor}
						/>
					))}
				</Reorder.Group>

				{stages.length === 0 && (
					<div className='rounded-xl border border-dashed border-border-subtle py-12 text-center'>
						<p className='text-sm text-text-muted'>{t('builderNoStages')}</p>
					</div>
				)}
			</div>

			{/* Add Stage Modal */}
			{showAddStage && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className='fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-4'
					onClick={() => setShowAddStage(false)}
				>
					<motion.div
						initial={{ scale: 0.95, y: 10 }}
						animate={{ scale: 1, y: 0 }}
						transition={TRANSITION_SPRING}
						className='w-full max-w-sm rounded-2xl bg-gradient-to-br from-bg-card via-bg-card to-bg-elevated/60 p-6 shadow-warm border border-border-subtle/80 ring-1 ring-white/8'
						onClick={e => e.stopPropagation()}
					>
						<h3 className='mb-4 text-lg font-bold text-text-primary'>
							{t('builderAddStageTitle')}
						</h3>
						<div className='space-y-4'>
							<div>
								<label className='mb-1.5 block text-sm font-medium text-text-secondary'>
									{t('builderStageNameLabel')}
								</label>
								<input
									type='text'
									value={newStageName}
									onChange={e => setNewStageName(e.target.value)}
									placeholder={t('builderStageNamePlaceholder')}
									className='w-full rounded-xl border border-border-subtle bg-bg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50'
									autoFocus
								/>
							</div>
							<div>
								<label className='mb-1.5 block text-sm font-medium text-text-secondary'>
									{t('builderDifficultyLabel')}
								</label>
								<Select
									value={newStageDifficulty}
									onValueChange={v => setNewStageDifficulty(v as DifficultyLevel)}
								>
									<SelectTrigger className='w-full bg-bg-card'>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{DIFFICULTY_LEVELS.map(level => (
											<SelectItem key={level} value={level}>
												{level}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className='mt-6 flex justify-end gap-3'>
							<button
								type='button'
								onClick={() => setShowAddStage(false)}
								className='rounded-xl px-4 py-2.5 text-sm font-medium text-text-muted hover:bg-bg-elevated'
							>
								{t('cancel')}
							</button>
							<button
								type='button'
								onClick={handleAddStage}
								className='rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover'
							>
								{t('builderAddStage')}
							</button>
						</div>
					</motion.div>
				</motion.div>
			)}

			{/* Save button */}
			<div className='flex justify-end gap-3 border-t border-border-subtle pt-6'>
				<button
					type='button'
					onClick={onCancel}
					className='rounded-xl px-6 py-2.5 text-sm font-medium text-text-muted hover:bg-bg-elevated'
				>
					{t('cancel')}
				</button>
				<button
					type='button'
					onClick={handleSave}
					disabled={isSaving || !name.trim()}
					className='flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-warm transition-colors hover:bg-brand-hover disabled:opacity-50'
				>
					{isSaving ? (
						<Loader2 className='size-4 animate-spin' />
					) : (
						<Save className='size-4' />
					)}
					{isSaving ? t('builderSaving') : t('builderSaveLearningPath')}
				</button>
			</div>
		</div>
	)
}

// StageItem Sub-component

interface StageItemProps {
	stage: DifficultyStep
	stageIndex: number
	onUpdateLabel: (index: number, label: string) => void
	onUpdateDifficulty: (index: number, difficulty: DifficultyLevel) => void
	onRemove: (index: number) => void
	onRemoveRecipe: (stageIndex: number, recipeId: string) => void
	onAddRecipe: (stageIndex: number, option: AsyncComboboxOption) => void
	existingRecipeIds: string[]
	getDifficultyColor: (difficulty: string) => string
}

function StageItem({
	stage,
	stageIndex,
	onUpdateLabel,
	onUpdateDifficulty,
	onRemove,
	onRemoveRecipe,
	onAddRecipe,
	existingRecipeIds,
	getDifficultyColor,
}: StageItemProps) {
	const t = useTranslations('collections')
	const controls = useDragControls()
	const [isEditing, setIsEditing] = useState(false)
	const [recipeSearch, setRecipeSearch] = useState('')

	const fetchRecipeOptions = useCallback(
		async (query: string): Promise<AsyncComboboxOption[]> => {
			const response = await autocompleteSearch(query.trim(), 'recipes', 6)
			if (!response.success || !response.data?.recipes?.hits) {
				return []
			}

			return response.data.recipes.hits
				.map(hit => hit.document as RecipeSearchDoc)
				.filter(doc => !existingRecipeIds.includes(doc.id))
				.map(doc => ({
					value: doc.id,
					label: doc.title,
					secondary: doc.cuisine || doc.description || undefined,
					category: doc.difficulty || undefined,
				}))
		},
		[existingRecipeIds],
	)

	return (
		<Reorder.Item
			value={stage}
			dragListener={false}
			dragControls={controls}
			className='rounded-xl border border-border-subtle/80 bg-gradient-to-br from-bg-card to-bg-elevated/60 shadow-card'
		>
			{/* Stage header */}
			<div className='flex items-center gap-3 p-4'>
				<div
					onPointerDown={e => controls.start(e)}
					className='cursor-grab touch-none text-text-muted active:cursor-grabbing'
				>
					<GripVertical className='size-5' />
				</div>

				<div className='flex-1'>
					{isEditing ? (
						<input
							type='text'
							value={stage.label}
							onChange={e => onUpdateLabel(stageIndex, e.target.value)}
							onBlur={() => setIsEditing(false)}
							onKeyDown={e => e.key === 'Enter' && setIsEditing(false)}
							className='w-full rounded-xl border border-border-subtle bg-bg px-2 py-1 text-sm text-text-primary focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50'
							autoFocus
						/>
					) : (
						<button
							type='button'
							onClick={() => setIsEditing(true)}
							className='text-left font-semibold text-text-primary hover:text-brand'
						>
							{stage.label}
						</button>
					)}
				</div>

				<div className='w-32 flex-shrink-0'>
					<Select
						value={stage.difficulty}
						onValueChange={v => onUpdateDifficulty(stageIndex, v as DifficultyLevel)}
					>
						<SelectTrigger className={`h-8 rounded-full border px-2.5 py-1 text-xs font-medium focus-visible:ring-2 focus-visible:ring-brand/50 ${getDifficultyColor(stage.difficulty)}`}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{DIFFICULTY_LEVELS.map(level => (
								<SelectItem key={level} value={level}>
									{level}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<button
					type='button'
					onClick={() => onRemove(stageIndex)}
					className='rounded-xl p-1.5 text-text-muted transition-colors hover:bg-destructive/10 hover:text-destructive'
				>
					<Trash2 className='size-4' />
				</button>
			</div>

			{/* Recipes in this stage */}
			<div className='border-t border-border-subtle px-4 py-3'>
				<div className='space-y-3'>
					{stage.recipeIds.length > 0 ? (
						<div className='space-y-2'>
							{stage.recipeIds.map((recipeId, idx) => (
								<div
									key={recipeId}
									className='flex items-center justify-between rounded-xl bg-bg-elevated px-3 py-2'
								>
									<span className='text-sm text-text-primary'>
										{t('builderRecipeLabel', {
											index: idx + 1,
											id: recipeId.slice(0, 8),
										})}
									</span>
									<button
										type='button'
										onClick={() => onRemoveRecipe(stageIndex, recipeId)}
										className='rounded p-1 text-text-muted hover:bg-destructive/10 hover:text-destructive'
									>
										<X className='size-3.5' />
									</button>
								</div>
							))}
						</div>
					) : (
						<p className='text-center text-xs text-text-muted'>
							{t('builderNoRecipes')}
						</p>
					)}

					<div className='rounded-xl border border-dashed border-border-subtle bg-bg-card/50 p-3'>
						<p className='mb-2 text-xs font-medium uppercase tracking-wide text-text-muted'>
							{t('builderAddRecipeToStage')}
						</p>
						<AsyncCombobox
							fetchOptions={fetchRecipeOptions}
							onSelect={option => {
								onAddRecipe(stageIndex, option)
								setRecipeSearch('')
							}}
							value={recipeSearch}
							onChange={setRecipeSearch}
							placeholder={t('builderSearchRecipesPlaceholder')}
							emptyMessage={t('builderSearchRecipesEmpty')}
							searchingMessage={t('builderSearchRecipesLoading')}
							errorMessage={t('builderSearchRecipesError')}
							maxResults={6}
							minChars={2}
						/>
					</div>
				</div>
			</div>
		</Reorder.Item>
	)
}

export default CollectionBuilder
