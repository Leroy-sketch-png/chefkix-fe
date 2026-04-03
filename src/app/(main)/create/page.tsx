'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { RecipeCreateAiFlow, type RecipeFormData } from '@/components/recipe'
import { DraftsList } from '@/components/recipe/DraftsList'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PageHeader } from '@/components/layout/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { Recipe } from '@/lib/types/recipe'
import { getRecipeById } from '@/services/recipe'
import {
	ArrowLeft,
	FileText,
	Clock,
	Trash2,
	Loader2,
	Edit3,
} from 'lucide-react'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	CARD_HOVER,
} from '@/lib/motion'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
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
import { logDevError } from '@/lib/dev-log'
import { useOnboardingOrchestrator } from '@/hooks/useOnboardingOrchestrator'

/**
 * Local Draft shape (stored in localStorage under 'chefkix-recipe-draft')
 */
interface LocalDraft {
	type: 'manual'
	data: RecipeFormData
	savedAt: string
}

/**
 * Create Recipe Page
 *
 * DESIGN DECISION: No back button for the main view.
 * Create is a PRIMARY navigation destination (appears in LeftSidebar).
 * Primary destinations don't have back buttons - user navigates away via nav.
 *
 * However, when editing a draft or creating new, show a back button to return to drafts.
 */
