'use client'

/**
 * RecipeCreateAiFlow â€” The recipe creation orchestrator.
 *
 * This component manages the multi-step creation flow (input â†’ parsing â†’ preview â†’ xp-preview)
 * and delegates rendering to extracted sub-components. All pure helpers live in recipeCreateUtils.
 *
 * Architecture:
 *   Types         â†’ @/lib/types/recipeCreate
 *   Pure helpers  â†’ @/lib/recipeCreateUtils
 *   Sub-components: MethodCard, PasteArea, RecipeParsingOverlay, IngredientItem, StepItem, XpPreviewModal
 */

import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
	ArrowLeft,
	AlertTriangle,
	Clock,
	Edit3,
	ImagePlus,
	ListOrdered,
	Loader2,
	Lock,
	Plus,
	Rocket,
	ShoppingBasket,
	Signal,
	Sparkles,
	Utensils,
	Wand2,
	X,
} from 'lucide-react'
import Image from 'next/image'
import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { diag } from '@/lib/diagnostics'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	BUTTON_SUBTLE_HOVER,
	STEP_VARIANTS,
	STEP_TRANSITION,
	CONTENT_SWITCH_VARIANTS,
	CONTENT_SWITCH_TRANSITION,
	ICON_BUTTON_HOVER,
	ICON_BUTTON_TAP,
} from '@/lib/motion'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { logDevError, logDevWarn } from '@/lib/dev-log'

// â”€â”€ Hooks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import { useAutoSave, type SaveStatus } from '@/hooks/useAutoSave'
import { useBeforeUnloadWarning } from '@/hooks/useBeforeUnloadWarning'

// â”€â”€ Services & stores â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import { processRecipe, calculateMetas, validateRecipe } from '@/services/ai'
import {
	createDraft,
	saveDraft,
	uploadRecipeImages,
	publishRecipe,
} from '@/services/recipe'
import { guardContent } from '@/services/ml'
import { useCookingStore } from '@/store/cookingStore'
import { useUiStore } from '@/store/uiStore'
import { parsedRecipeToRecipe } from '@/lib/recipeTransforms'
import { triggerRecipeCompleteConfetti } from '@/lib/confetti'

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import { Recipe } from '@/lib/types/recipe'
import type { Difficulty } from '@/lib/types/gamification'
import { resolveBadge } from '@/lib/data/badgeRegistry'
import type {
	CreateMethod,
	CreateStep,
	ParsedRecipe,
	XpBreakdown,
	Ingredient,
	RecipeStep,
} from '@/lib/types/recipeCreate'

// â”€â”€ Extracted utilities â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import {
	modKey,
	RECALCULATION_THRESHOLD,
	validateRecipeForPublish,
	mapBackendErrorToEnglish,
	calculateRecipeChangePercent,
	transformProcessedRecipe,
} from '@/lib/recipeCreateUtils'

// â”€â”€ Extracted sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import { RecipeFormDetailed, type RecipeFormData } from './RecipeFormDetailed'
import { MethodCard } from './MethodCard'
import { PasteArea } from './PasteArea'
import { RecipeParsingOverlay } from './RecipeParsingOverlay'
import { IngredientItem } from './IngredientItem'
import { StepItem } from './StepItem'
import { XpPreviewModal } from './XpPreviewModal'
import {
	Combobox,
	type ComboboxOption,
} from '@/components/ui/combobox'

const CUISINE_OPTIONS: ComboboxOption[] = [
	'Italian', 'Asian', 'Mexican', 'American', 'French', 'Indian',
	'Mediterranean', 'Vietnamese', 'Thai', 'Chinese', 'Japanese',
	'Korean', 'Middle Eastern', 'African', 'Caribbean', 'Brazilian',
	'Greek', 'Spanish', 'Fusion', 'Other',
].map(c => ({ value: c, label: c }))

const isLocalPreviewUrl = (url?: string) =>
	typeof url === 'string' && url.startsWith('blob:')

// ============================================
// PROPS
// ============================================

interface RecipeCreateAiFlowProps {
	onBack?: () => void
	onPublishSuccess?: (recipeId: string) => void
	className?: string
	/** Optional initial draft to load (from draft listing) â€” server-saved AI-parsed draft */
	initialDraft?: Recipe
	/** Optional initial manual draft to load (from localStorage) â€” manually entered draft */
	initialManualDraft?: RecipeFormData
}

// ============================================
// AUTO-SAVE INDICATOR
// ============================================

