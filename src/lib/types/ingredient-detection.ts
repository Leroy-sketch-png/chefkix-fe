export interface IngredientBoundingBox {
	/** Coordinates are normalized from 0 to 1 relative to the captured image. */
	x: number
	y: number
	width: number
	height: number
}

export interface IngredientDetection {
	id: string
	name: string
	confidence: number
	boundingBox: IngredientBoundingBox
}

export interface DetectionSpeed {
	preprocess_ms: number
	inference_ms: number
	postprocess_ms: number
	total_ms: number
}

export interface IngredientDetectionResult {
	detections: IngredientDetection[]
	/** Indicates whether the configured detector or local demo fallback answered. */
	source?: 'backend' | 'mock'
	model?: string
	device?: string
	speed?: DetectionSpeed
}