function CreateRecipeContent() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const urlDraftId = searchParams.get('draftId')
	const [mode, setMode] = useState<'list' | 'create'>(
		urlDraftId ? 'create' : 'list',
	)
	const [selectedDraft, setSelectedDraft] = useState<Recipe | null>(null)
	const [localDraft, setLocalDraft] = useState<LocalDraft | null>(null)
	const [showDiscardDialog, setShowDiscardDialog] = useState(false)
	const [isLoadingDraft, setIsLoadingDraft] = useState(!!urlDraftId)

	// Onboarding hints
	useOnboardingOrchestrator({ delay: 1000 })

	const loadLocalDraft = useCallback(() => {
		try {
			const stored = localStorage.getItem('chefkix-recipe-draft')
			if (!stored) {
				setLocalDraft(null)
				return
			}

			const parsed = JSON.parse(stored) as LocalDraft
			if (parsed.type === 'manual' && parsed.data) {
				setLocalDraft(parsed)
				return
			}

			setLocalDraft(null)
		} catch (error) {
			logDevError('Failed to parse local draft:', error)
			localStorage.removeItem('chefkix-recipe-draft')
			setLocalDraft(null)
			toast.error(
				'Your local draft was corrupted and had to be removed. Sorry about that!',
			)
		}
	}, [])

	// Load draft from URL ?draftId= param (deep links, redirects from edit page)
	useEffect(() => {
		if (!urlDraftId) return
		let cancelled = false
		const loadUrlDraft = async () => {
			setIsLoadingDraft(true)
			try {
				const response = await getRecipeById(urlDraftId)
				if (cancelled) return
				if (response.success && response.data) {
					setSelectedDraft(response.data)
					localStorage.removeItem('chefkix-recipe-draft')
					setLocalDraft(null)
					setMode('create')
				} else {
					setSelectedDraft(null)
					toast.error(response.message || 'Draft not found')
					setMode('list')
				}
			} catch (error) {
				if (cancelled) return
				logDevError('Failed to load draft from URL:', error)
				setSelectedDraft(null)
				toast.error('Failed to load draft')
				setMode('list')
			} finally {
				if (!cancelled) setIsLoadingDraft(false)
			}
		}
		loadUrlDraft()
		return () => {
			cancelled = true
		}
	}, [urlDraftId])

	// Check for local draft on mount
	useEffect(() => {
		if (urlDraftId) return // Skip local draft check if loading from URL
		loadLocalDraft()
	}, [loadLocalDraft, urlDraftId])

	const handlePublishSuccess = (recipeId: string) => {
		// Clear local draft on successful publish
		localStorage.removeItem('chefkix-recipe-draft')
		setLocalDraft(null)
		// Navigate to the new recipe page
		router.push(`/recipes/${recipeId}`)
	}

	/**
	 * Fetch full recipe data when selecting a draft.
	 * The draft list only returns summary data (no ingredients/steps).
	 * We need to fetch the full recipe to edit it properly.
	 */
	const handleSelectDraft = useCallback(async (draftId: string) => {
		setIsLoadingDraft(true)
		try {
			const response = await getRecipeById(draftId)
			if (response.success && response.data) {
				setSelectedDraft(response.data)
				localStorage.removeItem('chefkix-recipe-draft')
				setLocalDraft(null) // Clear local draft state when using server draft
				setMode('create')
			} else {
				setSelectedDraft(null)
				toast.error(response.message || 'Failed to load draft')
			}
		} catch (error) {
			logDevError('Failed to load draft:', error)
			setSelectedDraft(null)
			toast.error('Failed to load draft. Please try again.')
		} finally {
			setIsLoadingDraft(false)
		}
	}, [])

	const handleResumeLocalDraft = () => {
		setSelectedDraft(null)
		setMode('create')
	}

	const handleDiscardLocalDraft = () => {
		localStorage.removeItem('chefkix-recipe-draft')
		setLocalDraft(null)
		setShowDiscardDialog(false)
	}

	const handleNewRecipe = () => {
		setSelectedDraft(null)
		setLocalDraft(null)
		setMode('create')
	}

	const handleBackToList = () => {
		setMode('list')
		setSelectedDraft(null)
		// Clean URL if we came from ?draftId=
		if (urlDraftId) {
			router.replace('/create', { scroll: false })
		}
		// Re-check for local draft (it might have been saved during editing)
		loadLocalDraft()
	}

	return (
		<PageTransition>
			<PageContainer maxWidth='lg'>
				<AnimatePresence mode='wait'>
					{mode === 'list' ? (
						<motion.div
							key='list'
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							transition={TRANSITION_SPRING}
						>
							{/* Header */}
							<PageHeader
								icon={Edit3}
								title='Create Recipe'
								subtitle='Start a new recipe or continue working on a draft'
								gradient='orange'
								marginBottom='md'
							/>

							{/* Local Draft Recovery Card */}
							{localDraft && (
								<motion.div
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									className='mb-6 overflow-hidden rounded-2xl border-2 border-dashed border-streak/40 bg-gradient-to-r from-streak/10 to-orange-500/5 p-5'
								>
									<div className='flex items-start gap-4'>
										<div className='flex size-12 items-center justify-center rounded-xl bg-streak/20'>
											<FileText className='size-6 text-streak' />
										</div>
										<div className='flex-1'>
											<div className='flex items-center gap-2'>
												<h3 className='font-semibold text-text'>
													{localDraft.data.title || 'Untitled Recipe'}
												</h3>
												<span className='rounded-full bg-streak/20 px-2 py-0.5 text-xs font-medium text-streak'>
													Local Draft
												</span>
											</div>
											<div className='mt-1 flex items-center gap-1.5 text-xs text-text-muted'>
												<Clock className='size-3' />
												<span>
													Saved{' '}
													{formatDistanceToNow(new Date(localDraft.savedAt), {
														addSuffix: true,
													})}
												</span>
											</div>
											<p className='mt-2 text-sm text-text-secondary'>
												{localDraft.data.ingredients?.length || 0} ingredients •{' '}
												{localDraft.data.steps?.length || 0} steps
											</p>
										</div>
									</div>
									<div className='mt-4 flex gap-3'>
										<motion.button
											onClick={handleResumeLocalDraft}
											whileHover={BUTTON_HOVER}
											whileTap={BUTTON_TAP}
											className='flex-1 rounded-xl bg-streak py-2.5 text-sm font-semibold text-white'
										>
											Resume Editing
										</motion.button>
										<motion.button
											onClick={() => setShowDiscardDialog(true)}
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
											className='flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm text-text-muted hover:border-destructive hover:text-destructive'
										>
											<Trash2 className='size-4' />
										</motion.button>
									</div>
								</motion.div>
							)}

							{/* Drafts List with New Recipe CTA */}
							<DraftsList
								onSelectDraft={handleSelectDraft}
								onNewRecipe={handleNewRecipe}
							/>

							{/* Loading overlay when fetching full draft data */}
							<AnimatePresence>
								{isLoadingDraft && (
									<motion.div
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										className='fixed inset-0 z-modal flex items-center justify-center bg-black/50 backdrop-blur-sm'
									>
										<div className='flex flex-col items-center gap-4 rounded-2xl bg-bg-card p-8 shadow-lg'>
											<Loader2 className='size-8 animate-spin text-brand' />
											<p className='font-medium text-text'>Loading draft...</p>
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</motion.div>
					) : (
						<motion.div
							key='create'
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 20 }}
							transition={TRANSITION_SPRING}
						>
							{/* Recipe Create Flow - optionally with preloaded draft */}
							<RecipeCreateAiFlow
								onPublishSuccess={handlePublishSuccess}
								onBack={handleBackToList}
								initialDraft={selectedDraft || undefined}
								initialManualDraft={localDraft?.data}
							/>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Discard Local Draft Confirmation */}
				<AlertDialog
					open={showDiscardDialog}
					onOpenChange={setShowDiscardDialog}
				>
					<AlertDialogContent className='max-w-sm rounded-2xl border-border bg-bg-card'>
						<AlertDialogHeader className='text-center'>
							<div className='mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-destructive/10'>
								<Trash2 className='size-7 text-destructive' />
							</div>
							<AlertDialogTitle className='text-lg font-bold text-text'>
								Discard local draft?
							</AlertDialogTitle>
							<AlertDialogDescription className='text-sm text-text-secondary'>
								This will permanently delete your unsaved recipe &quot;
								{localDraft?.data.title || 'Untitled Recipe'}&quot;. This action
								cannot be undone.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter className='flex-row gap-3 sm:justify-center'>
							<AlertDialogCancel className='flex-1 rounded-xl border-border bg-bg text-text-secondary hover:bg-bg-hover'>
								Keep it
							</AlertDialogCancel>
							<AlertDialogAction
								onClick={handleDiscardLocalDraft}
								className='flex-1 rounded-xl bg-destructive text-white hover:bg-destructive/90'
							>
								Discard
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</PageContainer>
		</PageTransition>
	)
}

function CreateRecipeSkeleton() {
	return (
		<PageContainer maxWidth='lg'>
			<div className='space-y-6'>
				{/* Header */}
				<div className='flex items-center gap-3'>
					<Skeleton className='size-10 rounded-xl' />
					<Skeleton className='h-8 w-48' />
				</div>
				{/* Input area / Draft list */}
				<Skeleton className='h-32 w-full rounded-2xl' />
				{/* Draft cards */}
				{[1, 2, 3].map(i => (
					<div
						key={i}
						className='flex gap-4 rounded-2xl border border-border-subtle bg-bg-card p-4'
					>
						<Skeleton className='size-16 shrink-0 rounded-xl' />
						<div className='flex-1 space-y-2'>
							<Skeleton className='h-5 w-2/3' />
							<Skeleton className='h-4 w-1/3' />
						</div>
					</div>
				))}
			</div>
		</PageContainer>
	)
}

export default function CreateRecipePage() {
	return (
		<Suspense fallback={<CreateRecipeSkeleton />}>
			<CreateRecipeContent />
		</Suspense>
	)
}
