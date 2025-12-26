'use client'

import {
	motion,
	AnimatePresence,
	Reorder,
	useMotionValue,
	useTransform,
	animate,
} from 'framer-motion'
import {
	ArrowLeft,
	Clipboard,
	Edit3,
	GripVertical,
	ImagePlus,
	ListOrdered,
	Loader2,
	Lock,
	Plus,
	Send,
	Shield,
	ShoppingBasket,
	Sparkles,
	Timer,
	Trash2,
	Wand2,
	X,
	CheckCircle,
	Circle,
	AlertTriangle,
	Clock,
	Signal,
	Utensils,
	Rocket,
} from 'lucide-react'
import Image from 'next/image'
import React, { useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	STEP_VARIANTS,
	STEP_TRANSITION,
	CONTENT_SWITCH_VARIANTS,
	CONTENT_SWITCH_TRANSITION,
} from '@/lib/motion'
import { RecipeFormDetailed, type RecipeFormData } from './RecipeFormDetailed'
import { processRecipe, calculateMetas, validateRecipe } from '@/services/ai'
import {
	createDraft,
	saveDraft,
	uploadRecipeImages,
	publishRecipe,
} from '@/services/recipe'
import { toast } from 'sonner'
import { triggerRecipeCompleteConfetti } from '@/lib/confetti'
import { Recipe } from '@/lib/types/recipe'
import type { Difficulty } from '@/lib/types/gamification'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// ============================================
// TYPES
// ============================================

type CreateMethod = 'ai' | 'manual'
type CreateStep = 'input' | 'parsing' | 'preview' | 'xp-preview'

// Platform detection for keyboard hints
const isMac =
	typeof navigator !== 'undefined' && navigator.platform.includes('Mac')
const modKey = isMac ? '⌘' : 'Ctrl'

interface Ingredient {
	id: string
	quantity: string
	name: string
}

type TimeUnit = 'seconds' | 'minutes' | 'hours' | 'days'

interface RecipeStep {
	id: string
	instruction: string
	timerSeconds?: number // Total timer in seconds (source of truth)
	technique?: string
	imageUrl?: string // Step-specific image
}

interface ParsedRecipe {
	title: string
	description: string
	coverImageUrl?: string
	cookTime: string
	difficulty: Difficulty
	servings: number
	cuisine: string
	ingredients: Ingredient[]
	steps: RecipeStep[]
	detectedBadges: { emoji: string; name: string }[]
	// XP data from AI (preserved from process_recipe)
	xpReward?: number
	xpBreakdown?: {
		base: number
		baseReason: string
		steps: number
		stepsReason: string
		time: number
		timeReason: string
		techniques?: number
		techniquesReason?: string
		total: number
	}
	skillTags?: string[]
	difficultyMultiplier?: number
}

interface XpBreakdown {
	base: number
	steps: number
	time: number
	techniques: { name: string; xp: number }[]
	adjustments?: { reason: string; xp: number }[]
	total: number
	isValidated: boolean
	confidence: number
}

interface RecipeCreateAiFlowProps {
	onBack?: () => void
	onPublishSuccess?: (recipeId: string) => void
	className?: string
	/** Optional initial draft to load (from draft listing) - server-saved AI-parsed draft */
	initialDraft?: Recipe
	/** Optional initial manual draft to load (from localStorage) - manually entered draft */
	initialManualDraft?: RecipeFormData
}

// ============================================
// HELPER: Pre-publish validation (mirrors backend validateMandatoryFields)
// ============================================

interface PublishValidationError {
	field: 'title' | 'coverImage' | 'ingredients' | 'steps'
	message: string
	hint: string
}

/**
 * Validates recipe data before publish, matching backend requirements:
 * 1. Title is required
 * 2. At least 1 cover image
 * 3. Ingredients list is not empty
 * 4. At least 1 step
 *
 * Returns array of validation errors (empty = valid)
 */
const validateRecipeForPublish = (
	recipe: ParsedRecipe | null,
): PublishValidationError[] => {
	if (!recipe) {
		return [
			{
				field: 'title',
				message: 'No recipe data',
				hint: 'Please create a recipe first.',
			},
		]
	}

	const errors: PublishValidationError[] = []

	// 1. Title is required
	if (!recipe.title?.trim()) {
		errors.push({
			field: 'title',
			message: 'Title is required',
			hint: 'Add a title for your recipe in the preview.',
		})
	}

	// 2. Cover image is required (at least 1)
	if (!recipe.coverImageUrl?.trim()) {
		errors.push({
			field: 'coverImage',
			message: 'Cover image is required',
			hint: 'Upload a photo of your finished dish using the image button.',
		})
	}

	// 3. Ingredients list is required
	if (!recipe.ingredients || recipe.ingredients.length === 0) {
		errors.push({
			field: 'ingredients',
			message: 'Ingredients are required',
			hint: 'Add at least one ingredient to your recipe.',
		})
	}

	// 4. Steps are required (at least 1)
	if (!recipe.steps || recipe.steps.length === 0) {
		errors.push({
			field: 'steps',
			message: 'Steps are required',
			hint: 'Add at least one step to your recipe instructions.',
		})
	}

	return errors
}

/**
 * Maps backend Vietnamese error messages to English (for robustness)
 */
const mapBackendErrorToEnglish = (message: string): string => {
	const errorMap: Record<string, string> = {
		'Tiêu đề là bắt buộc': 'Title is required',
		'Cần ít nhất 1 ảnh bìa': 'Cover image is required',
		'Danh sách nguyên liệu không được trống':
			'Ingredients list cannot be empty',
		'Cần ít nhất 1 bước hướng dẫn': 'At least one step is required',
	}
	return errorMap[message] || message
}

// ============================================
// HELPER: Transform API response to local types
// ============================================

const transformProcessedRecipe = (
	data: Awaited<ReturnType<typeof processRecipe>>['data'],
): ParsedRecipe | null => {
	if (!data) return null

	return {
		title: data.title,
		description: data.description,
		cookTime: `${data.cookTimeMinutes} min`,
		difficulty: (data.difficulty || 'Intermediate') as Difficulty,
		servings: data.servings,
		cuisine: data.cuisineType || 'International',
		ingredients: (data.fullIngredientList || []).map((ing, i) => ({
			id: `ing-${i}`,
			quantity: `${ing.quantity} ${ing.unit}`.trim(),
			name: ing.name,
		})),
		steps: (data.steps || []).map(step => ({
			id: `step-${step.stepNumber}`,
			instruction: step.description,
			timerSeconds: step.timerSeconds, // Store in seconds for flexibility
			technique: step.action,
			imageUrl: step.imageUrl,
		})),
		detectedBadges:
			data.badges?.map(badge => ({
				emoji: '🏆',
				name: badge,
			})) || [],
		// PRESERVE ALL XP data from AI - full transparency
		xpReward: data.xpReward,
		xpBreakdown: data.xpBreakdown,
		skillTags: data.skillTags,
		difficultyMultiplier: data.difficultyMultiplier,
	}
}

// ============================================
// COMPONENTS
// ============================================

// Method Selection Card
const MethodCard = ({
	method,
	icon,
	title,
	description,
	isActive,
	badge,
	onClick,
}: {
	method: CreateMethod
	icon: React.ReactNode
	title: string
	description: string
	isActive: boolean
	badge?: string
	onClick: () => void
}) => (
	<button
		onClick={onClick}
		className={cn(
			'relative flex items-center gap-3.5 rounded-2xl border-2 p-5 text-left transition-all',
			isActive
				? 'border-primary bg-primary/10'
				: 'border-border bg-panel-bg hover:border-muted-foreground',
		)}
	>
		<div
			className={cn(
				'flex size-12 items-center justify-center rounded-xl',
				method === 'ai'
					? 'bg-gradient-hero text-white'
					: 'bg-bg text-muted-foreground',
			)}
		>
			{icon}
		</div>
		<div className='flex-1'>
			<span className='text-base font-bold text-text'>{title}</span>
			<span className='mt-0.5 block text-xs text-muted-foreground'>
				{description}
			</span>
		</div>
		{badge && (
			<span className='absolute -top-2 right-3 rounded-lg bg-gradient-hero px-2.5 py-1 text-2xs font-bold text-white'>
				{badge}
			</span>
		)}
	</button>
)

// Paste Area
const PasteArea = ({
	value,
	onChange,
	onPaste,
	charCount,
	maxChars = 5000,
}: {
	value: string
	onChange: (v: string) => void
	onPaste: () => void
	charCount: number
	maxChars?: number
}) => (
	<div className='overflow-hidden rounded-2xl border-2 border-dashed border-border bg-bg'>
		<textarea
			value={value}
			onChange={e => onChange(e.target.value)}
			placeholder={`Paste your recipe text here...

Example:
Spicy Garlic Noodles

Ingredients:
- 8 oz rice noodles
- 4 cloves garlic, minced
- 2 tbsp soy sauce
...

Instructions:
1. Cook noodles according to package
2. Sauté garlic until fragrant
...`}
			className='min-h-textarea-lg w-full resize-y bg-transparent p-5 text-sm leading-relaxed text-text placeholder:text-muted-foreground focus:outline-none'
		/>
		<div className='flex items-center justify-between border-t border-border bg-panel-bg px-5 py-3'>
			<button
				onClick={onPaste}
				className='flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-bg'
			>
				<Clipboard className='size-4' />
				Paste from Clipboard
			</button>
			<span className='text-xs text-muted-foreground'>
				{charCount} / {maxChars}
			</span>
		</div>
	</div>
)

