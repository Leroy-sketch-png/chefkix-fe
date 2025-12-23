'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { RecipeCreateAiFlow, ParsedRecipe } from '@/components/recipe'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { createRecipe } from '@/services/recipe'
import type { RecipeCreateRequest, Difficulty } from '@/lib/types/recipe'

/**
 * Transform ParsedRecipe (from AI flow) to RecipeCreateRequest (for API)
 */
function transformToRequest(recipe: ParsedRecipe): RecipeCreateRequest {
	// Map display difficulty to BE enum (uses @JsonValue format: "Beginner", etc.)
	const difficultyMap: Record<string, Difficulty> = {
		Easy: 'Beginner',
		Medium: 'Intermediate',
		Hard: 'Advanced',
		Expert: 'Expert',
	}

	// Parse cook time (e.g., "30 min" -> 30)
	const cookTimeMinutes = parseInt(recipe.cookTime) || 30

	return {
		title: recipe.title,
		description: recipe.description,
		coverImageUrl: recipe.coverImageUrl ? [recipe.coverImageUrl] : [],
		difficulty: difficultyMap[recipe.difficulty] || 'Intermediate',
		prepTimeMinutes: 10, // Default, can be refined later
		cookTimeMinutes,
		totalTimeMinutes: 10 + cookTimeMinutes,
		servings: recipe.servings,
		cuisineType: recipe.cuisine,
		dietaryTags: [],
		fullIngredientList: recipe.ingredients.map(ing => {
			// Parse "2 cups" -> { quantity: "2", unit: "cups", name: "flour" }
			const parts = ing.quantity.trim().split(' ')
			const quantity = parts[0] || '1'
			const unit = parts.slice(1).join(' ') || ''
			return { name: ing.name, quantity, unit }
		}),
		steps: recipe.steps.map(step => ({
			title: step.technique || 'Step',
			description: step.instruction,
			action: step.technique,
			// Use timerSeconds directly (already stored in seconds)
			timerSeconds: step.timerSeconds,
		})),
		rewardBadges: recipe.detectedBadges.map(b => b.name),
	}
}

/**
 * Create Recipe Page
 *
 * DESIGN DECISION: No back button.
 * Create is a PRIMARY navigation destination (appears in LeftSidebar).
 * Primary destinations don't have back buttons - user navigates away via nav.
 * Secondary pages (recipe edit, post new) have back buttons - they're tasks.
 */
export default function CreateRecipePage() {
	const router = useRouter()
	const [isPublishing, setIsPublishing] = useState(false)

	const handlePublish = async (recipe: ParsedRecipe) => {
		if (isPublishing) return

		setIsPublishing(true)

		try {
			const request = transformToRequest(recipe)
			const response = await createRecipe(request)

			if (response.success && response.data) {
				toast.success('Recipe published! 🎉', {
					description: `"${recipe.title}" is now live`,
				})
				// Navigate to the new recipe page
				router.push(`/recipes/${response.data.id}`)
			} else {
				toast.error('Failed to publish recipe', {
					description: response.message || 'Please try again',
				})
			}
		} catch (error) {
			console.error('Publish error:', error)
			toast.error('Something went wrong', {
				description: 'Please try again later',
			})
		} finally {
			setIsPublishing(false)
		}
	}

	return (
		<PageTransition>
			<PageContainer maxWidth='lg'>
				{/* No onBack = no back button. Primary nav destinations use nav to leave. */}
				<RecipeCreateAiFlow onPublish={handlePublish} />
			</PageContainer>
		</PageTransition>
	)
}
