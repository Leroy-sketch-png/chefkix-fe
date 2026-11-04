import type { KitchenInteractionMode } from '@/store/cookingStore'

export function canOfferStepPhotoPrompt(
	interactionMode: KitchenInteractionMode | null,
): boolean {
	return (
		interactionMode === 'PREP' ||
		interactionMode === 'ACTIVE' ||
		interactionMode === 'MONITORING'
	)
}