// Parsing Overlay
const ParsingOverlay = ({ currentStep }: { currentStep: number }) => {
	const steps = [
		'Reading text',
		'Extracting ingredients',
		'Parsing steps',
		'Calculating XP',
	]

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm'
		>
			<motion.div
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				className='rounded-3xl bg-panel-bg p-12 text-center'
			>
				{/* Animated Wand */}
				<div className='relative mx-auto mb-6 size-20'>
					<motion.div
						animate={{ scale: [1, 1.1, 1] }}
						transition={{ repeat: Infinity, duration: 1.5 }}
						className='flex size-20 items-center justify-center rounded-2xl bg-gradient-hero text-white shadow-lg'
					>
						<Wand2 className='size-9' />
					</motion.div>
					{/* Sparkles */}
					<motion.span
						animate={{ y: [0, -10, 0], opacity: [1, 0.5, 1] }}
						transition={{ repeat: Infinity, duration: 2, delay: 0 }}
						className='absolute -right-5 -top-5 text-2xl'
					>
						✨
					</motion.span>
					<motion.span
						animate={{ y: [0, -10, 0], opacity: [1, 0.5, 1] }}
						transition={{ repeat: Infinity, duration: 2, delay: 0.3 }}
						className='absolute -bottom-2 -left-4 text-xl'
					>
						⭐
					</motion.span>
				</div>

				<h3 className='mb-6 text-xl font-bold text-text'>
					Parsing your recipe...
				</h3>

				<div className='space-y-4 text-left'>
					{steps.map((step, i) => (
						<div
							key={step}
							className={cn(
								'flex items-center gap-3 text-sm',
								i < currentStep && 'text-success',
								i === currentStep && 'font-semibold text-text',
								i > currentStep && 'text-muted-foreground',
							)}
						>
							{i < currentStep ? (
								<CheckCircle className='size-5' />
							) : i === currentStep ? (
								<div className='size-5 animate-spin rounded-full border-2 border-border border-t-primary' />
							) : (
								<Circle className='size-5' />
							)}
							<span>{step}</span>
						</div>
					))}
				</div>
			</motion.div>
		</motion.div>
	)
}

// Ingredient Item with editing support
const IngredientItem = ({
	ingredient,
	onRemove,
	onUpdate,
}: {
	ingredient: Ingredient
	onRemove: () => void
	onUpdate: (updates: Partial<Ingredient>) => void
}) => (
	<div className='group flex items-center gap-3 rounded-xl bg-bg px-4 py-3'>
		<input
			type='text'
			value={ingredient.quantity}
			onChange={e => onUpdate({ quantity: e.target.value })}
			placeholder='Qty'
			className='min-w-24 w-auto max-w-40 bg-transparent text-sm font-bold text-primary outline-none placeholder:text-muted-foreground/50'
		/>
		<input
			type='text'
			value={ingredient.name}
			onChange={e => onUpdate({ name: e.target.value })}
			placeholder='Ingredient name'
			className='flex-1 bg-transparent text-sm text-text outline-none placeholder:text-muted-foreground/50'
		/>
		<button
			onClick={onRemove}
			className='flex size-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500'
		>
			<X className='size-4' />
		</button>
	</div>
)

// Helper: Convert seconds to human-readable display
const formatTimer = (seconds: number): string => {
	if (seconds >= 86400) {
		const days = Math.floor(seconds / 86400)
		const hours = Math.floor((seconds % 86400) / 3600)
		return hours > 0
			? `${days}d ${hours}h`
			: `${days} day${days > 1 ? 's' : ''}`
	}
	if (seconds >= 3600) {
		const hours = Math.floor(seconds / 3600)
		const mins = Math.floor((seconds % 3600) / 60)
		return mins > 0
			? `${hours}h ${mins}m`
			: `${hours} hour${hours > 1 ? 's' : ''}`
	}
	if (seconds >= 60) {
		return `${Math.floor(seconds / 60)} min`
	}
	return `${seconds} sec`
}

// Helper: Get timer in seconds from step
const getTimerSeconds = (step: RecipeStep): number | undefined => {
	if (step.timerSeconds != null && step.timerSeconds > 0)
		return step.timerSeconds
	return undefined
}

// Step Item with flexible timer and image support
const StepItem = ({
	step,
	index,
	onRemove,
	onUpdate,
}: {
	step: RecipeStep
	index: number
	onRemove: () => void
	onUpdate: (updates: Partial<RecipeStep>) => void
}) => {
	const [isEditingTimer, setIsEditingTimer] = useState(false)
	const [timerValue, setTimerValue] = useState('')
	const [timerUnit, setTimerUnit] = useState<TimeUnit>('minutes')
	const fileInputRef = React.useRef<HTMLInputElement>(null)

	// Initialize timer editing state from step
	const openTimerEditor = () => {
		const seconds = getTimerSeconds(step)
		if (seconds !== undefined) {
			// Convert to most natural unit
			if (seconds >= 86400 && seconds % 86400 === 0) {
				setTimerValue((seconds / 86400).toString())
				setTimerUnit('days')
			} else if (seconds >= 3600 && seconds % 3600 === 0) {
				setTimerValue((seconds / 3600).toString())
				setTimerUnit('hours')
			} else if (seconds >= 60) {
				setTimerValue(Math.floor(seconds / 60).toString())
				setTimerUnit('minutes')
			} else {
				setTimerValue(seconds.toString())
				setTimerUnit('seconds')
			}
		} else {
			setTimerValue('')
			setTimerUnit('minutes')
		}
		setIsEditingTimer(true)
	}

	const handleTimerSave = () => {
		const value = parseFloat(timerValue)
		if (!isNaN(value) && value > 0) {
			let seconds = value
			switch (timerUnit) {
				case 'days':
					seconds = value * 86400
					break
				case 'hours':
					seconds = value * 3600
					break
				case 'minutes':
					seconds = value * 60
					break
				case 'seconds':
					seconds = value
					break
			}
			onUpdate({ timerSeconds: Math.round(seconds) })
		} else {
			// Clear timer
			onUpdate({ timerSeconds: undefined })
		}
		setIsEditingTimer(false)
	}

	const handleClearTimer = (e: React.MouseEvent) => {
		e.stopPropagation()
		onUpdate({ timerSeconds: undefined })
	}

	const handleTimerKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') handleTimerSave()
		else if (e.key === 'Escape') setIsEditingTimer(false)
	}

	const [isUploadingImage, setIsUploadingImage] = useState(false)

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		setIsUploadingImage(true)

		// Show local preview immediately for better UX
		const localPreviewUrl = URL.createObjectURL(file)
		onUpdate({ imageUrl: localPreviewUrl })

		try {
			// Upload to server
			const response = await uploadRecipeImages([file])
			if (response.success && response.data?.[0]) {
				// Replace local preview with server URL
				onUpdate({ imageUrl: response.data[0] })
			} else {
				// Upload failed - keep local preview but warn user
				toast.error('Image upload failed', {
					description:
						"Using local preview. Image won't persist after page refresh.",
				})
			}
		} catch (error) {
			console.error('Image upload error:', error)
			toast.error('Image upload failed', {
				description:
					"Using local preview. Image won't persist after page refresh.",
			})
		} finally {
			setIsUploadingImage(false)
		}
	}

	const timerSeconds = getTimerSeconds(step)

	return (
		<div className='group flex gap-3.5 rounded-2xl bg-bg p-4'>
			<div className='flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-hero text-sm font-extrabold text-white shadow-md'>
				{index + 1}
			</div>
			<div className='flex-1 space-y-3'>
				{/* Step Image */}
				{step.imageUrl ? (
					<div className='relative'>
						<Image
							src={step.imageUrl}
							alt={`Step ${index + 1}`}
							width={400}
							height={128}
							className={cn(
								'h-32 w-full rounded-lg object-cover',
								isUploadingImage && 'opacity-60',
							)}
						/>
						{isUploadingImage && (
							<div className='absolute inset-0 flex items-center justify-center'>
								<div className='size-8 animate-spin rounded-full border-2 border-white border-t-transparent' />
							</div>
						)}
						<button
							onClick={() => onUpdate({ imageUrl: undefined })}
							disabled={isUploadingImage}
							className='absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-500 disabled:opacity-50'
						>
							<X className='size-3.5' />
						</button>
					</div>
				) : (
					<button
						onClick={() => fileInputRef.current?.click()}
						disabled={isUploadingImage}
						className='flex h-20 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50'
					>
						{isUploadingImage ? (
							<>
								<div className='size-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
								Uploading...
							</>
						) : (
							<>
								<ImagePlus className='size-4' />
								Add step photo
							</>
						)}
					</button>
				)}
				<input
					ref={fileInputRef}
					type='file'
					accept='image/*'
					onChange={handleImageUpload}
					className='hidden'
				/>

				{/* Instruction */}
				<textarea
					defaultValue={step.instruction}
					onChange={e => onUpdate({ instruction: e.target.value })}
					placeholder='Describe this step...'
					className='min-h-16 w-full resize-none rounded-lg border border-border bg-panel-bg p-3 text-sm text-text placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none'
				/>

				{/* Timer & Technique Tags */}
				<div className='flex flex-wrap gap-2.5'>
					{isEditingTimer ? (
						<div className='flex items-center gap-1.5 rounded-lg border border-primary bg-primary/5 px-2 py-1'>
							<Timer className='size-3.5 text-primary' />
							<input
								type='number'
								value={timerValue}
								onChange={e => setTimerValue(e.target.value)}
								onKeyDown={handleTimerKeyDown}
								placeholder='0'
								min='0'
								className='w-12 bg-transparent text-xs font-semibold text-primary outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
								autoFocus
							/>
							<select
								value={timerUnit}
								onChange={e => setTimerUnit(e.target.value as TimeUnit)}
								className='bg-bg-card text-xs font-semibold text-primary outline-none cursor-pointer rounded px-1 py-0.5'
							>
								<option value='seconds' className='bg-bg-card text-text'>
									sec
								</option>
								<option value='minutes' className='bg-bg-card text-text'>
									min
								</option>
								<option value='hours' className='bg-bg-card text-text'>
									hours
								</option>
								<option value='days' className='bg-bg-card text-text'>
									days
								</option>
							</select>
							<button
								onClick={handleTimerSave}
								className='ml-1 rounded bg-primary px-2 py-0.5 text-xs font-semibold text-white'
							>
								✓
							</button>
						</div>
					) : timerSeconds ? (
						<div className='flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5'>
							<button
								onClick={openTimerEditor}
								className='flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary/80'
							>
								<Timer className='size-3.5' />
								{formatTimer(timerSeconds)}
							</button>
							<button
								onClick={handleClearTimer}
								className='ml-1 flex size-4 items-center justify-center rounded-full text-primary/60 hover:bg-primary/20 hover:text-primary'
							>
								<X className='size-3' />
							</button>
						</div>
					) : (
						<button
							onClick={openTimerEditor}
							className='flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary'
						>
							<Timer className='size-3.5' />
							Add Timer
						</button>
					)}
					{step.technique && (
						<span className='rounded-lg bg-streak/10 px-3 py-1.5 text-xs font-semibold text-streak'>
							🔥 {step.technique}
						</span>
					)}
				</div>
			</div>
			<div className='flex flex-col gap-2'>
				<button className='flex size-8 cursor-grab items-center justify-center rounded-lg text-muted-foreground/70 transition-colors hover:bg-muted/30 hover:text-muted-foreground active:cursor-grabbing'>
					<GripVertical className='size-4' />
				</button>
				<button
					onClick={onRemove}
					className='flex size-8 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-red-500/10 hover:text-red-500'
				>
					<Trash2 className='size-4' />
				</button>
			</div>
		</div>
	)
}

