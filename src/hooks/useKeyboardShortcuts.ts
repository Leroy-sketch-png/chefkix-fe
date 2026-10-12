import { useEffect, useCallback, useRef, useState } from 'react'

export interface KeyboardShortcut {
	key: string
	ctrl?: boolean
	shift?: boolean
	alt?: boolean
	action: () => void
	description?: string
	enabled?: boolean
	preventDefault?: boolean
}

interface UseKeyboardShortcutsOptions {
	disableInInputs?: boolean
}

/**
 * Declarative keyboard shortcut system with modifier support.
 * Input-field aware (disables in inputs unless Escape/F-keys).
 *
 * @example
 * useKeyboardShortcuts([
 *   { key: 'k', ctrl: true, action: openSearch, description: 'Search' },
 *   { key: 'Escape', action: handleClose },
 * ])
 */
export function useKeyboardShortcuts(
	shortcuts: KeyboardShortcut[],
	options: UseKeyboardShortcutsOptions = {},
) {
	const { disableInInputs = true } = options
	const shortcutsRef = useRef(shortcuts)
	shortcutsRef.current = shortcuts

	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			if (disableInInputs) {
				const target = event.target as HTMLElement
				const tag = target.tagName.toLowerCase()
				const isInput =
					tag === 'input' || tag === 'textarea' || target.isContentEditable
				if (isInput && event.key !== 'Escape' && !event.key.startsWith('F'))
					return
			}

			for (const shortcut of shortcutsRef.current) {
				if (shortcut.enabled === false) continue

				const ctrlMatch = shortcut.ctrl
					? event.ctrlKey || event.metaKey
					: !event.ctrlKey && !event.metaKey
				const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
				const altMatch = shortcut.alt ? event.altKey : !event.altKey
				const keyMatch =
					event.key.toLowerCase() === shortcut.key.toLowerCase() ||
					event.code.toLowerCase() === `key${shortcut.key.toLowerCase()}`

				if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
					if (shortcut.preventDefault !== false) event.preventDefault()
					shortcut.action()
					return
				}
			}
		},
		[disableInInputs],
	)

	useEffect(() => {
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [handleKeyDown])
}

/** Platform-aware modifier symbol */
export function getModifierSymbol(): string {
	if (typeof navigator === 'undefined') return 'Ctrl'
	const platform =
		'userAgentData' in navigator
			? (navigator.userAgentData as { platform?: string }).platform
			: undefined
	return platform === 'macOS' || /Mac|iPhone|iPad/.test(navigator.userAgent)
		? '⌘'
		: 'Ctrl'
}

/** Hydration-stable platform modifier for shortcut labels. */
export function useModifierSymbol(): string {
	const [symbol, setSymbol] = useState('Ctrl')

	useEffect(() => {
		setSymbol(getModifierSymbol())
	}, [])

	return symbol
}

/** Format shortcut for display */
export function formatShortcutLabel(
	shortcut: Pick<KeyboardShortcut, 'key' | 'ctrl' | 'shift' | 'alt'>,
	modifierSymbol = getModifierSymbol(),
): string {
	const parts: string[] = []
	if (shortcut.ctrl) parts.push(modifierSymbol)
	if (shortcut.shift) parts.push('Shift')
	if (shortcut.alt) parts.push('Alt')

	const keyDisplay: Record<string, string> = {
		Enter: '↵',
		Escape: 'Esc',
		ArrowUp: '↑',
		ArrowDown: '↓',
		ArrowLeft: '←',
		ArrowRight: '→',
		' ': 'Space',
	}
	parts.push(keyDisplay[shortcut.key] || shortcut.key.toUpperCase())
	return parts.join('+')
}
