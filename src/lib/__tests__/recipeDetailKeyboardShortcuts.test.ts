import { handleRecipeDetailKeyDown } from '../recipeDetailKeyboardShortcuts'

describe('recipe detail keyboard shortcuts', () => {
	let actions: {
		hasOpenOverlay: boolean
		onEscape: jest.Mock
		onEnter: jest.Mock
		onSave: jest.Mock
		onLike: jest.Mock
	}
	const cleanups: Array<() => void> = []

	beforeEach(() => {
		actions = {
			hasOpenOverlay: false,
			onEscape: jest.fn(),
			onEnter: jest.fn(),
			onSave: jest.fn(),
			onLike: jest.fn(),
		}
	})

	afterEach(() => {
		cleanups.splice(0).forEach(cleanup => cleanup())
	})

	function dispatch(
		target: HTMLElement,
		key: string,
		init: KeyboardEventInit = {},
	) {
		const event = new KeyboardEvent('keydown', {
			key,
			bubbles: true,
			cancelable: true,
			...init,
		})
		target.dispatchEvent(event)
		return event
	}

	it('does not prevent native Enter activation on Manage or a menu item', () => {
		const manage = document.createElement('button')
		manage.textContent = 'Manage'
		const menuItem = document.createElement('div')
		menuItem.setAttribute('role', 'menuitem')
		const nativeActivation = jest.fn()
		manage.addEventListener('keydown', nativeActivation)
		menuItem.addEventListener('keydown', nativeActivation)
		document.body.append(manage, menuItem)
		const handler = (event: KeyboardEvent) =>
			handleRecipeDetailKeyDown(event, actions)
		window.addEventListener('keydown', handler)
		cleanups.push(() => window.removeEventListener('keydown', handler))
		cleanups.push(
			() => manage.remove(),
			() => menuItem.remove(),
		)

		const manageEvent = dispatch(manage, 'Enter')
		const menuEvent = dispatch(menuItem, 'Enter')

		expect(nativeActivation).toHaveBeenCalledTimes(2)
		expect(manageEvent.defaultPrevented).toBe(false)
		expect(menuEvent.defaultPrevented).toBe(false)
		expect(actions.onEnter).not.toHaveBeenCalled()
	})

	it('does not start cooking when the focused control differs from event target', () => {
		const manage = document.createElement('button')
		manage.textContent = 'Manage'
		document.body.append(manage)
		manage.focus()
		const handler = (event: KeyboardEvent) =>
			handleRecipeDetailKeyDown(event, actions)
		window.addEventListener('keydown', handler)
		cleanups.push(() => window.removeEventListener('keydown', handler))
		cleanups.push(() => manage.remove())

		const event = dispatch(document.body, 'Enter')

		expect(document.activeElement).toBe(manage)
		expect(event.defaultPrevented).toBe(false)
		expect(actions.onEnter).not.toHaveBeenCalled()
	})

	it('keeps Escape and shortcut keys inside text inputs', () => {
		const input = document.createElement('input')
		document.body.append(input)
		const handler = (event: KeyboardEvent) =>
			handleRecipeDetailKeyDown(event, actions)
		window.addEventListener('keydown', handler)
		cleanups.push(() => window.removeEventListener('keydown', handler))
		cleanups.push(() => input.remove())

		const escape = dispatch(input, 'Escape')
		const save = dispatch(input, 's')

		expect(escape.defaultPrevented).toBe(false)
		expect(save.defaultPrevented).toBe(false)
		expect(actions.onEscape).not.toHaveBeenCalled()
		expect(actions.onSave).not.toHaveBeenCalled()
	})

	it('does not steal Enter or character shortcuts from contenteditable text', () => {
		const editor = document.createElement('div')
		editor.setAttribute('contenteditable', 'true')
		document.body.append(editor)
		const handler = (event: KeyboardEvent) =>
			handleRecipeDetailKeyDown(event, actions)
		window.addEventListener('keydown', handler)
		cleanups.push(() => window.removeEventListener('keydown', handler))
		cleanups.push(() => editor.remove())

		const enter = dispatch(editor, 'Enter')
		const like = dispatch(editor, 'l')

		expect(enter.defaultPrevented).toBe(false)
		expect(like.defaultPrevented).toBe(false)
		expect(actions.onEnter).not.toHaveBeenCalled()
		expect(actions.onLike).not.toHaveBeenCalled()
	})

	it('runs Escape on the page and preserves modifier-key behavior', () => {
		const handler = (event: KeyboardEvent) =>
			handleRecipeDetailKeyDown(event, actions)
		window.addEventListener('keydown', handler)
		cleanups.push(() => window.removeEventListener('keydown', handler))

		const escape = dispatch(document.body, 'Escape')
		const modifiedSave = dispatch(document.body, 's', { ctrlKey: true })
		const shiftedSave = dispatch(document.body, 'S', { shiftKey: true })

		expect(escape.defaultPrevented).toBe(true)
		expect(actions.onEscape).toHaveBeenCalledTimes(1)
		expect(modifiedSave.defaultPrevented).toBe(false)
		expect(shiftedSave.defaultPrevented).toBe(true)
		expect(actions.onSave).toHaveBeenCalledTimes(1)
	})

	it('keeps overlay Escape behavior while suppressing page shortcuts', () => {
		actions.hasOpenOverlay = true
		const handler = (event: KeyboardEvent) =>
			handleRecipeDetailKeyDown(event, actions)
		window.addEventListener('keydown', handler)
		cleanups.push(() => window.removeEventListener('keydown', handler))

		const enter = dispatch(document.body, 'Enter')
		const escape = dispatch(document.body, 'Escape')

		expect(enter.defaultPrevented).toBe(false)
		expect(actions.onEnter).not.toHaveBeenCalled()
		expect(escape.defaultPrevented).toBe(true)
		expect(actions.onEscape).toHaveBeenCalledTimes(1)
	})
})
