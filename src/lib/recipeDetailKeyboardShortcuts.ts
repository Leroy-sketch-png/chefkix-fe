const NATIVE_INTERACTIVE_TARGETS =
	'button, a, input, textarea, select, summary, [role="button"], [role="link"], [role="menuitem"], [contenteditable="true"]'

function isNativeInteractiveElement(element: Element | null) {
	return Boolean(element?.closest(NATIVE_INTERACTIVE_TARGETS))
}

export interface RecipeDetailKeyboardActions {
	hasOpenOverlay: boolean
	onEscape: () => void
	onEnter: () => void
	onSave: () => void
	onLike: () => void
}

/** Handle page-level recipe shortcuts while leaving editing and native controls alone. */
export function handleRecipeDetailKeyDown(
	event: KeyboardEvent,
	actions: RecipeDetailKeyboardActions,
) {
	// Preserve the original input contract: Escape and shortcut keys typed into
	// text fields belong to the field, not the recipe page.
	if (
		event.target instanceof HTMLInputElement ||
		event.target instanceof HTMLTextAreaElement
	) {
		return
	}

	if (event.key === 'Escape') {
		event.preventDefault()
		actions.onEscape()
		return
	}

	if (
		actions.hasOpenOverlay ||
		event.ctrlKey ||
		event.metaKey ||
		event.altKey
	) {
		return
	}

	const eventTarget = event.target instanceof Element ? event.target : null
	const activeElement = document.activeElement
	if (
		isNativeInteractiveElement(eventTarget) ||
		isNativeInteractiveElement(activeElement)
	) {
		return
	}

	switch (event.key) {
		case 'Enter':
			event.preventDefault()
			actions.onEnter()
			break
		case 's':
		case 'S':
			event.preventDefault()
			actions.onSave()
			break
		case 'l':
		case 'L':
			event.preventDefault()
			actions.onLike()
			break
	}
}