// Animated Count-Up Component
const CountUp = ({
	value,
	className,
}: {
	value: number
	className?: string
}) => {
	const count = useMotionValue(0)
	const rounded = useTransform(count, latest => Math.round(latest))
	const [displayValue, setDisplayValue] = React.useState(0)

	React.useEffect(() => {
		const controls = animate(count, value, {
			duration: 1.2,
			ease: 'easeOut',
		})
		const unsubscribe = rounded.on('change', v => setDisplayValue(v))
		return () => {
			controls.stop()
			unsubscribe()
		}
	}, [value, count, rounded])

	return <span className={className}>{displayValue}</span>
}

// XP Preview Modal
const XpPreviewModal = ({
	recipe,
	xpBreakdown,
	onBack,
	onPublish,
	isPublishing = false,
}: {
	recipe: ParsedRecipe
	xpBreakdown: XpBreakdown
	onBack: () => void
	onPublish: () => void
	isPublishing?: boolean
}) => {
	const [showConfirm, setShowConfirm] = useState(false)

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4'
		>
			<motion.div
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				className='w-full max-w-md max-h-modal overflow-y-auto rounded-3xl bg-panel-bg p-7'
			>
				{/* Header */}
				<div className='mb-5 flex items-center justify-between'>
					<h2 className='text-xl font-extrabold text-text'>XP Preview</h2>
					<button
						onClick={onBack}
						className='flex size-9 items-center justify-center rounded-lg bg-bg text-muted-foreground'
					>
						<X className='size-5' />
					</button>
				</div>

				{/* Recipe Summary */}
				<div className='mb-5 flex items-center gap-4 rounded-2xl bg-bg p-4'>
					{recipe.coverImageUrl ? (
						<Image
							src={recipe.coverImageUrl}
							alt={recipe.title}
							width={80}
							height={80}
							className='size-20 rounded-xl object-cover'
						/>
					) : (
						<div className='flex size-20 items-center justify-center rounded-xl bg-muted text-3xl'>
							🍳
						</div>
					)}
					<div className='flex-1'>
						<h3 className='text-lg font-bold text-text'>{recipe.title}</h3>
						<p className='text-xs text-muted-foreground'>
							{recipe.cookTime} • {recipe.difficulty} • {recipe.servings}{' '}
							servings
						</p>
					</div>
				</div>

				{/* XP Breakdown */}
				<div className='mb-5 rounded-2xl bg-bg p-5'>
					<div className='mb-4 flex items-center justify-between border-b border-border pb-4'>
						<span className='text-sm text-muted-foreground'>
							Total Recipe XP
						</span>
						<CountUp
							value={xpBreakdown.total}
							className='text-4xl font-black text-primary'
						/>
					</div>

					<div className='mb-4 space-y-3'>
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-2.5 text-sm text-text'>
								<span className='text-lg'>📊</span>
								Base ({recipe.difficulty} difficulty)
							</div>
							<span className='font-bold text-success'>
								+{xpBreakdown.base}
							</span>
						</div>
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-2.5 text-sm text-text'>
								<span className='text-lg'>📝</span>
								Steps ({recipe.steps.length} × 10)
							</div>
							<span className='font-bold text-success'>
								+{xpBreakdown.steps}
							</span>
						</div>
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-2.5 text-sm text-text'>
								<span className='text-lg'>⏱️</span>
								Time ({recipe.cookTime})
							</div>
							<span className='font-bold text-success'>
								+{xpBreakdown.time}
							</span>
						</div>
						{(xpBreakdown.techniques || []).map((t, i) => (
							<div
								key={i}
								className='flex items-center justify-between rounded-lg bg-streak/10 px-3.5 py-2.5'
							>
								<div className='flex items-center gap-2.5 text-sm text-text'>
									<span className='text-lg'>🔥</span>
									{t.name} technique
								</div>
								<span className='font-bold text-success'>+{t.xp}</span>
							</div>
						))}
					</div>

					{/* Validation */}
					<div className='flex items-center gap-3 rounded-xl bg-success/10 px-4 py-3.5 text-success'>
						<Shield className='size-6' />
						<div className='flex-1'>
							<strong className='text-sm'>XP Validated</strong>
							<span className='block text-xs opacity-80'>
								Recipe passes anti-cheat checks
							</span>
						</div>
						<span className='text-xs font-semibold text-muted-foreground'>
							{xpBreakdown.confidence}% confident
						</span>
					</div>
				</div>

				{/* Badges Preview */}
				<div className='mb-4'>
					<span className='mb-2.5 block text-xs text-muted-foreground'>
						Cooks can earn:
					</span>
					<div className='flex gap-2.5'>
						{(recipe.detectedBadges || []).map((badge, i) => (
							<motion.div
								key={i}
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ delay: i * 0.1, ...TRANSITION_SPRING }}
								whileHover={{ scale: 1.05 }}
								className='flex items-center gap-2 rounded-xl bg-bg px-4 py-2.5'
							>
								<span className='text-xl'>{badge.emoji}</span>
								<span className='text-xs font-semibold text-text'>
									{badge.name}
								</span>
							</motion.div>
						))}
					</div>
				</div>

				{/* Creator Incentive */}
				<div className='mb-5 flex items-center gap-3.5 rounded-2xl border border-xp/20 bg-xp/10 px-5 py-4'>
					<span className='text-3xl'>✨</span>
					<div>
						<strong className='text-sm text-xp'>You earn 4% XP</strong>{' '}
						<span className='text-sm text-text'>
							when others cook this recipe
						</span>
						<span className='block text-xs text-muted-foreground'>
							If 100 people cook this: +
							{Math.round(xpBreakdown.total * 0.04 * 100)} XP for you!
						</span>
					</div>
				</div>

				{/* Actions */}
				<div className='flex gap-3'>
					<motion.button
						onClick={onBack}
						whileHover={BUTTON_HOVER}
						whileTap={BUTTON_TAP}
						className='flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-bg py-3.5 text-sm font-semibold text-muted-foreground'
					>
						<Edit3 className='size-4' />
						Edit Recipe
					</motion.button>
					<motion.button
						onClick={() => setShowConfirm(true)}
						whileHover={BUTTON_HOVER}
						whileTap={BUTTON_TAP}
						className='flex flex-[2] items-center justify-center gap-2 rounded-xl bg-gradient-hero py-3.5 text-sm font-bold text-white shadow-lg'
					>
						<Send className='size-4' />
						Publish Recipe
						<kbd className='hidden rounded bg-white/20 px-1.5 py-0.5 text-xs font-normal md:inline-block'>
							{modKey}+↵
						</kbd>
					</motion.button>
				</div>

				{/* Publish Confirmation Dialog */}
				<AlertDialog
					open={showConfirm}
					onOpenChange={open => !isPublishing && setShowConfirm(open)}
				>
					<AlertDialogContent className='max-w-sm rounded-2xl border-border bg-bg-card'>
						<AlertDialogHeader className='text-center'>
							<div className='mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-gradient-hero'>
								<Rocket className='size-7 text-white' />
							</div>
							<AlertDialogTitle className='text-lg font-bold text-text'>
								Ready to go live?
							</AlertDialogTitle>
							<AlertDialogDescription className='text-sm text-muted-foreground'>
								<span className='font-medium text-text'>{recipe.title}</span>{' '}
								will be visible to the ChefKix community. You&apos;ll earn{' '}
								<span className='font-semibold text-xp'>
									{xpBreakdown.total} XP
								</span>{' '}
								when others cook it!
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter className='flex-row gap-3 sm:justify-center'>
							<AlertDialogCancel
								disabled={isPublishing}
								className='flex-1 rounded-xl border-border bg-bg text-muted-foreground hover:bg-muted disabled:opacity-50'
							>
								Wait, go back
							</AlertDialogCancel>
							{/* Use button instead of AlertDialogAction to prevent auto-close on async operation */}
							<button
								onClick={onPublish}
								disabled={isPublishing}
								className='flex-1 inline-flex items-center justify-center rounded-xl bg-gradient-hero px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none'
							>
								{isPublishing ? (
									<>
										<Loader2 className='mr-2 size-4 animate-spin' />
										Publishing...
									</>
								) : (
									<>
										<Rocket className='mr-2 size-4' />
										Publish!
									</>
								)}
							</button>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</motion.div>
		</motion.div>
	)
}

