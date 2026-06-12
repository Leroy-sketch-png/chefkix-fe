export type KitchenAudioChannel =
	| 'timer-critical'
	| 'user-request'
	| 'step-guidance'
	| 'timer-milestone'

export type KitchenAudioInterruption =
	| 'interrupt'
	| 'queue'
	| 'replace-lower-priority'

export interface KitchenAudioPreferences {
	spokenGuidanceEnabled: boolean
	timerVoiceEnabled: boolean
	timerChimesEnabled: boolean
	soundEffectsEnabled: boolean
}

export interface KitchenAudioRequest {
	channel: KitchenAudioChannel
	priority: number
	dedupeKey: string
	text: string
	interruption: KitchenAudioInterruption
	rate?: number
	pitch?: number
	volume?: number
	language?: string
}

export interface KitchenAudioSnapshot {
	preferences: KitchenAudioPreferences
	guidanceChoiceMade: boolean
	isSpeaking: boolean
	activeChannel: KitchenAudioChannel | null
	microphoneOwner: 'voice' | 'clap' | null
}

interface QueuedRequest {
	request: KitchenAudioRequest
	resolve: () => void
	reject: (error: Error) => void
}

const PREFERENCES_KEY = 'chefkix-kitchen-audio-preferences'
const LEGACY_AUDIO_KEY = 'chefkix-audio-enabled'

export const DEFAULT_KITCHEN_AUDIO_PREFERENCES: KitchenAudioPreferences = {
	spokenGuidanceEnabled: false,
	timerVoiceEnabled: true,
	timerChimesEnabled: true,
	soundEffectsEnabled: true,
}

const DEDUPE_WINDOW_MS = 5000
const MAX_DEDUPE_HISTORY = 200

const CHANNEL_PRIORITIES: Record<KitchenAudioChannel, number> = {
	'timer-critical': 400,
	'user-request': 300,
	'step-guidance': 200,
	'timer-milestone': 100,
}

function canUseStorage(): boolean {
	return (
		typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
	)
}

function readPersistedState(): {
	preferences: KitchenAudioPreferences
	guidanceChoiceMade: boolean
} {
	if (!canUseStorage()) {
		return {
			preferences: DEFAULT_KITCHEN_AUDIO_PREFERENCES,
			guidanceChoiceMade: false,
		}
	}

	try {
		const raw = window.localStorage.getItem(PREFERENCES_KEY)
		if (raw) {
			const parsed = JSON.parse(raw) as {
				preferences?: Partial<KitchenAudioPreferences>
				guidanceChoiceMade?: boolean
			}
			return {
				preferences: {
					...DEFAULT_KITCHEN_AUDIO_PREFERENCES,
					...parsed.preferences,
				},
				guidanceChoiceMade: parsed.guidanceChoiceMade === true,
			}
		}

		const legacyEnabled =
			window.localStorage.getItem(LEGACY_AUDIO_KEY) !== 'false'
		return {
			preferences: {
				...DEFAULT_KITCHEN_AUDIO_PREFERENCES,
				soundEffectsEnabled: legacyEnabled,
				timerChimesEnabled: legacyEnabled,
			},
			guidanceChoiceMade: false,
		}
	} catch {
		return {
			preferences: DEFAULT_KITCHEN_AUDIO_PREFERENCES,
			guidanceChoiceMade: false,
		}
	}
}

export class KitchenAudioCoordinator {
	private preferences = DEFAULT_KITCHEN_AUDIO_PREFERENCES
	private guidanceChoiceMade = false
	private queue: QueuedRequest[] = []
	private active: QueuedRequest | null = null
	private activeUtterance: SpeechSynthesisUtterance | null = null
	private listeners = new Set<() => void>()
	private microphoneOwner: 'voice' | 'clap' | null = null
	private hydrated = false
	private activeTimeout: ReturnType<typeof setTimeout> | null = null
	private dedupeHistory = new Map<string, number>()
	private snapshot: KitchenAudioSnapshot = {
		preferences: DEFAULT_KITCHEN_AUDIO_PREFERENCES,
		guidanceChoiceMade: false,
		isSpeaking: false,
		activeChannel: null,
		microphoneOwner: null,
	}

