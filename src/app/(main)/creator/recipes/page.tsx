'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
	ArrowLeft,
	Plus,
	Edit3,
	Trash2,
	Eye,
	Heart,
	Bookmark,
	ChefHat,
	Loader2,
	Clock,
	Search,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ui/error-state'
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { getRecipesByUserId, deleteRecipe } from '@/services/recipe'
import { getRecipeImage } from '@/lib/types/recipe'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	staggerContainer,
	staggerItem,
} from '@/lib/motion'
import type { Recipe, Difficulty } from '@/lib/types/recipe'

// ============================================
// RECIPE CARD COMPONENT
// ============================================

interface RecipeManageCardProps {
	recipe: Recipe
	onDelete: (id: string) => void
	isDeleting: boolean
}

const difficultyColors: Record<Difficulty, string> = {
	Beginner: 'bg-success text-white',
	Intermediate: 'bg-amber-500 text-white',
	Advanced: 'bg-error text-white',
	Expert: 'bg-xp text-white',
}

const RecipeManageCard = ({
	recipe,
	onDelete,
	isDeleting,
}: RecipeManageCardProps) => {
	const router = useRouter()

	return (
		<motion.div
			variants={staggerItem}
			whileHover={{ y: -4 }}
			className='group overflow-hidden rounded-2xl border border-border-subtle bg-bg-card shadow-card transition-shadow hover:shadow-warm'
		>
			{/* Image */}
			<Link href={`/recipes/${recipe.id}`} className='block'>
				<div className='relative aspect-video overflow-hidden'>
					<Image
						src={getRecipeImage(recipe)}
						alt={recipe.title}
						fill
						className='object-cover transition-transform duration-500 group-hover:scale-105'
					/>
					<div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent' />

					{/* Badges */}
					<div className='absolute left-3 top-3 flex items-center gap-2'>
						<span
							className={cn(
								'rounded-full px-2.5 py-1 text-xs font-bold',
								difficultyColors[recipe.difficulty],
							)}
						>
							{recipe.difficulty}
						</span>
					</div>

					{/* XP */}
					<div className='absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-gradient-xp px-2.5 py-1 text-xs font-bold text-white'>
						<ChefHat className='size-3' />+{recipe.xpReward} XP
					</div>

					{/* Status */}
					<div className='absolute right-3 top-3'>
						<span
							className={cn(
								'rounded-full px-2 py-1 text-xs font-medium backdrop-blur-sm',
								recipe.recipeStatus === 'PUBLISHED'
									? 'bg-success/90 text-white'
									: 'bg-bg-elevated/90 text-text-muted',
							)}
						>
							{recipe.recipeStatus}
						</span>
					</div>
				</div>
			</Link>

			{/* Content */}
			<div className='p-4'>
				<Link href={`/recipes/${recipe.id}`}>
					<h3 className='mb-1 line-clamp-1 text-lg font-bold text-text group-hover:text-brand'>
						{recipe.title}
					</h3>
				</Link>
				<p className='mb-3 line-clamp-2 text-sm text-text-muted'>
					{recipe.description}
				</p>

				{/* Stats */}
				<div className='mb-4 flex items-center gap-4 text-sm text-text-secondary'>
					<span className='flex items-center gap-1'>
						<Eye className='size-4' />
						{recipe.viewCount}
					</span>
					<span className='flex items-center gap-1'>
						<Heart className='size-4' />
						{recipe.likeCount}
					</span>
					<span className='flex items-center gap-1'>
						<Bookmark className='size-4' />
						{recipe.saveCount}
					</span>
					<span className='flex items-center gap-1'>
						<Clock className='size-4' />
						{recipe.totalTimeMinutes}m
					</span>
				</div>

				{/* Actions */}
				<div className='flex items-center gap-2'>
					<Button
						onClick={() => router.push(`/recipes/${recipe.id}/edit`)}
						variant='outline'
						size='sm'
						className='flex-1 gap-1'
					>
						<Edit3 className='size-4' />
						Edit
					</Button>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button
								variant='outline'
								size='sm'
								className='border-error/30 text-error hover:bg-error/10'
								disabled={isDeleting}
							>
								{isDeleting ? (
									<Loader2 className='size-4 animate-spin' />
								) : (
									<Trash2 className='size-4' />
								)}
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Delete Recipe?</AlertDialogTitle>
								<AlertDialogDescription>
									This will permanently delete &ldquo;{recipe.title}&rdquo;.
									This action cannot be undone.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									onClick={() => onDelete(recipe.id)}
									className='bg-error text-white hover:bg-error/90'
								>
									Delete
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>
		</motion.div>
	)
}

// ============================================
// MAIN PAGE
// ============================================