// ============================================
// MAIN COMPONENT
// ============================================

export const RecipeCreateAiFlow = ({
	onBack,
	onPublishSuccess,
	className,
	initialDraft,
	initialManualDraft,
}: RecipeCreateAiFlowProps) => {
	// If resuming a manual draft from localStorage, start in manual mode
	const [method, setMethod] = useState<CreateMethod>(
		initialManualDraft ? 'manual' : 'ai',
	)
	const [step, setStep] = useState<CreateStep>('input')
	const [rawText, setRawText] = useState('')
	const [parsingStep, setParsingStep] = useState(0)
	const [recipe, setRecipe] = useState<ParsedRecipe | null>(null)
	const [xpBreakdown, setXpBreakdown] = useState<XpBreakdown | null>(null)
	// Draft management state
	const [draftId, setDraftId] = useState<string | null>(null)
	const [isSaving, setIsSaving] = useState(false)
	const [isPublishing, setIsPublishing] = useState(false)
	const [isCalculatingXp, setIsCalculatingXp] = useState(false)
	// Track if user has edited the recipe (to know if we need to recalculate XP)
	const [hasEdited, setHasEdited] = useState(false)
	// Track previous step order to detect no-op reorders
	const [prevStepIds, setPrevStepIds] = useState<string[]>([])
	// Cover image upload
	const coverImageRef = React.useRef<HTMLInputElement>(null)
	const [isUploadingCover, setIsUploadingCover] = useState(false)

	// Load initialDraft when provided (from draft listing)
	useEffect(() => {
		if (initialDraft) {
			// Convert Recipe to ParsedRecipe format
			// Note: Recipe type uses BE field names, ParsedRecipe uses FE/AI field names
			const parsedRecipe: ParsedRecipe = {
				title: initialDraft.title,
				description: initialDraft.description || '',
				coverImageUrl: initialDraft.coverImageUrl?.[0] || undefined, // Recipe has array
				cookTime: `${initialDraft.cookTimeMinutes || initialDraft.totalTimeMinutes || 0} min`,
				servings: initialDraft.servings,
				cuisine: initialDraft.cuisineType || '',
				difficulty: initialDraft.difficulty,
				ingredients: (initialDraft.fullIngredientList || []).map(
					(ing, idx) => ({
						id: `ing-${idx}`,
						name: ing.name,
						quantity: `${ing.quantity || ''} ${ing.unit || ''}`.trim(), // Combine quantity + unit
					}),
				),
				steps: (initialDraft.steps || []).map((step, idx) => ({
					id: `step-${idx}`,
					instruction: step.description, // BE uses 'description', ParsedRecipe uses 'instruction'
					timerSeconds: step.timerSeconds || undefined,
					technique: step.action, // BE uses 'action', ParsedRecipe uses 'technique'
					imageUrl: step.imageUrl,
				})),
				skillTags: initialDraft.skillTags || [],
				detectedBadges: (initialDraft.rewardBadges || []).map(b => ({
					emoji: '🏆',
					name: b,
				})),
				xpReward: initialDraft.xpReward,
				difficultyMultiplier: initialDraft.difficultyMultiplier,
			}

			setRecipe(parsedRecipe)
			setDraftId(initialDraft.id)
			setStep('preview')

			// Load XP breakdown if available (convert from Recipe's XpBreakdown to component's XpBreakdown)
			if (initialDraft.xpBreakdown) {
				const breakdown = initialDraft.xpBreakdown
				setXpBreakdown({
					base: breakdown.base,
					steps: breakdown.steps,
					time: breakdown.time,
					techniques: breakdown.techniques
						? [{ name: 'Techniques', xp: breakdown.techniques }]
						: [],
					total: breakdown.total,
					isValidated: true,
					confidence: 1,
				})
			}
		}
	}, [initialDraft])

	const handlePaste = useCallback(async () => {
		try {
			const text = await navigator.clipboard.readText()
			setRawText(text)
		} catch (err) {
			console.error('Failed to read clipboard:', err)
		}
	}, [])

	// Cover image upload handler
	const handleCoverImageUpload = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0]
			if (!file || !recipe) return

			setIsUploadingCover(true)

			// Show local preview immediately for better UX
			const localPreviewUrl = URL.createObjectURL(file)
			setRecipe({ ...recipe, coverImageUrl: localPreviewUrl })

			try {
				// Upload to server
				const response = await uploadRecipeImages([file])
				if (response.success && response.data?.[0]) {
					// Replace local preview with server URL
					setRecipe(prev =>
						prev ? { ...prev, coverImageUrl: response.data![0] } : prev,
					)
					toast.success('Cover image uploaded!')
				} else {
					// Upload failed - keep local preview but warn user
					toast.error('Image upload failed', {
						description:
							"Using local preview. Image won't persist after page refresh.",
					})
				}
			} catch (error) {
				console.error('Cover image upload error:', error)
				toast.error('Image upload failed', {
					description:
						"Using local preview. Image won't persist after page refresh.",
				})
			} finally {
				setIsUploadingCover(false)
				// Reset file input so same file can be selected again
				if (coverImageRef.current) {
					coverImageRef.current.value = ''
				}
			}
		},
		[recipe],
	)

	// Save draft handler - creates draft if needed, then saves
	// Can accept an optional targetRecipe to use instead of state (for manual mode save)
	const handleSaveDraft = useCallback(
		async (targetRecipe?: ParsedRecipe) => {
			const recipeToSave = targetRecipe || recipe
			if (!recipeToSave) return

			setIsSaving(true)
			try {
				let currentDraftId = draftId

				// Create draft if we don't have one
				if (!currentDraftId) {
					const createResponse = await createDraft()
					if (!createResponse.success || !createResponse.data) {
						toast.error('Failed to create draft')
						setIsSaving(false)
						return
					}
					currentDraftId = createResponse.data.id
					setDraftId(currentDraftId)
				}

				// Debug logging to trace data flow
				console.log(
					'[handleSaveDraft] recipeToSave:',
					JSON.stringify(recipeToSave, null, 2),
				)

				const savePayload = {
					title: recipeToSave.title,
					description: recipeToSave.description,
					coverImageUrl: recipeToSave.coverImageUrl
						? [recipeToSave.coverImageUrl]
						: undefined,
					difficulty: recipeToSave.difficulty,
					cookTimeMinutes: parseInt(recipeToSave.cookTime) || 30,
					servings: recipeToSave.servings,
					cuisineType: recipeToSave.cuisine,
					fullIngredientList: (recipeToSave.ingredients || []).map(i => {
						// Parse "2 cup" back to { quantity: "2", unit: "cup" }
						// Handle edge cases: " cup" (empty amount), "2" (no unit), etc.
						const parts = i.quantity.trim().split(' ')
						const quantity = parts[0] || ''
						const unit = parts.slice(1).join(' ') || ''
						return { name: i.name, quantity, unit }
					}),
					steps: (recipeToSave.steps || []).map((s, i) => ({
						stepNumber: i + 1,
						description: s.instruction,
						action: s.technique,
						timerSeconds: s.timerSeconds || undefined,
						imageUrl: s.imageUrl,
					})),
					// Gamification: full transparency (save breakdown, not just total)
					rewardBadges: (recipeToSave.detectedBadges || []).map(b => b.name),
					skillTags: recipeToSave.skillTags || [],
					xpReward: xpBreakdown?.total || recipeToSave.xpReward,
					xpBreakdown: xpBreakdown
						? {
								base: xpBreakdown.base,
								steps: xpBreakdown.steps,
								time: xpBreakdown.time,
								techniques:
									xpBreakdown.techniques?.reduce((sum, t) => sum + t.xp, 0) ||
									0,
								total: xpBreakdown.total,
							}
						: recipeToSave.xpBreakdown,
					difficultyMultiplier: recipeToSave.difficultyMultiplier,
				}

				console.log(
					'[handleSaveDraft] savePayload:',
					JSON.stringify(savePayload, null, 2),
				)

				const saveResponse = await saveDraft(currentDraftId, savePayload)

				if (saveResponse.success) {
					toast.success('Draft saved!', {
						description:
							'Your recipe has been saved. You can continue editing later.',
					})
				} else {
					console.error(
						'Save draft failed:',
						JSON.stringify(saveResponse, null, 2),
					)
					toast.error('Failed to save draft', {
						description:
							saveResponse.message ||
							`Error ${saveResponse.statusCode || 'unknown'}. Please try again.`,
					})
				}
			} catch (err) {
				console.error(
					'Save draft error:',
					err instanceof Error ? err.message : err,
				)
				const axiosError = err as {
					response?: { status?: number; data?: { message?: string } }
				}
				const message =
					axiosError.response?.data?.message ||
					(err instanceof Error ? err.message : 'Unknown error')
				const status = axiosError.response?.status
				toast.error('Failed to save draft', {
					description:
						status === 401
							? 'Session expired. Please log in again.'
							: status === 403
								? 'You do not have permission to save this draft.'
								: status === 400
									? `Invalid data: ${message}`
									: 'Network error. Please check your connection.',
				})
			} finally {
				setIsSaving(false)
			}
		},
		[recipe, draftId, xpBreakdown],
	)

	const handleParse = useCallback(async () => {
		if (!rawText.trim()) {
			toast.error('Please paste some recipe text first')
			return
		}

		setStep('parsing')
		setParsingStep(0)

		// Progress animation
		const progressInterval = setInterval(() => {
			setParsingStep(prev => Math.min(prev + 1, 3))
		}, 600)

		try {
			// Call real AI service
			console.debug('[RecipeCreateAiFlow] Calling processRecipe...')
			const response = await processRecipe(rawText)
			console.debug('[RecipeCreateAiFlow] Response:', response)

			clearInterval(progressInterval)
			setParsingStep(4)

			if (response.success && response.data) {
				console.debug('[RecipeCreateAiFlow] Transforming recipe...')
				const parsed = transformProcessedRecipe(response.data)
				if (parsed) {
					console.debug('[RecipeCreateAiFlow] Transform success:', parsed.title)
					setRecipe(parsed)
					// Save initial step order for smart reorder detection
					setPrevStepIds(parsed.steps.map(s => s.id))
					setStep('preview')
					toast.success('Recipe parsed successfully!', {
						description: `Found ${parsed.steps.length} steps and ${parsed.ingredients.length} ingredients`,
					})
				} else {
					console.error('[RecipeCreateAiFlow] Transform returned null')
					toast.error('Failed to parse recipe', {
						description: 'The AI response could not be processed. Try again.',
					})
					setStep('input')
				}
			} else {
				console.error('[RecipeCreateAiFlow] Recipe parse failed:', response)
				// Show user-friendly error message
				const errorMessage = response.message || 'Unknown error occurred'
				toast.error('Recipe parsing failed', {
					description: errorMessage,
				})
				setStep('input')
			}
		} catch (err) {
			clearInterval(progressInterval)
			console.error('[RecipeCreateAiFlow] Exception:', err)
			toast.error('Recipe parsing failed', {
				description:
					err instanceof Error
						? err.message
						: 'Network error. Check your connection.',
			})
			setStep('input')
		}
	}, [rawText])

	const handlePreviewXp = useCallback(async () => {
		if (!recipe || isCalculatingXp) return

		// If AI already calculated XP with breakdown and user hasn't edited, use it directly
		// Per spec 14-ai-integration.txt: calculate_metas is only for manual/edited recipes
		if (!hasEdited && recipe.xpBreakdown && method === 'ai') {
			console.debug(
				'[handlePreviewXp] Using full XP breakdown from AI parsing:',
				recipe.xpBreakdown,
			)
			// Use the REAL breakdown from AI - no more estimation!
			const aiBreakdown = recipe.xpBreakdown
			setXpBreakdown({
				base: aiBreakdown.base,
				steps: aiBreakdown.steps,
				time: aiBreakdown.time,
				techniques: aiBreakdown.techniques
					? [
							{
								name: aiBreakdown.techniquesReason || 'Techniques',
								xp: aiBreakdown.techniques,
							},
						]
					: [],
				total: aiBreakdown.total,
				isValidated: true, // AI already validated
				confidence: 95, // High confidence since AI computed it
			})
			setStep('xp-preview')
			return
		}

		// User edited the recipe OR it's manual entry - need to recalculate
		setIsCalculatingXp(true)
		console.debug(
			'[handlePreviewXp] Calling calculateMetas (hasEdited:',
			hasEdited,
			', method:',
			method,
			')',
		)

		// Build request for calculate-metas API
		const metasRequest = {
			title: recipe.title,
			description: recipe.description,
			difficulty: recipe.difficulty,
			prep_time_minutes: 10, // Default since not captured
			cook_time_minutes: parseInt(recipe.cookTime) || 30,
			servings: recipe.servings,
			cuisine_type: recipe.cuisine,
			dietary_tags: [],
			full_ingredient_list: (recipe.ingredients || []).map(i => {
				const parts = i.quantity.trim().split(' ')
				return {
					name: i.name,
					quantity: parts[0] || '',
					unit: parts.slice(1).join(' ') || '',
				}
			}),
			steps: (recipe.steps || []).map((s, i) => ({
				step_number: i + 1,
				description: s.instruction,
				action: s.technique,
				timer_seconds: s.timerSeconds || undefined,
			})),
			include_enrichment: true,
		}

		console.debug(
			'[handlePreviewXp] Calling calculateMetas with:',
			metasRequest,
		)

		try {
			const response = await calculateMetas(metasRequest)

			if (response.success && response.data) {
				const data = response.data

				// Update recipe with badges from calculate_metas (fixes manual entry showing no badges)
				if (recipe && data.badges && data.badges.length > 0) {
					setRecipe({
						...recipe,
						detectedBadges: data.badges.map(badge => ({
							emoji: '🏆',
							name: badge,
						})),
						xpReward: data.xpReward,
						skillTags: data.skillTags,
					})
				}

				setXpBreakdown({
					base: data.xpBreakdown.base,
					steps: data.xpBreakdown.steps,
					time: data.xpBreakdown.time,
					techniques:
						data.skillTags?.map(tag => ({
							name: tag,
							xp: data.xpBreakdown.techniques || 0,
						})) || [],
					total: data.xpBreakdown.total,
					isValidated: data.xpValidated,
					confidence: data.validationConfidence,
				})
				setStep('xp-preview')
			} else {
				// Log the failed response for debugging
				console.warn('[handlePreviewXp] calculateMetas failed:', response)
				toast.error('Could not calculate XP', {
					description: response.message || 'Using default values',
				})
				// Fallback: still show XP preview with empty values
				setXpBreakdown({
					base: 0,
					steps: 0,
					time: 0,
					techniques: [],
					total: 0,
					isValidated: false,
					confidence: 0,
				})
				setStep('xp-preview')
			}
		} catch (err) {
			console.error('[handlePreviewXp] XP calculation error:', err)
			toast.error('XP calculation failed', {
				description: 'Please try again',
			})
			// Fallback
			setXpBreakdown({
				base: 0,
				steps: 0,
				time: 0,
				techniques: [],
				total: 0,
				isValidated: false,
				confidence: 0,
			})
			setStep('xp-preview')
		} finally {
			setIsCalculatingXp(false)
		}
	}, [recipe, hasEdited, method, isCalculatingXp])

	// Full publish flow: Save Draft → Validate → Publish
	// Accepts optional recipeToPublish for manual entry flow
	const handlePublish = useCallback(
		async (recipeToPublish?: ParsedRecipe) => {
			const targetRecipe = recipeToPublish || recipe
			if (!targetRecipe || isPublishing) return

			// ============================================
			// STEP 0: Pre-publish validation (FE guard)
			// Catches missing required fields BEFORE hitting backend
			// ============================================
			const validationErrors = validateRecipeForPublish(targetRecipe)
			if (validationErrors.length > 0) {
				// Show first error as the primary message, list all in description
				const primaryError = validationErrors[0]
				const allHints = validationErrors.map(e => `• ${e.hint}`).join('\n')

				toast.error(primaryError.message, {
					description:
						validationErrors.length === 1
							? primaryError.hint
							: `Please fix the following:\n${allHints}`,
					duration: 6000, // Longer duration for actionable feedback
				})
				return // Don't proceed, don't set isPublishing
			}

			setIsPublishing(true)

			try {
				// Step 1: Ensure draft exists
				let currentDraftId = draftId
				if (!currentDraftId) {
					// Create draft first
					const createResponse = await createDraft()
					if (!createResponse.success || !createResponse.data) {
						toast.error('Failed to save recipe', {
							description: 'Could not create draft. Please try again.',
						})
						setIsPublishing(false)
						return
					}
					currentDraftId = createResponse.data.id
					setDraftId(currentDraftId)
				}

				// Step 2: Save all recipe data to draft
				const saveResponse = await saveDraft(currentDraftId, {
					title: targetRecipe.title,
					description: targetRecipe.description,
					coverImageUrl: targetRecipe.coverImageUrl
						? [targetRecipe.coverImageUrl]
						: undefined,
					difficulty: targetRecipe.difficulty,
					cookTimeMinutes: parseInt(targetRecipe.cookTime) || 30,
					servings: targetRecipe.servings,
					cuisineType: targetRecipe.cuisine,
					fullIngredientList: (targetRecipe.ingredients || []).map(i => {
						const parts = i.quantity.trim().split(' ')
						return {
							name: i.name,
							quantity: parts[0] || '',
							unit: parts.slice(1).join(' ') || '',
						}
					}),
					steps: (targetRecipe.steps || []).map((s, i) => ({
						stepNumber: i + 1,
						description: s.instruction,
						action: s.technique,
						timerSeconds: s.timerSeconds || undefined,
						imageUrl: s.imageUrl,
					})),
					// Gamification: full transparency (save breakdown, not just total)
					rewardBadges: (targetRecipe.detectedBadges || []).map(b => b.name),
					skillTags: targetRecipe.skillTags || [],
					xpReward: xpBreakdown?.total || targetRecipe.xpReward,
					xpBreakdown: xpBreakdown
						? {
								base: xpBreakdown.base,
								steps: xpBreakdown.steps,
								time: xpBreakdown.time,
								techniques:
									xpBreakdown.techniques?.reduce((sum, t) => sum + t.xp, 0) ||
									0,
								total: xpBreakdown.total,
							}
						: targetRecipe.xpBreakdown,
					difficultyMultiplier: targetRecipe.difficultyMultiplier,
				})

				// Check if save succeeded
				if (!saveResponse.success) {
					const errorMessage = mapBackendErrorToEnglish(
						saveResponse.message || 'Unknown error',
					)
					toast.error('Failed to save recipe', {
						description: errorMessage,
					})
					setIsPublishing(false)
					return
				}

				// Step 3: Validate recipe for safety (per spec 14-ai-integration.txt)
				const validationResponse = await validateRecipe({
					title: targetRecipe.title,
					description: targetRecipe.description,
					ingredients: (targetRecipe.ingredients || []).map(i => i.name),
					steps: (targetRecipe.steps || []).map(s => s.instruction),
					check_safety: true,
				})

				if (
					!validationResponse.success ||
					!validationResponse.data?.contentSafe
				) {
					const issues = validationResponse.data?.issues || [
						'Content validation failed',
					]
					toast.error('Recipe cannot be published', {
						description: issues.join(', '),
					})
					setIsPublishing(false)
					return
				}

				// Step 4: Publish the draft
				const publishResponse = await publishRecipe(currentDraftId)

				if (publishResponse.success) {
					// 🎉 CELEBRATION! Recipe creation deserves fanfare
					triggerRecipeCompleteConfetti()

					toast.success('Recipe published! 🎉', {
						description: `"${targetRecipe.title}" is now live! You earned ${targetRecipe.xpReward || 0} XP`,
					})
					// Notify parent of success (for navigation)
					onPublishSuccess?.(currentDraftId)
				} else {
					// Map backend error to English and provide actionable feedback
					const errorMessage = mapBackendErrorToEnglish(
						publishResponse.message || 'Unknown error',
					)
					toast.error('Cannot publish recipe', {
						description: errorMessage,
						duration: 5000,
					})
				}
			} catch (error) {
				console.error('[handlePublish] Error:', error)
				toast.error('Something went wrong', {
					description: 'Please try again later',
				})
			} finally {
				setIsPublishing(false)
			}
		},
		[recipe, draftId, xpBreakdown, isPublishing, onPublishSuccess],
	)

	// Keyboard shortcuts: Ctrl+S = save draft, Ctrl+Enter = context-aware submit
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Ctrl+S or Cmd+S: Save draft (in preview or xp-preview step with a recipe)
			if ((e.ctrlKey || e.metaKey) && e.key === 's') {
				e.preventDefault()
				if (recipe && (step === 'preview' || step === 'xp-preview')) {
					handleSaveDraft()
				}
			}
			// Ctrl+Enter or Cmd+Enter: Context-aware submit action
			if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
				e.preventDefault()
				if (step === 'input' && rawText.trim()) {
					handleParse()
				} else if (step === 'preview' && recipe) {
					handlePreviewXp()
				} else if (step === 'xp-preview' && recipe && xpBreakdown) {
					handlePublish()
				}
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [
		step,
		recipe,
		rawText,
		xpBreakdown,
		handleParse,
		handlePreviewXp,
		handlePublish,
		handleSaveDraft,
	])

	const removeIngredient = (id: string) => {
		if (!recipe) return
		setHasEdited(true)
		setRecipe({
			...recipe,
			ingredients: (recipe.ingredients || []).filter(i => i.id !== id),
		})
	}

	const addIngredient = () => {
		if (!recipe) return
		setHasEdited(true)
		const newId = `ing-${Date.now()}`
		setRecipe({
			...recipe,
			ingredients: [
				...(recipe.ingredients || []),
				{ id: newId, quantity: '', name: '' },
			],
		})
	}

	const updateIngredient = (id: string, updates: Partial<Ingredient>) => {
		if (!recipe) return
		setHasEdited(true)
		setRecipe({
			...recipe,
			ingredients: (recipe.ingredients || []).map(i =>
				i.id === id ? { ...i, ...updates } : i,
			),
		})
	}

	const removeStep = (id: string) => {
		if (!recipe) return
		setHasEdited(true)
		setRecipe({
			...recipe,
			steps: (recipe.steps || []).filter(s => s.id !== id),
		})
	}

	const addStep = () => {
		if (!recipe) return
		setHasEdited(true)
		const newId = `step-${Date.now()}`
		setRecipe({
			...recipe,
			steps: [...(recipe.steps || []), { id: newId, instruction: '' }],
		})
	}

	const updateStep = (id: string, updates: Partial<RecipeStep>) => {
		if (!recipe) return
		setHasEdited(true)
		setRecipe({
			...recipe,
			steps: (recipe.steps || []).map(s =>
				s.id === id ? { ...s, ...updates } : s,
			),
		})
	}

	return (
		<div className={cn('mx-auto max-w-3xl space-y-5 p-5', className)}>
			{/* Header */}
			<div className='flex items-center gap-4'>
				{onBack && (
					<button
						onClick={onBack}
						className='flex size-10 items-center justify-center rounded-xl border border-border bg-panel-bg text-text'
					>
						<ArrowLeft className='size-5' />
					</button>
				)}
				<h1 className='flex-1 text-2xl font-extrabold text-text'>
					{step === 'preview' ? 'Review Recipe' : 'Create Recipe'}
				</h1>
				{step === 'preview' && (
					<button
						onClick={() => handleSaveDraft()}
						disabled={isSaving}
						className='flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50'
					>
						{isSaving ? 'Saving...' : 'Save Draft'}
						{!isSaving && (
							<kbd className='hidden rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal md:inline-block'>
								{modKey}+S
							</kbd>
						)}
					</button>
				)}
			</div>

			{/* Step Content - Animated transitions between steps */}
			<AnimatePresence mode='wait'>
				{/* Step: Input */}
				{step === 'input' && (
					<motion.div
						key='input-step'
						variants={STEP_VARIANTS}
						initial='initial'
						animate='animate'
						exit='exit'
						transition={STEP_TRANSITION}
						className='space-y-5'
					>
						{/* Method Selection */}
						<div className='grid gap-4 md:grid-cols-2'>
							<MethodCard
								method='ai'
								icon={<Wand2 className='size-6' />}
								title='Paste & Parse'
								description='AI extracts recipe from text'
								isActive={method === 'ai'}
								badge='✨ Recommended'
								onClick={() => setMethod('ai')}
							/>
							<MethodCard
								method='manual'
								icon={<Edit3 className='size-6' />}
								title='Manual Entry'
								description='Fill in all fields yourself'
								isActive={method === 'manual'}
								onClick={() => setMethod('manual')}
							/>
						</div>

						{/* Method Content - Animated switch between AI and Manual */}
						<AnimatePresence mode='wait'>
							{/* Paste Section (AI method) */}
							{method === 'ai' && (
								<motion.div
									key='ai-method'
									variants={CONTENT_SWITCH_VARIANTS}
									initial='initial'
									animate='animate'
									exit='exit'
									transition={CONTENT_SWITCH_TRANSITION}
									className='rounded-2xl bg-panel-bg p-6'
								>
									<div className='mb-4'>
										<h3 className='text-lg font-bold text-text'>
											Paste your recipe
										</h3>
										<p className='text-sm text-muted-foreground'>
											From a website, document, or notes
										</p>
									</div>

									<div className='mb-5'>
										<PasteArea
											value={rawText}
											onChange={setRawText}
											onPaste={handlePaste}
											charCount={rawText.length}
										/>
									</div>

									<motion.button
										onClick={handleParse}
										disabled={!rawText.trim()}
										whileHover={rawText.trim() ? BUTTON_HOVER : undefined}
										whileTap={rawText.trim() ? BUTTON_TAP : undefined}
										className={cn(
											'flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-base font-bold text-white transition-all',
											rawText.trim()
												? 'bg-gradient-hero shadow-lg hover:shadow-xl'
												: 'cursor-not-allowed bg-muted/50',
										)}
									>
										<Sparkles className='size-5' />
										Parse Recipe
										{rawText.trim() && (
											<kbd className='ml-2 hidden rounded bg-white/20 px-1.5 py-0.5 text-xs font-normal md:inline-block'>
												{modKey}+↵
											</kbd>
										)}
									</motion.button>
								</motion.div>
							)}

							{/* Manual Entry Form */}
							{method === 'manual' && (
								<motion.div
									key='manual-method'
									variants={CONTENT_SWITCH_VARIANTS}
									initial='initial'
									animate='animate'
									exit='exit'
									transition={CONTENT_SWITCH_TRANSITION}
								>
									<RecipeFormDetailed
										initialData={initialManualDraft}
										onSubmit={async data => {
											// Clear local draft on submit (it will be server-saved)
											localStorage.removeItem('chefkix-recipe-draft')
											// Convert RecipeFormData to ParsedRecipe format
											const parsed: ParsedRecipe = {
												title: data.title,
												description: data.description,
												coverImageUrl: data.coverImageUrl,
												cookTime: `${data.cookTimeMinutes} min`,
												// RecipeFormDetailed now uses Title Case difficulty directly
												difficulty: data.difficulty,
												servings: data.servings,
												cuisine: data.category || 'General',
												ingredients: (data.ingredients || []).map(i => ({
													id: i.id,
													quantity: `${i.amount} ${i.unit}`,
													name: i.name,
												})),
												steps: (data.steps || []).map(s => ({
													id: s.id,
													instruction: s.instruction,
													timerSeconds: s.timerSeconds,
													imageUrl: s.imageUrl,
												})),
												detectedBadges: [],
												// Manual entry has no XP yet - must calculate
											}
											// Set recipe and go to preview step (same as AI flow)
											// This ensures XP is calculated via calculate_metas
											setRecipe(parsed)
											// Save initial step order for smart reorder detection
											setPrevStepIds((parsed.steps || []).map(s => s.id))
											setHasEdited(true) // Manual = needs XP calculation
											setStep('preview')
											toast.success('Recipe ready for review!', {
												description: 'Preview XP calculation before publishing',
											})
										}}
										onSaveDraft={async data => {
											// Convert RecipeFormData to ParsedRecipe for server save
											const parsed: ParsedRecipe = {
												title: data.title,
												description: data.description,
												coverImageUrl: data.coverImageUrl,
												cookTime: `${data.cookTimeMinutes} min`,
												difficulty: data.difficulty,
												servings: data.servings,
												cuisine: data.category || 'General',
												ingredients: (data.ingredients || []).map(i => ({
													id: i.id,
													quantity: `${i.amount} ${i.unit}`,
													name: i.name,
												})),
												steps: (data.steps || []).map(s => ({
													id: s.id,
													instruction: s.instruction,
													timerSeconds: s.timerSeconds,
													imageUrl: s.imageUrl,
												})),
												detectedBadges: [],
											}
											// Also save to localStorage as backup
											try {
												const draft = {
													type: 'manual' as const,
													data,
													savedAt: new Date().toISOString(),
												}
												localStorage.setItem(
													'chefkix-recipe-draft',
													JSON.stringify(draft),
												)
											} catch {
												// localStorage save is best-effort
											}
											// Save to server
											await handleSaveDraft(parsed)
										}}
										isSaving={isSaving}
										isSubmitting={isPublishing}
										// No onCancel - header already has back button
										className='-mx-5 -mb-5'
									/>
								</motion.div>
							)}
						</AnimatePresence>
					</motion.div>
				)}

				{/* Step: Preview */}
				{step === 'preview' && recipe && (
					<motion.div
						key='preview-step'
						variants={STEP_VARIANTS}
						initial='initial'
						animate='animate'
						exit='exit'
						transition={STEP_TRANSITION}
						className='space-y-5'
					>
						{/* Success Banner with XP Preview */}
						<div className='flex items-center justify-between gap-3.5 rounded-2xl border border-success/20 bg-gradient-to-r from-success/10 to-emerald-500/5 px-5 py-4'>
							<div className='flex items-center gap-3.5'>
								<span className='text-3xl'>✨</span>
								<div>
									<strong className='text-sm text-success'>
										Recipe parsed successfully!
									</strong>
									<span className='block text-xs text-muted-foreground'>
										{hasEdited
											? 'You made edits — click Preview XP to recalculate'
											: 'Review and edit below, then publish'}
									</span>
								</div>
							</div>
							{/* Show XP badge immediately if we have it from AI */}
							{recipe.xpReward && !hasEdited && (
								<motion.div
									initial={{ opacity: 0, scale: 0.8 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={TRANSITION_SPRING}
									className='flex items-center gap-2 rounded-xl bg-xp/10 px-4 py-2'
								>
									<span className='text-lg'>⭐</span>
									<div className='text-right'>
										<div className='text-lg font-bold text-xp'>
											+{recipe.xpReward} XP
										</div>
										<div className='text-xs text-muted-foreground'>
											{recipe.detectedBadges.length} badge
											{recipe.detectedBadges.length !== 1 ? 's' : ''}
										</div>
									</div>
								</motion.div>
							)}
							{hasEdited && (
								<div className='flex items-center gap-2 rounded-xl bg-warning/10 px-3 py-2 flex-shrink-0'>
									<AlertTriangle className='size-4 text-warning flex-shrink-0' />
									<span className='text-xs font-medium text-warning whitespace-nowrap'>
										Recalculate XP
									</span>
								</div>
							)}
						</div>

						{/* Recipe Card */}
						<div className='rounded-2xl bg-panel-bg p-6'>
							{/* Cover Image */}
							<div className='mb-5'>
								{recipe.coverImageUrl ? (
									<div className='relative'>
										<Image
											src={recipe.coverImageUrl}
											alt={recipe.title}
											width={600}
											height={176}
											className={cn(
												'h-44 w-full rounded-2xl object-cover',
												isUploadingCover && 'opacity-60',
											)}
										/>
										{isUploadingCover && (
											<div className='absolute inset-0 flex items-center justify-center'>
												<Loader2 className='size-8 animate-spin text-white' />
											</div>
										)}
										<button
											onClick={() =>
												setRecipe({ ...recipe, coverImageUrl: undefined })
											}
											disabled={isUploadingCover}
											className='absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-500 disabled:opacity-50'
										>
											<X className='size-4' />
										</button>
										<button
											onClick={() => coverImageRef.current?.click()}
											disabled={isUploadingCover}
											className='absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/80 disabled:opacity-50'
										>
											<ImagePlus className='size-3.5' />
											Change
										</button>
									</div>
								) : (
									<button
										onClick={() => coverImageRef.current?.click()}
										disabled={isUploadingCover}
										className='flex h-44 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-bg text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50'
									>
										{isUploadingCover ? (
											<>
												<Loader2 className='size-8 animate-spin' />
												<span className='text-sm'>Uploading...</span>
											</>
										) : (
											<>
												<ImagePlus className='size-8' />
												<span className='text-sm'>Add Cover Photo</span>
											</>
										)}
									</button>
								)}
								<input
									ref={coverImageRef}
									type='file'
									accept='image/*'
									onChange={handleCoverImageUpload}
									className='hidden'
								/>
							</div>

							{/* Title */}
							<div className='mb-4'>
								<label className='mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
									Recipe Title
								</label>
								<input
									type='text'
									value={recipe.title}
									onChange={e => {
										setHasEdited(true)
										setRecipe({ ...recipe, title: e.target.value })
									}}
									className='w-full rounded-xl border-2 border-transparent bg-bg px-4 py-3 text-xl font-bold text-text focus:border-primary focus:outline-none'
								/>
							</div>

							{/* Description */}
							<div className='mb-4'>
								<label className='mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
									Description
								</label>
								<textarea
									value={recipe.description}
									onChange={e => {
										setHasEdited(true)
										setRecipe({ ...recipe, description: e.target.value })
									}}
									className='min-h-20 w-full resize-y rounded-xl border-2 border-transparent bg-bg px-4 py-3 text-sm text-text focus:border-primary focus:outline-none'
								/>
							</div>

							{/* Meta Row - All Editable */}
							<div className='mb-4 flex flex-wrap gap-2.5'>
								{/* Cook Time - Editable */}
								<div className='flex items-center gap-1.5 rounded-lg bg-bg px-2 py-1'>
									<Clock className='size-4 text-muted-foreground' />
									<input
										type='text'
										value={recipe.cookTime}
										onChange={e => {
											setHasEdited(true)
											setRecipe({ ...recipe, cookTime: e.target.value })
										}}
										className='w-20 border-none bg-transparent text-xs font-semibold text-text focus:outline-none'
										placeholder='30 min'
									/>
								</div>
								{/* Difficulty - Read-only (AI determines for XP fairness) */}
								<div
									className='group relative flex items-center gap-1.5 rounded-lg bg-bg px-3.5 py-2 cursor-help'
									title='Difficulty is determined by AI based on techniques and complexity. This ensures fair XP calculation.'
								>
									<Signal className='size-4 text-muted-foreground' />
									<span className='text-xs font-semibold text-text'>
										{recipe.difficulty}
									</span>
									<Lock className='size-3 text-muted-foreground/50' />
								</div>
								{/* Servings - Editable */}
								<div className='flex items-center gap-1.5 rounded-lg bg-bg px-2 py-1'>
									<Utensils className='size-4 text-muted-foreground' />
									<input
										type='number'
										min={1}
										max={50}
										value={recipe.servings}
										onChange={e => {
											setHasEdited(true)
											setRecipe({
												...recipe,
												servings: parseInt(e.target.value) || 1,
											})
										}}
										className='w-12 border-none bg-transparent text-xs font-semibold text-text focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
									/>
									<span className='text-xs text-muted-foreground'>
										servings
									</span>
								</div>
								{/* Cuisine - Editable */}
								<div className='flex items-center gap-1.5 rounded-lg bg-bg px-2 py-1'>
									<span>🌏</span>
									<input
										type='text'
										value={recipe.cuisine}
										onChange={e => {
											setHasEdited(true)
											setRecipe({ ...recipe, cuisine: e.target.value })
										}}
										className='w-24 border-none bg-transparent text-xs font-semibold text-text focus:outline-none'
										placeholder='Cuisine'
									/>
								</div>
							</div>

							{/* Detected Badges */}
							<div className='flex flex-wrap items-center gap-3'>
								<span className='text-xs text-muted-foreground'>
									Potential Badges:
								</span>
								{(recipe.detectedBadges || []).map((badge, i) => (
									<motion.span
										key={i}
										initial={{ opacity: 0, scale: 0.8 }}
										animate={{ opacity: 1, scale: 1 }}
										transition={{ delay: i * 0.1, ...TRANSITION_SPRING }}
										whileHover={{ scale: 1.05 }}
										className='rounded-lg border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary cursor-default'
									>
										{badge.emoji} {badge.name}
									</motion.span>
								))}
							</div>
						</div>

						{/* Ingredients Section */}
						<div className='rounded-2xl bg-panel-bg p-6'>
							<div className='mb-4 flex items-center justify-between'>
								<h3 className='flex items-center gap-2.5 text-lg font-bold text-text'>
									<ShoppingBasket className='size-5 text-primary' />
									Ingredients
								</h3>
								<motion.button
									onClick={addIngredient}
									whileHover={BUTTON_HOVER}
									whileTap={BUTTON_TAP}
									className='flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary'
								>
									<Plus className='size-4' />
									Add
								</motion.button>
							</div>
							<div className='space-y-2'>
								<AnimatePresence initial={false}>
									{(recipe.ingredients || []).map(ing => (
										<motion.div
											key={ing.id}
											initial={{ opacity: 0, height: 0, y: -10 }}
											animate={{ opacity: 1, height: 'auto', y: 0 }}
											exit={{ opacity: 0, height: 0, y: -10 }}
											transition={TRANSITION_SPRING}
										>
											<IngredientItem
												ingredient={ing}
												onRemove={() => removeIngredient(ing.id)}
												onUpdate={updates => updateIngredient(ing.id, updates)}
											/>
										</motion.div>
									))}
								</AnimatePresence>
							</div>
						</div>

						{/* Steps Section */}
						<div className='rounded-2xl bg-panel-bg p-6'>
							<div className='mb-4 flex items-center justify-between'>
								<h3 className='flex items-center gap-2.5 text-lg font-bold text-text'>
									<ListOrdered className='size-5 text-primary' />
									Instructions
								</h3>
								<motion.button
									onClick={addStep}
									whileHover={BUTTON_HOVER}
									whileTap={BUTTON_TAP}
									className='flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary'
								>
									<Plus className='size-4' />
									Add Step
								</motion.button>
							</div>
							<Reorder.Group
								axis='y'
								values={recipe.steps || []}
								onReorder={newSteps => {
									// Smart reorder detection: only mark as edited if order actually changed from original
									const newStepIds = newSteps.map(s => s.id).join(',')
									const originalStepIds = prevStepIds.join(',')
									if (newStepIds !== originalStepIds) {
										setHasEdited(true)
									}
									setRecipe({
										...recipe,
										steps: newSteps,
									})
								}}
								className='space-y-3'
							>
								{(recipe.steps || []).map((s, i) => (
									<Reorder.Item
										key={s.id}
										value={s}
										className='cursor-grab active:cursor-grabbing'
									>
										<StepItem
											step={s}
											index={i}
											onRemove={() => removeStep(s.id)}
											onUpdate={updates => updateStep(s.id, updates)}
										/>
									</Reorder.Item>
								))}
							</Reorder.Group>
						</div>

						{/* Preview XP Button */}
						<div className='sticky bottom-5 pt-4'>
							<motion.button
								onClick={handlePreviewXp}
								disabled={isCalculatingXp}
								whileHover={isCalculatingXp ? {} : BUTTON_HOVER}
								whileTap={isCalculatingXp ? {} : BUTTON_TAP}
								className='flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-hero py-4.5 shadow-xl disabled:opacity-70 disabled:cursor-not-allowed'
							>
								{isCalculatingXp ? (
									<>
										<Loader2 className='size-5 text-white animate-spin' />
										<span className='text-base font-bold text-white'>
											Calculating XP...
										</span>
									</>
								) : (
									<>
										<span className='text-base font-bold text-white'>
											{hasEdited
												? 'Recalculate XP & Publish'
												: 'Preview XP & Publish'}
										</span>
										{recipe.xpReward && !hasEdited ? (
											<span className='rounded-lg bg-white/20 px-3 py-1 text-sm font-extrabold text-white'>
												{recipe.xpReward} XP
											</span>
										) : (
											<Sparkles className='size-5 text-white' />
										)}
										<kbd className='hidden rounded bg-white/20 px-1.5 py-0.5 text-xs font-normal text-white/80 md:inline-block'>
											{modKey}+↵
										</kbd>
									</>
								)}
							</motion.button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Parsing Overlay - Separate AnimatePresence for overlay */}
			<AnimatePresence>
				{step === 'parsing' && <ParsingOverlay currentStep={parsingStep} />}
			</AnimatePresence>

			{/* XP Preview Modal */}
			<AnimatePresence>
				{step === 'xp-preview' && recipe && xpBreakdown && (
					<XpPreviewModal
						recipe={recipe}
						xpBreakdown={xpBreakdown}
						onBack={() => setStep('preview')}
						onPublish={handlePublish}
						isPublishing={isPublishing}
					/>
				)}
			</AnimatePresence>
		</div>
	)
}

// ============================================
// EXPORTS
// ============================================

export type {
	ParsedRecipe,
	XpBreakdown,
	RecipeCreateAiFlowProps,
	Ingredient,
	RecipeStep,
}
