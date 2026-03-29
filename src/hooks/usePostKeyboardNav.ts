'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

/**
 * j/k keyboard navigation for post feeds.
 * - j = next post, k = previous post
 * - Enter = open focused post
 * - Escape = clear focus
 *
 * Returns `focusedIndex` for visual focus ring.
 * Wrap each post in a div with `data-post-index={i}`.
 */
export function usePostKeyboardNav(posts: { id: string }[]) {
	const router = useRouter()
	const [focusedIndex, setFocusedIndex] = useState(-1)
	const stateRef = useRef({ focusedIndex, posts })
	stateRef.current = { focusedIndex, posts }

	// Reset when post list changes significantly (e.g., tab switch)
	const prevLenRef = useRef(posts.length)
	useEffect(() => {
		if (posts.length === 0 || Math.abs(posts.length - prevLenRef.current) > 5) {
			setFocusedIndex(-1)
		}
		prevLenRef.current = posts.length
	}, [posts.length])

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement ||
				(e.target as HTMLElement)?.isContentEditable
			) {
				return
			}

			const { focusedIndex: fi, posts: p } = stateRef.current

			switch (e.key) {
				case 'j': {
					e.preventDefault()
					const next = Math.min(fi + 1, p.length - 1)
					setFocusedIndex(next)
					requestAnimationFrame(() => {
						document
							.querySelector(`[data-post-index="${next}"]`)
							?.scrollIntoView({ behavior: 'smooth', block: 'center' })
					})
					break
				}
				case 'k': {
					e.preventDefault()
					const next = Math.max(fi - 1, -1)
					setFocusedIndex(next)
					if (next >= 0) {
						requestAnimationFrame(() => {
							document
								.querySelector(`[data-post-index="${next}"]`)
								?.scrollIntoView({ behavior: 'smooth', block: 'center' })
						})
					}
					break
				}
				case 'Enter':
					if (fi >= 0 && fi < p.length) {
						e.preventDefault()
						router.push(`/posts/${p[fi].id}`)
					}
					break
				case 'Escape':
					setFocusedIndex(-1)
					break
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [router])

	return { focusedIndex }
}
