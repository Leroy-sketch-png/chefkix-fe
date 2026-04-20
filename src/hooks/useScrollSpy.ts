'use client'

import * as React from 'react'

interface UseScrollSpyOptions {
	/** CSS selectors or element IDs to observe */
	sectionIds: string[]
	/** Offset from top in pixels (e.g., for fixed headers) */
	offset?: number
	/** Root margin for IntersectionObserver */
	rootMargin?: string
}

/**
 * Tracks which section is currently in view.
 * Returns the active section ID.
 *
 * @example
 * const activeId = useScrollSpy({
 *   sectionIds: ['features', 'pricing', 'faq'],
 *   offset: 80,
 * })
 */
export function useScrollSpy({
	sectionIds,
	offset = 0,
	rootMargin,
}: UseScrollSpyOptions): string | null {
	const [activeId, setActiveId] = React.useState<string | null>(null)

	React.useEffect(() => {
		const elements = sectionIds
			.map(id => document.getElementById(id))
			.filter(Boolean) as Element[]

		if (elements.length === 0) return

		const margin = rootMargin ?? `-${offset}px 0px -50% 0px`

		const observer = new IntersectionObserver(
			entries => {
				// Find the first intersecting entry
				for (const entry of entries) {
					if (entry.isIntersecting) {
						setActiveId(entry.target.id)
						break
					}
				}
			},
			{ rootMargin: margin, threshold: 0 },
		)

		elements.forEach(el => observer.observe(el))

		return () => observer.disconnect()
	}, [sectionIds, offset, rootMargin])

	return activeId
}
