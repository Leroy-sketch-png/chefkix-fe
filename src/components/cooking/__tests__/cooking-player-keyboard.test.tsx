import { fireEvent, render } from '@testing-library/react'
import { handleCookingPlayerKeyboardEvent } from '../cookingPlayerKeyboard'
import { VoiceHelpOverlay } from '../VoiceHelpOverlay'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => key,
}))

jest.mock('framer-motion', () => ({
	motion: { div: 'div' },
	AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('@/components/ui/portal', () => ({
	Portal: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('@/hooks/useFocusTrap', () => ({
	useFocusTrap: () => ({ current: null }),
}))

const defaultState = {
	isOpen: true,
	hasRecipe: true,
	showCompletion: false,
	showAbandonConfirm: false,
	showAiAssist: false,
	showIngredientList: false,
	showVoiceHelp: false,
	hasOpenModal: false,
}

function makeActions() {
	return {
		closePlayer: jest.fn(),
		closeAbandonConfirm: jest.fn(),
		nextStep: jest.fn(),
		previousStep: jest.fn(),
		toggleMode: jest.fn(),
	}
}

function listenWith(
	state: typeof defaultState,
	actions: ReturnType<typeof makeActions>,
) {
	const handler = (event: KeyboardEvent) =>
		handleCookingPlayerKeyboardEvent(event, state, actions)
	window.addEventListener('keydown', handler)
	return () => window.removeEventListener('keydown', handler)
}

describe('CookingPlayer keyboard event ownership', () => {
	it('keeps deliberate unmodified shortcuts available while the player is active', () => {
		const actions = makeActions()
		const remove = listenWith(defaultState, actions)
		const right = new KeyboardEvent('keydown', {
			key: 'ArrowRight',
			bubbles: true,
			cancelable: true,
		})
		window.dispatchEvent(right)
		window.dispatchEvent(
			new KeyboardEvent('keydown', {
				key: 'ArrowLeft',
				bubbles: true,
				cancelable: true,
			}),
		)
		window.dispatchEvent(
			new KeyboardEvent('keydown', {
				key: 'm',
				bubbles: true,
				cancelable: true,
			}),
		)
		remove()

		expect(right.defaultPrevented).toBe(true)
		expect(actions.nextStep).toHaveBeenCalledTimes(1)
		expect(actions.previousStep).toHaveBeenCalledTimes(1)
		expect(actions.toggleMode).toHaveBeenCalledTimes(1)
	})

	it('does not steal typing, nested contenteditable, native controls, or modified/composing/repeated keys', () => {
		const actions = makeActions()
		const remove = listenWith(defaultState, actions)
		const cases: Array<[HTMLElement, KeyboardEventInit]> = []
		const input = document.createElement('input')
		const editable = document.createElement('div')
		editable.setAttribute('contenteditable', 'true')
		const nestedEditable = document.createElement('span')
		editable.append(nestedEditable)
		const select = document.createElement('select')
		const slider = document.createElement('input')
		slider.type = 'range'
		const combobox = document.createElement('div')
		combobox.setAttribute('role', 'combobox')
		document.body.append(input, editable, select, slider, combobox)
		for (const element of [input, nestedEditable, select, slider, combobox])
			cases.push([element, { key: 'ArrowRight' }])
		for (const init of [
			{ key: 'ArrowRight', ctrlKey: true },
			{ key: 'ArrowRight', metaKey: true },
			{ key: 'ArrowLeft', altKey: true },
			{ key: 'm', shiftKey: true },
			{ key: 'ArrowRight', isComposing: true },
			{ key: 'ArrowRight', repeat: true },
		]) {
			cases.push([document.body, init])
		}
		for (const [target, init] of cases) {
			fireEvent.keyDown(target, init)
		}
		remove()

		expect(actions.nextStep).not.toHaveBeenCalled()
		expect(actions.previousStep).not.toHaveBeenCalled()
		expect(actions.toggleMode).not.toHaveBeenCalled()
		input.remove()
		editable.remove()
		select.remove()
		slider.remove()
		combobox.remove()
	})

	it('respects already-handled events and events owned by controls or child dialogs', () => {
		const actions = makeActions()
		const remove = listenWith(defaultState, actions)
		const button = document.createElement('button')
		const dialog = document.createElement('div')
		dialog.setAttribute('role', 'dialog')
		const control = document.createElement('button')
		dialog.append(control)
		document.body.append(button, dialog)
		const closeDialog = jest.fn()
		control.addEventListener('keydown', event => {
			if (event.key === 'Escape') {
				event.preventDefault()
				closeDialog()
			}
		})
		fireEvent.keyDown(button, { key: 'ArrowRight' })
		fireEvent.keyDown(button, { key: 'm' })
		fireEvent.keyDown(control, { key: 'ArrowRight' })
		fireEvent.keyDown(control, { key: 'Escape' })
		const handled = new KeyboardEvent('keydown', {
			key: 'ArrowRight',
			bubbles: true,
			cancelable: true,
		})
		handled.preventDefault()
		window.dispatchEvent(handled)
		remove()

		expect(actions.nextStep).not.toHaveBeenCalled()
		expect(actions.toggleMode).not.toHaveBeenCalled()
		expect(actions.closePlayer).not.toHaveBeenCalled()
		expect(closeDialog).toHaveBeenCalledTimes(1)
		button.remove()
		dialog.remove()
	})

	it('leaves ingredient-dialog Escape to Radix and does not close the player', () => {
		const actions = makeActions()
		const remove = listenWith(
			{ ...defaultState, showIngredientList: true },
			actions,
		)
		fireEvent.keyDown(window, { key: 'Escape' })
		remove()
		expect(actions.closePlayer).not.toHaveBeenCalled()
		expect(actions.nextStep).not.toHaveBeenCalled()
	})

	it('does not route shortcuts to the player while another modal is open', () => {
		const actions = makeActions()
		const remove = listenWith({ ...defaultState, hasOpenModal: true }, actions)
		fireEvent.keyDown(window, { key: 'ArrowRight' })
		fireEvent.keyDown(window, { key: 'Escape' })
		remove()
		expect(actions.nextStep).not.toHaveBeenCalled()
		expect(actions.closePlayer).not.toHaveBeenCalled()
	})

	it('lets voice-help Escape close help without closing the cooking player', () => {
		const actions = makeActions()
		const remove = listenWith({ ...defaultState, showVoiceHelp: true }, actions)
		const onClose = jest.fn()
		render(<VoiceHelpOverlay show onClose={onClose} />)

		fireEvent.keyDown(window, { key: 'Escape' })

		expect(onClose).toHaveBeenCalledTimes(1)
		expect(actions.closePlayer).not.toHaveBeenCalled()
		remove()
	})

	it('closes only the abandon confirmation on Escape and ignores a closed player', () => {
		const actions = makeActions()
		const removeAbandon = listenWith(
			{ ...defaultState, showAbandonConfirm: true },
			actions,
		)
		const dialog = document.createElement('div')
		dialog.setAttribute('role', 'alertdialog')
		const dialogButton = document.createElement('button')
		dialog.append(dialogButton)
		document.body.append(dialog)
		fireEvent.keyDown(dialogButton, { key: 'Escape' })
		removeAbandon()
		expect(actions.closeAbandonConfirm).toHaveBeenCalledTimes(1)
		expect(actions.closePlayer).not.toHaveBeenCalled()
		dialog.remove()

		const removeClosed = listenWith({ ...defaultState, isOpen: false }, actions)
		fireEvent.keyDown(window, { key: 'ArrowRight' })
		removeClosed()
		expect(actions.nextStep).not.toHaveBeenCalled()
	})

	it('does not advance again when the same key event is delivered twice', () => {
		const actions = makeActions()
		const remove = listenWith(defaultState, actions)
		const event = new KeyboardEvent('keydown', {
			key: 'ArrowRight',
			bubbles: true,
			cancelable: true,
		})
		window.dispatchEvent(event)
		handleCookingPlayerKeyboardEvent(event, defaultState, actions)
		remove()
		expect(actions.nextStep).toHaveBeenCalledTimes(1)
	})
})
