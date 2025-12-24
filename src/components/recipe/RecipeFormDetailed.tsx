'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Clock,
	Cloud,
	Image as ImageIcon,
	Loader2,
	Lock,
	Plus,
	Save,
	Send,
	Signal,
	Timer,
	Trash2,
	Upload,
	Users,
	X,
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING, BUTTON_HOVER, BUTTON_TAP } from '@/lib/motion'
import type { Difficulty } from '@/lib/types/gamification'

// ============================================
// TYPES
// ============================================

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
	timerSeconds?: number // Total timer in seconds (source of truth)
	imageUrl?: string
	imageFile?: File
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
	isSubmitting?: boolean
	isSaving?: boolean
	/** Custom label for the submit button (default: 'Review & Calculate XP') */
	submitLabel?: string
	/** Custom label shown when submitting (default: 'Processing...') */
	submittingLabel?: string
	/** Custom label for save draft button (default: 'Save to Cloud') */
	saveDraftLabel?: string
	/** Custom label shown when saving (default: 'Saving...') */
	savingLabel?: string
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

// Platform detection for keyboard shortcuts
const isMac =
	typeof navigator !== 'undefined' && navigator.platform.includes('Mac')
const modKey = isMac ? '⌘' : 'Ctrl'

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
				className='w-24 rounded-xl border-2 border-border bg-bg-card px-3 py-2.5 text-sm text-text focus:border-primary focus:outline-none'
			>
				{MEASUREMENT_UNITS.map(unit => (
					<option key={unit} value={unit} className='bg-bg-card text-text'>
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
	const [showTimerInput, setShowTimerInput] = useState(!!step.timerSeconds)
	const fileInputRef = React.useRef<HTMLInputElement>(null)

	// Convert timerSeconds to H:M:S for display
	const totalSeconds = step.timerSeconds || 0
	const hours = Math.floor(totalSeconds / 3600)
	const minutes = Math.floor((totalSeconds % 3600) / 60)
	const seconds = totalSeconds % 60

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) {
			const url = URL.createObjectURL(file)
			onChange({ ...step, imageUrl: url, imageFile: file })
		}
	}

	const handleRemoveImage = () => {
		onChange({ ...step, imageUrl: undefined, imageFile: undefined })
		if (fileInputRef.current) {
			fileInputRef.current.value = ''
		}
	}

	return (
		<div className='group flex gap-4'>
			<div className='flex size-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-hero text-sm font-bold text-white shadow-md'>
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
				{/* Step Image Preview */}
				{step.imageUrl && (
					<div className='relative aspect-video w-full max-w-xs overflow-hidden rounded-xl border-2 border-border'>
						<Image
							src={step.imageUrl}
							alt={`Step ${index + 1}`}
							fill
							className='object-cover'
						/>
						<button
							type='button'
							onClick={handleRemoveImage}
							className='absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70'
						>
							<X className='size-4' />
						</button>
					</div>
				)}
				<div className='flex flex-wrap items-center gap-2'>
					<input
						ref={fileInputRef}
						type='file'
						accept='image/*'
						onChange={handleImageChange}
						className='hidden'
					/>
					<button
						type='button'
						onClick={() => fileInputRef.current?.click()}
						className='flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary'
					>
						<ImageIcon className='size-3.5' />
						{step.imageUrl ? 'Change Photo' : 'Add Photo'}
					</button>
					{showTimerInput ? (
						<div className='flex items-center gap-2'>
							<div className='flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5'>
								<Timer className='size-3.5 text-primary' />
								{/* Hours */}
								<input
									type='number'
									value={hours || ''}
									onChange={e => {
										const h = parseInt(e.target.value) || 0
										const newTotal = h * 3600 + minutes * 60 + seconds
										onChange({ ...step, timerSeconds: newTotal || undefined })
									}}
									placeholder='0'
									className='w-8 bg-transparent text-center text-xs font-semibold text-primary focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
									min={0}
									max={23}
								/>
								<span className='text-xs font-semibold text-primary'>h</span>
								{/* Minutes */}
								<input
									type='number'
									value={minutes || ''}
									onChange={e => {
										const m = parseInt(e.target.value) || 0
										const newTotal = hours * 3600 + m * 60 + seconds
										onChange({ ...step, timerSeconds: newTotal || undefined })
									}}
									placeholder='0'
									className='w-8 bg-transparent text-center text-xs font-semibold text-primary focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
									min={0}
									max={59}
								/>
								<span className='text-xs font-semibold text-primary'>m</span>
								{/* Seconds */}
								<input
									type='number'
									value={seconds || ''}
									onChange={e => {
										const s = parseInt(e.target.value) || 0
										const newTotal = hours * 3600 + minutes * 60 + s
										onChange({ ...step, timerSeconds: newTotal || undefined })
									}}
									placeholder='0'
									className='w-8 bg-transparent text-center text-xs font-semibold text-primary focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
									min={0}
									max={59}
								/>
								<span className='text-xs font-semibold text-primary'>s</span>
							</div>
							<button
								type='button'
								onClick={() => {
									setShowTimerInput(false)
									onChange({ ...step, timerSeconds: undefined })
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
	isSubmitting = false,
	isSaving = false,
	submitLabel = 'Review & Calculate XP',
	submittingLabel = 'Processing...',
	saveDraftLabel = 'Save to Cloud',
	savingLabel = 'Saving...',
	className,
}: RecipeFormDetailedProps) => {
	const [formData, setFormData] = useState<RecipeFormData>({
		title: initialData?.title || '',
		description: initialData?.description || '',
		coverImageUrl: initialData?.coverImageUrl,
		prepTimeMinutes: initialData?.prepTimeMinutes || 0,
		cookTimeMinutes: initialData?.cookTimeMinutes || 0,
		servings: initialData?.servings || 4,
		difficulty: initialData?.difficulty || 'Intermediate',
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

	// ============================================
	// VALIDATION
	// ============================================

	interface ValidationErrors {
		title?: string
		description?: string
		coverImage?: string
		ingredients?: string
		steps?: string
		category?: string
	}

	const [errors, setErrors] = useState<ValidationErrors>({})
	const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)

	const validateForm = (): boolean => {
		const newErrors: ValidationErrors = {}

		// Title is required (min 3 chars)
		if (!formData.title.trim()) {
			newErrors.title = 'Recipe title is required'
		} else if (formData.title.trim().length < 3) {
			newErrors.title = 'Title must be at least 3 characters'
		}

		// Description is required (min 10 chars)
		if (!formData.description.trim()) {
			newErrors.description = 'Description is required'
		} else if (formData.description.trim().length < 10) {
			newErrors.description = 'Description must be at least 10 characters'
		}

		// Cover image is required
		if (!formData.coverImageUrl && !formData.coverImageFile) {
			newErrors.coverImage = 'Cover image is required'
		}

		// At least one valid ingredient
		const validIngredients = formData.ingredients.filter(
			i => i.name.trim() && i.amount.trim(),
		)
		if (validIngredients.length === 0) {
			newErrors.ingredients =
				'At least one ingredient with name and amount is required'
		}

		// At least one step with instruction
		const validSteps = formData.steps.filter(s => s.instruction.trim())
		if (validSteps.length === 0) {
			newErrors.steps = 'At least one step with instructions is required'
		}

		// Category is recommended but we'll make it required for discoverability
		if (!formData.category) {
			newErrors.category = 'Please select a category'
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		setHasAttemptedSubmit(true)

		if (!validateForm()) {
			// Scroll to first error
			const firstErrorField = document.querySelector('[data-error="true"]')
			firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' })
			return
		}

		onSubmit?.(formData)
	}

	const handleSaveDraft = () => {
		onSaveDraft?.(formData)
	}

	// Clear individual error when field is updated
	const updateFieldWithClearError = <K extends keyof RecipeFormData>(
		field: K,
		value: RecipeFormData[K],
	) => {
		updateField(field, value)
		if (hasAttemptedSubmit) {
			// Clear related error
			if (field === 'title') setErrors(prev => ({ ...prev, title: undefined }))
			if (field === 'description')
				setErrors(prev => ({ ...prev, description: undefined }))
			if (field === 'coverImageUrl' || field === 'coverImageFile')
				setErrors(prev => ({ ...prev, coverImage: undefined }))
			if (field === 'category')
				setErrors(prev => ({ ...prev, category: undefined }))
		}
	}

	// Keyboard shortcuts: Ctrl/⌘+S = save draft, Ctrl/⌘+Enter = publish
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const isMod = isMac ? e.metaKey : e.ctrlKey

			// Ctrl/⌘ + S = Save Draft
			if (isMod && e.key === 's') {
				e.preventDefault()
				handleSaveDraft()
			}

			// Ctrl/⌘ + Enter = Submit/Publish
			if (isMod && e.key === 'Enter') {
				e.preventDefault()
				setHasAttemptedSubmit(true)
				if (validateForm()) {
					onSubmit?.(formData)
				} else {
					const firstErrorField = document.querySelector('[data-error="true"]')
					firstErrorField?.scrollIntoView({
						behavior: 'smooth',
						block: 'center',
					})
				}
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [formData, onSubmit])

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
					<div className='mb-6' data-error={!!errors.title}>
						<label className='mb-2 block text-sm font-semibold text-text'>
							Recipe Title <span className='text-red-500'>*</span>
						</label>
						<input
							type='text'
							value={formData.title}
							onChange={e => updateFieldWithClearError('title', e.target.value)}
							placeholder='e.g., Classic Italian Carbonara'
							maxLength={100}
							className={cn(
								'w-full rounded-xl border-2 bg-bg px-4 py-3 text-sm text-text focus:outline-none',
								errors.title
									? 'border-red-500 focus:border-red-500'
									: 'border-border focus:border-primary',
							)}
						/>
						{errors.title ? (
							<p className='mt-1.5 text-sm text-red-500'>{errors.title}</p>
						) : (
							<p className='mt-1.5 text-sm text-muted-foreground'>
								Give your recipe a catchy, descriptive name
							</p>
						)}
					</div>

					{/* Description */}
					<div className='mb-6' data-error={!!errors.description}>
						<label className='mb-2 block text-sm font-semibold text-text'>
							Description <span className='text-red-500'>*</span>
						</label>
						<textarea
							value={formData.description}
							onChange={e =>
								updateFieldWithClearError('description', e.target.value)
							}
							placeholder='Tell us about your recipe. What makes it special?'
							rows={4}
							maxLength={500}
							className={cn(
								'w-full resize-y rounded-xl border-2 bg-bg px-4 py-3 text-sm text-text focus:outline-none',
								errors.description
									? 'border-red-500 focus:border-red-500'
									: 'border-border focus:border-primary',
							)}
						/>
						{errors.description ? (
							<p className='mt-1.5 text-sm text-red-500'>
								{errors.description}
							</p>
						) : (
							<p className='mt-1.5 text-sm text-muted-foreground'>
								{formData.description.length} / 500 characters
							</p>
						)}
					</div>

					{/* Cover Image */}
					<div className='mb-6' data-error={!!errors.coverImage}>
						<label className='mb-2 block text-sm font-semibold text-text'>
							Cover Image <span className='text-red-500'>*</span>
						</label>
						<div
							className={cn(
								'rounded-2xl',
								errors.coverImage && 'ring-2 ring-red-500',
							)}
						>
							<ImageUpload
								value={formData.coverImageUrl}
								onChange={file => {
									handleCoverImage(file)
									if (hasAttemptedSubmit)
										setErrors(prev => ({ ...prev, coverImage: undefined }))
								}}
								label='Drop your image here or click to browse'
							/>
						</div>
						{errors.coverImage && (
							<p className='mt-1.5 text-sm text-red-500'>{errors.coverImage}</p>
						)}
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
									className='w-full rounded-xl border-2 border-border bg-bg py-3 pl-4 pr-12 text-sm text-text focus:border-primary focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
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
									className='w-full rounded-xl border-2 border-border bg-bg py-3 pl-4 pr-12 text-sm text-text focus:border-primary focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
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
								className='w-full rounded-xl border-2 border-border bg-bg px-4 py-3 text-sm text-text focus:border-primary focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
							/>
						</div>
					</div>

					{/* Difficulty & Category */}
					<div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
						<div>
							<label className='mb-2 block text-sm font-semibold text-text'>
								Difficulty
							</label>
							<div
								className='flex items-center gap-2 rounded-xl border-2 border-border bg-bg-card px-4 py-3 cursor-help'
								title='Difficulty will be determined by AI based on techniques and complexity. This ensures fair XP calculation.'
							>
								<Signal className='size-4 text-muted-foreground' />
								<span className='flex-1 text-sm text-muted-foreground'>
									Determined by AI
								</span>
								<Lock className='size-4 text-muted-foreground/50' />
							</div>
							<p className='mt-1.5 text-xs text-muted-foreground'>
								AI analyzes your recipe to set fair difficulty
							</p>
						</div>
						<div data-error={!!errors.category}>
							<label className='mb-2 block text-sm font-semibold text-text'>
								Category <span className='text-red-500'>*</span>
							</label>
							<select
								value={formData.category}
								onChange={e =>
									updateFieldWithClearError('category', e.target.value)
								}
								className={cn(
									'w-full rounded-xl border-2 bg-bg-card px-4 py-3 text-sm text-text focus:outline-none',
									errors.category
										? 'border-red-500 focus:border-red-500'
										: 'border-border focus:border-primary',
								)}
							>
								<option value='' className='bg-bg-card text-text'>
									Select category
								</option>
								{CATEGORIES.map(cat => (
									<option
										key={cat}
										value={cat}
										className='bg-bg-card text-text'
									>
										{cat}
									</option>
								))}
							</select>
							{errors.category && (
								<p className='mt-1.5 text-sm text-red-500'>{errors.category}</p>
							)}
						</div>
					</div>
				</section>

				{/* Ingredients Section */}
				<section
					className='mb-12 border-b-2 border-border pb-12'
					data-error={!!errors.ingredients}
				>
					<div className='mb-6 flex items-center justify-between'>
						<div>
							<h2 className='text-xl font-bold text-text'>Ingredients</h2>
							{errors.ingredients && (
								<p className='mt-1 text-sm text-red-500'>
									{errors.ingredients}
								</p>
							)}
						</div>
						<motion.button
							type='button'
							onClick={() => {
								addIngredient()
								if (hasAttemptedSubmit)
									setErrors(prev => ({ ...prev, ingredients: undefined }))
							}}
							whileHover={BUTTON_HOVER}
							whileTap={BUTTON_TAP}
							className='flex items-center gap-1.5 rounded-xl border-2 border-dashed border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary'
						>
							<Plus className='size-4' />
							Add Ingredient
						</motion.button>
					</div>
					<div className='space-y-4'>
						<AnimatePresence mode='popLayout'>
							{formData.ingredients.map(ing => (
								<motion.div
									key={ing.id}
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									transition={{ duration: 0.2 }}
								>
									<IngredientRow
										ingredient={ing}
										onChange={updated => {
											updateIngredient(ing.id, updated)
											if (hasAttemptedSubmit)
												setErrors(prev => ({ ...prev, ingredients: undefined }))
										}}
										onRemove={() => removeIngredient(ing.id)}
									/>
								</motion.div>
							))}
						</AnimatePresence>
					</div>
				</section>

				{/* Instructions Section */}
				<section
					className='mb-12 border-b-2 border-border pb-12'
					data-error={!!errors.steps}
				>
					<div className='mb-6 flex items-center justify-between'>
						<div>
							<h2 className='text-xl font-bold text-text'>Instructions</h2>
							{errors.steps && (
								<p className='mt-1 text-sm text-red-500'>{errors.steps}</p>
							)}
						</div>
						<motion.button
							type='button'
							onClick={() => {
								addStep()
								if (hasAttemptedSubmit)
									setErrors(prev => ({ ...prev, steps: undefined }))
							}}
							whileHover={BUTTON_HOVER}
							whileTap={BUTTON_TAP}
							className='flex items-center gap-1.5 rounded-xl border-2 border-dashed border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary'
						>
							<Plus className='size-4' />
							Add Step
						</motion.button>
					</div>
					<div className='space-y-5'>
						<AnimatePresence mode='popLayout'>
							{formData.steps.map((step, i) => (
								<motion.div
									key={step.id}
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									transition={{ duration: 0.2 }}
								>
									<StepRow
										step={step}
										index={i}
										onChange={updated => {
											updateStep(step.id, updated)
											if (hasAttemptedSubmit)
												setErrors(prev => ({ ...prev, steps: undefined }))
										}}
										onRemove={() => removeStep(step.id)}
									/>
								</motion.div>
							))}
						</AnimatePresence>
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
						disabled={isSaving}
						whileHover={isSaving ? undefined : BUTTON_HOVER}
						whileTap={isSaving ? undefined : BUTTON_TAP}
						className='flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-5 py-3 font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-50'
					>
						{isSaving ? (
							<Loader2 className='size-4 animate-spin' />
						) : (
							<Cloud className='size-4' />
						)}
						{isSaving ? savingLabel : saveDraftLabel}
						{!isSaving && (
							<kbd className='ml-1 hidden rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary/70 sm:inline-block'>
								{modKey}+S
							</kbd>
						)}
					</motion.button>
					<div className='flex gap-3'>
						{onCancel && (
							<button
								type='button'
								onClick={onCancel}
								disabled={isSubmitting || isSaving}
								className='flex-1 rounded-xl border border-border bg-bg px-5 py-3 font-semibold text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none'
							>
								Cancel
							</button>
						)}
						<motion.button
							type='submit'
							disabled={isSubmitting || isSaving}
							whileHover={isSubmitting ? undefined : BUTTON_HOVER}
							whileTap={isSubmitting ? undefined : BUTTON_TAP}
							className='flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-hero px-6 py-3 font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-70 sm:flex-none'
						>
							{isSubmitting ? (
								<Loader2 className='size-4 animate-spin' />
							) : (
								<Send className='size-4' />
							)}
							{isSubmitting ? submittingLabel : submitLabel}
							{!isSubmitting && (
								<kbd className='ml-1 hidden rounded bg-white/20 px-1.5 py-0.5 text-xs font-medium text-white/80 sm:inline-block'>
									{modKey}+↵
								</kbd>
							)}
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
