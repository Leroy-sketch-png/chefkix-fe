/**
 * TextToSpeech — SpeechSynthesis wrapper.
 *
 * Reads step instructions and timer announcements aloud.
 * Spec: vision_and_spec/22-voice-mode.txt §3
 */

export function isTTSSupported(): boolean {
	return typeof window !== 'undefined' && 'speechSynthesis' in window
}

interface SpeakOptions {
	rate?: number
	pitch?: number
	volume?: number
}

class TextToSpeech {
	private synth: SpeechSynthesis | null = null

	constructor() {
		if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
			this.synth = window.speechSynthesis
		}
	}

	speak(text: string, options?: SpeakOptions): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.synth) {
				reject(new Error('SpeechSynthesis not supported'))
				return
			}

			// Cancel any in-progress speech
			this.synth.cancel()

			const utterance = new SpeechSynthesisUtterance(text)
			utterance.rate = options?.rate ?? 1.0
			utterance.pitch = options?.pitch ?? 1.0
			utterance.volume = options?.volume ?? 1.0
			utterance.lang = 'en-US'

			// Timeout guard: resolve if speak() is a no-op (voices not loaded, browser quirk)
			const timeout = setTimeout(() => resolve(), 15000)

			utterance.onend = () => {
				clearTimeout(timeout)
				resolve()
			}
			utterance.onerror = e => {
				clearTimeout(timeout)
				if (e.error === 'canceled') {
					resolve() // Not really an error
				} else {
					reject(new Error(`TTS error: ${e.error}`))
				}
			}

			this.synth.speak(utterance)
		})
	}

	cancel(): void {
		this.synth?.cancel()
	}

	get isSpeaking(): boolean {
		return this.synth?.speaking ?? false
	}
}

/** Singleton instance */
let instance: TextToSpeech | null = null

export function getTextToSpeech(): TextToSpeech {
	if (!instance) {
		instance = new TextToSpeech()
	}
	return instance
}
