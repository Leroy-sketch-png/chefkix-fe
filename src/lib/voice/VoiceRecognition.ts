/**
 * VoiceRecognition — Web Speech API wrapper.
 *
 * Provides a clean interface to SpeechRecognition with:
 * - Browser compat detection (webkit prefix)
 * - Auto-restart in continuous mode
 * - Confidence gating
 *
 * Spec: vision_and_spec/22-voice-mode.txt §3
 */

export interface VoiceRecognitionOptions {
	language?: string
	continuous?: boolean
	onResult: (transcript: string, confidence: number) => void
	onError: (error: string) => void
	onEnd: () => void
	onListeningChange?: (isListening: boolean) => void
}

interface SpeechRecognitionAlternative {
	transcript: string
	confidence: number
}

interface SpeechRecognitionResult {
	readonly isFinal: boolean
	readonly length: number
	[index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionResultList {
	readonly length: number
	[item: number]: SpeechRecognitionResult
}

// Augment window for webkit prefix
interface SpeechRecognitionEvent extends Event {
	results: SpeechRecognitionResultList
	resultIndex: number
}

interface SpeechRecognition extends EventTarget {
	lang: string
	continuous: boolean
	interimResults: boolean
	maxAlternatives: number
	onresult: ((event: SpeechRecognitionEvent) => void) | null
	onerror: ((event: Event) => void) | null
	onend: (() => void) | null
	start(): void
	stop(): void
}

interface SpeechRecognitionWindow extends Window {
	SpeechRecognition?: SpeechRecognitionCtor
	webkitSpeechRecognition?: SpeechRecognitionCtor
}

interface SpeechRecognitionErrorEvent extends Event {
	error?: string
}

type SpeechRecognitionCtor = new () => SpeechRecognition

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
	if (typeof window === 'undefined') return null
	const w = window as SpeechRecognitionWindow
	return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export function isVoiceSupported(): boolean {
	return getSpeechRecognitionCtor() !== null
}

export class VoiceRecognition {
	private recognition: SpeechRecognition | null = null
	private opts: Required<VoiceRecognitionOptions>
	private _isListening = false
	private intentionalStop = false

	constructor(options: VoiceRecognitionOptions) {
		this.opts = {
			language: options.language ?? 'en-US',
			continuous: options.continuous ?? false,
			onResult: options.onResult,
			onError: options.onError,
			onEnd: options.onEnd,
			onListeningChange: options.onListeningChange ?? (() => {}),
		}

		const Ctor = getSpeechRecognitionCtor()
		if (!Ctor) return

		const rec = new Ctor()
		rec.lang = this.opts.language
		rec.continuous = this.opts.continuous
		rec.interimResults = false
		rec.maxAlternatives = 1

		rec.onresult = (e: SpeechRecognitionEvent) => {
			const result = e.results[e.resultIndex]
			if (!result?.isFinal) return

			const transcript = result[0].transcript
			const confidence = result[0].confidence
			this.opts.onResult(transcript, confidence)
		}

		rec.onerror = (e: Event) => {
			const errorEvent = e as SpeechRecognitionErrorEvent
			const error = errorEvent.error || 'unknown'
			// 'no-speech' is expected in push-to-talk, don't surface as error
			if (error === 'no-speech') return
			if (error === 'aborted') return
			this.opts.onError(error)
		}

		rec.onend = () => {
			this._isListening = false
			this.opts.onListeningChange(false)

			// Auto-restart in continuous mode unless intentionally stopped
			if (this.opts.continuous && !this.intentionalStop) {
				try {
					rec.start()
					this._isListening = true
					this.opts.onListeningChange(true)
				} catch {
					// Already running or other error
				}
				return
			}

			this.opts.onEnd()
		}

		this.recognition = rec
	}

	start(): void {
		if (!this.recognition) return
		this.intentionalStop = false
		try {
			this.recognition.start()
			this._isListening = true
			this.opts.onListeningChange(true)
		} catch {
			// May already be running
		}
	}

	stop(): void {
		if (!this.recognition) return
		this.intentionalStop = true
		this.recognition.stop()
		this._isListening = false
		this.opts.onListeningChange(false)
	}

	get isListening(): boolean {
		return this._isListening
	}
}
