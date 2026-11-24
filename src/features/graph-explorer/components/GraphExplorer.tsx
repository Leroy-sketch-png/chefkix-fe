'use client'

import { ProductCompositionExplorer } from './ProductCompositionExplorer'

/**
 * The public graph route is the pinned FooDB product view. Research and legacy
 * graph artifacts have separate contracts and must not appear as substitutes.
 */
export function GraphExplorer() {
	return <ProductCompositionExplorer />
}