export default function MyRecipesPage() {
	const router = useRouter()
	const { user } = useAuthStore()
	const [recipes, setRecipes] = useState<Recipe[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [deletingId, setDeletingId] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState('')
	const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'views'>('newest')

	// Fetch user's recipes
	useEffect(() => {
		const fetchRecipes = async () => {
			if (!user?.userId) return

			setIsLoading(true)
			setError(null)

			try {
				const response = await getRecipesByUserId(user.userId)
				if (response.success && response.data) {
					setRecipes(response.data)
				} else {
					setError(response.message || 'Failed to load recipes')
				}
			} catch {
				setError('Failed to load recipes')
			} finally {
				setIsLoading(false)
			}
		}

		fetchRecipes()
	}, [user?.userId])

	// Handle delete
	const handleDelete = async (recipeId: string) => {
		setDeletingId(recipeId)
		try {
			const response = await deleteRecipe(recipeId)
			if (response.success) {
				setRecipes(prev => prev.filter(r => r.id !== recipeId))
				toast.success('Recipe deleted')
			} else {
				toast.error(response.message || 'Failed to delete recipe')
			}
		} catch {
			toast.error('Failed to delete recipe')
		} finally {
			setDeletingId(null)
		}
	}

	// Filter and sort recipes
	const filteredRecipes = recipes
		.filter(
			r =>
				r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				r.description.toLowerCase().includes(searchQuery.toLowerCase()),
		)
		.sort((a, b) => {
			switch (sortBy) {
				case 'popular':
					return b.likeCount - a.likeCount
				case 'views':
					return b.viewCount - a.viewCount
				case 'newest':
				default:
					return (
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
					)
			}
		})

	if (isLoading) {
		return <MyRecipesSkeleton />
	}

	if (error) {
		return (
			<PageTransition>
				<PageContainer maxWidth='2xl'>
					<ErrorState
						title='Failed to load recipes'
						message={error}
						onRetry={() => window.location.reload()}
						showHomeButton
					/>
				</PageContainer>
			</PageTransition>
		)
	}

	return (
		<PageTransition>
			<PageContainer maxWidth='2xl'>
				{/* Header - Secondary page pattern with back button and icon-box */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={TRANSITION_SPRING}
					className='mb-8'
				>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							<button
								onClick={() => router.back()}
								className='flex size-10 items-center justify-center rounded-xl border border-border bg-bg-card text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text'
							>
								<ArrowLeft className='size-5' />
							</button>
							<motion.div
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{ delay: 0.1, ...TRANSITION_SPRING }}
								className='flex size-12 items-center justify-center rounded-2xl bg-gradient-xp shadow-md shadow-xp/25'
							>
								<ChefHat className='size-6 text-white' />
							</motion.div>
							<div>
								<h1 className='text-3xl font-bold text-text'>My Recipes</h1>
								<p className='text-text-secondary'>
									{recipes.length} recipe{recipes.length !== 1 ? 's' : ''}{' '}
									published
								</p>
							</div>
						</div>
						<Button
							onClick={() => router.push('/create')}
							className='gap-2 bg-gradient-hero text-white shadow-lg shadow-brand/30'
						>
							<Plus className='size-4' />
							Create Recipe
						</Button>
					</div>
				</motion.div>

				{/* Filters */}
				{recipes.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
						className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'
					>
						<div className='relative flex-1 sm:max-w-xs'>
							<Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted' />
							<Input
								value={searchQuery}
								onChange={e => setSearchQuery(e.target.value)}
								placeholder='Search your recipes...'
								className='pl-9'
							/>
						</div>
						<Select
							value={sortBy}
							onValueChange={v => setSortBy(v as typeof sortBy)}
						>
							<SelectTrigger className='w-full sm:w-40'>
								<SelectValue placeholder='Sort by' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='newest'>Newest</SelectItem>
								<SelectItem value='popular'>Most Liked</SelectItem>
								<SelectItem value='views'>Most Viewed</SelectItem>
							</SelectContent>
						</Select>
					</motion.div>
				)}

				{/* Recipes Grid */}
				{recipes.length === 0 ? (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className='rounded-2xl border border-border-subtle bg-bg-card p-12 text-center shadow-card'
					>
						<div className='mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-brand/10'>
							<ChefHat className='size-8 text-brand' />
						</div>
						<h3 className='mb-2 text-xl font-bold text-text'>No recipes yet</h3>
						<p className='mb-6 text-text-muted'>
							Share your culinary creations with the world!
						</p>
						<Button
							onClick={() => router.push('/create')}
							className='gap-2 bg-gradient-hero text-white'
						>
							<Plus className='size-4' />
							Create Your First Recipe
						</Button>
					</motion.div>
				) : filteredRecipes.length === 0 ? (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className='rounded-2xl border border-border-subtle bg-bg-card p-8 text-center shadow-card'
					>
						<p className='text-text-muted'>
							No recipes match &ldquo;{searchQuery}&rdquo;
						</p>
					</motion.div>
				) : (
					<motion.div
						variants={staggerContainer}
						initial='hidden'
						animate='visible'
						className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'
					>
						{filteredRecipes.map(recipe => (
							<RecipeManageCard
								key={recipe.id}
								recipe={recipe}
								onDelete={handleDelete}
								isDeleting={deletingId === recipe.id}
							/>
						))}
					</motion.div>
				)}
			</PageContainer>
		</PageTransition>
	)
}

// Loading skeleton
function MyRecipesSkeleton() {
	return (
		<PageContainer maxWidth='2xl'>
			<div className='mb-8 flex items-center justify-between'>
				<div className='flex items-center gap-4'>
					<Skeleton className='size-10 rounded-full' />
					<div>
						<Skeleton className='mb-2 h-8 w-40' />
						<Skeleton className='h-4 w-24' />
					</div>
				</div>
				<Skeleton className='h-10 w-36' />
			</div>
			<div className='mb-6 flex gap-3'>
				<Skeleton className='h-10 w-64' />
				<Skeleton className='h-10 w-40' />
			</div>
			<div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
				{[1, 2, 3, 4, 5, 6].map(i => (
					<div
						key={i}
						className='overflow-hidden rounded-2xl border border-border-subtle bg-bg-card'
					>
						<Skeleton className='aspect-video' />
						<div className='p-4'>
							<Skeleton className='mb-2 h-6 w-3/4' />
							<Skeleton className='mb-4 h-4 w-full' />
							<Skeleton className='mb-4 h-4 w-2/3' />
							<div className='flex gap-2'>
								<Skeleton className='h-9 flex-1' />
								<Skeleton className='size-9' />
							</div>
						</div>
					</div>
				))}
			</div>
		</PageContainer>
	)
}