	hydrate(): void {
		if (this.hydrated) return
		const persisted = readPersistedState()
		this.preferences = persisted.preferences
		this.guidanceChoiceMade = persisted.guidanceChoiceMade
		this.hydrated = true
		this.refreshSnapshot()
	}

	getSnapshot = (): KitchenAudioSnapshot => {
		this.hydrate()
		return this.snapshot
	}

	subscribe = (listener: () => void): (() => void) => {
		this.listeners.add(listener)
		return () => this.listeners.delete(listener)
	}

	setPreferences(update: Partial<KitchenAudioPreferences>): void {
		this.hydrate()
		this.preferences = { ...this.preferences, ...update }
		this.persist()
		this.emit()

		if (
			update.spokenGuidanceEnabled === false &&
			this.active?.request.channel !== 'timer-critical'
		) {
			this.cancelActive()
		}
	}

	chooseSpokenGuidance(enabled: boolean): void {
		this.guidanceChoiceMade = true
		this.setPreferences({ spokenGuidanceEnabled: enabled })
	}

	dismissGuidanceChoice(): void {
		this.chooseSpokenGuidance(false)
	}

	speak(
		request: Omit<KitchenAudioRequest, 'priority'> & { priority?: number },
	): Promise<void> {
		this.hydrate()
		const normalized: KitchenAudioRequest = {
			...request,
			priority: request.priority ?? CHANNEL_PRIORITIES[request.channel],
		}

		if (!this.shouldSpeak(normalized.channel) || !normalized.text.trim()) {
			return Promise.resolve()
		}

		if (
			this.active?.request.dedupeKey === normalized.dedupeKey ||
			this.queue.some(item => item.request.dedupeKey === normalized.dedupeKey)
		) {
			return Promise.resolve()
		}

		const now = Date.now()
		const lastSpoken = this.dedupeHistory.get(normalized.dedupeKey)
		if (lastSpoken && now - lastSpoken < DEDUPE_WINDOW_MS) {
			return Promise.resolve()
		}

		for (const [key, spokenAt] of this.dedupeHistory) {
			if (now - spokenAt >= DEDUPE_WINDOW_MS) {
				this.dedupeHistory.delete(key)
			}
		}
		this.dedupeHistory.delete(normalized.dedupeKey)
		this.dedupeHistory.set(normalized.dedupeKey, now)
		while (this.dedupeHistory.size > MAX_DEDUPE_HISTORY) {
			const oldestKey = this.dedupeHistory.keys().next().value
			if (typeof oldestKey !== 'string') break
			this.dedupeHistory.delete(oldestKey)
		}

		return new Promise((resolve, reject) => {
			const item = { request: normalized, resolve, reject }
			if (!this.active) {
				this.active = item
				this.startActive()
				return
			}

			const shouldInterrupt =
				normalized.interruption === 'interrupt' ||
				(normalized.interruption === 'replace-lower-priority' &&
					normalized.priority > this.active.request.priority)

			if (shouldInterrupt) {
				this.cancelActive()
				this.active = item
				this.startActive()
				return
			}

			this.queue.push(item)
			this.queue.sort((a, b) => b.request.priority - a.request.priority)
		})
	}

	stopSpokenGuidance(): void {
		this.setPreferences({ spokenGuidanceEnabled: false })
		this.queue = this.queue.filter(item => {
			if (
				item.request.channel === 'step-guidance' ||
				item.request.channel === 'user-request'
			) {
				item.resolve()
				return false
			}
			return true
		})
	}

	cancelAll(): void {
		this.cancelActive()
		for (const item of this.queue) item.resolve()
		this.queue = []
	}

	acquireMicrophone(owner: 'voice' | 'clap'): boolean {
		if (this.microphoneOwner && this.microphoneOwner !== owner) return false
		this.microphoneOwner = owner
		this.emit()
		return true
	}

