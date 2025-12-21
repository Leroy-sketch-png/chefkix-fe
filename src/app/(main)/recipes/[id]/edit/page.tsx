'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
	ArrowLeft,
	Save,
	Trash2,
	Plus,
	Clock,
	Users,
	Loader2,
} from 'lucide-react'
import Image from 'next/image'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ui/error-state'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { getRecipeById, updateRecipe, deleteRecipe } from '@/services/recipe'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	staggerContainer,
	staggerItem,
} from '@/lib/motion'
import type {
	Recipe,
	RecipeUpdateRequest,
	Ingredient,
	Step,
	Difficulty,
} from '@/lib/types/recipe'

// ============================================
// TYPES
// ============================================

interface EditableIngredient extends Ingredient {
	id: string
}

interface EditableStep extends Omit<Step, 'stepNumber'> {
	id: string
}

// ============================================
// CONSTANTS
// ============================================

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
	{ value: 'Beginner', label: 'Beginner' },
	{ value: 'Intermediate', label: 'Intermediate' },
	{ value: 'Advanced', label: 'Advanced' },
	{ value: 'Expert', label: 'Expert' },
]

const CUISINE_OPTIONS = [
	'Italian',
	'Asian',
	'Mexican',
	'American',
	'French',
	'Indian',
	'Mediterranean',
	'Japanese',
	'Chinese',
	'Thai',
	'Greek',
	'Middle Eastern',
	'Korean',
	'Vietnamese',
	'Spanish',
	'Other',
]

// ============================================
// HELPERS
// ============================================

const generateId = () => Math.random().toString(36).substring(2, 9)

const createEmptyIngredient = (): EditableIngredient => ({
	id: generateId(),
	name: '',
	quantity: '',
	unit: '',
})

const createEmptyStep = (): EditableStep => ({
	id: generateId(),
	title: '',
	description: '',
})

// ============================================
// MAIN COMPONENT
// ============================================

