import { create } from 'zustand'

export type LogEntry = {
	id: string
	timestamp: string
	driver: string
	level: 'info' | 'warn' | 'error' | 'success'
	message: string
}

type TelemetryStore = {
	logs: LogEntry[]
	addLog: (driver: string, level: 'info' | 'warn' | 'error' | 'success', message: string) => void
	clearLogs: () => void
}

export const useTelemetryStore = create<TelemetryStore>((set) => ({
	logs: [],
	addLog: (driver, level, message) => set((state) => ({
		logs: [...state.logs.slice(-49), { // Keep last 50 logs
			id: Math.random().toString(36).substring(2, 9),
			timestamp: new Date().toISOString(),
			driver,
			level,
			message
		}]
	})),
	clearLogs: () => set({ logs: [] })
}))

export type GhostState = {
	x: number
	y: number
	clicking: boolean
	typing: boolean
	visible: boolean
	name: string
	spotlightRect?: { x: number, y: number, w: number, h: number } | null
}

type Listener = (state: GhostState) => void

export class GhostDriver {
	private state: GhostState
	private listeners: Set<Listener> = new Set()
	private isRunning = false

	constructor(name: string) {
		this.state = {
			x: window.innerWidth / 2,
			y: window.innerHeight / 2,
			clicking: false,
			typing: false,
			visible: false,
			name,
			spotlightRect: null
		}
	}

	log(level: 'info' | 'warn' | 'error' | 'success', message: string) {
		useTelemetryStore.getState().addLog(this.state.name, level, message)
	}

	subscribe(listener: Listener) {
		this.listeners.add(listener)
		listener(this.state)
		return () => this.listeners.delete(listener)
	}

	private emit() {
		this.listeners.forEach(l => l(this.state))
	}

	private update(patch: Partial<GhostState>) {
		this.state = { ...this.state, ...patch }
		this.emit()
	}

	async wait(ms: number) {
		if (!this.isRunning) throw new Error('Ghost driver stopped')
		return new Promise(resolve => setTimeout(resolve, ms))
	}

	async waitForSelector(selector: string, timeoutMs = 10000): Promise<Element> {
		this.log('info', `Locating element: ${selector}`)
		const start = Date.now()
		while (Date.now() - start < timeoutMs) {
			if (!this.isRunning) throw new Error('Ghost driver stopped')
			const el = document.querySelector(selector)
			if (el) {
				this.log('success', `Found ${selector}`)
				return el
			}
			await this.wait(100)
		}
		this.log('error', `Timeout locating ${selector}`)
		throw new Error(`Timeout waiting for ${selector}`)
	}

	async moveTo(el: Element) {
		if (!this.isRunning) return
		this.update({ visible: true })
		el.scrollIntoView({ behavior: 'smooth', block: 'center' })
		await this.wait(500) // let scroll happen
		const rect = el.getBoundingClientRect()
		this.log('info', `Moving to (x: ${Math.round(rect.left + rect.width / 2)}, y: ${Math.round(rect.top + rect.height / 2)})`)
		this.update({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
		await this.wait(400) // let cursor travel
	}

	async click(selector: string) {
		if (!this.isRunning) return
		this.log('info', `Initiating click sequence on ${selector}`)
		const el = await this.waitForSelector(selector)
		await this.moveTo(el)
		
		this.update({ clicking: true })
		await this.wait(150)
		
		el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: this.state.x, clientY: this.state.y }))
		el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: this.state.x, clientY: this.state.y }))
		if (el instanceof HTMLElement) {
			el.click()
		}
		
		this.update({ clicking: false, spotlightRect: null })
		await this.wait(200)
	}

	async hover(selector: string, spotlight: boolean = false) {
		if (!this.isRunning) return
		this.log('info', `Hovering ${selector}${spotlight ? ' with Spotlight' : ''}`)
		const el = await this.waitForSelector(selector)
		await this.moveTo(el)
		if (spotlight) {
			const rect = el.getBoundingClientRect()
			this.log('info', `Engaging laser spotlight at [${Math.round(rect.width)}x${Math.round(rect.height)}]`)
			this.update({ spotlightRect: { x: rect.left, y: rect.top, w: rect.width, h: rect.height } })
		}
		await this.wait(1000)
	}

	async type(selector: string, text: string) {
		if (!this.isRunning) return
		this.log('info', `Typing "${text}" into ${selector}`)
		const el = await this.waitForSelector(selector) as HTMLInputElement | HTMLTextAreaElement
		await this.moveTo(el)
		
		this.update({ clicking: true })
		await this.wait(100)
		el.focus()
		this.update({ clicking: false })
		await this.wait(100)
		
		this.update({ typing: true })
		
		// React 16+ controlled inputs require setting the value setter directly
		const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
		const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
		
		for (let i = 0; i < text.length; i++) {
			if (!this.isRunning) break
			const char = text[i]
			const currentVal = el.value + char
			
			// Try brutal native execCommand first (perfect for contenteditable and rich editors)
			let execSuccess = false
			try {
				if (document.queryCommandSupported('insertText')) {
					execSuccess = document.execCommand('insertText', false, char)
				}
			} catch (e) {}

			// Fallback to React synthetic override if execCommand fails or is an input
			if (!execSuccess || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
				if (el instanceof HTMLInputElement && nativeInputValueSetter) {
					nativeInputValueSetter.call(el, currentVal)
				} else if (el instanceof HTMLTextAreaElement && nativeTextAreaValueSetter) {
					nativeTextAreaValueSetter.call(el, currentVal)
				} else {
					el.value = currentVal
				}
				
				// Dispatch both generic and specialized input events
				el.dispatchEvent(new Event('input', { bubbles: true }))
				if (typeof InputEvent !== 'undefined') {
					el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: char }))
				}
			}
			
			await this.wait(40 + Math.random() * 60)
		}
		
		this.update({ typing: false })
		await this.wait(200)
	}

	async scroll(distance: number) {
		if (!this.isRunning) return
		this.log('info', `Scrolling window by ${distance}px`)
		window.scrollBy({ top: distance, behavior: 'smooth' })
		await this.wait(1000)
	}
	
	async press(selector: string, key: string) {
		if (!this.isRunning) return
		this.log('info', `Pressing [${key}] on ${selector}`)
		const el = await this.waitForSelector(selector)
		await this.moveTo(el)
		el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key }))
		el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key }))
	}

	stop() {
		this.isRunning = false
		this.update({ visible: false, spotlightRect: null })
	}

	start() {
		this.isRunning = true
		this.update({ visible: true })
	}
}

// Map of all active ghost drivers
const drivers = new Map<string, GhostDriver>()

export function getGhostDriver(name: string = 'main'): GhostDriver {
	if (!drivers.has(name)) {
		drivers.set(name, new GhostDriver(name))
	}
	return drivers.get(name)!
}

// Export the main ghost driver for backward compatibility with phase 1
export const ghostDriver = getGhostDriver('main')