	releaseMicrophone(owner: 'voice' | 'clap'): void {
		if (this.microphoneOwner !== owner) return
		this.microphoneOwner = null
		this.emit()
	}

	private shouldSpeak(channel: KitchenAudioChannel): boolean {
		switch (channel) {
			case 'timer-critical':
			case 'timer-milestone':
				return this.preferences.timerVoiceEnabled
			case 'step-guidance':
			case 'user-request':
				return this.preferences.spokenGuidanceEnabled
		}
	}

	private startActive(): void {
		if (!this.active) return
		if (
			typeof window === 'undefined' ||
			!('speechSynthesis' in window) ||
			typeof SpeechSynthesisUtterance === 'undefined'
		) {
			this.finishActive(new Error('SpeechSynthesis not supported'))
			return
		}

		const request = this.active.request
		const utterance = new SpeechSynthesisUtterance(request.text)
		utterance.rate = request.rate ?? 1
		utterance.pitch = request.pitch ?? 1
		utterance.volume = request.volume ?? 1
		utterance.lang = request.language ?? 'en-US'
		this.activeUtterance = utterance

		utterance.onend = () => this.finishActive(undefined, utterance)
		utterance.onerror = event => {
			if (event.error === 'canceled' || event.error === 'interrupted') {
				this.finishActive(undefined, utterance)
				return
			}
			this.finishActive(new Error(`TTS error: ${event.error}`), utterance)
		}

		this.activeTimeout = setTimeout(() => {
			window.speechSynthesis.cancel()
			this.finishActive(undefined, utterance)
		}, 30000)

		this.emit()
		window.speechSynthesis.speak(utterance)
	}

	private cancelActive(): void {
		if (!this.active) return
		const active = this.active
		this.clearActiveTimeout()
		this.active = null
		this.activeUtterance = null
		if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
			window.speechSynthesis.cancel()
		}
		active.resolve()
		this.emit()
	}

	private finishActive(
		error?: Error,
		utterance?: SpeechSynthesisUtterance,
	): void {
		if (!this.active) return
		if (utterance && this.activeUtterance !== utterance) return
		const active = this.active
		this.clearActiveTimeout()
		this.active = null
		this.activeUtterance = null
		if (error) active.reject(error)
		else active.resolve()
		this.emit()
		this.startNext()
	}

	private startNext(): void {
		const next = this.queue.shift()
		if (!next) return
		if (!this.shouldSpeak(next.request.channel)) {
			next.resolve()
			this.startNext()
			return
		}
		this.active = next
		this.startActive()
	}

	private clearActiveTimeout(): void {
		if (!this.activeTimeout) return
		clearTimeout(this.activeTimeout)
		this.activeTimeout = null
	}

	private persist(): void {
		if (!canUseStorage()) return
		try {
			window.localStorage.setItem(
				PREFERENCES_KEY,
				JSON.stringify({
					preferences: this.preferences,
					guidanceChoiceMade: this.guidanceChoiceMade,
				}),
			)
			window.localStorage.setItem(
				LEGACY_AUDIO_KEY,
				String(this.preferences.soundEffectsEnabled),
			)
		} catch {
			// Storage is optional; the in-memory preference still applies.
		}
	}

	private emit(): void {
		this.refreshSnapshot()
		for (const listener of this.listeners) listener()
	}

	private refreshSnapshot(): void {
		this.snapshot = {
			preferences: this.preferences,
			guidanceChoiceMade: this.guidanceChoiceMade,
			isSpeaking: this.active !== null,
			activeChannel: this.active?.request.channel ?? null,
			microphoneOwner: this.microphoneOwner,
		}
	}
}

let coordinator: KitchenAudioCoordinator | null = null

export function getKitchenAudioCoordinator(): KitchenAudioCoordinator {
	if (!coordinator) coordinator = new KitchenAudioCoordinator()
	return coordinator
}

export function resetKitchenAudioCoordinatorForTests(): void {
	coordinator?.cancelAll()
	coordinator = null
}