export default function RecipeEditPage() {
	const params = useParams()
	const router = useRouter()
	const recipeId = params?.id as string
	const { user } = useAuthStore()

	// Form state
	const [recipe, setRecipe] = useState<Recipe | null>(null)
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [difficulty, setDifficulty] = useState<Difficulty>('Intermediate')
	const [prepTimeMinutes, setPrepTimeMinutes] = useState(10)
	const [cookTimeMinutes, setCookTimeMinutes] = useState(30)
	const [servings, setServings] = useState(4)
	const [cuisineType, setCuisineType] = useState('')
	const [ingredients, setIngredients] = useState<EditableIngredient[]>([])
	const [steps, setSteps] = useState<EditableStep[]>([])

	// UI state
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [isAuthorized, setIsAuthorized] = useState(true)

	// Fetch recipe data
	useEffect(() => {
		const fetchRecipe = async () => {
			setIsLoading(true)
			setError(null)
			try {
				const response = await getRecipeById(recipeId)
				if (response.success && response.data) {
					const r = response.data
					setRecipe(r)

					// Check authorization
					if (user?.userId !== r.author.userId) {
						setIsAuthorized(false)
						return
					}

					// Populate form
					setTitle(r.title)
					setDescription(r.description)
					setDifficulty(r.difficulty)
					setPrepTimeMinutes(r.prepTimeMinutes)
					setCookTimeMinutes(r.cookTimeMinutes)
					setServings(r.servings)
					setCuisineType(r.cuisineType || '')
					setIngredients(
						r.fullIngredientList.map(ing => ({
							...ing,
							id: generateId(),
						})),
					)
					setSteps(
						r.steps.map(step => ({
							id: generateId(),
							title: step.title,
							description: step.description,
							action: step.action,
							timerSeconds: step.timerSeconds,
							imageUrl: step.imageUrl,
							tips: step.tips,
						})),
					)
				} else {
					setError('Recipe not found')
				}
			} catch (err) {
				setError('Failed to load recipe')
			} finally {
				setIsLoading(false)
			}
		}

		if (recipeId) {
			fetchRecipe()
		}
	}, [recipeId, user?.userId])

	// Handle save
	const handleSave = async () => {
		if (!title.trim()) {
			toast.error('Please enter a recipe title')
			return
		}
		if (ingredients.filter(i => i.name.trim()).length === 0) {
			toast.error('Please add at least one ingredient')
			return
		}
		if (steps.filter(s => s.description.trim()).length === 0) {
			toast.error('Please add at least one step')
			return
		}

		setIsSaving(true)
		try {
			const updateData: RecipeUpdateRequest = {
				title: title.trim(),
				description: description.trim(),
				difficulty,
				prepTimeMinutes,
				cookTimeMinutes,
				totalTimeMinutes: prepTimeMinutes + cookTimeMinutes,
				servings,
				cuisineType: cuisineType || undefined,
				fullIngredientList: ingredients
					.filter(i => i.name.trim())
					.map(({ name, quantity, unit }) => ({ name, quantity, unit })),
				steps: steps
					.filter(s => s.description.trim())
					.map(
						({ title, description, action, timerSeconds, imageUrl, tips }) => ({
							title: title || 'Step',
							description,
							action,
							timerSeconds,
							imageUrl,
							tips,
						}),
					),
			}

			const response = await updateRecipe(recipeId, updateData)
			if (response.success) {
				toast.success('Recipe updated successfully! 🎉')
				router.push(`/recipes/${recipeId}`)
			} else {
				toast.error(response.message || 'Failed to update recipe')
			}
		} catch (err) {
			toast.error('Something went wrong')
		} finally {
			setIsSaving(false)
		}
	}

	// Handle delete
	const handleDelete = async () => {
		setIsDeleting(true)
		try {
			const response = await deleteRecipe(recipeId)
			if (response.success) {
				toast.success('Recipe deleted')
				router.push('/creator')
			} else {
				toast.error(response.message || 'Failed to delete recipe')
			}
		} catch (err) {
			toast.error('Something went wrong')
		} finally {
			setIsDeleting(false)
		}
	}

	// Ingredient handlers
	const addIngredient = () => {
		setIngredients([...ingredients, createEmptyIngredient()])
	}

	const updateIngredient = (
		id: string,
		field: keyof Ingredient,
		value: string,
	) => {
		setIngredients(prev =>
			prev.map(ing => (ing.id === id ? { ...ing, [field]: value } : ing)),
		)
	}

	const removeIngredient = (id: string) => {
		setIngredients(prev => prev.filter(ing => ing.id !== id))
	}

	// Step handlers
	const addStep = () => {
		setSteps([...steps, createEmptyStep()])
	}

	const updateStep = (
		id: string,
		field: keyof EditableStep,
		value: string | number | undefined,
	) => {
		setSteps(prev =>
			prev.map(step => (step.id === id ? { ...step, [field]: value } : step)),
		)
	}

	const removeStep = (id: string) => {
		setSteps(prev => prev.filter(step => step.id !== id))
	}

	// Loading state
	if (isLoading) {
		return <EditRecipeSkeleton />
	}

	// Unauthorized
	if (!isAuthorized) {
		return (
			<PageTransition>
				<PageContainer maxWidth='2xl'>
					<ErrorState
						title="You can't edit this recipe"
						message='Only the recipe author can edit this recipe.'
						onRetry={() => router.push(`/recipes/${recipeId}`)}
						showHomeButton
					/>
				</PageContainer>
			</PageTransition>
		)
	}

	// Error state
	if (error || !recipe) {
		return (
			<PageTransition>
				<PageContainer maxWidth='2xl'>
					<ErrorState
						title='Recipe not found'
						message={error || 'The recipe you are looking for does not exist.'}
						onRetry={() => router.push('/explore')}
						showHomeButton
					/>
				</PageContainer>
			</PageTransition>
		)
	}

	return (
		<PageTransition>
			<PageContainer maxWidth='2xl'>
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className='mb-8 flex items-center justify-between'
				>
					<div className='flex items-center gap-4'>
						<motion.button
							onClick={() => router.back()}
							whileHover={BUTTON_HOVER}
							whileTap={BUTTON_TAP}
							className='grid size-10 place-items-center rounded-full bg-bg-card shadow-card transition-colors hover:bg-bg-elevated'
						>
							<ArrowLeft className='size-5' />
						</motion.button>
						<div>
							<h1 className='text-2xl font-bold text-text md:text-3xl'>
								Edit Recipe
							</h1>
							<p className='text-sm text-text-muted'>
								Update your culinary creation
							</p>
						</div>
					</div>

					<div className='flex items-center gap-3'>
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button
									variant='outline'
									size='sm'
									className='border-error/30 text-error hover:bg-error/10'
									disabled={isDeleting}
								>
									<Trash2 className='mr-2 size-4' />
									Delete
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Delete Recipe?</AlertDialogTitle>
									<AlertDialogDescription>
										This action cannot be undone. This will permanently delete
										&ldquo;{recipe.title}&rdquo; and remove all associated data.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancel</AlertDialogCancel>
									<AlertDialogAction
										onClick={handleDelete}
										className='bg-error text-white hover:bg-error/90'
									>
										{isDeleting ? (
											<Loader2 className='mr-2 size-4 animate-spin' />
										) : (
											<Trash2 className='mr-2 size-4' />
										)}
										Delete Recipe
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>

						<Button
							onClick={handleSave}
							disabled={isSaving}
							className='bg-gradient-hero text-white shadow-lg shadow-brand/30'
						>
							{isSaving ? (
								<Loader2 className='mr-2 size-4 animate-spin' />
							) : (
								<Save className='mr-2 size-4' />
							)}
							Save Changes
						</Button>
					</div>
				</motion.div>

				<div className='grid gap-8 lg:grid-cols-3'>
					{/* Main Form */}
					<motion.div
						variants={staggerContainer}
						initial='hidden'
						animate='visible'
						className='space-y-6 lg:col-span-2'
					>
						{/* Basic Info */}
						<motion.div
							variants={staggerItem}
							className='rounded-2xl border border-border-subtle bg-bg-card p-6 shadow-card'
						>
							<h2 className='mb-4 text-lg font-bold text-text'>
								Basic Information
							</h2>
							<div className='space-y-4'>
								<div>
									<label className='mb-2 block text-sm font-medium text-text'>
										Recipe Title
									</label>
									<Input
										value={title}
										onChange={e => setTitle(e.target.value)}
										placeholder='Enter recipe title...'
										className='text-lg font-semibold'
									/>
								</div>
								<div>
									<label className='mb-2 block text-sm font-medium text-text'>
										Description
									</label>
									<Textarea
										value={description}
										onChange={e => setDescription(e.target.value)}
										placeholder='Describe your recipe...'
										rows={3}
									/>
								</div>
							</div>
						</motion.div>

						{/* Ingredients */}
						<motion.div
							variants={staggerItem}
							className='rounded-2xl border border-border-subtle bg-bg-card p-6 shadow-card'
						>
							<div className='mb-4 flex items-center justify-between'>
								<h2 className='text-lg font-bold text-text'>🧾 Ingredients</h2>
								<Button
									onClick={addIngredient}
									variant='outline'
									size='sm'
									className='gap-1'
								>
									<Plus className='size-4' />
									Add
								</Button>
							</div>
							<div className='space-y-3'>
								{ingredients.map((ing, index) => (
									<motion.div
										key={ing.id}
										initial={{ opacity: 0, x: -10 }}
										animate={{ opacity: 1, x: 0 }}
										exit={{ opacity: 0, x: -10 }}
										className='flex items-center gap-2'
									>
										<div className='w-8 flex-shrink-0 text-center text-sm font-medium text-text-muted'>
											{index + 1}.
										</div>
										<Input
											value={ing.quantity}
											onChange={e =>
												updateIngredient(ing.id, 'quantity', e.target.value)
											}
											placeholder='Qty'
											className='w-20'
										/>
										<Input
											value={ing.unit}
											onChange={e =>
												updateIngredient(ing.id, 'unit', e.target.value)
											}
											placeholder='Unit'
											className='w-24'
										/>
										<Input
											value={ing.name}
											onChange={e =>
												updateIngredient(ing.id, 'name', e.target.value)
											}
											placeholder='Ingredient name'
											className='flex-1'
										/>
										<Button
											onClick={() => removeIngredient(ing.id)}
											variant='ghost'
											size='icon'
											className='flex-shrink-0 text-error hover:bg-error/10'
										>
											<Trash2 className='size-4' />
										</Button>
									</motion.div>
								))}
								{ingredients.length === 0 && (
									<p className='py-4 text-center text-text-muted'>
										No ingredients yet. Click &ldquo;Add&rdquo; to get started.
									</p>
								)}
							</div>
						</motion.div>

						{/* Steps */}
						<motion.div
							variants={staggerItem}
							className='rounded-2xl border border-border-subtle bg-bg-card p-6 shadow-card'
						>
							<div className='mb-4 flex items-center justify-between'>
								<h2 className='text-lg font-bold text-text'>👨‍🍳 Instructions</h2>
								<Button
									onClick={addStep}
									variant='outline'
									size='sm'
									className='gap-1'
								>
									<Plus className='size-4' />
									Add Step
								</Button>
							</div>
							<div className='space-y-4'>
								{steps.map((step, index) => (
									<motion.div
										key={step.id}
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
										className='rounded-xl border border-border-subtle bg-bg p-4'
									>
										<div className='mb-3 flex items-center justify-between'>
											<div className='flex items-center gap-3'>
												<div className='grid size-8 place-items-center rounded-lg bg-brand text-sm font-bold text-white'>
													{index + 1}
												</div>
												<Input
													value={step.title}
													onChange={e =>
														updateStep(step.id, 'title', e.target.value)
													}
													placeholder='Step title (optional)'
													className='w-48'
												/>
											</div>
											<div className='flex items-center gap-2'>
												<div className='flex items-center gap-1 rounded-lg bg-bg-elevated px-2 py-1'>
													<Clock className='size-3.5 text-text-muted' />
													<Input
														type='number'
														value={
															step.timerSeconds
																? Math.ceil(step.timerSeconds / 60)
																: ''
														}
														onChange={e =>
															updateStep(
																step.id,
																'timerSeconds',
																e.target.value
																	? parseInt(e.target.value) * 60
																	: undefined,
															)
														}
														placeholder='Min'
														className='h-6 w-12 border-none bg-transparent p-0 text-center text-sm'
													/>
												</div>
												<Button
													onClick={() => removeStep(step.id)}
													variant='ghost'
													size='icon'
													className='text-error hover:bg-error/10'
												>
													<Trash2 className='size-4' />
												</Button>
											</div>
										</div>
										<Textarea
											value={step.description}
											onChange={e =>
												updateStep(step.id, 'description', e.target.value)
											}
											placeholder='Describe what to do in this step...'
											rows={2}
										/>
									</motion.div>
								))}
								{steps.length === 0 && (
									<p className='py-4 text-center text-text-muted'>
										No steps yet. Click &ldquo;Add Step&rdquo; to get started.
									</p>
								)}
							</div>
						</motion.div>
					</motion.div>

					{/* Sidebar */}
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.2 }}
						className='space-y-6'
					>
						{/* Cover Image Preview */}
						{recipe.coverImageUrl?.[0] && (
							<div className='overflow-hidden rounded-2xl border border-border-subtle bg-bg-card shadow-card'>
								<div className='relative aspect-video'>
									<Image
										src={recipe.coverImageUrl[0]}
										alt={recipe.title}
										fill
										className='object-cover'
									/>
								</div>
								<div className='p-4'>
									<p className='text-sm text-text-muted'>Cover image</p>
								</div>
							</div>
						)}

						{/* Recipe Settings */}
						<div className='rounded-2xl border border-border-subtle bg-bg-card p-6 shadow-card'>
							<h2 className='mb-4 text-lg font-bold text-text'>Settings</h2>
							<div className='space-y-4'>
								<div>
									<label className='mb-2 block text-sm font-medium text-text'>
										Difficulty
									</label>
									<Select
										value={difficulty}
										onValueChange={v => setDifficulty(v as Difficulty)}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{DIFFICULTY_OPTIONS.map(opt => (
												<SelectItem key={opt.value} value={opt.value}>
													{opt.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div>
									<label className='mb-2 block text-sm font-medium text-text'>
										Cuisine Type
									</label>
									<Select value={cuisineType} onValueChange={setCuisineType}>
										<SelectTrigger>
											<SelectValue placeholder='Select cuisine' />
										</SelectTrigger>
										<SelectContent>
											{CUISINE_OPTIONS.map(cuisine => (
												<SelectItem key={cuisine} value={cuisine}>
													{cuisine}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className='grid grid-cols-2 gap-3'>
									<div>
										<label className='mb-2 flex items-center gap-1.5 text-sm font-medium text-text'>
											<Clock className='size-4 text-brand' />
											Prep (min)
										</label>
										<Input
											type='number'
											value={prepTimeMinutes}
											onChange={e =>
												setPrepTimeMinutes(parseInt(e.target.value) || 0)
											}
											min={0}
										/>
									</div>
									<div>
										<label className='mb-2 flex items-center gap-1.5 text-sm font-medium text-text'>
											<Clock className='size-4 text-streak' />
											Cook (min)
										</label>
										<Input
											type='number'
											value={cookTimeMinutes}
											onChange={e =>
												setCookTimeMinutes(parseInt(e.target.value) || 0)
											}
											min={0}
										/>
									</div>
								</div>

								<div>
									<label className='mb-2 flex items-center gap-1.5 text-sm font-medium text-text'>
										<Users className='size-4 text-xp' />
										Servings
									</label>
									<Input
										type='number'
										value={servings}
										onChange={e => setServings(parseInt(e.target.value) || 1)}
										min={1}
									/>
								</div>
							</div>
						</div>

						{/* XP Info */}
						<div className='rounded-2xl border border-border-subtle bg-gradient-to-br from-xp/10 to-xp/5 p-6 shadow-card'>
							<div className='flex items-center gap-2 text-xp'>
								<span className='text-xl'>⚡</span>
								<span className='text-2xl font-bold'>
									{recipe.xpReward || 0} XP
								</span>
							</div>
							<p className='mt-2 text-sm text-text-muted'>
								XP is calculated based on recipe complexity and techniques used.
							</p>
						</div>
					</motion.div>
				</div>
			</PageContainer>
		</PageTransition>
	)
}

// Loading skeleton
function EditRecipeSkeleton() {
	return (
		<PageContainer maxWidth='2xl'>
			<div className='mb-8 flex items-center justify-between'>
				<div className='flex items-center gap-4'>
					<Skeleton className='size-10 rounded-full' />
					<div>
						<Skeleton className='mb-2 h-8 w-48' />
						<Skeleton className='h-4 w-32' />
					</div>
				</div>
				<div className='flex gap-3'>
					<Skeleton className='h-9 w-24' />
					<Skeleton className='h-9 w-32' />
				</div>
			</div>
			<div className='grid gap-8 lg:grid-cols-3'>
				<div className='space-y-6 lg:col-span-2'>
					<Skeleton className='h-48 rounded-2xl' />
					<Skeleton className='h-64 rounded-2xl' />
					<Skeleton className='h-80 rounded-2xl' />
				</div>
				<div className='space-y-6'>
					<Skeleton className='aspect-video rounded-2xl' />
					<Skeleton className='h-64 rounded-2xl' />
					<Skeleton className='h-32 rounded-2xl' />
				</div>
			</div>
		</PageContainer>
	)
}
