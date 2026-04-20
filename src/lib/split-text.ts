/**
 * Split a string into words or characters for animation purposes.
 * Returns an array of segments with their computed keys.
 */
export interface TextSegment {
	text: string
	key: string
}

/**
 * Split text into words, preserving spaces as part of the word.
 */
export function splitByWords(text: string): TextSegment[] {
	return text.split(/(\s+)/).map((word, i) => ({
		text: word,
		key: `word-${i}-${word}`,
	}))
}

/**
 * Split text into individual characters.
 * Spaces become non-breaking spaces for rendering.
 */
export function splitByCharacters(text: string): TextSegment[] {
	return text.split('').map((char, i) => ({
		text: char === ' ' ? '\u00A0' : char,
		key: `char-${i}-${char}`,
	}))
}

/**
 * Split text by mode (word or character).
 */
export function splitText(
	text: string,
	mode: 'word' | 'character' = 'word',
): TextSegment[] {
	return mode === 'character' ? splitByCharacters(text) : splitByWords(text)
}
