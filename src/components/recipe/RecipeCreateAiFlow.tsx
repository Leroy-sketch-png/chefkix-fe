'use client'

/**
 * RecipeCreateAiFlow — The recipe creation orchestrator.
 *
 * This component manages the multi-step creation flow (input → parsing → preview → xp-preview)
 * and delegates rendering to extracted sub-components. All pure helpers live in recipeCreateUtils.
 *
 * Architecture:
 *   Types         → @/lib/types/recipeCreate
 *   Pure helpers  → @/lib/recipeCreateUtils
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
	STEP_VARIANTS,
	STEP_TRANSITION,
	CONTENT_SWITCH_VARIANTS,
	CONTENT_SWITCH_TRANSITION,
} from '@/lib/motion'
import { toast } from 'sonner'

// ── Hooks ───────────────────────────────────────────────────────────
import { useAutoSave, type SaveStatus } from '@/hooks/useAutoSave'
import { useBeforeUnloadWarning } from '@/hooks/useBeforeUnloadWarning'

// ── Services & stores ───────────────────────────────────────────────
import { processRecipe, calculateMetas, validateRecipe } from '@/services/ai'
import {
	createDraft,
	saveDraft,
	uploadRecipeImages,
	publishRecipe,
} from '@/services/recipe'
import { useCookingStore } from '@/store/cookingStore'
import { useUiStore } from '@/store/uiStore'
import { parsedRecipeToRecipe } from '@/lib/recipeTransforms'
import { triggerRecipeCompleteConfetti } from '@/lib/confetti'

// ── Types ───────────────────────────────────────────────────────────
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

// ── Extracted utilities ─────────────────────────────────────────────
import {
	modKey,
	RECALCULATION_THRESHOLD,
	validateRecipeForPublish,
	mapBackendErrorToEnglish,
	calculateRecipeChangePercent,
	transformProcessedRecipe,
} from '@/lib/recipeCreateUtils'

// ── Extracted sub-components ────────────────────────────────────────
import { RecipeFormDetailed, type RecipeFormData } from './RecipeFormDetailed'
import { MethodCard } from './MethodCard'
import { PasteArea } from './PasteArea'
import { RecipeParsingOverlay } from './RecipeParsingOverlay'
import { IngredientItem } from './IngredientItem'
import { StepItem } from './StepItem'
import { XpPreviewModal } from './XpPreviewModal'

const isLocalPreviewUrl = (url?: string) =>
	typeof url === 'string' && url.startsWith('blob:')

// ============================================
// PROPS
// ============================================

interface RecipeCreateAiFlowProps {
	onBack?: () => void
	onPublishSuccess?: (recipeId: string) => void
	className?: string
	/** Optional initial draft to load (from draft listing) — server-saved AI-parsed draft */
	initialDraft?: Recipe
	/** Optional initial manual draft to load (from localStorage) — manually entered draft */
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
					className='flex items-center gap-1.5 text-xs text-muted-foreground'
				>
					<Loader2 className='size-3 animate-spin' />
					Saving...
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
					Saved at {formatTime(lastSavedAt)}
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
					Save failed — retrying...
				</motion.span>
			)}
			{status === 'idle' && lastSavedAt && (
				<motion.span
					key='idle-saved'
					initial={{ opacity: 0 }}
					animate={{ opacity: 0.6 }}
					exit={{ opacity: 0 }}
					className='text-xs text-muted-foreground'
				>
					Saved at {formatTime(lastSavedAt)}
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

	// ── Auto-save ────────────────────────────────────────────────────
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

	// ── Derived state ───────────────────────────────────────────────
	const changePercent = calculateRecipeChangePercent(originalRecipe, recipe)
	const needsRecalculation =
		forceRecalculate || changePercent >= RECALCULATION_THRESHOLD
	const hasEdited = needsRecalculation
	const hasUnpersistedMedia = useMemo(() => {
		if (!recipe) return false
		if (isLocalPreviewUrl(recipe.coverImageUrl)) return true
		return (recipe.steps || []).some(step => isLocalPreviewUrl(step.imageUrl))
	}, [recipe])

	// ── Warn before unload if recipe creation is in progress ────────
	const hasUnsavedWork =
		(rawText.trim().length > 0 || recipe !== null) && !isPublishing
	useBeforeUnloadWarning(
		hasUnsavedWork,
		'You have an unfinished recipe. Are you sure you want to leave?',
	)

	// ── Load initial draft ──────────────────────────────────────────
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
						emoji: resolved?.icon || '🏆',
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

	// ── Clipboard paste ─────────────────────────────────────────────
	const handlePaste = useCallback(async () => {
		try {
			const text = await navigator.clipboard.readText()
			setRawText(text)
		} catch (err) {
			console.error('Failed to read clipboard:', err)
		}
	}, [])

	// ── Cover image upload ──────────────────────────────────────────
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
						prev ? { ...prev, coverImageUrl: response.data![0] } : prev,
					)
					URL.revokeObjectURL(localPreviewUrl)
					toast.success('Cover image uploaded!')
				} else {
					diag.image('recipe', 'upload-fail', { type: 'cover', response })
					toast.error('Image upload failed', {
						description:
							"Using local preview. Image won't persist after page refresh.",
					})
				}
			} catch (error) {
				diag.image('recipe', 'upload-fail', { type: 'cover', error })
				toast.error('Image upload failed', {
					description:
						"Using local preview. Image won't persist after page refresh.",
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

	// ── Build save payload (shared between save-draft and publish) ──
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

	// ── Save draft ──────────────────────────────────────────────────
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
					toast.warning('Some local preview images were not uploaded', {
						description:
							'Only successfully uploaded images are saved to your cloud draft.',
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
						toast.error('Failed to create draft')
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
					toast.success('Draft saved!', {
						description:
							'Your recipe has been saved. You can continue editing later.',
					})
				} else {
					diag.error('recipe', 'SAVE_DRAFT failed', saveResponse)
					toast.error('Failed to save draft', {
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
		[recipe, draftId, buildSavePayload, hasUnpersistedMedia],
	)

	// ── AI parse ────────────────────────────────────────────────────
	const handleParse = useCallback(async () => {
		diag.action('recipe', 'AI_PARSE clicked', { textLength: rawText.length })

		if (!rawText.trim()) {
			diag.warn('recipe', 'AI_PARSE aborted - no text')
			toast.error('Please paste some recipe text first')
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
					toast.success('Recipe parsed successfully!', {
						description: `Found ${parsed.steps.length} steps and ${parsed.ingredients.length} ingredients`,
					})
				} else {
					diag.error(
						'recipe',
						'AI_PARSE transform returned null',
						response.data,
					)
					toast.error('Failed to parse recipe', {
						description: 'The AI response could not be processed. Try again.',
					})
					setStep('input')
				}
			} else {
				diag.error('recipe', 'AI_PARSE failed', response)
				const errorMessage = response.message || 'Unknown error occurred'
				toast.error('Recipe parsing failed', {
					description: errorMessage,
				})
				setStep('input')
			}
		} catch (err) {
			clearInterval(progressInterval)
			diag.error('recipe', 'AI_PARSE exception', err)
			toast.error('Recipe parsing failed', {
				description:
					err instanceof Error
						? err.message
						: 'Network error. Check your connection.',
			})
			setStep('input')
		}
	}, [rawText])

	// ── XP preview ──────────────────────────────────────────────────
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

		// User edited or manual entry — recalculate via AI
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
							console.error(
								'[handlePreviewXp] Cannot update empty recipe with badges',
							)
							return currentRecipe
						}
						return {
							...currentRecipe,
							detectedBadges: data.badges.map(badge => ({
								emoji: '🏆',
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
				console.warn('[handlePreviewXp] calculateMetas failed:', response)
				toast.error('Could not calculate XP', {
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
			console.error('[handlePreviewXp] XP calculation error:', err)
			toast.error('XP calculation failed', {
				description: 'Please try again',
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

	// ── Publish flow: Save Draft → Validate → Publish ───────────────
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
				if (hasUnpersistedMedia) {
					toast.error('Please re-upload image previews before publishing', {
						description:
							'Local preview images are temporary and cannot be published. Upload them again to continue.',
					})
					return
				}
				diag.warn('recipe', 'PUBLISH aborted', {
					hasRecipe: !!finalRecipe,
					isPublishing,
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

			// ── STEP 0: Pre-publish FE validation ───────────────────
			const validationErrors = validateRecipeForPublish(finalRecipe)
			if (validationErrors.length > 0) {
				diag.warn('recipe', 'PUBLISH validation failed', validationErrors)
				const primaryError = validationErrors[0]
				const allHints = validationErrors.map(e => `• ${e.hint}`).join('\n')

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
						toast.error('Failed to save recipe', {
							description: 'Could not create draft. Please try again.',
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
					toast.error('Failed to save recipe', {
						description: errorMessage,
					})
					setIsPublishing(false)
					return
				}

				// Step 3: Validate recipe for safety
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
						'Content validation failed',
					]
					toast.error('Recipe cannot be published', {
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
					diag.action('recipe', 'PUBLISH SUCCESS! 🎉', {
						recipeId: currentDraftId,
						title: finalRecipe.title,
						xpReward: finalRecipe.xpReward,
					})

					triggerRecipeCompleteConfetti()

					toast.success('Recipe published! 🎉', {
						description: `"${finalRecipe.title}" is now live! You earned ${finalRecipe.xpReward || 0} XP`,
					})

					// NOTE: Do NOT setIsPublishing(false) — leave button disabled until navigation
					diag.action('recipe', 'Calling onPublishSuccess callback', {
						recipeId: currentDraftId,
					})
					onPublishSuccess?.(currentDraftId)
				} else {
					diag.error('recipe', 'PUBLISH step 4 failed', publishResponse)
					const errorMessage = mapBackendErrorToEnglish(
						publishResponse.message || 'Unknown error',
					)
					toast.error('Cannot publish recipe', {
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
				toast.error('Something went wrong', {
					description: 'Please try again later',
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

	// ── Keyboard shortcuts ──────────────────────────────────────────
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

	// ── Ingredient CRUD ─────────────────────────────────────────────
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

	// ── Step CRUD ───────────────────────────────────────────────────
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

	// ── JSX ─────────────────────────────────────────────────────────
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
					<div className='flex items-center gap-3'>
						{/* Auto-save status indicator */}
						<AutoSaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} />
						<button
							onClick={() => handleSaveDraft()}
							disabled={isSaving || saveStatus === 'saving'}
							className='flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50'
						>
							{isSaving || saveStatus === 'saving' ? 'Saving...' : 'Save Draft'}
							{!isSaving && saveStatus !== 'saving' && (
								<kbd className='hidden rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal md:inline-block'>
									{modKey}+S
								</kbd>
							)}
						</button>
					</div>
				)}
			</div>

			{/* Step Content — Animated transitions */}
			<AnimatePresence mode='wait'>
				{/* ── Input Step ──────────────────────────────────── */}
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
											toast.success('Recipe ready for review!', {
												description: 'Preview XP calculation before publishing',
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

				{/* ── Preview Step ────────────────────────────────── */}
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
						<div className='flex items-center justify-between gap-3.5 rounded-2xl border border-success/20 bg-gradient-to-r from-success/10 to-emerald-500/5 px-5 py-4'>
							<div className='flex items-center gap-3.5'>
								<span className='text-3xl'>✨</span>
								<div>
									<strong className='text-sm text-success'>
										Recipe parsed successfully!
									</strong>
									<span className='block text-xs text-muted-foreground'>
										{needsRecalculation
											? `Significant changes detected (${changePercent}%) — recalculate XP`
											: changePercent > 0
												? `Minor edits (${changePercent}%) — no recalculation needed`
												: 'Review and edit below, then publish'}
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
											className='absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-error disabled:opacity-50'
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
								<label
									htmlFor='ai-recipe-title'
									className='mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground'
								>
									Recipe Title
								</label>
								<input
									id='ai-recipe-title'
									type='text'
									value={recipe.title}
									onChange={e =>
										setRecipe({ ...recipe, title: e.target.value })
									}
									className='w-full rounded-xl border-2 border-transparent bg-bg px-4 py-3 text-xl font-bold text-text focus:border-primary focus:outline-none'
								/>
							</div>

							{/* Description */}
							<div className='mb-4'>
								<label
									htmlFor='ai-recipe-description'
									className='mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground'
								>
									Description
								</label>
								<textarea
									id='ai-recipe-description'
									value={recipe.description}
									onChange={e =>
										setRecipe({ ...recipe, description: e.target.value })
									}
									className='min-h-20 w-full resize-y rounded-xl border-2 border-transparent bg-bg px-4 py-3 text-sm text-text focus:border-primary focus:outline-none'
								/>
							</div>

							{/* Meta Row */}
							<div className='mb-4 flex flex-wrap gap-2.5'>
								<div className='flex items-center gap-1.5 rounded-lg bg-bg px-2 py-1'>
									<Clock className='size-4 text-muted-foreground' />
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
									title='Difficulty is determined by AI based on techniques and complexity. This ensures fair XP calculation.'
								>
									<Signal className='size-4 text-muted-foreground' />
									<span className='text-xs font-semibold text-text'>
										{recipe.difficulty}
									</span>
									<Lock className='size-3 text-muted-foreground/50' />
								</div>
								<div className='flex items-center gap-1.5 rounded-lg bg-bg px-2 py-1'>
									<Utensils className='size-4 text-muted-foreground' />
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
									<span className='text-xs text-muted-foreground'>
										servings
									</span>
								</div>
								<div className='flex items-center gap-1.5 rounded-lg bg-bg px-2 py-1'>
									<span>🌏</span>
									<input
										type='text'
										value={recipe.cuisine}
										onChange={e =>
											setRecipe({ ...recipe, cuisine: e.target.value })
										}
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
								<div className='flex items-center gap-4'>
									<h3 className='flex items-center gap-2.5 text-lg font-bold text-text'>
										<ListOrdered className='size-5 text-primary' />
										Instructions
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
											Test Play
										</button>
									)}
								</div>
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

			{/* Parsing Overlay */}
			<AnimatePresence>
				{step === 'parsing' && (
					<RecipeParsingOverlay currentStep={parsingStep} />
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
