'use client'

import { motion } from 'framer-motion'
import {
	Clock,
	Image as ImageIcon,
	Plus,
	Save,
	Send,
	Timer,
	Trash2,
	Upload,
	Users,
	X,
} from 'lucide-react'
import Image from 'next/image'
import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING, BUTTON_HOVER, BUTTON_TAP } from '@/lib/motion'

// ============================================
// TYPES
// ============================================

type Difficulty = 'easy' | 'medium' | 'hard'
type MeasurementUnit =
	| 'cup'
	| 'tbsp'
	| 'tsp'
	| 'g'
	| 'ml'
	| 'oz'
	| 'lb'
	| 'pieces'

interface Ingredient {
	id: string
	amount: string
	unit: MeasurementUnit
	name: string
}

interface RecipeStep {
	id: string
	instruction: string
	timerMinutes?: number
	imageUrl?: string
}

interface RecipeFormData {
	title: string
	description: string
	coverImageUrl?: string
	coverImageFile?: File
	prepTimeMinutes: number
	cookTimeMinutes: number
	servings: number
	difficulty: Difficulty
	category: string
	ingredients: Ingredient[]
	steps: RecipeStep[]
	tips: string
	tags: string[]
}

interface RecipeFormDetailedProps {
	initialData?: Partial<RecipeFormData>
	onSubmit?: (data: RecipeFormData) => void
	onSaveDraft?: (data: RecipeFormData) => void
	onCancel?: () => void
	className?: string
}

// ============================================
// CONSTANTS
// ============================================

const MEASUREMENT_UNITS: MeasurementUnit[] = [
	'cup',
	'tbsp',
	'tsp',
	'g',
	'ml',
	'oz',
	'lb',
	'pieces',
]

const CATEGORIES = [
	'Italian',
	'Asian',
	'Mexican',
	'American',
	'French',
	'Indian',
	'Mediterranean',
	'Dessert',
	'Healthy',
	'Quick & Easy',
]

const SUGGESTED_TAGS = [
	'vegetarian',
	'vegan',
	'gluten-free',
	'dairy-free',
	'quick',
	'healthy',
	'comfort-food',
	'spicy',
	'low-carb',
	'high-protein',
]

// ============================================
// HELPER FUNCTIONS
// ============================================

const generateId = () => Math.random().toString(36).substring(2, 9)

const createEmptyIngredient = (): Ingredient => ({
	id: generateId(),
	amount: '',
	unit: 'cup',
	name: '',
})

const createEmptyStep = (): RecipeStep => ({
	id: generateId(),
	instruction: '',
})

// ============================================
// COMPONENTS
// ============================================

// Image Upload
const ImageUpload = ({
	value,
	onChange,
	label,
}: {
	value?: string
	onChange: (file: File | null) => void
	label: string
}) => {
	const [preview, setPreview] = useState<string | undefined>(value)

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) {
			const url = URL.createObjectURL(file)
			setPreview(url)
			onChange(file)
		}
	}

	const handleRemove = () => {
		setPreview(undefined)
		onChange(null)
	}

	return (
		<div className='relative'>
			{preview ? (
				<div className='relative aspect-video w-full overflow-hidden rounded-2xl'>
					<Image src={preview} alt='Preview' fill className='object-cover' />
					<button
						type='button'
						onClick={handleRemove}
						className='absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70'
					>
						<X className='size-4' />
					</button>
				</div>
			) : (
				<label className='flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-3 border-dashed border-border bg-bg p-10 transition-colors hover:border-primary hover:bg-primary/5'>
					<div className='flex size-12 items-center justify-center rounded-xl bg-muted/30'>
						<Upload className='size-6 text-muted-foreground' />
					</div>
					<div className='text-center'>
						<p className='font-semibold text-text'>{label}</p>
						<p className='text-sm text-muted-foreground'>JPG, PNG up to 10MB</p>
					</div>
					<input
						type='file'
						accept='image/*'
						onChange={handleChange}
						className='hidden'
					/>
				</label>
			)}
		</div>
	)
}

