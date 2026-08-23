import type { IngredientDetectionResult } from '@/lib/types/ingredient-detection'

const DETECTION_ENDPOINT = '/api/ingredient-detection'

interface DetectionApiResponse {
	success: boolean
	message?: string
	data?: IngredientDetectionResult
}

/**
 * Keeps the scanner UI independent from the detector implementation.
 * Replace the endpoint here when the YOLO service is ready.
 */
export async function detectIngredients(
	image: Blob,
): Promise<IngredientDetectionResult> {
	const body = new FormData()
	body.append('image', image, 'ingredient-scan.jpg')

	const response = await fetch(DETECTION_ENDPOINT, {
		method: 'POST',
		body,
	})
	const payload = (await response.json()) as DetectionApiResponse

	if (!response.ok || !payload.success || !payload.data) {
		throw new Error(payload.message || 'Ingredient detection failed')
	}

	return payload.data
}
