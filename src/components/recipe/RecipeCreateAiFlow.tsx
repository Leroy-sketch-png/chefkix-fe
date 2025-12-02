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
import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING, BUTTON_HOVER, BUTTON_TAP } from '@/lib/motion'
import { RecipeFormDetailed, type RecipeFormData } from './RecipeFormDetailed'
import { processRecipe, calculateMetas } from '@/services/ai'

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

interface RecipeStep {
	id: string
	instruction: string
	timerMinutes?: number
	technique?: string
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

	// Map difficulty
	const difficultyMap: Record<string, Difficulty> = {
		BEGINNER: 'Easy',
		INTERMEDIATE: 'Medium',
		ADVANCED: 'Hard',
		EXPERT: 'Expert',
	}

	return {
		title: data.title,
		description: data.description,
		cookTime: `${data.cook_time_minutes} min`,
		difficulty:
			difficultyMap[data.difficulty?.toUpperCase() || 'INTERMEDIATE'] ||
			'Medium',
		servings: data.servings,
		cuisine: data.cuisine_type || 'International',
		ingredients: data.ingredients.map((ing, i) => ({
			id: `ing-${i}`,
			quantity: `${ing.quantity} ${ing.unit}`.trim(),
			name: ing.name,
		})),
		steps: data.steps.map(step => ({
			id: `step-${step.step_number}`,
			instruction: step.description,
			timerMinutes: step.timer_seconds
				? Math.ceil(step.timer_seconds / 60)
				: undefined,
			technique: step.action,
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

// Ingredient Item
const IngredientItem = ({
	ingredient,
	onRemove,
}: {
	ingredient: Ingredient
	onRemove: () => void
}) => (
	<div className='group flex items-center gap-3 rounded-xl bg-bg px-4 py-3'>
		<span className='min-w-thumbnail-md text-sm font-bold text-primary'>
			{ingredient.quantity}
		</span>
		<span className='flex-1 text-sm text-text'>{ingredient.name}</span>
		<button
			onClick={onRemove}
			className='flex size-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500'
		>
			<X className='size-4' />
		</button>
	</div>
)

// Step Item
const StepItem = ({
	step,
	index,
	onRemove,
}: {
	step: RecipeStep
	index: number
	onRemove: () => void
}) => (
	<div className='group flex gap-3.5 rounded-2xl bg-bg p-4'>
		<div className='flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-hero text-sm font-extrabold text-white shadow-md'>
			{index + 1}
		</div>
		<div className='flex-1'>
			<textarea
				defaultValue={step.instruction}
				className='min-h-16 w-full resize-none rounded-lg border border-border bg-panel-bg p-3 text-sm text-text focus:border-primary focus:outline-none'
			/>
			<div className='mt-2.5 flex flex-wrap gap-2.5'>
				{step.timerMinutes ? (
					<span className='flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary'>
						<Timer className='size-3.5' />
						{step.timerMinutes} min
					</span>
				) : (
					<button className='flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground'>
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

	const handlePaste = useCallback(async () => {
		try {
			const text = await navigator.clipboard.readText()
			setRawText(text)
		} catch (err) {
			console.error('Failed to read clipboard:', err)
		}
	}, [])

	const handleParse = useCallback(async () => {
		if (!rawText.trim()) return

		setStep('parsing')
		setParsingStep(0)

		// Progress animation
		const progressInterval = setInterval(() => {
			setParsingStep(prev => Math.min(prev + 1, 3))
		}, 600)

		try {
			// Call real AI service
			const response = await processRecipe(rawText)

			clearInterval(progressInterval)
			setParsingStep(4)

			if (response.success && response.data) {
				const parsed = transformProcessedRecipe(response.data)
				if (parsed) {
					setRecipe(parsed)
					setStep('preview')
				} else {
					console.error('Failed to transform recipe')
					setStep('input')
				}
			} else {
				console.error('Recipe parse failed:', response.message)
				setStep('input')
			}
		} catch (err) {
			clearInterval(progressInterval)
			console.error('Recipe parse error:', err)
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
				timer_seconds: s.timerMinutes ? s.timerMinutes * 60 : undefined,
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

	const removeStep = (id: string) => {
		if (!recipe) return
		setRecipe({
			...recipe,
			steps: recipe.steps.filter(s => s.id !== id),
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
					<button className='rounded-lg border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground'>
						Save Draft
					</button>
				)}
			</div>

			{/* Step: Input */}
			{step === 'input' && (
				<>
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

					{/* Paste Section (AI method) */}
					{method === 'ai' && (
						<div className='rounded-2xl bg-panel-bg p-6'>
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
						</div>
					)}

					{/* Manual Entry Form */}
					{method === 'manual' && (
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
					)}
				</>
			)}

			{/* Parsing Overlay */}
			<AnimatePresence>
				{step === 'parsing' && <ParsingOverlay currentStep={parsingStep} />}
			</AnimatePresence>

			{/* Step: Preview */}
			{step === 'preview' && recipe && (
				<>
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
							<button className='flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-muted-foreground'>
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
							<button className='flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-muted-foreground'>
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
				</>
			)}

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
