'use client'

import { useEffect } from 'react'

/**
 * Closes a modal/dropdown when Escape is pressed.
 * Only attaches the listener when `isOpen` is true.
 */
export function useEscapeKey(isOpen: boolean, onClose: () => void) {
	useEffect(() => {
		if (!isOpen) return

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.preventDefault()
				onClose()
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isOpen, onClose])
}
