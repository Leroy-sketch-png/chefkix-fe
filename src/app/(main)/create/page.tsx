'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { RecipeCreateAiFlow, type RecipeFormData } from '@/components/recipe'
import { DraftsList } from '@/components/recipe/DraftsList'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { Recipe } from '@/lib/types/recipe'
import { ArrowLeft, FileText, Clock, Trash2 } from 'lucide-react'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	CARD_HOVER,
} from '@/lib/motion'
import { formatDistanceToNow } from 'date-fns'
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
export default function CreateRecipePage() {
	const router = useRouter()
	const [mode, setMode] = useState<'list' | 'create'>('list')
	const [selectedDraft, setSelectedDraft] = useState<Recipe | null>(null)
	const [localDraft, setLocalDraft] = useState<LocalDraft | null>(null)
	const [showDiscardDialog, setShowDiscardDialog] = useState(false)

	// Check for local draft on mount
	useEffect(() => {
		try {
			const stored = localStorage.getItem('chefkix-recipe-draft')
			if (stored) {
				const parsed = JSON.parse(stored) as LocalDraft
				if (parsed.type === 'manual' && parsed.data) {
					setLocalDraft(parsed)
				}
			}
		} catch (e) {
			console.error('Failed to parse local draft:', e)
			localStorage.removeItem('chefkix-recipe-draft')
		}
	}, [])

	const handlePublishSuccess = (recipeId: string) => {
		// Clear local draft on successful publish
		localStorage.removeItem('chefkix-recipe-draft')
		setLocalDraft(null)
		// Navigate to the new recipe page
		router.push(`/recipes/${recipeId}`)
	}

	const handleSelectDraft = (draft: Recipe) => {
		setSelectedDraft(draft)
		setLocalDraft(null) // Clear local draft state when using server draft
		setMode('create')
	}

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
		// Re-check for local draft (it might have been saved during editing)
		try {
			const stored = localStorage.getItem('chefkix-recipe-draft')
			if (stored) {
				const parsed = JSON.parse(stored) as LocalDraft
				if (parsed.type === 'manual' && parsed.data) {
					setLocalDraft(parsed)
				}
			}
		} catch (e) {
			// Ignore
		}
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
							<div className='mb-8'>
								<h1 className='text-3xl font-bold text-text'>Create Recipe</h1>
								<p className='mt-1 text-text-muted'>
									Start a new recipe or continue working on a draft
								</p>
							</div>

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
							<AlertDialogDescription className='text-sm text-muted-foreground'>
								This will permanently delete your unsaved recipe &quot;
								{localDraft?.data.title || 'Untitled Recipe'}&quot;. This action
								cannot be undone.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter className='flex-row gap-3 sm:justify-center'>
							<AlertDialogCancel className='flex-1 rounded-xl border-border bg-bg text-muted-foreground hover:bg-muted'>
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
