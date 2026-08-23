export interface IngredientBoundingBox {
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
