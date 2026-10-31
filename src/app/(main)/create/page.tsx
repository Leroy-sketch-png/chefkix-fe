'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { RecipeCreateAiFlow, type RecipeFormData } from '@/components/recipe'
import { CreateCommandDeck } from '@/components/recipe/CreateCommandDeck'
import { DraftsList } from '@/components/recipe/DraftsList'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { Skeleton } from '@/components/ui/skeleton'
import { Recipe } from '@/lib/types/recipe'
import { getRecipeById } from '@/services/recipe'
import { ArrowLeft, FileText, Clock, Trash2, Edit3 } from 'lucide-react'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	CARD_HOVER,
} from '@/lib/motion'
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
import { useAuthStore } from '@/store/authStore'
import { recipeDraftRepository } from '@/lib/recipe-draft-repository'
import { useFormatter, useTranslations } from 'next-intl'
import {
	clearLocalRecipeDraft,
	isLocalRecipeDraftStale,
	readLocalRecipeDraft,
	type LocalRecipeDraft,
} from '@/lib/local-recipe-draft'

type RecipeEditorSource = 'new' | 'local' | 'server'

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
	const t = useTranslations('create')
	const format = useFormatter()
	const ownerId = useAuthStore(state => state.user?.userId)
	const urlDraftId = searchParams.get('draftId')
	const [mode, setMode] = useState<'list' | 'create'>(
		urlDraftId ? 'create' : 'list',
	)
	const [selectedDraft, setSelectedDraft] = useState<Recipe | null>(null)
	const [localDraft, setLocalDraft] =
		useState<LocalRecipeDraft<RecipeFormData> | null>(null)
	const [localDraftOwnerId, setLocalDraftOwnerId] = useState<string | null>(
		null,
	)
	const legacyDraftRef = useRef<LocalRecipeDraft<RecipeFormData> | null>(null)
	const [legacyDraftAvailable, setLegacyDraftAvailable] = useState(false)
	const [editorSource, setEditorSource] = useState<RecipeEditorSource>(
		urlDraftId ? 'server' : 'new',
	)
	const [showDiscardDialog, setShowDiscardDialog] = useState(false)
	const [discardAction, setDiscardAction] = useState<'discard' | 'start'>(
		'discard',
	)
	const [isLoadingDraft, setIsLoadingDraft] = useState(!!urlDraftId)
	const ownedLocalDraft = localDraftOwnerId === ownerId ? localDraft : null
	const localDraftIsOlder = ownedLocalDraft
		? isLocalRecipeDraftStale(ownedLocalDraft.savedAt)
		: false

	const loadLocalDraft = useCallback(async () => {
		if (!ownerId) {
			setLocalDraft(null)
			setLocalDraftOwnerId(null)
			setLegacyDraftAvailable(false)
			legacyDraftRef.current = null
			return
		}

		try {
			const saved = await recipeDraftRepository.load(ownerId)
			if (useAuthStore.getState().user?.userId !== ownerId) return
			if (saved) {
				setLocalDraft({
					type: 'manual',
					data: saved.data,
					savedAt: new Date(saved.updatedAt).toISOString(),
				})
				setLocalDraftOwnerId(ownerId)
				setLegacyDraftAvailable(false)
				return
			}
		} catch (error) {
			logDevError('Failed to load local recipe draft:', error)
			toast.error(t('localDraftStorageUnavailable'))
			return
		}

		const result = readLocalRecipeDraft<RecipeFormData>()
		if (result.status === 'corrupt') {
			clearLocalRecipeDraft()
			setLocalDraft(null)
			toast.error(t('draftCorrupted'))
			return
		}
		if (result.status !== 'valid') {
			setLocalDraft(null)
			setLegacyDraftAvailable(false)
			legacyDraftRef.current = null
			return
		}

		const legacyOwner = (
			result.draft as LocalRecipeDraft<RecipeFormData> & { ownerId?: string }
		).ownerId
		if (legacyOwner === ownerId) {
			try {
				await recipeDraftRepository.save(ownerId, result.draft.data)
				if (useAuthStore.getState().user?.userId !== ownerId) return
				clearLocalRecipeDraft()
				setLocalDraft(result.draft)
				setLocalDraftOwnerId(ownerId)
				setLegacyDraftAvailable(false)
				return
			} catch (error) {
				logDevError('Failed to migrate owned local recipe draft:', error)
				toast.error(t('localDraftStorageUnavailable'))
				return
			}
		}
		legacyDraftRef.current = result.draft
		setLocalDraft(null)
		setLocalDraftOwnerId(null)
		setLegacyDraftAvailable(true)
	}, [ownerId, t])

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
					setEditorSource('server')
					setMode('create')
				} else {
					setSelectedDraft(null)
					toast.error(t('draftNotFound'))
					setMode('list')
				}
			} catch (error) {
				if (cancelled) return
				logDevError('Failed to load draft from URL:', error)
				setSelectedDraft(null)
				toast.error(t('failedToLoadDraft'))
				setMode('list')
			} finally {
				if (!cancelled) setIsLoadingDraft(false)
			}
		}
		loadUrlDraft()
		return () => {
			cancelled = true
		}
	}, [t, urlDraftId])

	// Check for local draft on mount
	useEffect(() => {
		if (urlDraftId) return // Skip local draft check if loading from URL
		loadLocalDraft()
	}, [loadLocalDraft, urlDraftId])

	const handlePublishSuccess = async (recipeId: string) => {
		// A server draft has its own identity; never erase unrelated local recovery.
		if (editorSource !== 'server') {
			try {
				if (ownerId) await recipeDraftRepository.clear(ownerId)
				setLocalDraft(null)
				setLocalDraftOwnerId(null)
			} catch (error) {
				logDevError('Published recipe, but local draft cleanup failed:', error)
				toast.error(t('localDraftCleanupFailed'))
			}
		}
		// Navigate to the new recipe page
		router.push(`/recipes/${recipeId}`)
	}

	/**
	 * Fetch full recipe data when selecting a draft.
	 * The draft list only returns summary data (no ingredients/steps).
	 * We need to fetch the full recipe to edit it properly.
	 */
	const handleSelectDraft = useCallback(
		async (draftId: string) => {
			setIsLoadingDraft(true)
			try {
				const response = await getRecipeById(draftId)
				if (response.success && response.data) {
					setSelectedDraft(response.data)
					setEditorSource('server')
					setMode('create')
				} else {
					setSelectedDraft(null)
					toast.error(t('failedToLoadDraft'))
				}
			} catch (error) {
				logDevError('Failed to load draft:', error)
				setSelectedDraft(null)
				toast.error(t('failedToLoadDraftRetry'))
			} finally {
				setIsLoadingDraft(false)
			}
		},
		[t],
	)

	const handleResumeLocalDraft = () => {
		setSelectedDraft(null)
		setEditorSource('local')
		setMode('create')
	}

	const confirmDiscardLocalDraft = async (event: React.MouseEvent) => {
		event.preventDefault()
		try {
			if (!ownerId) throw new Error('Missing authenticated draft owner')
			await recipeDraftRepository.clear(ownerId)
			setLocalDraft(null)
			setLocalDraftOwnerId(null)
			setShowDiscardDialog(false)
			if (discardAction === 'start') {
				setSelectedDraft(null)
				setEditorSource('new')
				setMode('create')
			}
		} catch (error) {
			logDevError('Failed to discard local recipe draft:', error)
			toast.error(t('localDraftCleanupFailed'))
		}
	}

	const claimLegacyDraft = async () => {
		const legacy = legacyDraftRef.current
		if (!legacy || !ownerId) return
		try {
			await recipeDraftRepository.save(ownerId, legacy.data)
			if (useAuthStore.getState().user?.userId !== ownerId) return
			if (!clearLocalRecipeDraft())
				throw new Error('Legacy draft could not be cleared')
			legacyDraftRef.current = null
			setLegacyDraftAvailable(false)
			setLocalDraft(legacy)
			setLocalDraftOwnerId(ownerId)
		} catch (error) {
			logDevError('Failed to claim legacy recipe draft:', error)
			toast.error(t('localDraftStorageUnavailable'))
		}
	}

	const handleNewRecipe = () => {
		if (ownedLocalDraft) {
			setDiscardAction('start')
			setShowDiscardDialog(true)
			return
		}
		setSelectedDraft(null)
		setEditorSource('new')
		setMode('create')
	}

	const handleDiscardRequest = () => {
		setDiscardAction('discard')
		setShowDiscardDialog(true)
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
			<PageContainer maxWidth={mode === 'list' ? '2xl' : 'lg'}>
				<AnimatePresence mode='wait'>
					{isLoadingDraft ? (
						<DraftLoadingState key='loading' />
					) : mode === 'list' ? (
						<motion.div
							key='list'
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							transition={TRANSITION_SPRING}
						>
							<div className='grid grid-cols-1 gap-6'>
								<div>
									<CreateCommandDeck className='mb-6' />

									{legacyDraftAvailable && (
										<div className='mb-6 rounded-xl border border-warning/40 bg-warning/5 p-4'>
											<p className='text-sm font-semibold text-text-primary'>
												{t('legacyDraftNeedsReview')}
											</p>
											<p className='mt-1 text-sm text-text-secondary'>
												{t('legacyDraftClaimDescription')}
											</p>
											<button
												type='button'
												onClick={() => void claimLegacyDraft()}
												className='mt-3 rounded-md font-semibold text-brand underline underline-offset-2 focus-visible:ring-2 focus-visible:ring-brand/50'
											>
												{t('claimLegacyDraft')}
											</button>
										</div>
									)}

									{/* Local Draft Recovery Card */}
									{ownedLocalDraft && (
										<motion.div
											initial={{ opacity: 0, y: -10 }}
											animate={{ opacity: 1, y: 0 }}
											className='mb-6 relative overflow-hidden rounded-2xl border-2 border-streak/60 bg-gradient-to-r from-streak/10 via-bg-card to-streak/5 p-5 shadow-card'
										>
											<div className='pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-streak/20 blur-2xl' />
											<div className='flex items-start gap-4'>
												<div className='flex size-12 items-center justify-center rounded-xl bg-streak/20'>
													<FileText className='size-6 text-streak' />
												</div>
												<div className='flex-1'>
													<div className='flex items-center gap-2'>
														<h2 className='font-semibold text-text-primary'>
															{ownedLocalDraft.data.title ||
																t('untitledRecipe')}
														</h2>
														<span className='rounded-full bg-streak/20 px-2 py-0.5 text-xs font-medium text-streak'>
															{t(
																localDraftIsOlder
																	? 'olderLocalDraft'
																	: 'localDraft',
															)}
														</span>
													</div>
													<div className='mt-1 flex items-center gap-1.5 text-xs text-text-muted'>
														<Clock className='size-3' />
														<span>
															{t('savedAgo', {
																time: format.relativeTime(
																	new Date(ownedLocalDraft.savedAt),
																	{ now: new Date() },
																),
															})}
														</span>
													</div>
													<p className='mt-2 text-sm text-text-secondary'>
														{t('ingredientsSteps', {
															ingredients:
																ownedLocalDraft.data.ingredients?.length || 0,
															steps: ownedLocalDraft.data.steps?.length || 0,
														})}
													</p>
													{localDraftIsOlder ? (
														<p className='mt-2 text-sm text-text-secondary'>
															{t('olderDraftNotice')}
														</p>
													) : null}
												</div>
											</div>
											<div className='mt-4 flex gap-3'>
												<motion.button
													type='button'
													onClick={handleResumeLocalDraft}
													whileHover={BUTTON_HOVER}
													whileTap={BUTTON_TAP}
													className='flex-1 rounded-xl bg-streak py-2.5 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-brand/50'
												>
													{t('resumeEditing')}
												</motion.button>
												<motion.button
													type='button'
													onClick={handleDiscardRequest}
													aria-label={t('discardDraftTitle')}
													title={t('discardDraftTitle')}
													whileHover={BUTTON_HOVER}
													whileTap={BUTTON_TAP}
													className='flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm text-text-muted hover:border-destructive hover:text-destructive focus-visible:ring-2 focus-visible:ring-brand/50'
												>
													<Trash2 className='size-4' />
												</motion.button>
											</div>
										</motion.div>
									)}

									<DraftsList
										onSelectDraft={handleSelectDraft}
										onNewRecipe={handleNewRecipe}
									/>
								</div>
							</div>
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
								initialManualDraft={ownedLocalDraft?.data}
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
							<AlertDialogTitle className='text-lg font-bold text-text-primary'>
								{t(
									discardAction === 'start'
										? 'startFreshDraftTitle'
										: 'discardDraftTitle',
								)}
							</AlertDialogTitle>
							<AlertDialogDescription className='text-sm text-text-secondary'>
								{t(
									discardAction === 'start'
										? 'startFreshDraftDescription'
										: 'discardDraftDescription',
									{
										title: ownedLocalDraft?.data.title || t('untitledRecipe'),
									},
								)}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter className='flex-row gap-3 sm:justify-center'>
							<AlertDialogCancel className='flex-1 rounded-xl border-border bg-bg text-text-secondary hover:bg-bg-hover'>
								{t('keepIt')}
							</AlertDialogCancel>
							<AlertDialogAction
								onClick={confirmDiscardLocalDraft}
								className='flex-1 rounded-xl bg-destructive text-white hover:bg-destructive/90'
							>
								{t(discardAction === 'start' ? 'discardAndStart' : 'discard')}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				{/* Bottom breathing room for MobileBottomNav */}
				<div className='pb-[calc(var(--h-mobile-nav)+var(--space-16))] md:pb-8' />
			</PageContainer>
		</PageTransition>
	)
}

function DraftLoadingState() {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className='mx-auto max-w-3xl space-y-5 p-5'
		>
			<div className='flex items-center gap-4'>
				<Skeleton className='size-10 rounded-xl' />
				<Skeleton className='h-8 w-48' />
			</div>
			<div className='grid gap-4 md:grid-cols-2'>
				<Skeleton className='h-24 rounded-2xl' />
				<Skeleton className='h-24 rounded-2xl' />
			</div>
			<div className='space-y-4 rounded-2xl bg-bg-card p-6'>
				<Skeleton className='h-6 w-40' />
				<Skeleton className='h-4 w-64' />
				<Skeleton className='h-40 w-full rounded-xl' />
				<Skeleton className='h-12 w-full rounded-xl' />
			</div>
		</motion.div>
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
