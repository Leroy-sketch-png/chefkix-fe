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
} from 'lucide-react'
import { toast } from 'sonner'
import { TRANSITION_SPRING } from '@/lib/motion'
import { DifficultyStep, CollectionType } from '@/lib/types/collection'

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
	onSave,
	onCancel,
	isSaving = false,
}: CollectionBuilderProps) {
	const [name, setName] = useState(initialName)
	const [description, setDescription] = useState(initialDescription)
	const [collectionType, setCollectionType] = useState<CollectionType>(initialType)
	const [isPublic, setIsPublic] = useState(true)
	const [stages, setStages] = useState<DifficultyStep[]>(
		initialStages.length > 0
			? initialStages
			: [
					{
						label: 'Getting Started',
						difficulty: 'Beginner',
						recipeIds: initialRecipeIds,
						order: 0,
					},
				],
	)
	const [showAddStage, setShowAddStage] = useState(false)
	const [newStageName, setNewStageName] = useState('')
	const [newStageDifficulty, setNewStageDifficulty] = useState<DifficultyLevel>('Beginner')

	// Computed stats
	const totalRecipes = stages.reduce((acc, s) => acc + s.recipeIds.length, 0)
	const totalXp = totalRecipes * 50 // Estimate: 50 XP per recipe

	const handleAddStage = useCallback(() => {
		if (!newStageName.trim()) {
			toast.error('Stage name is required')
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
		toast.success('Stage added')
	}, [newStageName, newStageDifficulty, stages])

	const handleRemoveStage = useCallback((stageIndex: number) => {
		setStages(prev => {
			const updated = prev.filter((_, idx) => idx !== stageIndex)
			// Re-order remaining stages
			return updated.map((s, idx) => ({ ...s, order: idx }))
		})
	}, [])

	const handleStageReorder = useCallback((reorderedStages: DifficultyStep[]) => {
		setStages(reorderedStages.map((s, idx) => ({ ...s, order: idx })))
	}, [])

	const handleUpdateStageLabel = useCallback((stageIndex: number, label: string) => {
		setStages(prev =>
			prev.map((s, idx) => (idx === stageIndex ? { ...s, label } : s)),
		)
	}, [])

	const handleUpdateStageDifficulty = useCallback(
		(stageIndex: number, difficulty: DifficultyLevel) => {
			setStages(prev =>
				prev.map((s, idx) => (idx === stageIndex ? { ...s, difficulty } : s)),
			)
		},
		[],
	)

	const handleRemoveRecipe = useCallback((stageIndex: number, recipeId: string) => {
		setStages(prev =>
			prev.map((s, idx) =>
				idx === stageIndex
					? { ...s, recipeIds: s.recipeIds.filter(id => id !== recipeId) }
					: s,
			),
		)
	}, [])

	const handleSave = async () => {
		if (!name.trim()) {
			toast.error('Collection name is required')
			return
		}
		if (totalRecipes === 0) {
			toast.error('Add at least one recipe to your learning path')
			return
		}

		// Flatten all recipe IDs in order
		const allRecipeIds = stages.flatMap(s => s.recipeIds)

		await onSave({
			name: name.trim(),
			description: description.trim(),
			collectionType,
			recipeIds: allRecipeIds,
			difficultyProgression: stages,
			isPublic,
		})
	}

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-3'>
					<BookOpen className='size-6 text-brand' />
					<h1 className='text-xl font-bold text-text'>
						{initialName ? 'Edit Learning Path' : 'Create Learning Path'}
					</h1>
				</div>
				<button
					onClick={onCancel}
					className='rounded-lg p-2 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text'
				>
					<X className='size-5' />
				</button>
			</div>

			{/* Basic info */}
			<div className='space-y-4 rounded-xl border border-border-subtle bg-bg-card p-5 shadow-card'>
				<div>
					<label className='mb-1.5 block text-sm font-medium text-text-secondary'>
						Name
					</label>
					<input
						type='text'
						value={name}
						onChange={e => setName(e.target.value)}
						placeholder='e.g., "Master Italian Pasta"'
						maxLength={80}
						className='w-full rounded-xl border border-border-subtle bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none'
					/>
				</div>
				<div>
					<label className='mb-1.5 block text-sm font-medium text-text-secondary'>
						Description
					</label>
					<textarea
						value={description}
						onChange={e => setDescription(e.target.value)}
						placeholder='What will learners achieve by completing this path?'
						maxLength={500}
						rows={3}
						className='w-full resize-none rounded-xl border border-border-subtle bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none'
					/>
				</div>
				<label className='flex cursor-pointer items-center gap-3'>
					<input
						type='checkbox'
						checked={isPublic}
						onChange={e => setIsPublic(e.target.checked)}
						className='size-4 rounded border-border-subtle accent-brand'
					/>
					<span className='text-sm text-text'>
						Make this learning path public
					</span>
				</label>
			</div>

			{/* Stats preview */}
			<div className='grid grid-cols-3 gap-4'>
				<div className='rounded-xl border border-border-subtle bg-bg-card p-4 text-center shadow-card'>
					<ChefHat className='mx-auto mb-1.5 size-5 text-text-muted' />
					<p className='text-xl font-bold text-text'>{totalRecipes}</p>
					<p className='text-xs text-text-muted'>Recipes</p>
				</div>
				<div className='rounded-xl border border-border-subtle bg-bg-card p-4 text-center shadow-card'>
					<Clock className='mx-auto mb-1.5 size-5 text-text-muted' />
					<p className='text-xl font-bold text-text'>{stages.length}</p>
					<p className='text-xs text-text-muted'>Stages</p>
				</div>
				<div className='rounded-xl border border-border-subtle bg-bg-card p-4 text-center shadow-card'>
					<Zap className='mx-auto mb-1.5 size-5 text-xp' />
					<p className='text-xl font-bold text-xp'>{totalXp}</p>
					<p className='text-xs text-text-muted'>Total XP</p>
				</div>
			</div>

			{/* Stages (Reorderable) */}
			<div className='space-y-3'>
				<div className='flex items-center justify-between'>
					<h2 className='text-lg font-semibold text-text'>Learning Stages</h2>
					<button
						onClick={() => setShowAddStage(true)}
						className='flex items-center gap-1.5 rounded-lg bg-brand/10 px-3 py-1.5 text-sm font-medium text-brand transition-colors hover:bg-brand/20'
					>
						<Plus className='size-4' />
						Add Stage
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
							getDifficultyColor={getDifficultyColor}
						/>
					))}
				</Reorder.Group>

				{stages.length === 0 && (
					<div className='rounded-xl border border-dashed border-border-subtle py-12 text-center'>
						<p className='text-sm text-text-muted'>
							No stages yet. Add a stage to organize your recipes.
						</p>
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
						className='w-full max-w-sm rounded-2xl bg-bg-card p-6 shadow-warm'
						onClick={e => e.stopPropagation()}
					>
						<h3 className='mb-4 text-lg font-bold text-text'>Add Stage</h3>
						<div className='space-y-4'>
							<div>
								<label className='mb-1.5 block text-sm font-medium text-text-secondary'>
									Stage Name
								</label>
								<input
									type='text'
									value={newStageName}
									onChange={e => setNewStageName(e.target.value)}
									placeholder='e.g., "Knife Skills"'
									className='w-full rounded-xl border border-border-subtle bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none'
									autoFocus
								/>
							</div>
							<div>
								<label className='mb-1.5 block text-sm font-medium text-text-secondary'>
									Difficulty
								</label>
								<select
									value={newStageDifficulty}
									onChange={e =>
										setNewStageDifficulty(e.target.value as DifficultyLevel)
									}
									className='w-full rounded-xl border border-border-subtle bg-bg px-4 py-2.5 text-sm text-text focus:border-brand focus:outline-none'
								>
									{DIFFICULTY_LEVELS.map(level => (
										<option key={level} value={level}>
											{level}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className='mt-6 flex justify-end gap-3'>
							<button
								onClick={() => setShowAddStage(false)}
								className='rounded-xl px-4 py-2.5 text-sm font-medium text-text-muted hover:bg-bg-elevated'
							>
								Cancel
							</button>
							<button
								onClick={handleAddStage}
								className='rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover'
							>
								Add Stage
							</button>
						</div>
					</motion.div>
				</motion.div>
			)}

			{/* Save button */}
			<div className='flex justify-end gap-3 border-t border-border-subtle pt-6'>
				<button
					onClick={onCancel}
					className='rounded-xl px-6 py-2.5 text-sm font-medium text-text-muted hover:bg-bg-elevated'
				>
					Cancel
				</button>
				<button
					onClick={handleSave}
					disabled={isSaving || !name.trim()}
					className='flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-warm transition-colors hover:bg-brand-hover disabled:opacity-50'
				>
					<Save className='size-4' />
					{isSaving ? 'Saving...' : 'Save Learning Path'}
				</button>
			</div>
		</div>
	)
}

// ─────────────────────────────────────────────────────────────────────────────
// StageItem Sub-component
// ─────────────────────────────────────────────────────────────────────────────

interface StageItemProps {
	stage: DifficultyStep
	stageIndex: number
	onUpdateLabel: (index: number, label: string) => void
	onUpdateDifficulty: (index: number, difficulty: DifficultyLevel) => void
	onRemove: (index: number) => void
	onRemoveRecipe: (stageIndex: number, recipeId: string) => void
	getDifficultyColor: (difficulty: string) => string
}

function StageItem({
	stage,
	stageIndex,
	onUpdateLabel,
	onUpdateDifficulty,
	onRemove,
	onRemoveRecipe,
	getDifficultyColor,
}: StageItemProps) {
	const controls = useDragControls()
	const [isEditing, setIsEditing] = useState(false)

	return (
		<Reorder.Item
			value={stage}
			dragListener={false}
			dragControls={controls}
			className='rounded-xl border border-border-subtle bg-bg-card shadow-card'
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
							className='w-full rounded-lg border border-border-subtle bg-bg px-2 py-1 text-sm text-text focus:border-brand focus:outline-none'
							autoFocus
						/>
					) : (
						<button
							onClick={() => setIsEditing(true)}
							className='text-left font-semibold text-text hover:text-brand'
						>
							{stage.label}
						</button>
					)}
				</div>

				<select
					value={stage.difficulty}
					onChange={e =>
						onUpdateDifficulty(stageIndex, e.target.value as DifficultyLevel)
					}
					className={`rounded-full border px-2.5 py-1 text-xs font-medium focus:outline-none ${getDifficultyColor(stage.difficulty)}`}
				>
					{DIFFICULTY_LEVELS.map(level => (
						<option key={level} value={level}>
							{level}
						</option>
					))}
				</select>

				<button
					onClick={() => onRemove(stageIndex)}
					className='rounded-lg p-1.5 text-text-muted transition-colors hover:bg-destructive/10 hover:text-destructive'
				>
					<Trash2 className='size-4' />
				</button>
			</div>

			{/* Recipes in this stage */}
			{stage.recipeIds.length > 0 ? (
				<div className='border-t border-border-subtle px-4 py-3'>
					<div className='space-y-2'>
						{stage.recipeIds.map((recipeId, idx) => (
							<div
								key={recipeId}
								className='flex items-center justify-between rounded-lg bg-bg-elevated px-3 py-2'
							>
								<span className='text-sm text-text'>
									Recipe {idx + 1}: {recipeId.slice(0, 8)}...
								</span>
								<button
									onClick={() => onRemoveRecipe(stageIndex, recipeId)}
									className='rounded p-1 text-text-muted hover:bg-destructive/10 hover:text-destructive'
								>
									<X className='size-3.5' />
								</button>
							</div>
						))}
					</div>
				</div>
			) : (
				<div className='border-t border-border-subtle px-4 py-3'>
					<p className='text-center text-xs text-text-muted'>
						No recipes in this stage. Add recipes from the recipe browser.
					</p>
				</div>
			)}
		</Reorder.Item>
	)
}

export default CollectionBuilder
