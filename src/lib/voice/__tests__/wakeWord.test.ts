import {
	DEFAULT_WAKE_WORD,
	extractWakeWordCommand,
	normalizeVoiceText,
} from '../wakeWord'

describe('wake word parsing', () => {
	it('normalizes punctuation and spacing from speech recognition', () => {
		expect(normalizeVoiceText(' Hey,   Chef-Kix! ')).toBe('hey chef kix')
	})

	it('extracts a command after the wake word', () => {
		expect(
			extractWakeWordCommand('Hey ChefKix, what should I watch for?'),
		).toEqual({
			heardWakeWord: true,
			command: 'what should i watch for',
		})
	})

	it('supports wake-word-only arming and ignores unrelated speech', () => {
		expect(extractWakeWordCommand(DEFAULT_WAKE_WORD)).toEqual({
			heardWakeWord: true,
			command: '',
		})
		expect(extractWakeWordCommand('Please turn the heat down')).toEqual({
			heardWakeWord: false,
			command: '',
		})
		expect(extractWakeWordCommand('Hey ChefKixx next step')).toEqual({
			heardWakeWord: false,
			command: '',
		})
	})
})
