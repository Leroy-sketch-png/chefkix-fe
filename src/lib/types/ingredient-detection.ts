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

export interface IngredientDetectionResult {
	detections: IngredientDetection[]
}
