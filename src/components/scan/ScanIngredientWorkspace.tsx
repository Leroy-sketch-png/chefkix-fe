'use client'

import { useState } from 'react'
import type { IngredientDetectionResult } from '@/lib/types/ingredient-detection'
import { IngredientScanner } from './IngredientScanner'
import { PhotoIntelligencePanel } from './PhotoIntelligencePanel'

/** Keeps camera state and post-scan intelligence state together without bloating the page route. */
export function ScanIngredientWorkspace() {
	const [result, setResult] = useState<IngredientDetectionResult | null>(null)

	return (
		<>
			<IngredientScanner onScanComplete={setResult} />
			<PhotoIntelligencePanel result={result} />
		</>
	)
}
