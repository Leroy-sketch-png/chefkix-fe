export const DEFAULT_WAKE_WORD = 'hey chefkix'

export interface WakeWordMatch {
	heardWakeWord: boolean
	command: string
}

/** Normalize speech transcripts before matching a wake word. */
export function normalizeVoiceText(value: string): string {
	return value
		.toLocaleLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, ' ')
		.replace(/\s+/g, ' ')
		.trim()
}

/** Extract a command only after the configured wake word is heard. */
export function extractWakeWordCommand(
	transcript: string,
	wakeWord = DEFAULT_WAKE_WORD,
): WakeWordMatch {
	const normalizedTranscript = normalizeVoiceText(transcript)
	const normalizedWakeWord = normalizeVoiceText(wakeWord)
	const wakeWordVariants = [
		normalizedWakeWord,
		normalizedWakeWord.replace('chefkix', 'chef kix'),
	].filter(Boolean)
	const matchedWakeWord = wakeWordVariants.find(
		variant =>
			normalizedTranscript === variant ||
			normalizedTranscript.startsWith(`${variant} `),
	)

	if (!matchedWakeWord) return { heardWakeWord: false, command: '' }

	return {
		heardWakeWord: true,
		command: normalizedTranscript.slice(matchedWakeWord.length).trim(),
	}
}
