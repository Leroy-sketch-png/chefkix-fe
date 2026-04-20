'use client'

import * as React from 'react'

interface UseModalReturn {
	isOpen: boolean
	open: () => void
	close: () => void
	toggle: () => void
}

/**
 * Simple modal state management hook.
 *
 * @example
 * const modal = useModal()
 * <button onClick={modal.open}>Open</button>
 * {modal.isOpen && <Dialog onClose={modal.close}>...</Dialog>}
 */
export function useModal(defaultOpen = false): UseModalReturn {
	const [isOpen, setIsOpen] = React.useState(defaultOpen)

	const open = React.useCallback(() => setIsOpen(true), [])
	const close = React.useCallback(() => setIsOpen(false), [])
	const toggle = React.useCallback(() => setIsOpen(v => !v), [])

	return { isOpen, open, close, toggle }
}
