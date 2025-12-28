'use client'

import { useEffect, useState, ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * Portal Component
 *
 * Renders children into a DOM node that exists outside the parent component hierarchy.
 * This is CRITICAL for modals, tooltips, and overlays to escape stacking contexts
 * created by CSS properties like transform, filter, backdrop-blur, etc.
 *
 * @example
 * ```tsx
 * <Portal>
 *   <div className="fixed inset-0 z-modal">Modal content</div>
 * </Portal>
 * ```
 *
 * Why this matters:
 * - CSS stacking contexts trap child elements regardless of z-index value
 * - Properties like backdrop-blur, transform, opacity<1 create new stacking contexts
 * - Portal renders to document.body, outside ALL stacking contexts
 */
interface PortalProps {
	children: ReactNode
	/**
	 * Custom container element to portal into.
	 * Defaults to document.body.
	 */
	container?: Element | null
}

export function Portal({ children, container }: PortalProps) {
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	if (!mounted) return null

	const targetContainer = container ?? document.body

	return createPortal(children, targetContainer)
}

/**
 * Convenience wrapper for modal overlays.
 * Combines Portal with common modal overlay patterns.
 */
interface ModalPortalProps {
	children: ReactNode
	isOpen: boolean
}

export function ModalPortal({ children, isOpen }: ModalPortalProps) {
	if (!isOpen) return null
	return <Portal>{children}</Portal>
}