function AutoSaveIndicator({
	status,
	lastSavedAt,
}: {
	status: SaveStatus
	lastSavedAt: string | null
}) {
	const t = useTranslations('recipe')
	if (status === 'idle' && !lastSavedAt) return null

	const formatTime = (iso: string) => {
		try {
			return new Date(iso).toLocaleTimeString([], {
				hour: '2-digit',
				minute: '2-digit',
			})
		} catch {
			return ''
		}
	}

	return (
		<AnimatePresence mode='wait'>
			{status === 'saving' && (
				<motion.span
					key='saving'
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className='flex items-center gap-1.5 text-xs text-text-secondary'
				>
					<Loader2 className='size-3 animate-spin' />
					{t('aiFlowSaving')}
				</motion.span>
			)}
			{status === 'saved' && lastSavedAt && (
				<motion.span
					key='saved'
					initial={{ opacity: 0, y: -4 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0 }}
					className='flex items-center gap-1.5 text-xs text-success'
				>
					<span className='size-1.5 rounded-full bg-success' />
					{t('aiFlowSavedAt', { time: formatTime(lastSavedAt) })}
				</motion.span>
			)}
			{status === 'error' && (
				<motion.span
					key='error'
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className='flex items-center gap-1.5 text-xs text-destructive'
				>
					<AlertTriangle className='size-3' />
					{t('aiFlowSaveFailed')}
				</motion.span>
			)}
			{status === 'idle' && lastSavedAt && (
				<motion.span
					key='idle-saved'
					initial={{ opacity: 0 }}
					animate={{ opacity: 0.6 }}
					exit={{ opacity: 0 }}
					className='text-xs text-text-secondary'
				>
					{t('aiFlowSavedAt', { time: formatTime(lastSavedAt) })}
				</motion.span>
			)}
		</AnimatePresence>
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
	const t = useTranslations('recipe')
	// If resuming a manual draft from localStorage, start in manual mode
	const [method, setMethod] = useState<CreateMethod>(
		initialManualDraft ? 'manual' : 'ai',
	)
	// CRITICAL: Initialize step based on whether we have a draft to prevent flicker.
	// Without this, component mounts with 'input', then useEffect sets 'preview' = visible flicker.
	const [step, setStep] = useState<CreateStep>(
		initialDraft ? 'preview' : 'input',
	)
	const [rawText, setRawText] = useState('')
	const [parsingStep, setParsingStep] = useState(0)
	const [recipe, setRecipe] = useState<ParsedRecipe | null>(null)
	const [xpBreakdown, setXpBreakdown] = useState<XpBreakdown | null>(null)
	// Draft management state
	const [draftId, setDraftId] = useState<string | null>(null)
	const [isSaving, setIsSaving] = useState(false)
	const [isPublishing, setIsPublishing] = useState(false)
	const [isCalculatingXp, setIsCalculatingXp] = useState(false)
	// Original recipe state for smart recalculation detection (30% threshold)
	const [originalRecipe, setOriginalRecipe] = useState<ParsedRecipe | null>(
		null,
	)
	// Track if user manually triggered need for recalculation (for manual entry mode)
	const [forceRecalculate, setForceRecalculate] = useState(false)
	// Track previous step order to detect no-op reorders
	const [prevStepIds, setPrevStepIds] = useState<string[]>([])
	// Cover image upload
	const coverImageRef = React.useRef<HTMLInputElement>(null)
	const [isUploadingCover, setIsUploadingCover] = useState(false)

	// â”€â”€ Auto-save â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
	const autoSavePayload = useMemo(() => {
		if (!recipe) return null
		return {
			title: recipe.title,
			description: recipe.description,
			coverImageUrl: recipe.coverImageUrl ? [recipe.coverImageUrl] : undefined,
			difficulty: recipe.difficulty,
			cookTimeMinutes: parseInt(recipe.cookTime) || 30,
			servings: recipe.servings,
			cuisineType: recipe.cuisine,
			fullIngredientList: (recipe.ingredients || []).map(i => {
				const parts = i.quantity.trim().split(' ')
				return {
					name: i.name,
					quantity: parts[0] || '',
					unit: parts.slice(1).join(' ') || '',
				}
			}),
			steps: (recipe.steps || []).map((s, i) => ({
				stepNumber: i + 1,
				description: s.instruction,
				action: s.technique,
				timerSeconds: s.timerSeconds || undefined,
				imageUrl: s.imageUrl,
				videoUrl: s.videoUrl,
				videoThumbnailUrl: s.videoThumbnailUrl,
				videoDurationSec: s.videoDurationSec,
			})),
			rewardBadges: (recipe.detectedBadges || []).map(b => b.name),
			skillTags: recipe.skillTags || [],
		}
	}, [recipe])

	const isAutoSaveEnabled = step === 'preview' && !isPublishing && !isSaving
	const { saveStatus, lastSavedAt, saveNow } = useAutoSave(
		draftId,
		autoSavePayload,
		isAutoSaveEnabled,
	)

	// â”€â”€ Derived state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
	const changePercent = calculateRecipeChangePercent(originalRecipe, recipe)
	const needsRecalculation =
		forceRecalculate || changePercent >= RECALCULATION_THRESHOLD
	const hasEdited = needsRecalculation
	const hasUnpersistedMedia = useMemo(() => {
		if (!recipe) return false
		if (isLocalPreviewUrl(recipe.coverImageUrl)) return true
		return (recipe.steps || []).some(step => isLocalPreviewUrl(step.imageUrl))
	}, [recipe])

	// â”€â”€ Warn before unload if recipe creation is in progress â”€â”€â”€â”€â”€â”€â”€â”€
	const hasUnsavedWork =
		(rawText.trim().length > 0 || recipe !== null) && !isPublishing
	useBeforeUnloadWarning(
		hasUnsavedWork,
		'You have an unfinished recipe. Are you sure you want to leave?',
	)

	// â”€â”€ Load initial draft â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
	useEffect(() => {
		if (initialDraft) {
			const parsedRecipe: ParsedRecipe = {
				title: initialDraft.title,
				description: initialDraft.description || '',
				coverImageUrl: initialDraft.coverImageUrl?.[0] || undefined,
				cookTime: `${initialDraft.cookTimeMinutes || initialDraft.totalTimeMinutes || 0} min`,
				servings: initialDraft.servings,
				cuisine: initialDraft.cuisineType || '',
				difficulty: initialDraft.difficulty,
				ingredients: (initialDraft.fullIngredientList || []).map(
					(ing, idx) => ({
						id: `ing-${idx}`,
						name: ing.name,
						quantity: `${ing.quantity || ''} ${ing.unit || ''}`.trim(),
					}),
				),
				steps: (initialDraft.steps || []).map((s, idx) => ({
					id: `step-${idx}`,
					instruction: s.description,
					timerSeconds: s.timerSeconds || undefined,
					technique: s.action,
					imageUrl: s.imageUrl,
				})),
				skillTags: initialDraft.skillTags || [],
				detectedBadges: (initialDraft.rewardBadges || []).map(b => {
					const resolved = resolveBadge(b)
					return {
						emoji: resolved?.icon || 'ðŸ†',
						name: b,
					}
				}),
				xpReward: initialDraft.xpReward,
				difficultyMultiplier: initialDraft.difficultyMultiplier,
			}

			setRecipe(parsedRecipe)
			setOriginalRecipe(structuredClone(parsedRecipe))
			setDraftId(initialDraft.id)
			setStep('preview')

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

	// â”€â”€ Clipboard paste â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
	const handlePaste = useCallback(async () => {
		try {
			const text = await navigator.clipboard.readText()
			setRawText(text)
		} catch (err) {
			logDevError('Failed to read clipboard:', err)
		}
	}, [])

	// â”€â”€ Cover image upload â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
	const handleCoverImageUpload = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0]
			if (!file || !recipe) return

			diag.image('recipe', 'select', {
				type: 'cover',
				fileName: file.name,
				size: file.size,
			})
			setIsUploadingCover(true)

			const localPreviewUrl = URL.createObjectURL(file)
			diag.image('recipe', 'upload-start', { type: 'cover', localPreviewUrl })
			setRecipe(prev =>
				prev ? { ...prev, coverImageUrl: localPreviewUrl } : prev,
			)

			try {
				const response = await uploadRecipeImages([file])
				if (response.success && response.data?.[0]) {
					diag.image('recipe', 'upload-success', {
						type: 'cover',
						serverUrl: response.data[0],
					})
					setRecipe(prev =>
						prev ? { ...prev, coverImageUrl: response.data[0] } : prev,
					)
					URL.revokeObjectURL(localPreviewUrl)
					toast.success(t('aiFlowCoverUploaded'))
				} else {
					diag.image('recipe', 'upload-fail', { type: 'cover', response })
					toast.error(t('aiFlowImageUploadFailed'), {
						description: t('aiFlowImageUploadFailedDesc'),
					})
				}
			} catch (error) {
				diag.image('recipe', 'upload-fail', { type: 'cover', error })
				toast.error(t('aiFlowImageUploadFailed'), {
					description: t('aiFlowImageUploadFailedDesc'),
				})
			} finally {
				setIsUploadingCover(false)
				if (coverImageRef.current) {
					coverImageRef.current.value = ''
				}
			}
		},
		[recipe],
	)

	// â”€â”€ Build save payload (shared between save-draft and publish) â”€â”€
	const buildSavePayload = useCallback(
		(targetRecipe: ParsedRecipe) => ({
			title: targetRecipe.title,
			description: targetRecipe.description,
			coverImageUrl: targetRecipe.coverImageUrl
				? isLocalPreviewUrl(targetRecipe.coverImageUrl)
					? undefined
					: [targetRecipe.coverImageUrl]
				: undefined,
			difficulty: targetRecipe.difficulty,
			cookTimeMinutes: parseInt(targetRecipe.cookTime) || 30,
			servings: targetRecipe.servings,
			cuisineType: targetRecipe.cuisine,
			fullIngredientList: (targetRecipe.ingredients || []).map(i => {
				const parts = i.quantity.trim().split(' ')
				const quantity = parts[0] || ''
				const unit = parts.slice(1).join(' ') || ''
				return { name: i.name, quantity, unit }
			}),
			steps: (targetRecipe.steps || []).map((s, i) => ({
				stepNumber: i + 1,
				description: s.instruction,
				action: s.technique,
				timerSeconds: s.timerSeconds || undefined,
				imageUrl: isLocalPreviewUrl(s.imageUrl) ? undefined : s.imageUrl,
				videoUrl: s.videoUrl,
				videoThumbnailUrl: s.videoThumbnailUrl,
				videoDurationSec: s.videoDurationSec,
			})),
			rewardBadges: (targetRecipe.detectedBadges || []).map(b => b.name),
			skillTags: targetRecipe.skillTags || [],
			xpReward: xpBreakdown?.total || targetRecipe.xpReward,
			xpBreakdown: xpBreakdown
				? {
						base: xpBreakdown.base,
						steps: xpBreakdown.steps,
						time: xpBreakdown.time,
						techniques:
							xpBreakdown.techniques?.reduce((sum, t) => sum + t.xp, 0) || 0,
						total: xpBreakdown.total,
					}
				: targetRecipe.xpBreakdown,
			difficultyMultiplier: targetRecipe.difficultyMultiplier,
		}),
		[xpBreakdown],
	)

	// â”€â”€ Save draft â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
	const handleSaveDraft = useCallback(
		async (targetRecipe?: ParsedRecipe) => {
			const recipeToSave = targetRecipe || recipe
			diag.action('recipe', 'SAVE_DRAFT clicked', {
				hasDraftId: !!draftId,
				draftId,
				hasRecipeToSave: !!recipeToSave,
			})

			if (!recipeToSave) {
				diag.warn('recipe', 'SAVE_DRAFT aborted - no recipe data')
				return
			}

			diag.snapshot('recipe', 'Recipe data being saved', {
				title: recipeToSave.title,
				ingredientsCount: recipeToSave.ingredients?.length ?? 0,
				stepsCount: recipeToSave.steps?.length ?? 0,
				hasCoverImage: !!recipeToSave.coverImageUrl,
				coverImageUrl: recipeToSave.coverImageUrl,
				ingredients: recipeToSave.ingredients,
				steps: recipeToSave.steps,
			})

			setIsSaving(true)
			try {
				if (hasUnpersistedMedia) {
					toast.warning(t('aiFlowLocalImagesWarning'), {
						description: t('aiFlowLocalImagesWarningDesc'),
					})
				}

				let currentDraftId = draftId

				if (!currentDraftId) {
					diag.request('recipe', 'POST /drafts', { action: 'create new draft' })
					const createResponse = await createDraft()
					diag.response(
						'recipe',
						'POST /drafts',
						createResponse,
						createResponse.success,
					)

					if (!createResponse.success || !createResponse.data) {
						toast.error(t('aiFlowDraftCreateFailed'))
						setIsSaving(false)
						return
					}
					currentDraftId = createResponse.data.id
					setDraftId(currentDraftId)
					diag.action('recipe', 'Draft created', { draftId: currentDraftId })
				}

				const savePayload = buildSavePayload(recipeToSave)

				diag.request('recipe', `PATCH /drafts/${currentDraftId}`, savePayload)
				const saveResponse = await saveDraft(currentDraftId, savePayload)
				diag.response(
					'recipe',
					`PATCH /drafts/${currentDraftId}`,
					saveResponse,
					saveResponse.success,
				)

				if (saveResponse.success) {
					diag.action('recipe', 'SAVE_DRAFT success', {
						draftId: currentDraftId,
					})
					toast.success(t('aiFlowDraftSaved'), {
						description: t('aiFlowDraftSavedDesc'),
					})
				} else {
					diag.error('recipe', 'SAVE_DRAFT failed', saveResponse)
					toast.error(t('aiFlowDraftSaveFailed'), {
						description:
							saveResponse.message ||
							`Error ${saveResponse.statusCode || 'unknown'}. Please try again.`,
					})
				}
			} catch (err) {
				diag.error('recipe', 'SAVE_DRAFT exception', err)
				const axiosError = err as {
					response?: { status?: number; data?: { message?: string } }
				}
				const message =
					axiosError.response?.data?.message ||
					(err instanceof Error ? err.message : 'Unknown error')
				const status = axiosError.response?.status
				toast.error(t('aiFlowDraftSaveFailed'), {
					description:
						status === 401
							? t('aiFlowSessionExpired')
							: status === 403
								? t('aiFlowNoPermission')
								: status === 400
									? t('aiFlowInvalidData', { message })
									: t('aiFlowNetworkError'),
				})
			} finally {
				setIsSaving(false)
			}
		},
		[recipe, draftId, buildSavePayload, hasUnpersistedMedia],
	)

	// â”€â”€ AI parse â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
	const handleParse = useCallback(async () => {
		diag.action('recipe', 'AI_PARSE clicked', { textLength: rawText.length })

		if (!rawText.trim()) {
			diag.warn('recipe', 'AI_PARSE aborted - no text')
			toast.error(t('aiFlowPasteFirst'))
			return
		}

		setStep('parsing')
		setParsingStep(0)

		const progressInterval = setInterval(() => {
			setParsingStep(prev => Math.min(prev + 1, 3))
		}, 600)

		try {
			diag.request('recipe', 'POST /process_recipe', {
				textPreview: rawText.slice(0, 200) + '...',
			})
			const response = await processRecipe(rawText)
			diag.response(
				'recipe',
				'POST /process_recipe',
				response,
				response.success,
			)

			clearInterval(progressInterval)
			setParsingStep(4)

			if (response.success && response.data) {
				const parsed = transformProcessedRecipe(response.data)
				if (parsed) {
					diag.action('recipe', 'AI_PARSE success', {
						title: parsed.title,
						ingredientsCount: parsed.ingredients.length,
						stepsCount: parsed.steps.length,
						hasXpBreakdown: !!parsed.xpBreakdown,
					})
					diag.snapshot('recipe', 'Parsed recipe from AI', parsed)

					setRecipe(parsed)
					setOriginalRecipe(structuredClone(parsed))
					setPrevStepIds(parsed.steps.map(s => s.id))
					setStep('preview')
					diag.nav('recipe', 'input', 'preview', 'AI parse complete')
					toast.success(t('aiFlowParsedSuccess'), {
						description: t('aiFlowParsedDesc', { steps: parsed.steps.length, ingredients: parsed.ingredients.length }),
					})
				} else {
					diag.error(
						'recipe',
						'AI_PARSE transform returned null',
						response.data,
					)
					toast.error(t('aiFlowParseFailed'), {
						description: t('aiFlowParseFailedDesc'),
					})
					setStep('input')
				}
			} else {
				diag.error('recipe', 'AI_PARSE failed', response)
				const errorMessage = response.message || 'Unknown error occurred'
				toast.error(t('aiFlowParsingFailed'), {
					description: errorMessage,
				})
				setStep('input')
			}
		} catch (err) {
			clearInterval(progressInterval)
			diag.error('recipe', 'AI_PARSE exception', err)
			toast.error(t('aiFlowParsingFailed'), {
				description:
					err instanceof Error
						? err.message
						: 'Network error. Check your connection.',
			})
			setStep('input')
		}
	}, [rawText])

	// â”€â”€ XP preview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
	const handlePreviewXp = useCallback(async () => {
		diag.action('recipe', 'PREVIEW_XP clicked', {
			hasRecipe: !!recipe,
			method,
			hasEdited,
		})

		if (!recipe || isCalculatingXp) return

		// If AI already calculated XP with breakdown and user hasn't edited, use it directly
		if (!hasEdited && recipe.xpBreakdown && method === 'ai') {
			diag.action('recipe', 'Using cached XP from AI parse', recipe.xpBreakdown)
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
				isValidated: true,
				confidence: 95,
			})
			setStep('xp-preview')
			return
		}

		// User edited or manual entry â€” recalculate via AI
		setIsCalculatingXp(true)

		const metasRequest = {
			title: recipe.title,
			description: recipe.description,
			difficulty: recipe.difficulty,
			prep_time_minutes: 10,
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

		try {
			const response = await calculateMetas(metasRequest)

			if (response.success && response.data) {
				const data = response.data

				if (data.badges && data.badges.length > 0) {
					setRecipe(currentRecipe => {
						if (!currentRecipe || !currentRecipe.title) {
							logDevError(
								'[handlePreviewXp] Cannot update empty recipe with badges',
							)
							return currentRecipe
						}
						return {
							...currentRecipe,
							detectedBadges: data.badges.map(badge => ({
								emoji: 'ðŸ†',
								name: badge,
							})),
							xpReward: data.xpReward,
							skillTags: data.skillTags,
						}
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
				logDevWarn('[handlePreviewXp] calculateMetas failed:', response)
				toast.error(t('aiFlowXpCalcFailed'), {
					description: response.message || 'Using default values',
				})
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
			logDevError('[handlePreviewXp] XP calculation error:', err)
			toast.error(t('aiFlowXpCalcFailedDesc'), {
				description: t('aiFlowTryAgain'),
			})
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

	// â”€â”€ Publish flow: Save Draft â†’ Validate â†’ Publish â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
	const handlePublish = useCallback(
		async (recipeToPublish?: ParsedRecipe) => {
			const targetRecipe = recipeToPublish || recipe
			diag.action('recipe', 'PUBLISH clicked', {
				hasDraftId: !!draftId,
				draftId,
				hasRecipe: !!targetRecipe,
				hasRecipeFromParam: !!recipeToPublish,
				hasRecipeFromState: !!recipe,
				isPublishing,
			})

			// Detect stale closure issue
			if (recipeToPublish && recipe) {
				const passedHasData =
					(recipeToPublish.ingredients?.length ?? 0) > 0 ||
					(recipeToPublish.steps?.length ?? 0) > 0
				const stateHasData =
					(recipe.ingredients?.length ?? 0) > 0 ||
					(recipe.steps?.length ?? 0) > 0
				if (!passedHasData && stateHasData) {
					diag.warn(
						'recipe',
						'PUBLISH detected stale recipe param, using state instead',
						{
							paramIngredients: recipeToPublish.ingredients?.length ?? 0,
							stateIngredients: recipe.ingredients?.length ?? 0,
						},
					)
				}
			}

			const finalRecipe =
				recipeToPublish && (recipeToPublish.ingredients?.length ?? 0) > 0
					? recipeToPublish
					: recipe

			if (!finalRecipe || isPublishing) {
				diag.warn('recipe', 'PUBLISH aborted', {
					hasRecipe: !!finalRecipe,
					isPublishing,
				})
				return
			}

			if (hasUnpersistedMedia) {
				toast.error(t('aiFlowReuploadImages'), {
					description: t('aiFlowReuploadImagesDesc'),
				})
				return
			}

			diag.snapshot('recipe', 'Recipe data for publish', {
				title: finalRecipe.title,
				description: finalRecipe.description?.slice(0, 100),
				ingredientsCount: finalRecipe.ingredients?.length ?? 0,
				stepsCount: finalRecipe.steps?.length ?? 0,
				hasCoverImage: !!finalRecipe.coverImageUrl,
				coverImageUrl: finalRecipe.coverImageUrl,
			})

			diag.validateData(
				'recipe',
				'finalRecipe before publish',
				{ ...finalRecipe },
				['title', 'description', 'ingredients', 'steps', 'difficulty'],
			)
			diag.inspectLocalStorage('recipe', 'recipe-draft')

			// â”€â”€ STEP 0: Pre-publish FE validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
			const validationErrors = validateRecipeForPublish(finalRecipe)
			if (validationErrors.length > 0) {
				diag.warn('recipe', 'PUBLISH validation failed', validationErrors)
				const primaryError = validationErrors[0]
				const allHints = validationErrors.map(e => `â€¢ ${e.hint}`).join('\n')

				toast.error(primaryError.message, {
					description:
						validationErrors.length === 1
							? primaryError.hint
							: `Please fix the following:\n${allHints}`,
					duration: 6000,
				})
				return
			}

			setIsPublishing(true)
			diag.action('recipe', 'PUBLISH starting multi-step flow', { step: 1 })

			try {
				// Step 1: Ensure draft exists
				let currentDraftId = draftId
				if (!currentDraftId) {
					diag.request('recipe', 'POST /drafts (for publish)', {})
					const createResponse = await createDraft()
					diag.response(
						'recipe',
						'POST /drafts',
						createResponse,
						createResponse.success,
					)

					if (!createResponse.success || !createResponse.data) {
						toast.error(t('aiFlowSaveRecipeFailed'), {
							description: t('aiFlowCouldNotCreateDraft'),
						})
						setIsPublishing(false)
						return
					}
					currentDraftId = createResponse.data.id
					setDraftId(currentDraftId)
					diag.action('recipe', 'PUBLISH step 1: draft created', {
						draftId: currentDraftId,
					})
				}

				// Step 2: Save all recipe data to draft
				diag.action('recipe', 'PUBLISH step 2: saving draft', {
					draftId: currentDraftId,
				})
				const publishSavePayload = buildSavePayload(finalRecipe)

				diag.request(
					'recipe',
					`PATCH /drafts/${currentDraftId} (publish save)`,
					publishSavePayload,
				)
				const saveResponse = await saveDraft(currentDraftId, publishSavePayload)
				diag.response(
					'recipe',
					`PATCH /drafts/${currentDraftId}`,
					saveResponse,
					saveResponse.success,
				)

				if (!saveResponse.success) {
					diag.error(
						'recipe',
						'PUBLISH step 2 failed: save draft',
						saveResponse,
					)
					const errorMessage = mapBackendErrorToEnglish(
						saveResponse.message || 'Unknown error',
					)
					toast.error(t('aiFlowSaveRecipeFailed'), {
						description: errorMessage,
					})
					setIsPublishing(false)
					return
				}

				// Step 3a: Fast content guard (rule-based, fail-open)
				const recipeText = [
					finalRecipe.title,
					finalRecipe.description,
					...(finalRecipe.steps || []).map(s => s.instruction),
				]
					.filter(Boolean)
					.join(' ')
				const guardResult = await guardContent(recipeText, 'recipe').catch(
					() => null,
				)
				if (guardResult?.success && guardResult.data?.action === 'block') {
					diag.warn('recipe', 'PUBLISH blocked by content guard', {
						reasons: guardResult.data.reasons,
					})
					toast.error(t('aiFlowCannotPublish'), {
						description:
							guardResult.data.reasons?.[0] ||
							'Content violates community guidelines.',
					})
					setIsPublishing(false)
					return
				}

				// Step 3b: Validate recipe for safety (AI-powered)
				diag.action('recipe', 'PUBLISH step 3: validating content', {})
				diag.request('recipe', 'POST /validate_recipe', {
					title: finalRecipe.title,
				})
				const validationResponse = await validateRecipe({
					title: finalRecipe.title,
					description: finalRecipe.description,
					ingredients: (finalRecipe.ingredients || []).map(i => i.name),
					steps: (finalRecipe.steps || []).map(s => s.instruction),
					check_safety: true,
				})
				diag.response(
					'recipe',
					'POST /validate_recipe',
					validationResponse,
					validationResponse.success && validationResponse.data?.contentSafe,
				)

				if (
					!validationResponse.success ||
					!validationResponse.data?.contentSafe
				) {
					diag.warn(
						'recipe',
						'PUBLISH step 3 failed: validation',
						validationResponse,
					)
					const issues = validationResponse.data?.issues || [
						t('aiFlowContentValidationFailed'),
					]
					toast.error(t('aiFlowCannotPublish'), {
						description: issues.join(', '),
					})
					setIsPublishing(false)
					return
				}

				// Step 4: Publish the draft
				diag.action('recipe', 'PUBLISH step 4: publishing', {
					draftId: currentDraftId,
				})
				diag.request('recipe', `POST /publish/${currentDraftId}`, {})
				const publishResponse = await publishRecipe(currentDraftId)
				diag.response(
					'recipe',
					`POST /publish/${currentDraftId}`,
					publishResponse,
					publishResponse.success,
				)

				if (publishResponse.success) {
					const publishData = publishResponse.data
					diag.action('recipe', 'PUBLISH SUCCESS! ðŸŽ‰', {
						recipeId: currentDraftId,
						title: finalRecipe.title,
						xpReward: finalRecipe.xpReward,
						qualityScore: publishData?.qualityScore,
						qualityTier: publishData?.qualityTier,
					})

					triggerRecipeCompleteConfetti()

					const qualityMsg = publishData?.qualityTier
						? t('aiFlowQuality', { tier: publishData.qualityTier, score: publishData.qualityScore ? ` (${publishData.qualityScore}/100)` : '' })
						: ''
					toast.success(t('aiFlowRecipePublished'), {
						description: t('aiFlowPublishedDesc', { title: finalRecipe.title, xp: finalRecipe.xpReward || 0, quality: qualityMsg }),
					})

					// NOTE: Do NOT setIsPublishing(false) â€” leave button disabled until navigation
					diag.action('recipe', 'Calling onPublishSuccess callback', {
						recipeId: currentDraftId,
					})
					onPublishSuccess?.(currentDraftId)
				} else {
					diag.error('recipe', 'PUBLISH step 4 failed', publishResponse)
					const errorMessage = mapBackendErrorToEnglish(
						publishResponse.message || 'Unknown error',
					)
					toast.error(t('aiFlowCannotPublishRecipe'), {
						description: errorMessage,
						duration: 5000,
					})
					setIsPublishing(false)
					diag.action('recipe', 'PUBLISH flow ended (API failure)', {
						isPublishing: false,
					})
				}
			} catch (error) {
				diag.error('recipe', 'PUBLISH exception', error)
				toast.error(t('aiFlowPublishFailed'), {
					description: t('aiFlowCheckConnection'),
				})
				setIsPublishing(false)
				diag.action('recipe', 'PUBLISH flow ended (error)', {
					isPublishing: false,
				})
			}
		},
		[
			recipe,
			draftId,
			isPublishing,
			hasUnpersistedMedia,
			onPublishSuccess,
			buildSavePayload,
		],
	)

	// â”€â”€ Keyboard shortcuts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === 's') {
				e.preventDefault()
				if (recipe && (step === 'preview' || step === 'xp-preview')) {
					diag.action('recipe', 'Keyboard shortcut: Ctrl+S (Save Draft)', {})
					// Use auto-save's immediate save if draft already exists, else manual flow
					if (draftId) {
						saveNow()
					} else {
						handleSaveDraft()
					}
				}
			}
			if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
				e.preventDefault()
				diag.action(
					'recipe',
					`Keyboard shortcut: Ctrl+Enter (step: ${step})`,
					{},
				)
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
		saveNow,
		draftId,
	])

	// â”€â”€ Ingredient CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
	const removeIngredient = (id: string) => {
		if (!recipe) return
		setRecipe({
			...recipe,
			ingredients: (recipe.ingredients || []).filter(i => i.id !== id),
		})
	}

	const addIngredient = () => {
		if (!recipe) return
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
		setRecipe({
			...recipe,
			ingredients: (recipe.ingredients || []).map(i =>
				i.id === id ? { ...i, ...updates } : i,
			),
		})
	}

	// â”€â”€ Step CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
	const removeStep = (id: string) => {
		if (!recipe) return
		setRecipe({
			...recipe,
			steps: (recipe.steps || []).filter(s => s.id !== id),
		})
	}

	const addStep = () => {
		if (!recipe) return
		const newId = `step-${Date.now()}`
		setRecipe({
			...recipe,
			steps: [...(recipe.steps || []), { id: newId, instruction: '' }],
		})
	}

	const updateStep = (id: string, updates: Partial<RecipeStep>) => {
		if (!recipe) return
		setRecipe({
			...recipe,
			steps: (recipe.steps || []).map(s =>
				s.id === id ? { ...s, ...updates } : s,
			),
		})
	}

	// â”€â”€ JSX â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
	return (
		<div className={cn('mx-auto max-w-3xl space-y-5 p-5', className)}>
			{/* Header */}
			<div className='flex items-center gap-4'>
				{onBack && (
					<motion.button
						onClick={onBack}
						whileHover={ICON_BUTTON_HOVER}
						whileTap={ICON_BUTTON_TAP}
						transition={TRANSITION_SPRING}
						className='flex size-10 items-center justify-center rounded-xl border border-border bg-bg-card text-text'
					>
						<ArrowLeft className='size-5' />
					</motion.button>
				)}
				<h1 className='flex-1 text-2xl font-display font-extrabold text-text'>
					{step === 'preview' ? t('aiFlowReviewRecipe') : t('aiFlowCreateRecipe')}
				</h1>
				{step === 'preview' && (
					<div className='flex items-center gap-3'>
						{/* Auto-save status indicator */}
						<AutoSaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} />
						<motion.button
							onClick={() => handleSaveDraft()}
							disabled={isSaving || saveStatus === 'saving'}
							whileHover={isSaving ? undefined : BUTTON_HOVER}
							whileTap={isSaving ? undefined : BUTTON_TAP}
							className='flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-xs font-semibold text-text-secondary transition-colors hover:border-brand hover:text-brand disabled:opacity-50'
						>
							{isSaving || saveStatus === 'saving' ? t('aiFlowSaving') : t('aiFlowSaveDraft')}
							{!isSaving && saveStatus !== 'saving' && (
								<kbd className='hidden rounded bg-bg-elevated px-1.5 py-0.5 text-2xs font-normal md:inline-block'>
									{modKey}+S
								</kbd>
							)}
						</motion.button>
					</div>
				)}
			</div>

			{/* Step Content - Animated transitions */}
			<AnimatePresence mode='wait'>
				{/* Input Step */}
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
								title={t('aiFlowPasteAndParse')}
								description={t('aiFlowAiExtractsRecipe')}
								isActive={method === 'ai'}
								badge={t('aiFlowRecommended')}
								onClick={() => setMethod('ai')}
							/>
							<MethodCard
								method='manual'
								icon={<Edit3 className='size-6' />}
								title={t('aiFlowManualEntry')}
								description={t('aiFlowFillInFields')}
								isActive={method === 'manual'}
								onClick={() => setMethod('manual')}
							/>
						</div>

						{/* Method Content */}
						<AnimatePresence mode='wait'>
							{/* AI Paste */}
							{method === 'ai' && (
								<motion.div
									key='ai-method'
									variants={CONTENT_SWITCH_VARIANTS}
									initial='initial'
									animate='animate'
									exit='exit'
									transition={CONTENT_SWITCH_TRANSITION}
									className='rounded-2xl bg-bg-card p-6'
								>
									<div className='mb-4'>
										<h3 className='text-lg font-bold text-text'>
											{t('aiFlowPasteYourRecipe')}
										</h3>
										<p className='text-sm text-text-secondary'>
											{t('aiFlowFromWebsite')}
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
										{t('aiFlowParseRecipe')}
										{rawText.trim() && (
											<kbd className='ml-2 hidden rounded bg-white/20 px-1.5 py-0.5 text-xs font-normal md:inline-block'>
												{modKey}+â†µ
											</kbd>
										)}
									</motion.button>
								</motion.div>
							)}

							{/* Manual Entry */}
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
											localStorage.removeItem('chefkix-recipe-draft')
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
											setRecipe(parsed)
											setPrevStepIds((parsed.steps || []).map(s => s.id))
											setForceRecalculate(true)
											setStep('preview')
											toast.success(t('aiFlowReadyForReview'), {
												description: t('aiFlowPreviewXpDesc'),
											})
										}}
										onSaveDraft={async data => {
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
											await handleSaveDraft(parsed)
										}}
										isSaving={isSaving}
										isSubmitting={isPublishing}
										className='-mx-5 -mb-5'
									/>
								</motion.div>
							)}
						</AnimatePresence>
					</motion.div>
				)}

				{/* â”€â”€ Preview Step â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
						<div className='flex items-center justify-between gap-3.5 rounded-2xl border border-success/20 bg-gradient-to-r from-success/10 to-success/5 px-5 py-4'>
							<div className='flex items-center gap-3.5'>
								<span className='text-3xl'>âœ¨</span>
								<div>
									<strong className='text-sm text-success'>
										{t('aiFlowParsedSuccess')}
									</strong>
									<span className='block text-xs text-text-secondary'>
										{needsRecalculation
											? t('aiFlowSignificantChanges', { pct: changePercent })
											: changePercent > 0
												? t('aiFlowMinorEdits', { pct: changePercent })
												: t('aiFlowReviewAndPublish')}
									</span>
								</div>
							</div>
							{recipe.xpReward && !needsRecalculation && (
								<motion.div
									initial={{ opacity: 0, scale: 0.8 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={TRANSITION_SPRING}
									className='flex items-center gap-2 rounded-xl bg-xp/10 px-4 py-2'
								>
									<span className='text-lg'>â­</span>
									<div className='text-right'>
										<div className='text-lg font-bold text-xp'>
											+{recipe.xpReward} XP
										</div>
										<div className='text-xs text-text-secondary'>
											{t('aiFlowBadgeCount', { count: recipe.detectedBadges.length })}
										</div>
									</div>
								</motion.div>
							)}
							{hasEdited && (
								<div className='flex items-center gap-2 rounded-xl bg-warning/10 px-3 py-2 flex-shrink-0'>
									<AlertTriangle className='size-4 text-warning flex-shrink-0' />
									<span className='text-xs font-medium text-warning whitespace-nowrap'>
										{t('aiFlowRecalculateXp')}
									</span>
								</div>
							)}
						</div>

						{/* Recipe Card */}
						<div className='rounded-2xl bg-bg-card p-6'>
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
											type='button'
											onClick={() =>
												setRecipe({ ...recipe, coverImageUrl: undefined })
											}
											disabled={isUploadingCover}
											className='absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-error disabled:opacity-50'
										>
											<X className='size-4' />
										</button>
										<button
											type='button'
											onClick={() => coverImageRef.current?.click()}
											disabled={isUploadingCover}
											className='absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/80 disabled:opacity-50'
										>
											<ImagePlus className='size-3.5' />
											{t('aiFlowChange')}
										</button>
									</div>
								) : (
									<button
										type='button'
										onClick={() => coverImageRef.current?.click()}
										disabled={isUploadingCover}
										className='flex h-44 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-bg text-text-secondary transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50'
									>
										{isUploadingCover ? (
											<>
												<Loader2 className='size-8 animate-spin' />
												<span className='text-sm'>{t('aiFlowUploading')}</span>
											</>
										) : (
											<>
												<ImagePlus className='size-8' />
												<span className='text-sm'>{t('aiFlowAddCoverPhoto')}</span>
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
								<label
									htmlFor='ai-recipe-title'
									className='mb-2 block text-xs font-semibold uppercase tracking-wide text-text-secondary'
								>
									{t('aiFlowRecipeTitle')}
								</label>
								<input
									id='ai-recipe-title'
									type='text'
									value={recipe.title}
									onChange={e =>
										setRecipe({ ...recipe, title: e.target.value })
									}
									className='w-full rounded-xl border-2 border-transparent bg-bg px-4 py-3 text-xl font-bold text-text focus:border-brand focus:outline-none'
								/>
							</div>

							{/* Description */}
							<div className='mb-4'>
								<label
									htmlFor='ai-recipe-description'
									className='mb-2 block text-xs font-semibold uppercase tracking-wide text-text-secondary'
								>
									{t('aiFlowDescription')}
								</label>
								<textarea
									id='ai-recipe-description'
									value={recipe.description}
									onChange={e =>
										setRecipe({ ...recipe, description: e.target.value })
									}
									className='min-h-20 w-full resize-y rounded-xl border-2 border-transparent bg-bg px-4 py-3 text-sm text-text focus:border-brand focus:outline-none'
								/>
							</div>

							{/* Meta Row */}
							<div className='mb-4 flex flex-wrap gap-2.5'>
								<div className='flex items-center gap-1.5 rounded-lg bg-bg px-2 py-1'>
									<Clock className='size-4 text-text-secondary' />
									<input
										type='text'
										value={recipe.cookTime}
										onChange={e =>
											setRecipe({ ...recipe, cookTime: e.target.value })
										}
										className='w-20 border-none bg-transparent text-xs font-semibold text-text focus:outline-none'
										placeholder='30 min'
									/>
								</div>
								<div
									className='group relative flex items-center gap-1.5 rounded-lg bg-bg px-3.5 py-2 cursor-help'
									title={t('aiFlowDifficultyTitle')}
								>
									<Signal className='size-4 text-text-secondary' />
									<span className='text-xs font-semibold text-text'>
										{recipe.difficulty}
									</span>
									<Lock className='size-3 text-text-secondary/50' />
								</div>
								<div className='flex items-center gap-1.5 rounded-lg bg-bg px-2 py-1'>
									<Utensils className='size-4 text-text-secondary' />
									<input
										type='number'
										min={1}
										max={50}
										value={recipe.servings}
										onChange={e =>
											setRecipe({
												...recipe,
												servings: parseInt(e.target.value) || 1,
											})
										}
										className='w-12 border-none bg-transparent text-xs font-semibold text-text focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
									/>
									<span className='text-xs text-text-secondary'>
										{t('aiFlowServings')}
									</span>
								</div>
								<div className='flex items-center gap-1.5 rounded-lg bg-bg px-2 py-1'>
									<span>🌍</span>
									<Combobox
										value={recipe.cuisine}
										onChange={val => setRecipe({ ...recipe, cuisine: val })}
										onSelect={opt => setRecipe({ ...recipe, cuisine: opt.value })}
										options={CUISINE_OPTIONS}
										placeholder={t('aiFlowCuisine')}
										className='w-24 border-none bg-transparent text-xs font-semibold text-text focus:outline-none'
									/>
								</div>
							</div>

							{/* Detected Badges */}
							<div className='flex flex-wrap items-center gap-3'>
								<span className='text-xs text-text-secondary'>
									{t('aiFlowPotentialBadges')}
								</span>
								{(recipe.detectedBadges || []).map((badge, i) => (
									<motion.span
										key={i}
										initial={{ opacity: 0, scale: 0.8 }}
										animate={{ opacity: 1, scale: 1 }}
										transition={{ delay: i * 0.1, ...TRANSITION_SPRING }}
										whileHover={BUTTON_SUBTLE_HOVER}
										className='rounded-lg border border-brand/20 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand cursor-default'
									>
										{badge.emoji} {badge.name}
									</motion.span>
								))}
							</div>
						</div>

						{/* Ingredients Section */}
						<div className='rounded-2xl bg-bg-card p-6'>
							<div className='mb-4 flex items-center justify-between'>
								<h3 className='flex items-center gap-2.5 text-lg font-bold text-text'>
									<ShoppingBasket className='size-5 text-brand' />
									{t('aiFlowIngredients')}
								</h3>
								<motion.button
									onClick={addIngredient}
									whileHover={BUTTON_HOVER}
									whileTap={BUTTON_TAP}
									className='flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-text-secondary transition-colors hover:border-brand hover:text-brand'
								>
									<Plus className='size-4' />
									{t('aiFlowAdd')}
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
						<div className='rounded-2xl bg-bg-card p-6'>
							<div className='mb-4 flex items-center justify-between'>
								<div className='flex items-center gap-4'>
									<h3 className='flex items-center gap-2.5 text-lg font-bold text-text'>
										<ListOrdered className='size-5 text-brand' />
										{t('aiFlowInstructions')}
									</h3>
									{recipe && recipe.steps.length > 0 && (
										<button
											type='button'
											onClick={() => {
												const previewRecipe = parsedRecipeToRecipe(recipe)
												useCookingStore
													.getState()
													.startPreviewCooking(previewRecipe)
												useUiStore.getState().expandCookingPanel()
											}}
											className='flex items-center gap-1.5 text-sm font-medium text-brand/70 transition-colors hover:text-brand'
										>
											<Rocket className='size-3.5' />
											{t('aiFlowTestPlay')}
										</button>
									)}
								</div>
								<motion.button
									onClick={addStep}
									whileHover={BUTTON_HOVER}
									whileTap={BUTTON_TAP}
									className='flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-text-secondary transition-colors hover:border-brand hover:text-brand'
								>
									<Plus className='size-4' />
									{t('aiFlowAddStep')}
								</motion.button>
							</div>
							<Reorder.Group
								axis='y'
								values={recipe.steps || []}
								onReorder={newSteps => {
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

						{/* Publish Action */}
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
											{t('aiFlowCalculatingXp')}
										</span>
									</>
								) : (
									<>
										<span className='text-base font-bold text-white'>
											{hasEdited
												? t('aiFlowRecalculatePublish')
												: t('aiFlowPreviewPublish')}
										</span>
										{recipe.xpReward && !hasEdited ? (
											<span className='rounded-lg bg-white/20 px-3 py-1 text-sm font-display font-extrabold text-white'>
												{recipe.xpReward} XP
											</span>
										) : (
											<Sparkles className='size-5 text-white' />
										)}
										<kbd className='hidden rounded bg-white/20 px-1.5 py-0.5 text-xs font-normal text-white/80 md:inline-block'>
											{modKey}+â†µ
										</kbd>
									</>
								)}
							</motion.button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Parsing Overlay */}
			<AnimatePresence>
				{step === 'parsing' && (
					<RecipeParsingOverlay
						currentStep={parsingStep}
						onCancel={() => setStep('input')}
					/>
				)}
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
// RE-EXPORTS (barrel compatibility)
// ============================================

export type {
	ParsedRecipe,
	XpBreakdown,
	Ingredient,
	RecipeStep,
} from '@/lib/types/recipeCreate'
export type { RecipeCreateAiFlowProps }
