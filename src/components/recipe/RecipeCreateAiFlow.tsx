'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
	ArrowLeft,
	Clipboard,
	Edit3,
	GripVertical,
	ImagePlus,
	ListOrdered,
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
} from 'lucide-react'
import Image from 'next/image'
import React, { useState, useCallback } from 'react'
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
import { processRecipe, calculateMetas } from '@/services/ai'
import { createDraft, saveDraft, uploadRecipeImages } from '@/services/recipe'
import { toast } from 'sonner'

// ============================================
// TYPES
// ============================================

type CreateMethod = 'ai' | 'manual'
type CreateStep = 'input' | 'parsing' | 'preview' | 'xp-preview'
type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert'

interface Ingredient {
	id: string
	quantity: string
	name: string
}

type TimeUnit = 'seconds' | 'minutes' | 'hours' | 'days'

interface RecipeStep {
	id: string
	instruction: string
	timerSeconds?: number // Store as seconds for flexibility
	timerMinutes?: number // Legacy support
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
	onPublish?: (recipe: ParsedRecipe) => void
	className?: string
}

// ============================================
// HELPER: Transform API response to local types
// ============================================

const transformProcessedRecipe = (
	data: Awaited<ReturnType<typeof processRecipe>>['data'],
): ParsedRecipe | null => {
	if (!data) return null

	// Map difficulty from AI format to local format
	const difficultyMap: Record<string, Difficulty> = {
		BEGINNER: 'Easy',
		INTERMEDIATE: 'Medium',
		ADVANCED: 'Hard',
		EXPERT: 'Expert',
		// Also handle lowercase/mixed case from AI
		Beginner: 'Easy',
		Intermediate: 'Medium',
		Advanced: 'Hard',
		Expert: 'Expert',
	}

	return {
		title: data.title,
		description: data.description,
		cookTime: `${data.cookTimeMinutes} min`,
		difficulty:
			difficultyMap[data.difficulty?.toUpperCase() || 'INTERMEDIATE'] ||
			difficultyMap[data.difficulty] ||
			'Medium',
		servings: data.servings,
		cuisine: data.cuisineType || 'International',
		ingredients: data.fullIngredientList.map((ing, i) => ({
			id: `ing-${i}`,
			quantity: `${ing.quantity} ${ing.unit}`.trim(),
			name: ing.name,
		})),
		steps: data.steps.map(step => ({
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
			className='min-w-thumbnail-md w-20 bg-transparent text-sm font-bold text-primary outline-none placeholder:text-muted-foreground/50'
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

// Helper: Get timer in seconds from step (supports both old and new format)
const getTimerSeconds = (step: RecipeStep): number | undefined => {
	if (step.timerSeconds !== undefined) return step.timerSeconds
	if (step.timerMinutes !== undefined) return step.timerMinutes * 60
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
			onUpdate({ timerSeconds: Math.round(seconds), timerMinutes: undefined })
		} else {
			// Clear timer
			onUpdate({ timerSeconds: undefined, timerMinutes: undefined })
		}
		setIsEditingTimer(false)
	}

	const handleClearTimer = (e: React.MouseEvent) => {
		e.stopPropagation()
		onUpdate({ timerSeconds: undefined, timerMinutes: undefined })
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
						<img
							src={step.imageUrl}
							alt={`Step ${index + 1}`}
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
								className='w-12 bg-transparent text-xs font-semibold text-primary outline-none'
								autoFocus
							/>
							<select
								value={timerUnit}
								onChange={e => setTimerUnit(e.target.value as TimeUnit)}
								className='bg-transparent text-xs font-semibold text-primary outline-none'
							>
								<option value='seconds'>sec</option>
								<option value='minutes'>min</option>
								<option value='hours'>hours</option>
								<option value='days'>days</option>
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
			<div className='flex flex-col gap-2 opacity-50 group-hover:opacity-100'>
				<button className='flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/30'>
					<GripVertical className='size-4' />
				</button>
				<button
					onClick={onRemove}
					className='flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500'
				>
					<Trash2 className='size-4' />
				</button>
			</div>
		</div>
	)
}

// XP Preview Modal
const XpPreviewModal = ({
	recipe,
	xpBreakdown,
	onBack,
	onPublish,
}: {
	recipe: ParsedRecipe
	xpBreakdown: XpBreakdown
	onBack: () => void
	onPublish: () => void
}) => (
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
						{recipe.cookTime} • {recipe.difficulty} • {recipe.servings} servings
					</p>
				</div>
			</div>

			{/* XP Breakdown */}
			<div className='mb-5 rounded-2xl bg-bg p-5'>
				<div className='mb-4 flex items-center justify-between border-b border-border pb-4'>
					<span className='text-sm text-muted-foreground'>Total Recipe XP</span>
					<span className='text-4xl font-black text-primary'>
						{xpBreakdown.total}
					</span>
				</div>

				<div className='mb-4 space-y-3'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-2.5 text-sm text-text'>
							<span className='text-lg'>📊</span>
							Base ({recipe.difficulty} difficulty)
						</div>
						<span className='font-bold text-success'>+{xpBreakdown.base}</span>
					</div>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-2.5 text-sm text-text'>
							<span className='text-lg'>📝</span>
							Steps ({recipe.steps.length} × 10)
						</div>
						<span className='font-bold text-success'>+{xpBreakdown.steps}</span>
					</div>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-2.5 text-sm text-text'>
							<span className='text-lg'>⏱️</span>
							Time ({recipe.cookTime})
						</div>
						<span className='font-bold text-success'>+{xpBreakdown.time}</span>
					</div>
					{xpBreakdown.techniques.map((t, i) => (
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
					{recipe.detectedBadges.map((badge, i) => (
						<div
							key={i}
							className='flex items-center gap-2 rounded-xl bg-bg px-4 py-2.5'
						>
							<span className='text-xl'>{badge.emoji}</span>
							<span className='text-xs font-semibold text-text'>
								{badge.name}
							</span>
						</div>
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
						If 100 people cook this: +580 XP for you!
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
					onClick={onPublish}
					whileHover={BUTTON_HOVER}
					whileTap={BUTTON_TAP}
					className='flex flex-[2] items-center justify-center gap-2 rounded-xl bg-gradient-hero py-3.5 text-sm font-bold text-white shadow-lg'
				>
					<Send className='size-4' />
					Publish Recipe
				</motion.button>
			</div>
		</motion.div>
	</motion.div>
)

// ============================================
// MAIN COMPONENT
// ============================================

export const RecipeCreateAiFlow = ({
	onBack,
	onPublish,
	className,
}: RecipeCreateAiFlowProps) => {
	const [method, setMethod] = useState<CreateMethod>('ai')
	const [step, setStep] = useState<CreateStep>('input')
	const [rawText, setRawText] = useState('')
	const [parsingStep, setParsingStep] = useState(0)
	const [recipe, setRecipe] = useState<ParsedRecipe | null>(null)
	const [xpBreakdown, setXpBreakdown] = useState<XpBreakdown | null>(null)
	// Draft management state
	const [draftId, setDraftId] = useState<string | null>(null)
	const [isSaving, setIsSaving] = useState(false)

	const handlePaste = useCallback(async () => {
		try {
			const text = await navigator.clipboard.readText()
			setRawText(text)
		} catch (err) {
			console.error('Failed to read clipboard:', err)
		}
	}, [])

	// Save draft handler - creates draft if needed, then saves
	const handleSaveDraft = useCallback(async () => {
		if (!recipe) return

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

			// Map local recipe format to backend format
			const difficultyMap: Record<Difficulty, string> = {
				Easy: 'BEGINNER',
				Medium: 'INTERMEDIATE',
				Hard: 'ADVANCED',
				Expert: 'EXPERT',
			}

			const saveResponse = await saveDraft(currentDraftId, {
				title: recipe.title,
				description: recipe.description,
				coverImageUrl: recipe.coverImageUrl
					? [recipe.coverImageUrl]
					: undefined,
				difficulty: difficultyMap[recipe.difficulty] as
					| 'BEGINNER'
					| 'INTERMEDIATE'
					| 'ADVANCED'
					| 'EXPERT',
				cookTimeMinutes: parseInt(recipe.cookTime) || 30,
				servings: recipe.servings,
				cuisineType: recipe.cuisine,
				fullIngredientList: recipe.ingredients.map(i => ({
					name: i.name,
					quantity: i.quantity.split(' ')[0] || '1',
					unit: i.quantity.split(' ').slice(1).join(' ') || '',
				})),
				steps: recipe.steps.map((s, i) => ({
					stepNumber: i + 1,
					description: s.instruction,
					action: s.technique,
					timerSeconds:
						s.timerSeconds ??
						(s.timerMinutes ? s.timerMinutes * 60 : undefined),
					imageUrl: s.imageUrl,
				})),
				rewardBadges: recipe.detectedBadges.map(b => b.name),
			})

			if (saveResponse.success) {
				toast.success('Draft saved!', {
					description:
						'Your recipe has been saved. You can continue editing later.',
				})
			} else {
				console.error('Save draft failed:', saveResponse)
				toast.error('Failed to save draft', {
					description: saveResponse.message || 'Please try again.',
				})
			}
		} catch (err) {
			console.error('Save draft error:', err)
			const message = err instanceof Error ? err.message : 'Unknown error'
			toast.error('Failed to save draft', {
				description: message.includes('401')
					? 'Please log in again.'
					: 'Network error. Please check your connection.',
			})
		} finally {
			setIsSaving(false)
		}
	}, [recipe, draftId])

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
		if (!recipe) return

		// Build request for calculate-metas API
		const metasRequest = {
			title: recipe.title,
			description: recipe.description,
			difficulty: recipe.difficulty.toUpperCase(),
			prep_time_minutes: 10, // Default since not captured
			cook_time_minutes: parseInt(recipe.cookTime) || 30,
			servings: recipe.servings,
			cuisine_type: recipe.cuisine,
			dietary_tags: [],
			full_ingredient_list: recipe.ingredients.map(i => ({
				name: i.name,
				quantity: i.quantity.split(' ')[0] || '1',
				unit: i.quantity.split(' ').slice(1).join(' ') || '',
			})),
			steps: recipe.steps.map((s, i) => ({
				step_number: i + 1,
				description: s.instruction,
				action: s.technique,
				timer_seconds:
					s.timerSeconds ?? (s.timerMinutes ? s.timerMinutes * 60 : undefined),
			})),
			include_enrichment: true,
		}

		try {
			const response = await calculateMetas(metasRequest)

			if (response.success && response.data) {
				const data = response.data
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
			console.error('XP calculation error:', err)
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
		}
	}, [recipe])

	const handlePublish = useCallback(() => {
		if (recipe) {
			onPublish?.(recipe)
		}
	}, [recipe, onPublish])

	const removeIngredient = (id: string) => {
		if (!recipe) return
		setRecipe({
			...recipe,
			ingredients: recipe.ingredients.filter(i => i.id !== id),
		})
	}

	const addIngredient = () => {
		if (!recipe) return
		const newId = `ing-${Date.now()}`
		setRecipe({
			...recipe,
			ingredients: [
				...recipe.ingredients,
				{ id: newId, quantity: '', name: '' },
			],
		})
	}

	const updateIngredient = (id: string, updates: Partial<Ingredient>) => {
		if (!recipe) return
		setRecipe({
			...recipe,
			ingredients: recipe.ingredients.map(i =>
				i.id === id ? { ...i, ...updates } : i,
			),
		})
	}

	const removeStep = (id: string) => {
		if (!recipe) return
		setRecipe({
			...recipe,
			steps: recipe.steps.filter(s => s.id !== id),
		})
	}

	const addStep = () => {
		if (!recipe) return
		const newId = `step-${Date.now()}`
		setRecipe({
			...recipe,
			steps: [...recipe.steps, { id: newId, instruction: '' }],
		})
	}

	const updateStep = (id: string, updates: Partial<RecipeStep>) => {
		if (!recipe) return
		setRecipe({
			...recipe,
			steps: recipe.steps.map(s => (s.id === id ? { ...s, ...updates } : s)),
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
						onClick={handleSaveDraft}
						disabled={isSaving}
						className='rounded-lg border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50'
					>
						{isSaving ? 'Saving...' : 'Save Draft'}
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
										onSubmit={data => {
											// Convert RecipeFormData to ParsedRecipe format
											const parsed: ParsedRecipe = {
												title: data.title,
												description: data.description,
												coverImageUrl: data.coverImageUrl,
												cookTime: `${data.cookTimeMinutes} min`,
												difficulty:
													data.difficulty === 'easy'
														? 'Easy'
														: data.difficulty === 'medium'
															? 'Medium'
															: 'Hard',
												servings: data.servings,
												cuisine: data.category || 'General',
												ingredients: data.ingredients.map(i => ({
													id: i.id,
													quantity: `${i.amount} ${i.unit}`,
													name: i.name,
												})),
												steps: data.steps.map(s => ({
													id: s.id,
													instruction: s.instruction,
													timerMinutes: s.timerMinutes,
												})),
												detectedBadges: [],
											}
											onPublish?.(parsed)
										}}
										onSaveDraft={data => {
											console.log('Draft saved:', data)
										}}
										onCancel={onBack}
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
						{/* Success Banner */}
						<div className='flex items-center gap-3.5 rounded-2xl border border-success/20 bg-gradient-to-r from-success/10 to-emerald-500/5 px-5 py-4'>
							<span className='text-3xl'>✨</span>
							<div>
								<strong className='text-sm text-success'>
									Recipe parsed successfully!
								</strong>
								<span className='block text-xs text-muted-foreground'>
									Review and edit below, then preview XP
								</span>
							</div>
						</div>

						{/* Recipe Card */}
						<div className='rounded-2xl bg-panel-bg p-6'>
							{/* Cover Image */}
							<div className='mb-5'>
								<div className='flex h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-bg text-muted-foreground transition-colors hover:border-primary hover:text-primary'>
									<ImagePlus className='size-8' />
									<span className='text-sm'>Add Cover Photo</span>
								</div>
							</div>

							{/* Title */}
							<div className='mb-4'>
								<label className='mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
									Recipe Title
								</label>
								<input
									type='text'
									defaultValue={recipe.title}
									className='w-full rounded-xl border-2 border-transparent bg-bg px-4 py-3 text-xl font-bold text-text focus:border-primary focus:outline-none'
								/>
							</div>

							{/* Description */}
							<div className='mb-4'>
								<label className='mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
									Description
								</label>
								<textarea
									defaultValue={recipe.description}
									className='min-h-20 w-full resize-y rounded-xl border-2 border-transparent bg-bg px-4 py-3 text-sm text-text focus:border-primary focus:outline-none'
								/>
							</div>

							{/* Meta Row */}
							<div className='mb-4 flex flex-wrap gap-2.5'>
								<div className='flex items-center gap-1.5 rounded-lg bg-bg px-3.5 py-2 text-xs font-semibold text-text'>
									<Clock className='size-4 text-muted-foreground' />
									{recipe.cookTime}
								</div>
								<div className='flex items-center gap-1.5 rounded-lg bg-bg px-3.5 py-2 text-xs font-semibold text-text'>
									<Signal className='size-4 text-muted-foreground' />
									{recipe.difficulty}
								</div>
								<div className='flex items-center gap-1.5 rounded-lg bg-bg px-3.5 py-2 text-xs font-semibold text-text'>
									<Utensils className='size-4 text-muted-foreground' />
									{recipe.servings} servings
								</div>
								<div className='flex items-center gap-1.5 rounded-lg bg-bg px-3.5 py-2 text-xs font-semibold text-text'>
									<span>🌏</span>
									{recipe.cuisine}
								</div>
							</div>

							{/* Detected Badges */}
							<div className='flex flex-wrap items-center gap-3'>
								<span className='text-xs text-muted-foreground'>
									Potential Badges:
								</span>
								{recipe.detectedBadges.map((badge, i) => (
									<span
										key={i}
										className='rounded-lg border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary'
									>
										{badge.emoji} {badge.name}
									</span>
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
								<button
									onClick={addIngredient}
									className='flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary'
								>
									<Plus className='size-4' />
									Add
								</button>
							</div>
							<div className='space-y-2'>
								{recipe.ingredients.map(ing => (
									<IngredientItem
										key={ing.id}
										ingredient={ing}
										onRemove={() => removeIngredient(ing.id)}
										onUpdate={updates => updateIngredient(ing.id, updates)}
									/>
								))}
							</div>
						</div>

						{/* Steps Section */}
						<div className='rounded-2xl bg-panel-bg p-6'>
							<div className='mb-4 flex items-center justify-between'>
								<h3 className='flex items-center gap-2.5 text-lg font-bold text-text'>
									<ListOrdered className='size-5 text-primary' />
									Instructions
								</h3>
								<button
									onClick={addStep}
									className='flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary'
								>
									<Plus className='size-4' />
									Add Step
								</button>
							</div>
							<div className='space-y-3'>
								{recipe.steps.map((s, i) => (
									<StepItem
										key={s.id}
										step={s}
										index={i}
										onRemove={() => removeStep(s.id)}
										onUpdate={updates => updateStep(s.id, updates)}
									/>
								))}
							</div>
						</div>

						{/* Preview XP Button */}
						<div className='sticky bottom-5 pt-4'>
							<motion.button
								onClick={handlePreviewXp}
								whileHover={BUTTON_HOVER}
								whileTap={BUTTON_TAP}
								className='flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-hero py-4.5 shadow-xl'
							>
								<span className='text-base font-bold text-white'>
									Preview XP & Publish
								</span>
								<span className='rounded-lg bg-white/20 px-3 py-1 text-sm font-extrabold text-white'>
									~145 XP
								</span>
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
