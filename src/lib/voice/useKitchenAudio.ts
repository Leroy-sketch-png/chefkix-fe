'use client'

import { useSyncExternalStore } from 'react'
import {
	getKitchenAudioCoordinator,
	type KitchenAudioPreferences,
} from './KitchenAudioCoordinator'

const serverSnapshot = {
	preferences: {
		spokenGuidanceEnabled: false,
		timerVoiceEnabled: true,
		timerChimesEnabled: true,
		soundEffectsEnabled: true,
	},
	guidanceChoiceMade: false,
	isSpeaking: false,
	activeChannel: null,
	microphoneOwner: null,
} as const

export function useKitchenAudio() {
	const coordinator = getKitchenAudioCoordinator()
	const snapshot = useSyncExternalStore(
		coordinator.subscribe,
		coordinator.getSnapshot,
		() => serverSnapshot,
	)

	return {
		...snapshot,
		setPreferences: (update: Partial<KitchenAudioPreferences>) =>
			coordinator.setPreferences(update),
		chooseSpokenGuidance: (enabled: boolean) =>
			coordinator.chooseSpokenGuidance(enabled),
		dismissGuidanceChoice: () => coordinator.dismissGuidanceChoice(),
		stopSpokenGuidance: () => coordinator.stopSpokenGuidance(),
	}
}
