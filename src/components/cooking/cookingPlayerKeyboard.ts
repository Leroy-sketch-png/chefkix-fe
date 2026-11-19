export interface CookingKeyboardState {
	isOpen: boolean
	hasRecipe: boolean
	showCompletion: boolean
	showAbandonConfirm: boolean
	showAiAssist: boolean
	showIngredientList: boolean
	showVoiceHelp: boolean
	hasOpenModal: boolean
}

export interface CookingKeyboardActions {
	closePlayer: () => void
	closeAbandonConfirm: () => void
	nextStep: () => void
	previousStep: () => void
	toggleMode: () => void
}

const EDITABLE_TARGETS =
	'input, textarea, select, [role="textbox"], [role="searchbox"], [role="slider"], [role="spinbutton"], [contenteditable]:not([contenteditable="false"])'
const OTHER_INTERACTIVE_TARGETS =
	'button, a[href], [role="button"], [role="combobox"], [role="listbox"], [role="radio"], [role="checkbox"], [role="switch"], [role="menuitem"], [role="tab"], [role="option"], [role="treeitem"], summary'
const DIALOG_TARGETS =
	'[role="dialog"], [role="alertdialog"], [aria-modal="true"]'

function targetMatches(event: KeyboardEvent, selector: string): boolean {
	return event.target instanceof Element && !!event.target.closest(selector)
}

export function handleCookingPlayerKeyboardEvent(
	event: KeyboardEvent,
	state: CookingKeyboardState,
	actions: CookingKeyboardActions,
): void {
	if (
		event.defaultPrevented ||
		event.isComposing ||
		event.repeat ||
		event.altKey ||
		event.ctrlKey ||
		event.metaKey ||
		event.shiftKey
	)
		return
	if (!state.isOpen) return
	if (targetMatches(event, EDITABLE_TARGETS)) return

	if (!state.hasRecipe) {
		if (event.key === 'Escape') {
			event.preventDefault()
			actions.closePlayer()
		}
		return
	}

	if (
		state.showCompletion ||
		state.showIngredientList ||
		state.showAiAssist ||
		state.showVoiceHelp
	)
		return

	if (state.showAbandonConfirm) {
		if (event.key === 'Escape') {
			event.preventDefault()
			actions.closeAbandonConfirm()
		}
		return
	}
	if (state.hasOpenModal) return

	// Other child controls own their keyboard events. The player-owned abandon
	// confirmation has already handled its own Escape path above.
	if (targetMatches(event, DIALOG_TARGETS)) return
	if (event.key !== 'Escape' && targetMatches(event, OTHER_INTERACTIVE_TARGETS))
		return

	if (event.key === 'ArrowRight') {
		event.preventDefault()
		actions.nextStep()
	} else if (event.key === 'ArrowLeft') {
		event.preventDefault()
		actions.previousStep()
	} else if (event.key === 'Escape') {
		actions.closePlayer()
	} else if (event.key === 'm' || event.key === 'M') {
		event.preventDefault()
		actions.toggleMode()
	}
}
