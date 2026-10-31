import type { IngredientDetectionResult } from '@/lib/types/ingredient-detection'
import { aiApi } from '@/lib/axios'
import { getUserFriendlyMessage } from '@/lib/error-utils'

// Keep the browser contract stable. The same-origin route owns mock/real
// provider selection so the UI never needs to know where the model runs.
const DETECTION_ENDPOINT = '/api/ingredient-detection'

interface DetectionApiResponse {
	success: boolean
	message?: string
	data?: IngredientDetectionResult
	meta?: { source?: 'real' | 'mock'; model?: string }
}

/**
 * Keeps the scanner UI independent from the detector implementation.
 * Configure INGREDIENT_DETECTION_BACKEND_URL on the frontend server when the
 * YOLO service is ready; the route adapts the upstream response to this shape.
 */
export async function detectIngredients(
	image: Blob,
	signal?: AbortSignal,
): Promise<IngredientDetectionResult> {
	const body = new FormData()
	body.append('image', image, 'ingredient-scan.jpg')

	let payload: DetectionApiResponse
	try {
		const response = await aiApi.post<DetectionApiResponse>(
			DETECTION_ENDPOINT,
			body,
			{
				signal,
				headers: { 'Content-Type': 'multipart/form-data' },
			},
		)
		payload = response.data
	} catch (error) {
		throw new Error(getUserFriendlyMessage(error))
	}

	if (!payload.success || !payload.data) {
		throw new Error(payload.message || 'Ingredient detection failed')
	}

	return {
		...payload.data,
		...(payload.meta && {
			source: payload.meta.source === 'real' ? 'backend' : 'mock',
			...(payload.meta.model ? { model: payload.meta.model } : {}),
		}),
	}
}
