/**
 * TextToSpeech — SpeechSynthesis wrapper.
 *
 * Reads step instructions and timer announcements aloud.
 * Spec: vision_and_spec/22-voice-mode.txt §3
 */

export function isTTSSupported(): boolean {
	return typeof window !== 'undefined' && 'speechSynthesis' in window
}

import {
	getKitchenAudioCoordinator,
	type KitchenAudioChannel,
	type KitchenAudioInterruption,
} from './KitchenAudioCoordinator'

interface SpeakOptions {
	rate?: number
	pitch?: number
	volume?: number
	channel?: KitchenAudioChannel
	dedupeKey?: string
	interruption?: KitchenAudioInterruption
}

class TextToSpeech {
	speak(text: string, options?: SpeakOptions): Promise<void> {
		return getKitchenAudioCoordinator().speak({
			text,
			channel: options?.channel ?? 'user-request',
			dedupeKey: options?.dedupeKey ?? `legacy:${text}`,
			interruption: options?.interruption ?? 'replace-lower-priority',
			rate: options?.rate,
			pitch: options?.pitch,
			volume: options?.volume,
		})
	}

	cancel(): void {
		getKitchenAudioCoordinator().cancelAll()
	}

	get isSpeaking(): boolean {
		return getKitchenAudioCoordinator().getSnapshot().isSpeaking
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
