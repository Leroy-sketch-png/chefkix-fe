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
	Rocket,
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
import {
	AsyncCombobox,
	AsyncComboboxOption,
} from '@/components/ui/async-combobox'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { autocompleteSearch } from '@/services/search'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	DURATION_S,
} from '@/lib/motion'
import { useCookingStore } from '@/store/cookingStore'
import { useUiStore } from '@/store/uiStore'
import { formDataToRecipe } from '@/lib/recipeTransforms'
import type { Difficulty } from '@/lib/types/gamification'
import { calibrateDifficulty } from '@/services/ml'
import { useTranslations } from 'next-intl'

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
	videoUrl?: string
	videoThumbnailUrl?: string
	videoDurationSec?: number
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

const CATEGORY_KEYS: { value: string; labelKey: string }[] = [
	{ value: 'Italian', labelKey: 'catItalian' },
	{ value: 'Asian', labelKey: 'catAsian' },
	{ value: 'Mexican', labelKey: 'catMexican' },
	{ value: 'American', labelKey: 'catAmerican' },
	{ value: 'French', labelKey: 'catFrench' },
	{ value: 'Indian', labelKey: 'catIndian' },
	{ value: 'Mediterranean', labelKey: 'catMediterranean' },
	{ value: 'Dessert', labelKey: 'catDessert' },
	{ value: 'Healthy', labelKey: 'catHealthy' },
	{ value: 'Quick & Easy', labelKey: 'catQuickEasy' },
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
	const t = useTranslations('recipe')
	const [preview, setPreview] = useState<string | undefined>(value)
	const blobUrlRef = React.useRef<string | null>(null)

	// Sync preview with value prop (for edit mode with existing server URL)
	React.useEffect(() => {
		// Only update if value is a server URL (not blob), and no local blob exists
		if (value && !value.startsWith('blob:') && !blobUrlRef.current) {
			setPreview(value)
		}
	}, [value])

	// Cleanup blob URL on unmount
	React.useEffect(() => {
		return () => {
			if (blobUrlRef.current) {
				URL.revokeObjectURL(blobUrlRef.current)
			}
		}
	}, [])

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) {
			// Revoke previous blob URL if exists
			if (blobUrlRef.current) {
				URL.revokeObjectURL(blobUrlRef.current)
			}
			const url = URL.createObjectURL(file)
			blobUrlRef.current = url
			setPreview(url)
			onChange(file)
		}
	}

	const handleRemove = () => {
		if (blobUrlRef.current) {
			URL.revokeObjectURL(blobUrlRef.current)
			blobUrlRef.current = null
		}
		setPreview(undefined)
		onChange(null)
	}

	return (
		<div className='relative'>
			{preview ? (
				<div className='relative aspect-video w-full overflow-hidden rounded-2xl'>
					<Image
						src={preview}
						alt={t('formPreviewAlt')}
						fill
						sizes='(max-width: 768px) 100vw, 50vw'
						className='object-cover'
					/>
					<button
						type='button'
						onClick={handleRemove}
						aria-label={t('formRemoveCoverImage')}
						className='absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70'
					>
						<X className='size-4' />
					</button>
				</div>
			) : (
				<label className='flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-3 border-dashed border-border bg-bg p-10 transition-colors hover:border-brand hover:bg-brand/5'>
					<div className='flex size-12 items-center justify-center rounded-xl bg-muted/30'>
						<Upload className='size-6 text-text-secondary' />
					</div>
					<div className='text-center'>
						<p className='font-semibold text-text'>{label}</p>
						<p className='text-sm text-text-secondary'>{t('formImageHint')}</p>
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
const fetchIngredientOptions = async (
	query: string,
): Promise<AsyncComboboxOption[]> => {
	try {
		const res = await autocompleteSearch(query, 'ingredients', 8)
		if (res.success && res.data?.ingredients?.hits) {
			return res.data.ingredients.hits.map(h => ({
				value: h.document.id,
				label: h.document.name,
				category: h.document.category,
			}))
		}
	} catch {
		// Autocomplete is non-critical — degrade to empty suggestions
	}
	return []
}

const IngredientRow = ({
	ingredient,
	onChange,
	onRemove,
}: {
	ingredient: Ingredient
	onChange: (updated: Ingredient) => void
	onRemove: () => void
}) => {
	const t = useTranslations('recipe')
	return (
		<div className='group flex items-center gap-3'>
			<div className='flex flex-1 items-center gap-3'>
				<input
					type='text'
					value={ingredient.amount}
					onChange={e => onChange({ ...ingredient, amount: e.target.value })}
					placeholder={t('formAmountPlaceholder')}
					className='w-20 rounded-xl border-2 border-border bg-bg px-3 py-2.5 text-sm text-text focus:border-brand focus:outline-none'
				/>
				<select
					value={ingredient.unit}
					onChange={e =>
						onChange({ ...ingredient, unit: e.target.value as MeasurementUnit })
					}
					className='w-24 rounded-xl border-2 border-border bg-bg-card px-3 py-2.5 text-sm text-text focus:border-brand focus:outline-none'
				>
					{MEASUREMENT_UNITS.map(unit => (
						<option key={unit} value={unit} className='bg-bg-card text-text'>
							{unit}
						</option>
					))}
				</select>
				<AsyncCombobox
					value={ingredient.name}
					onChange={val => onChange({ ...ingredient, name: val })}
					onSelect={opt => onChange({ ...ingredient, name: opt.label })}
					fetchOptions={fetchIngredientOptions}
					placeholder={t('formIngredientPlaceholder')}
					minChars={1}
					className='flex-1 rounded-xl border-2 border-border bg-bg px-4 py-2.5 text-sm text-text focus:border-brand focus:outline-none'
				/>
			</div>
			<button
				type='button'
				onClick={onRemove}
				aria-label={t('formDeleteIngredient')}
				className='flex size-9 flex-shrink-0 items-center justify-center rounded-full text-text-secondary md:opacity-0 transition-all md:group-hover:opacity-100 focus-visible:opacity-100 hover:bg-error/10 hover:text-error'
			>
				<Trash2 className='size-4' />
			</button>
		</div>
	)
}

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
	const t = useTranslations('recipe')
	const [showTimerInput, setShowTimerInput] = useState(!!step.timerSeconds)
	const fileInputRef = React.useRef<HTMLInputElement>(null)
	const blobUrlRef = React.useRef<string | null>(null)

	// Cleanup blob URL on unmount
	React.useEffect(() => {
		return () => {
			if (blobUrlRef.current) {
				URL.revokeObjectURL(blobUrlRef.current)
			}
		}
	}, [])

	// Convert timerSeconds to H:M:S for display
	const totalSeconds = step.timerSeconds || 0
	const hours = Math.floor(totalSeconds / 3600)
	const minutes = Math.floor((totalSeconds % 3600) / 60)
	const seconds = totalSeconds % 60

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) {
			// Revoke previous blob URL if exists
			if (blobUrlRef.current) {
				URL.revokeObjectURL(blobUrlRef.current)
			}
			const url = URL.createObjectURL(file)
			blobUrlRef.current = url
			onChange({ ...step, imageUrl: url, imageFile: file })
		}
	}

	const handleRemoveImage = () => {
		if (blobUrlRef.current) {
			URL.revokeObjectURL(blobUrlRef.current)
			blobUrlRef.current = null
		}
		onChange({ ...step, imageUrl: undefined, imageFile: undefined })
		if (fileInputRef.current) {
			fileInputRef.current.value = ''
		}
	}

	return (
		<div className='group flex gap-4'>
			<div className='flex size-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-hero text-sm font-bold text-white'>
				{index + 1}
			</div>
			<div className='flex-1 space-y-3'>
				<textarea
					value={step.instruction}
					onChange={e => onChange({ ...step, instruction: e.target.value })}
					placeholder={t('formStepPlaceholder')}
					rows={3}
					className='w-full resize-y rounded-xl border-2 border-border bg-bg px-4 py-3 text-sm text-text focus:border-brand focus:outline-none'
				/>
				{/* Step Image Preview */}
				{step.imageUrl && (
					<div className='relative aspect-video w-full max-w-xs overflow-hidden rounded-xl border-2 border-border'>
						<Image
							src={step.imageUrl}
							alt={t('formStepAlt', { num: index + 1 })}
							fill
							sizes='(max-width: 768px) 100vw, 320px'
							className='object-cover'
						/>
						<button
							type='button'
							onClick={handleRemoveImage}
							aria-label={t('formRemoveStepImage')}
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
						className='flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:border-brand hover:text-brand'
					>
						<ImageIcon className='size-3.5' />
						{step.imageUrl ? t('formChangePhoto') : t('formAddPhoto')}
					</button>
					{showTimerInput ? (
						<div className='flex items-center gap-2'>
							<div className='flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1.5'>
								<Timer className='size-3.5 text-brand' />
								{/* Hours */}
								<input
									type='number'
									aria-label={t('formTimerHoursLabel')}
									value={hours || ''}
									onChange={e => {
										const h = parseInt(e.target.value) || 0
										const newTotal = h * 3600 + minutes * 60 + seconds
										onChange({ ...step, timerSeconds: newTotal || undefined })
									}}
									placeholder='0'
									className='w-8 bg-transparent text-center text-xs font-semibold text-brand focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
									min={0}
									max={23}
								/>
								<span className='text-xs font-semibold text-brand'>
									{t('formTimerH')}
								</span>
								{/* Minutes */}
								<input
									type='number'
									aria-label={t('formTimerMinutesLabel')}
									value={minutes || ''}
									onChange={e => {
										const m = parseInt(e.target.value) || 0
										const newTotal = hours * 3600 + m * 60 + seconds
										onChange({ ...step, timerSeconds: newTotal || undefined })
									}}
									placeholder='0'
									className='w-8 bg-transparent text-center text-xs font-semibold text-brand focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
									min={0}
									max={59}
								/>
								<span className='text-xs font-semibold text-brand'>
									{t('formTimerM')}
								</span>
								{/* Seconds */}
								<input
									type='number'
									aria-label={t('formTimerSecondsLabel')}
									value={seconds || ''}
									onChange={e => {
										const s = parseInt(e.target.value) || 0
										const newTotal = hours * 3600 + minutes * 60 + s
										onChange({ ...step, timerSeconds: newTotal || undefined })
									}}
									placeholder='0'
									className='w-8 bg-transparent text-center text-xs font-semibold text-brand focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
									min={0}
									max={59}
								/>
								<span className='text-xs font-semibold text-brand'>
									{t('formTimerS')}
								</span>
							</div>
							<button
								type='button'
								onClick={() => {
									setShowTimerInput(false)
									onChange({ ...step, timerSeconds: undefined })
								}}
								aria-label={t('formClearTimer')}
								className='text-text-secondary hover:text-error'
							>
								<X className='size-4' />
							</button>
						</div>
					) : (
						<button
							type='button'
							onClick={() => setShowTimerInput(true)}
							className='flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:border-brand hover:text-brand'
						>
							<Timer className='size-3.5' />
							{t('formAddTimer')}
						</button>
					)}
				</div>
			</div>
			<button
				type='button'
				onClick={onRemove}
				aria-label={t('formDeleteStep')}
				className='flex size-9 flex-shrink-0 items-center justify-center rounded-full text-text-secondary md:opacity-0 transition-all md:group-hover:opacity-100 focus-visible:opacity-100 hover:bg-error/10 hover:text-error'
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
	const t = useTranslations('recipe')
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
			<div className='flex flex-wrap items-center gap-2 rounded-xl border-2 border-border bg-bg p-3 focus-within:border-brand'>
				{tags.map(tag => (
					<span
						key={tag}
						className='flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white'
					>
						{tag}
						<button
							type='button'
							onClick={() => removeTag(tag)}
							aria-label={t('formDeleteTag')}
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
					placeholder={tags.length === 0 ? t('formTagPlaceholder') : ''}
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
							className='rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:border-brand hover:text-brand'
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
	submitLabel,
	submittingLabel,
	saveDraftLabel,
	savingLabel,
	className,
}: RecipeFormDetailedProps) => {
	const t = useTranslations('recipe')
	const categoryOptions: ComboboxOption[] = CATEGORY_KEYS.map(cat => ({
		value: cat.value,
		label: t(cat.labelKey),
	}))
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
			// Note: ImageUpload manages blob URL preview internally.
			// We only store the file for upload. coverImageUrl is for existing server URLs.
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

	const validateForm = useCallback((): boolean => {
		const newErrors: ValidationErrors = {}

		// Title is required (min 3 chars)
		if (!formData.title.trim()) {
			newErrors.title = t('formErrTitleRequired')
		} else if (formData.title.trim().length < 3) {
			newErrors.title = t('formErrTitleMinLen')
		}

		// Description is required (min 10 chars)
		if (!formData.description.trim()) {
			newErrors.description = t('formErrDescRequired')
		} else if (formData.description.trim().length < 10) {
			newErrors.description = t('formErrDescMinLen')
		}

		// Cover image is required
		if (!formData.coverImageUrl && !formData.coverImageFile) {
			newErrors.coverImage = t('formErrCoverRequired')
		}

		// At least one valid ingredient
		const validIngredients = formData.ingredients.filter(
			i => i.name.trim() && i.amount.trim(),
		)
		if (validIngredients.length === 0) {
			newErrors.ingredients = t('formErrIngredientRequired')
		}

		// At least one step with instruction
		const validSteps = formData.steps.filter(s => s.instruction.trim())
		if (validSteps.length === 0) {
			newErrors.steps = t('formErrStepRequired')
		}

		// Category is recommended but we'll make it required for discoverability
		if (!formData.category) {
			newErrors.category = t('formErrCategoryRequired')
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}, [formData, t])

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

	const handleSaveDraft = useCallback(() => {
		onSaveDraft?.(formData)
	}, [formData, onSaveDraft])

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
	}, [formData, onSubmit, handleSaveDraft, validateForm])

	// ============================================
	// LIVE DIFFICULTY PREDICTION
	// ============================================
	const [predictedDifficulty, setPredictedDifficulty] = useState<string | null>(
		null,
	)
	const [difficultyConfidence, setDifficultyConfidence] = useState<number>(0)
	const difficultyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	useEffect(() => {
		const ingredientCount = formData.ingredients.filter(i =>
			i.name.trim(),
		).length
		const stepCount = formData.steps.filter(s => s.instruction.trim()).length
		const totalTime =
			(formData.prepTimeMinutes || 0) + (formData.cookTimeMinutes || 0)

		// Need at least 1 ingredient AND 1 step to predict
		if (ingredientCount === 0 || stepCount === 0) {
			setPredictedDifficulty(null)
			return
		}

		if (difficultyTimerRef.current) clearTimeout(difficultyTimerRef.current)

		difficultyTimerRef.current = setTimeout(async () => {
			try {
				const result = await calibrateDifficulty({
					ingredient_count: ingredientCount,
					step_count: stepCount,
					techniques: [],
					estimated_time_minutes: totalTime || 30,
					equipment_count: 0,
				})
				if (result.success && result.data) {
					setPredictedDifficulty(result.data.predictedDifficulty)
					setDifficultyConfidence(result.data.confidence)
				}
			} catch {
				// ML calibration is non-critical — silently skip
			}
		}, 1200)

		return () => {
			if (difficultyTimerRef.current) clearTimeout(difficultyTimerRef.current)
		}
	}, [
		formData.ingredients,
		formData.steps,
		formData.prepTimeMinutes,
		formData.cookTimeMinutes,
	])

	return (
		<div className={cn('mx-auto max-w-form p-6 md:p-10', className)}>
			{/* Header */}
			<div className='mb-10'>
				<h1 className='text-3xl font-display font-extrabold text-text md:text-4xl'>
					{t('formCreateTitle')}
				</h1>
				<p className='mt-2 text-text-secondary'>{t('formCreateSubtitle')}</p>
			</div>

			<form
				onSubmit={handleSubmit}
				className='rounded-2xl border border-border bg-bg-card p-6 md:p-10'
			>
				{/* Basic Info Section */}
				<section className='mb-12 border-b-2 border-border pb-12'>
					<h2 className='mb-6 text-xl font-bold text-text'>
						{t('formBasicInfo')}
					</h2>

					{/* Title */}
					<div className='mb-6' data-error={!!errors.title}>
						<label
							htmlFor='recipe-title'
							className='mb-2 block text-sm font-semibold text-text'
						>
							{t('formRecipeTitle')} <span className='text-error'>*</span>
						</label>
						<input
							id='recipe-title'
							type='text'
							value={formData.title}
							onChange={e => updateFieldWithClearError('title', e.target.value)}
							placeholder={t('formTitlePlaceholder')}
							maxLength={100}
							className={cn(
								'w-full rounded-xl border-2 bg-bg px-4 py-3 text-sm text-text focus:outline-none',
								errors.title
									? 'border-error focus:border-error'
									: 'border-border focus:border-brand',
							)}
						/>
						{errors.title ? (
							<p className='mt-1.5 text-sm text-error'>{errors.title}</p>
						) : (
							<div className='mt-1.5 flex items-center justify-between'>
								<p className='text-sm text-text-secondary'>
									{t('formTitleHint')}
								</p>
								<p
									className={`tabular-nums text-xs ${formData.title.length > 80 ? (formData.title.length >= 100 ? 'text-error font-semibold' : 'text-warning') : 'text-text-muted'}`}
								>
									{formData.title.length}/100
								</p>
							</div>
						)}
					</div>

					{/* Description */}
					<div className='mb-6' data-error={!!errors.description}>
						<label
							htmlFor='recipe-description'
							className='mb-2 block text-sm font-semibold text-text'
						>
							{t('formDescription')} <span className='text-error'>*</span>
						</label>
						<textarea
							id='recipe-description'
							value={formData.description}
							onChange={e =>
								updateFieldWithClearError('description', e.target.value)
							}
							placeholder={t('formDescPlaceholder')}
							rows={4}
							maxLength={500}
							className={cn(
								'w-full resize-y rounded-xl border-2 bg-bg px-4 py-3 text-sm text-text focus:outline-none',
								errors.description
									? 'border-error focus:border-error'
									: 'border-border focus:border-brand',
							)}
						/>
						{errors.description ? (
							<p className='mt-1.5 text-sm text-error'>{errors.description}</p>
						) : (
							<p
								className={`tabular-nums mt-1.5 text-sm ${formData.description.length > 400 ? (formData.description.length >= 500 ? 'text-error font-semibold' : 'text-warning') : 'text-text-secondary'}`}
							>
								{t('formDescCharCount', { count: formData.description.length })}
							</p>
						)}
					</div>

					{/* Cover Image */}
					<div className='mb-6' data-error={!!errors.coverImage}>
						<label
							id='recipe-cover-image-label'
							className='mb-2 block text-sm font-semibold text-text'
						>
							{t('formCoverImage')} <span className='text-error'>*</span>
						</label>
						<div
							aria-labelledby='recipe-cover-image-label'
							className={cn(
								'rounded-2xl',
								errors.coverImage && 'ring-2 ring-error',
							)}
						>
							<ImageUpload
								value={formData.coverImageUrl}
								onChange={file => {
									handleCoverImage(file)
									if (hasAttemptedSubmit)
										setErrors(prev => ({ ...prev, coverImage: undefined }))
								}}
								label={t('formCoverLabel')}
							/>
						</div>
						{errors.coverImage && (
							<p className='mt-1.5 text-sm text-error'>{errors.coverImage}</p>
						)}
					</div>

					{/* Time & Servings Grid */}
					<div className='mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3'>
						<div>
							<label
								htmlFor='recipe-prep-time'
								className='mb-2 block text-sm font-semibold text-text'
							>
								{t('formPrepTime')}
							</label>
							<div className='relative'>
								<input
									id='recipe-prep-time'
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
									className='w-full rounded-xl border-2 border-border bg-bg py-3 pl-4 pr-12 text-sm text-text focus:border-brand focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
								/>
								<span className='pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-secondary'>
									{t('formMinUnit')}
								</span>
							</div>
						</div>
						<div>
							<label
								htmlFor='recipe-cook-time'
								className='mb-2 block text-sm font-semibold text-text'
							>
								{t('formCookTime')}
							</label>
							<div className='relative'>
								<input
									id='recipe-cook-time'
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
									className='w-full rounded-xl border-2 border-border bg-bg py-3 pl-4 pr-12 text-sm text-text focus:border-brand focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
								/>
								<span className='pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-secondary'>
									{t('formMinUnit')}
								</span>
							</div>
						</div>
						<div>
							<label
								htmlFor='recipe-servings'
								className='mb-2 block text-sm font-semibold text-text'
							>
								{t('formServings')}
							</label>
							<input
								id='recipe-servings'
								type='number'
								value={formData.servings || ''}
								onChange={e =>
									updateField('servings', parseInt(e.target.value) || 1)
								}
								placeholder='4'
								min={1}
								className='w-full rounded-xl border-2 border-border bg-bg px-4 py-3 text-sm text-text focus:border-brand focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
							/>
						</div>
					</div>

					{/* Difficulty & Category */}
					<div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
						<div>
							<label
								id='recipe-difficulty-label'
								className='mb-2 block text-sm font-semibold text-text'
							>
								{t('formDifficulty')}
							</label>
							<div
								aria-labelledby='recipe-difficulty-label'
								className='flex items-center gap-2 rounded-xl border-2 border-border bg-bg-card px-4 py-3 cursor-help'
								title={t('formDifficultyTitle')}
							>
								<Signal
									className={cn(
										'size-4',
										predictedDifficulty ? 'text-brand' : 'text-text-secondary',
									)}
								/>
								<span
									className={cn(
										'flex-1 text-sm',
										predictedDifficulty
											? 'font-medium text-text'
											: 'text-text-secondary',
									)}
								>
									{predictedDifficulty || t('formDeterminedByAi')}
								</span>
								{predictedDifficulty && difficultyConfidence > 0 && (
									<span className='tabular-nums text-xs text-text-secondary'>
										{Math.round(difficultyConfidence * 100)}%
									</span>
								)}
								<Lock className='size-4 text-text-secondary/50' />
							</div>
							<p className='mt-1.5 text-xs text-text-secondary'>
								{predictedDifficulty
									? t('formAiPrediction')
									: t('formAiPredictionHint')}
							</p>
						</div>
						<div data-error={!!errors.category}>
							<label
								htmlFor='recipe-category'
								className='mb-2 block text-sm font-semibold text-text'
							>
								{t('formCategory')} <span className='text-error'>*</span>
							</label>
							<Combobox
								id='recipe-category'
								value={formData.category}
								onChange={val => updateFieldWithClearError('category', val)}
								onSelect={opt =>
									updateFieldWithClearError('category', opt.value)
								}
								options={categoryOptions}
								placeholder={t('formSelectCategory')}
								className={cn(
									'w-full rounded-xl border-2 bg-bg-card px-4 py-3 text-sm text-text focus:outline-none',
									errors.category
										? 'border-error focus:border-error'
										: 'border-border focus:border-brand',
								)}
							/>
							{errors.category && (
								<p className='mt-1.5 text-sm text-error'>{errors.category}</p>
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
							<h2 className='text-xl font-bold text-text'>
								{t('formIngredientsSection')}
							</h2>
							{errors.ingredients && (
								<p className='mt-1 text-sm text-error'>{errors.ingredients}</p>
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
							className='flex items-center gap-1.5 rounded-xl border-2 border-dashed border-border px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:border-brand hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/50'
						>
							<Plus className='size-4' />
							{t('formAddIngredient')}
						</motion.button>
					</div>
					<ul className='space-y-4'>
						<AnimatePresence mode='popLayout'>
							{formData.ingredients.map(ing => (
								<motion.li
									key={ing.id}
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									transition={{ duration: DURATION_S.normal }}
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
								</motion.li>
							))}
						</AnimatePresence>
					</ul>
				</section>

				{/* Instructions Section */}
				<section
					className='mb-12 border-b-2 border-border pb-12'
					data-error={!!errors.steps}
				>
					<div className='mb-6 flex items-center justify-between'>
						<div>
							<div className='flex items-center gap-4'>
								<h2 className='text-xl font-bold text-text'>
									{t('formInstructionsSection')}
								</h2>
								{formData.steps.length > 0 && (
									<button
										type='button'
										onClick={() => {
											const previewRecipe = formDataToRecipe(formData)
											useCookingStore
												.getState()
												.startPreviewCooking(previewRecipe)
											useUiStore.getState().expandCookingPanel()
										}}
										className='flex items-center gap-1.5 text-sm font-medium text-brand/70 transition-colors hover:text-brand'
									>
										<Rocket className='size-3.5' />
										{t('formTestPlay')}
									</button>
								)}
							</div>
							{errors.steps && (
								<p className='mt-1 text-sm text-error'>{errors.steps}</p>
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
							className='flex items-center gap-1.5 rounded-xl border-2 border-dashed border-border px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:border-brand hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/50'
						>
							<Plus className='size-4' />
							{t('formAddStep')}
						</motion.button>
					</div>
					<ol className='space-y-5'>
						<AnimatePresence mode='popLayout'>
							{formData.steps.map((step, i) => (
								<motion.li
									key={step.id}
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									transition={{ duration: DURATION_S.normal }}
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
								</motion.li>
							))}
						</AnimatePresence>
					</ol>
				</section>

				{/* Tips Section */}
				<section className='mb-12 border-b-2 border-border pb-12'>
					<h2 className='mb-6 text-xl font-bold text-text'>
						{t('formTipsSection')}
					</h2>
					<textarea
						value={formData.tips}
						onChange={e => updateField('tips', e.target.value)}
						placeholder={t('formTipsPlaceholder')}
						rows={4}
						className='w-full resize-y rounded-xl border-2 border-border bg-bg px-4 py-3 text-sm text-text focus:border-brand focus:outline-none'
					/>
				</section>

				{/* Tags Section */}
				<section className='mb-8'>
					<h2 className='mb-6 text-xl font-bold text-text'>
						{t('formTagsSection')}
					</h2>
					<p className='mb-3 text-sm text-text-secondary'>
						{t('formTagsHint')}
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
						className='flex items-center justify-center gap-2 rounded-xl border border-brand/30 bg-brand/5 px-5 py-3 font-semibold text-brand disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand/50'
					>
						{isSaving ? (
							<Loader2 className='size-4 animate-spin' />
						) : (
							<Cloud className='size-4' />
						)}
						{isSaving
							? (savingLabel ?? t('formSaving'))
							: (saveDraftLabel ?? t('formSaveToCloud'))}
						{!isSaving && (
							<kbd className='ml-1 hidden rounded bg-brand/10 px-1.5 py-0.5 text-xs font-medium text-brand/70 sm:inline-block'>
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
								className='flex-1 rounded-xl border border-border bg-bg px-5 py-3 font-semibold text-text-secondary disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none'
							>
								{t('formCancel')}
							</button>
						)}
						<motion.button
							type='submit'
							disabled={isSubmitting || isSaving}
							whileHover={isSubmitting ? undefined : BUTTON_HOVER}
							whileTap={isSubmitting ? undefined : BUTTON_TAP}
							className='flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-hero px-6 py-3 font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-70 sm:flex-none focus-visible:ring-2 focus-visible:ring-brand/50'
						>
							{isSubmitting ? (
								<Loader2 className='size-4 animate-spin' />
							) : (
								<Send className='size-4' />
							)}
							{isSubmitting
								? (submittingLabel ?? t('formProcessing'))
								: (submitLabel ?? t('formReviewXp'))}
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