// Ingredient Row
const IngredientRow = ({
	ingredient,
	onChange,
	onRemove,
}: {
	ingredient: Ingredient
	onChange: (updated: Ingredient) => void
	onRemove: () => void
}) => (
	<div className='group flex items-center gap-3'>
		<div className='flex flex-1 items-center gap-3'>
			<input
				type='text'
				value={ingredient.amount}
				onChange={e => onChange({ ...ingredient, amount: e.target.value })}
				placeholder='Amount'
				className='w-20 rounded-xl border-2 border-border bg-bg px-3 py-2.5 text-sm text-text focus:border-primary focus:outline-none'
			/>
			<select
				value={ingredient.unit}
				onChange={e =>
					onChange({ ...ingredient, unit: e.target.value as MeasurementUnit })
				}
				className='w-24 rounded-xl border-2 border-border bg-bg px-3 py-2.5 text-sm text-text focus:border-primary focus:outline-none'
			>
				{MEASUREMENT_UNITS.map(unit => (
					<option key={unit} value={unit}>
						{unit}
					</option>
				))}
			</select>
			<input
				type='text'
				value={ingredient.name}
				onChange={e => onChange({ ...ingredient, name: e.target.value })}
				placeholder='Ingredient name'
				className='flex-1 rounded-xl border-2 border-border bg-bg px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none'
			/>
		</div>
		<button
			type='button'
			onClick={onRemove}
			className='flex size-9 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500'
		>
			<Trash2 className='size-4' />
		</button>
	</div>
)

// Step Row
const StepRow = ({
	step,
	index,
	onChange,
	onRemove,
}: {
	step: RecipeStep
	index: number
	onChange: (updated: RecipeStep) => void
	onRemove: () => void
}) => {
	const [showTimerInput, setShowTimerInput] = useState(!!step.timerMinutes)

	return (
		<div className='group flex gap-4'>
			<div className='flex size-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-xp text-sm font-bold text-white'>
				{index + 1}
			</div>
			<div className='flex-1 space-y-3'>
				<textarea
					value={step.instruction}
					onChange={e => onChange({ ...step, instruction: e.target.value })}
					placeholder='Describe this cooking step in detail...'
					rows={3}
					className='w-full resize-y rounded-xl border-2 border-border bg-bg px-4 py-3 text-sm text-text focus:border-primary focus:outline-none'
				/>
				<div className='flex flex-wrap items-center gap-2'>
					<button
						type='button'
						className='flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary'
					>
						<ImageIcon className='size-3.5' />
						Add Photo
					</button>
					{showTimerInput ? (
						<div className='flex items-center gap-2'>
							<div className='flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5'>
								<Timer className='size-3.5 text-primary' />
								<input
									type='number'
									value={step.timerMinutes || ''}
									onChange={e =>
										onChange({
											...step,
											timerMinutes: parseInt(e.target.value) || undefined,
										})
									}
									placeholder='0'
									className='w-12 bg-transparent text-xs font-semibold text-primary focus:outline-none'
									min={0}
								/>
								<span className='text-xs font-semibold text-primary'>min</span>
							</div>
							<button
								type='button'
								onClick={() => {
									setShowTimerInput(false)
									onChange({ ...step, timerMinutes: undefined })
								}}
								className='text-muted-foreground hover:text-red-500'
							>
								<X className='size-4' />
							</button>
						</div>
					) : (
						<button
							type='button'
							onClick={() => setShowTimerInput(true)}
							className='flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary'
						>
							<Timer className='size-3.5' />
							Add Timer
						</button>
					)}
				</div>
			</div>
			<button
				type='button'
				onClick={onRemove}
				className='flex size-9 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500'
			>
				<Trash2 className='size-4' />
			</button>
		</div>
	)
}

