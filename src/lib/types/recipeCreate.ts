/**
 * Types for the recipe creation flow.
 *
 * SINGLE SOURCE OF TRUTH — imported by RecipeCreateAiFlow, sub-components,
 * hooks, utils, and recipeTransforms.ts (which previously duplicated these).
 */
import type { Difficulty } from '@/lib/types/gamification'

// ── Flow state ──────────────────────────────────────────────────────
export type CreateMethod = 'ai' | 'manual'
export type CreateStep = 'input' | 'parsing' | 'preview' | 'xp-preview'

// ── Ingredient ──────────────────────────────────────────────────────
export interface Ingredient {
	id: string
	quantity: string
	name: string
}

// ── Timer helpers ───────────────────────────────────────────────────
export type TimeUnit = 'seconds' | 'minutes' | 'hours' | 'days'

// ── Recipe Step ─────────────────────────────────────────────────────
export interface RecipeStep {
	id: string
	instruction: string
	/** Total timer in seconds (source of truth) */
	timerSeconds?: number
	technique?: string
	/** Step-specific image URL */
	imageUrl?: string
	/** Step-specific video (Cloudinary) */
	videoUrl?: string
	videoThumbnailUrl?: string
	videoDurationSec?: number
}

// ── Parsed Recipe (intermediate FE representation) ──────────────────
export interface ParsedRecipe {
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
	/** XP data from AI (preserved from process_recipe) */
	xpReward?: number
	xpBreakdown?: {
		base: number
		baseReason: string
		steps: number
		stepsReason: string
		time: number
		timeReason: string
		techniques?: number
		techniquesReason?: string
		total: number
	}
	skillTags?: string[]
	difficultyMultiplier?: number
}

// ── XP Breakdown (component-level, richer than DTO) ─────────────────
export interface XpBreakdown {
	base: number
	steps: number
	time: number
	techniques: { name: string; xp: number }[]
	adjustments?: { reason: string; xp: number }[]
	total: number
	isValidated: boolean
	confidence: number
}

// ── Publish validation ──────────────────────────────────────────────
export interface PublishValidationError {
	field: 'title' | 'coverImage' | 'ingredients' | 'steps'
	message: string
	hint: string
}
