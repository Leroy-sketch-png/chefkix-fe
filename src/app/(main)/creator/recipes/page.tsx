'use client'

import { useTranslations } from 'next-intl'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
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
	Copy,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PageHeader } from '@/components/layout/PageHeader'
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
import {
	getRecipesByUserId,
	deleteRecipe,
	duplicateRecipe,
} from '@/services/recipe'
import { getRecipeImage } from '@/lib/types/recipe'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	CARD_FEED_HOVER,
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
	onDuplicate: (id: string) => void
	isDeleting: boolean
	isDuplicating: boolean
}

const difficultyColors: Record<Difficulty, string> = {
	Beginner: 'bg-success text-white',
	Intermediate: 'bg-warning text-white',
	Advanced: 'bg-error text-white',
	Expert: 'bg-xp text-white',
}

const RecipeManageCard = ({
	recipe,
	onDelete,
	onDuplicate,
	isDeleting,
	isDuplicating,
}: RecipeManageCardProps) => {
	const router = useRouter()
	const [isNavigating, startNavigationTransition] = useTransition()
	const t = useTranslations('creator')

	return (
		<motion.div
			variants={staggerItem}
			whileHover={CARD_FEED_HOVER}
			className='group overflow-hidden rounded-2xl border border-border-subtle bg-bg-card shadow-card transition-shadow hover:shadow-warm'
		>
			{/* Image */}
			<Link href={`/recipes/${recipe.id}`} className='block'>
				<div className='relative aspect-video overflow-hidden'>
					<Image
						src={getRecipeImage(recipe)}
						alt={recipe.title}
						fill
						sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
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
					<h3 className='mb-1 line-clamp-1 text-lg font-serif font-bold text-text group-hover:text-brand'>
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
						onClick={() => startNavigationTransition(() => {
							router.push(`/create?draftId=${recipe.id}`)
						})}
						variant='outline'
						size='sm'
						disabled={isNavigating}
						className='flex-1 gap-1'
					>
						{isNavigating ? <Loader2 className='size-4 animate-spin' /> : <Edit3 className='size-4' />}
						{t('edit')}
					</Button>
					<Button
						onClick={() => onDuplicate(recipe.id)}
						variant='outline'
						size='sm'
						disabled={isDuplicating}
						title={t('duplicateAsDraft')}
						className='border-brand/30 text-brand hover:bg-brand/10'
					>
						{isDuplicating ? (
							<Loader2 className='size-4 animate-spin' />
						) : (
							<Copy className='size-4' />
						)}
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
								<AlertDialogTitle>{t('deleteRecipeTitle')}</AlertDialogTitle>
								<AlertDialogDescription>
									{t('deleteRecipeDesc', { title: recipe.title })}
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
								<AlertDialogAction
									onClick={() => onDelete(recipe.id)}
									className='bg-error text-white hover:bg-error/90'
								>
									{t('delete')}
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
	const t = useTranslations('creator')
	const router = useRouter()
	const { user } = useAuthStore()
	const [isNavigating, startNavigationTransition] = useTransition()
	const [recipes, setRecipes] = useState<Recipe[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [deletingId, setDeletingId] = useState<string | null>(null)
	const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState('')
	const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'views'>('newest')
	const [retryCount, setRetryCount] = useState(0)

	// Fetch user's recipes
	useEffect(() => {
		let cancelled = false
		const fetchRecipes = async () => {
			if (!user?.userId) return

			setIsLoading(true)
			setError(null)

			try {
				const response = await getRecipesByUserId(user.userId)
				if (cancelled) return
				if (response.success && response.data) {
					setRecipes(response.data)
				} else {
					setError(response.message || t('errorLoadRecipes'))
				}
			} catch {
				if (!cancelled) setError(t('errorLoadRecipes'))
			} finally {
				if (!cancelled) setIsLoading(false)
			}
		}

		fetchRecipes()
		return () => {
			cancelled = true
		}
	}, [user?.userId, retryCount, t])

	// Handle delete
	const handleDelete = async (recipeId: string) => {
		setDeletingId(recipeId)
		try {
			const response = await deleteRecipe(recipeId)
			if (response.success) {
				setRecipes(prev => prev.filter(r => r.id !== recipeId))
				toast.success(t('recipeDeleted'))
			} else {
				toast.error(response.message || t('failedToDeleteRecipe'))
			}
		} catch {
			toast.error(t('failedToDeleteRecipe'))
		} finally {
			setDeletingId(null)
		}
	}

	// Handle duplicate
	const handleDuplicate = async (recipeId: string) => {
		if (duplicatingId) return
		setDuplicatingId(recipeId)
		try {
			const response = await duplicateRecipe(recipeId)
			if (response.success && response.data) {
				toast.success(t('recipeDuplicated'))
				startNavigationTransition(() => {
					router.push(`/create?draftId=${response.data.id}`)
				})
			} else {
				toast.error(response.message || t('failedToDuplicateRecipe'))
			}
		} catch {
			toast.error(t('failedToDuplicateRecipe'))
		} finally {
			setDuplicatingId(null)
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
						title={t('errorLoadRecipes')}
						message={error}
						onRetry={() => {
							setError(null)
							setRetryCount(c => c + 1)
						}}
						showHomeButton
					/>
				</PageContainer>
			</PageTransition>
		)
	}

	return (
		<PageTransition>
			{/* Global navigation loading indicator */}
			<AnimatePresence>
				{isNavigating && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed top-20 left-1/2 z-toast -translate-x-1/2'
					>
						<div className='flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-warm'>
							<Loader2 className='size-4 animate-spin' />
					{t('loading')}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<PageContainer maxWidth='2xl'>
				{/* Header with PageHeader + back button + create action */}
				<div className='mb-8 flex items-center gap-3'>
					<button
						type='button'
						onClick={() => router.back()}
						className='flex size-10 items-center justify-center rounded-xl border border-border bg-bg-card text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text'
					>
						<ArrowLeft className='size-5' />
					</button>
					<div className='flex-1'>
						<PageHeader
							icon={ChefHat}
							title={t('myRecipes')}
							subtitle={t('recipeCount', { count: recipes.length })}
							gradient='purple'
							marginBottom='sm'
							className='mb-0'
							rightAction={
								<Button
									onClick={() => startNavigationTransition(() => {
										router.push('/create')
									})}
									disabled={isNavigating}
									className='gap-2 bg-gradient-hero text-white shadow-lg shadow-brand/30 disabled:opacity-50'
								>
									<Plus className='size-4' />
									{t('createRecipe')}
								</Button>
							}
						/>
					</div>
				</div>

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
								placeholder={t('searchRecipes')}
								className='pl-9'
							/>
						</div>
						<Select
							value={sortBy}
							onValueChange={v => setSortBy(v as typeof sortBy)}
						>
							<SelectTrigger className='w-full sm:w-40'>
								<SelectValue placeholder={t('sortBy')} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='newest'>{t('sortNewest')}</SelectItem>
								<SelectItem value='popular'>{t('sortMostLiked')}</SelectItem>
								<SelectItem value='views'>{t('sortMostViewed')}</SelectItem>
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
						<h3 className='mb-2 text-xl font-bold text-text'>{t('noRecipesYet')}</h3>
						<p className='mb-6 text-text-muted'>
							{t('noRecipesYetDesc')}
						</p>
						<Button
							onClick={() => startNavigationTransition(() => {
								router.push('/create')
							})}
							disabled={isNavigating}
							className='gap-2 bg-gradient-hero text-white disabled:opacity-50'
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
							{t('noRecipesMatch', { query: searchQuery })}
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
								onDuplicate={handleDuplicate}
								isDeleting={deletingId === recipe.id}
								isDuplicating={duplicatingId === recipe.id}
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