// Tag Input
const TagInput = ({
	tags,
	onChange,
}: {
	tags: string[]
	onChange: (tags: string[]) => void
}) => {
	const [input, setInput] = useState('')

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && input.trim()) {
			e.preventDefault()
			if (!tags.includes(input.trim().toLowerCase())) {
				onChange([...tags, input.trim().toLowerCase()])
			}
			setInput('')
		}
	}

	const removeTag = (tag: string) => {
		onChange(tags.filter(t => t !== tag))
	}

	const addSuggestedTag = (tag: string) => {
		if (!tags.includes(tag)) {
			onChange([...tags, tag])
		}
	}

	return (
		<div className='space-y-3'>
			<div className='flex flex-wrap items-center gap-2 rounded-xl border-2 border-border bg-bg p-3 focus-within:border-primary'>
				{tags.map(tag => (
					<span
						key={tag}
						className='flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white'
					>
						{tag}
						<button
							type='button'
							onClick={() => removeTag(tag)}
							className='flex size-4 items-center justify-center rounded-full transition-colors hover:bg-white/20'
						>
							×
						</button>
					</span>
				))}
				<input
					type='text'
					value={input}
					onChange={e => setInput(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={tags.length === 0 ? 'Type and press Enter' : ''}
					className='min-w-search flex-1 bg-transparent py-1.5 text-sm text-text focus:outline-none'
				/>
			</div>
			<div className='flex flex-wrap gap-2'>
				{SUGGESTED_TAGS.filter(t => !tags.includes(t))
					.slice(0, 6)
					.map(tag => (
						<button
							key={tag}
							type='button'
							onClick={() => addSuggestedTag(tag)}
							className='rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary'
						>
							{tag}
						</button>
					))}
			</div>
		</div>
	)
}

// ============================================
// MAIN COMPONENT
// ============================================

export const RecipeFormDetailed = ({
	initialData,
	onSubmit,
	onSaveDraft,
	onCancel,
	className,
}: RecipeFormDetailedProps) => {
	const [formData, setFormData] = useState<RecipeFormData>({
		title: initialData?.title || '',
		description: initialData?.description || '',
		coverImageUrl: initialData?.coverImageUrl,
		prepTimeMinutes: initialData?.prepTimeMinutes || 0,
		cookTimeMinutes: initialData?.cookTimeMinutes || 0,
		servings: initialData?.servings || 4,
		difficulty: initialData?.difficulty || 'medium',
		category: initialData?.category || '',
		ingredients: initialData?.ingredients || [createEmptyIngredient()],
		steps: initialData?.steps || [createEmptyStep()],
		tips: initialData?.tips || '',
		tags: initialData?.tags || [],
	})

	const updateField = <K extends keyof RecipeFormData>(
		field: K,
		value: RecipeFormData[K],
	) => {
		setFormData(prev => ({ ...prev, [field]: value }))
	}

	const addIngredient = () => {
		setFormData(prev => ({
			...prev,
			ingredients: [...prev.ingredients, createEmptyIngredient()],
		}))
	}

	const updateIngredient = (id: string, updated: Ingredient) => {
		setFormData(prev => ({
			...prev,
			ingredients: prev.ingredients.map(i => (i.id === id ? updated : i)),
		}))
	}

	const removeIngredient = (id: string) => {
		setFormData(prev => ({
			...prev,
			ingredients: prev.ingredients.filter(i => i.id !== id),
		}))
	}

	const addStep = () => {
		setFormData(prev => ({
			...prev,
			steps: [...prev.steps, createEmptyStep()],
		}))
	}

	const updateStep = (id: string, updated: RecipeStep) => {
		setFormData(prev => ({
			...prev,
			steps: prev.steps.map(s => (s.id === id ? updated : s)),
		}))
	}

	const removeStep = (id: string) => {
		setFormData(prev => ({
			...prev,
			steps: prev.steps.filter(s => s.id !== id),
		}))
	}

	const handleCoverImage = (file: File | null) => {
		if (file) {
			updateField('coverImageFile', file)
			updateField('coverImageUrl', URL.createObjectURL(file))
		} else {
			updateField('coverImageFile', undefined)
			updateField('coverImageUrl', undefined)
		}
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		onSubmit?.(formData)
	}

	const handleSaveDraft = () => {
		onSaveDraft?.(formData)
	}

	return (
		<div className={cn('mx-auto max-w-container-form p-6 md:p-10', className)}>
			{/* Header */}
			<div className='mb-10'>
				<h1 className='text-3xl font-extrabold text-text md:text-4xl'>
					Create Your Recipe
				</h1>
				<p className='mt-2 text-muted-foreground'>
					Share your culinary creation with the community
				</p>
			</div>

			<form
				onSubmit={handleSubmit}
				className='rounded-2xl border border-border bg-panel-bg p-6 md:p-10'
			>
				{/* Basic Info Section */}
				<section className='mb-12 border-b-2 border-border pb-12'>
					<h2 className='mb-6 text-xl font-bold text-text'>
						Basic Information
					</h2>

					{/* Title */}
					<div className='mb-6'>
						<label className='mb-2 block text-sm font-semibold text-text'>
							Recipe Title <span className='text-red-500'>*</span>
						</label>
						<input
							type='text'
							value={formData.title}
							onChange={e => updateField('title', e.target.value)}
							placeholder='e.g., Classic Italian Carbonara'
							maxLength={100}
							className='w-full rounded-xl border-2 border-border bg-bg px-4 py-3 text-sm text-text focus:border-primary focus:outline-none'
						/>
						<p className='mt-1.5 text-sm text-muted-foreground'>
							Give your recipe a catchy, descriptive name
						</p>
					</div>

					{/* Description */}
					<div className='mb-6'>
						<label className='mb-2 block text-sm font-semibold text-text'>
							Description <span className='text-red-500'>*</span>
						</label>
						<textarea
							value={formData.description}
							onChange={e => updateField('description', e.target.value)}
							placeholder='Tell us about your recipe. What makes it special?'
							rows={4}
							maxLength={500}
							className='w-full resize-y rounded-xl border-2 border-border bg-bg px-4 py-3 text-sm text-text focus:border-primary focus:outline-none'
						/>
						<p className='mt-1.5 text-sm text-muted-foreground'>
							{formData.description.length} / 500 characters
						</p>
					</div>

					{/* Cover Image */}
					<div className='mb-6'>
						<label className='mb-2 block text-sm font-semibold text-text'>
							Cover Image <span className='text-red-500'>*</span>
						</label>
						<ImageUpload
							value={formData.coverImageUrl}
							onChange={handleCoverImage}
							label='Drop your image here or click to browse'
						/>
					</div>

					{/* Time & Servings Grid */}
					<div className='mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3'>
						<div>
							<label className='mb-2 block text-sm font-semibold text-text'>
								Prep Time
							</label>
							<div className='relative'>
								<input
									type='number'
									value={formData.prepTimeMinutes || ''}
									onChange={e =>
										updateField(
											'prepTimeMinutes',
											parseInt(e.target.value) || 0,
										)
									}
									placeholder='15'
									min={0}
									className='w-full rounded-xl border-2 border-border bg-bg py-3 pl-4 pr-12 text-sm text-text focus:border-primary focus:outline-none'
								/>
								<span className='pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground'>
									min
								</span>
							</div>
						</div>
						<div>
							<label className='mb-2 block text-sm font-semibold text-text'>
								Cook Time
							</label>
							<div className='relative'>
								<input
									type='number'
									value={formData.cookTimeMinutes || ''}
									onChange={e =>
										updateField(
											'cookTimeMinutes',
											parseInt(e.target.value) || 0,
										)
									}
									placeholder='30'
									min={0}
									className='w-full rounded-xl border-2 border-border bg-bg py-3 pl-4 pr-12 text-sm text-text focus:border-primary focus:outline-none'
								/>
								<span className='pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground'>
									min
								</span>
							</div>
						</div>
						<div>
							<label className='mb-2 block text-sm font-semibold text-text'>
								Servings
							</label>
							<input
								type='number'
								value={formData.servings || ''}
								onChange={e =>
									updateField('servings', parseInt(e.target.value) || 1)
								}
								placeholder='4'
								min={1}
								className='w-full rounded-xl border-2 border-border bg-bg px-4 py-3 text-sm text-text focus:border-primary focus:outline-none'
							/>
						</div>
					</div>

					{/* Difficulty & Category */}
					<div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
						<div>
							<label className='mb-2 block text-sm font-semibold text-text'>
								Difficulty
							</label>
							<select
								value={formData.difficulty}
								onChange={e =>
									updateField('difficulty', e.target.value as Difficulty)
								}
								className='w-full rounded-xl border-2 border-border bg-bg px-4 py-3 text-sm text-text focus:border-primary focus:outline-none'
							>
								<option value='easy'>Easy</option>
								<option value='medium'>Medium</option>
								<option value='hard'>Hard</option>
							</select>
						</div>
						<div>
							<label className='mb-2 block text-sm font-semibold text-text'>
								Category
							</label>
							<select
								value={formData.category}
								onChange={e => updateField('category', e.target.value)}
								className='w-full rounded-xl border-2 border-border bg-bg px-4 py-3 text-sm text-text focus:border-primary focus:outline-none'
							>
								<option value=''>Select category</option>
								{CATEGORIES.map(cat => (
									<option key={cat} value={cat}>
										{cat}
									</option>
								))}
							</select>
						</div>
					</div>
				</section>

				{/* Ingredients Section */}
				<section className='mb-12 border-b-2 border-border pb-12'>
					<div className='mb-6 flex items-center justify-between'>
						<h2 className='text-xl font-bold text-text'>Ingredients</h2>
						<button
							type='button'
							onClick={addIngredient}
							className='flex items-center gap-1.5 rounded-xl border-2 border-dashed border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary'
						>
							<Plus className='size-4' />
							Add Ingredient
						</button>
					</div>
					<div className='space-y-4'>
						{formData.ingredients.map(ing => (
							<IngredientRow
								key={ing.id}
								ingredient={ing}
								onChange={updated => updateIngredient(ing.id, updated)}
								onRemove={() => removeIngredient(ing.id)}
							/>
						))}
					</div>
				</section>

				{/* Instructions Section */}
				<section className='mb-12 border-b-2 border-border pb-12'>
					<div className='mb-6 flex items-center justify-between'>
						<h2 className='text-xl font-bold text-text'>Instructions</h2>
						<button
							type='button'
							onClick={addStep}
							className='flex items-center gap-1.5 rounded-xl border-2 border-dashed border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary'
						>
							<Plus className='size-4' />
							Add Step
						</button>
					</div>
					<div className='space-y-5'>
						{formData.steps.map((step, i) => (
							<StepRow
								key={step.id}
								step={step}
								index={i}
								onChange={updated => updateStep(step.id, updated)}
								onRemove={() => removeStep(step.id)}
							/>
						))}
					</div>
				</section>

				{/* Tips Section */}
				<section className='mb-12 border-b-2 border-border pb-12'>
					<h2 className='mb-6 text-xl font-bold text-text'>
						Tips & Notes (Optional)
					</h2>
					<textarea
						value={formData.tips}
						onChange={e => updateField('tips', e.target.value)}
						placeholder='Share any helpful tips, substitutions, or notes about your recipe...'
						rows={4}
						className='w-full resize-y rounded-xl border-2 border-border bg-bg px-4 py-3 text-sm text-text focus:border-primary focus:outline-none'
					/>
				</section>

				{/* Tags Section */}
				<section className='mb-8'>
					<h2 className='mb-6 text-xl font-bold text-text'>Tags</h2>
					<p className='mb-3 text-sm text-muted-foreground'>
						Add tags to help people discover your recipe
					</p>
					<TagInput
						tags={formData.tags}
						onChange={tags => updateField('tags', tags)}
					/>
				</section>

				{/* Form Actions */}
				<div className='flex flex-col items-stretch gap-3 border-t-2 border-border pt-8 sm:flex-row sm:items-center sm:justify-between'>
					<motion.button
						type='button'
						onClick={handleSaveDraft}
						whileHover={BUTTON_HOVER}
						whileTap={BUTTON_TAP}
						className='flex items-center justify-center gap-2 rounded-xl border border-border bg-bg px-5 py-3 font-semibold text-muted-foreground'
					>
						<Save className='size-4' />
						Save Draft
					</motion.button>
					<div className='flex gap-3'>
						{onCancel && (
							<button
								type='button'
								onClick={onCancel}
								className='flex-1 rounded-xl border border-border bg-bg px-5 py-3 font-semibold text-muted-foreground sm:flex-none'
							>
								Cancel
							</button>
						)}
						<motion.button
							type='submit'
							whileHover={BUTTON_HOVER}
							whileTap={BUTTON_TAP}
							className='flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-brand px-6 py-3 font-bold text-white shadow-lg sm:flex-none'
						>
							<Send className='size-4' />
							Publish Recipe
						</motion.button>
					</div>
				</div>
			</form>
		</div>
	)
}

// ============================================
// EXPORTS
// ============================================

export type {
	RecipeFormData,
	RecipeFormDetailedProps,
	Ingredient as RecipeIngredient,
	RecipeStep as RecipeFormStep,
	Difficulty,
	MeasurementUnit,
}
