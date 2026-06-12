import {
	getKitchenAudioCoordinator,
	resetKitchenAudioCoordinatorForTests,
} from '../KitchenAudioCoordinator'

class MockUtterance {
	text: string
	rate = 1
	pitch = 1
	volume = 1
	lang = ''
	onend: (() => void) | null = null
	onerror: ((event: { error: string }) => void) | null = null

	constructor(text: string) {
		this.text = text
	}
}

describe('KitchenAudioCoordinator', () => {
	const spoken: MockUtterance[] = []
	const speak = jest.fn((utterance: MockUtterance) => {
		spoken.push(utterance)
	})
	const cancel = jest.fn()

	beforeEach(() => {
		jest.useFakeTimers()
		localStorage.clear()
		spoken.length = 0
		speak.mockClear()
		cancel.mockClear()
		resetKitchenAudioCoordinatorForTests()
		Object.defineProperty(global, 'SpeechSynthesisUtterance', {
			configurable: true,
			value: MockUtterance,
		})
		Object.defineProperty(window, 'speechSynthesis', {
			configurable: true,
			value: { speak, cancel },
		})
	})

	afterEach(() => {
		resetKitchenAudioCoordinatorForTests()
		jest.useRealTimers()
	})

	it('defaults spoken guidance to quiet while preserving timer alerts', async () => {
		const coordinator = getKitchenAudioCoordinator()
		const step = coordinator.speak({
			channel: 'step-guidance',
			dedupeKey: 'step-1',
			text: 'Step one',
			interruption: 'queue',
		})

		await expect(step).resolves.toBeUndefined()
		expect(speak).not.toHaveBeenCalled()
		expect(coordinator.getSnapshot().preferences.timerVoiceEnabled).toBe(true)
		expect(coordinator.getSnapshot().preferences.timerChimesEnabled).toBe(true)
	})

	it('deduplicates an utterance already active', () => {
		const coordinator = getKitchenAudioCoordinator()
		coordinator.chooseSpokenGuidance(true)

		void coordinator.speak({
			channel: 'step-guidance',
			dedupeKey: 'step-1',
			text: 'Step one',
			interruption: 'replace-lower-priority',
		})
		void coordinator.speak({
			channel: 'step-guidance',
			dedupeKey: 'step-1',
			text: 'Step one',
			interruption: 'replace-lower-priority',
		})

		expect(speak).toHaveBeenCalledTimes(1)
		expect(cancel).not.toHaveBeenCalled()
	})

	it('suppresses a recently completed duplicate without cancelling speech', async () => {
		const coordinator = getKitchenAudioCoordinator()
		coordinator.chooseSpokenGuidance(true)

		const first = coordinator.speak({
			channel: 'step-guidance',
			dedupeKey: 'step-repeat',
			text: 'Stir the sauce',
			interruption: 'replace-lower-priority',
		})
		spoken[0].onend?.()
		await first

		await coordinator.speak({
			channel: 'step-guidance',
			dedupeKey: 'step-repeat',
			text: 'Stir the sauce',
			interruption: 'replace-lower-priority',
		})

		expect(speak).toHaveBeenCalledTimes(1)
		expect(cancel).not.toHaveBeenCalled()

		jest.advanceTimersByTime(5000)
		void coordinator.speak({
			channel: 'step-guidance',
			dedupeKey: 'step-repeat',
			text: 'Stir the sauce',
			interruption: 'replace-lower-priority',
		})

		expect(speak).toHaveBeenCalledTimes(2)
	})

	it('drains 100 queued utterances without repeatedly cancelling speech', async () => {
		const coordinator = getKitchenAudioCoordinator()
		coordinator.chooseSpokenGuidance(true)

		const requests = Array.from({ length: 100 }, (_, index) =>
			coordinator.speak({
				channel: 'step-guidance',
				dedupeKey: `step-${index}`,
				text: `Step ${index}`,
				interruption: 'queue',
			}),
		)

		for (let index = 0; index < 100; index += 1) {
			expect(spoken[index]).toBeDefined()
			spoken[index].onend?.()
		}

		await expect(Promise.all(requests)).resolves.toHaveLength(100)
		expect(speak).toHaveBeenCalledTimes(100)
		expect(cancel).not.toHaveBeenCalled()
	})

	it('lets a critical timer replace lower-priority guidance once', async () => {
		const coordinator = getKitchenAudioCoordinator()
		coordinator.chooseSpokenGuidance(true)

		const guidance = coordinator.speak({
			channel: 'step-guidance',
			dedupeKey: 'step-2',
			text: 'Fold the batter',
			interruption: 'replace-lower-priority',
		})
		const original = spoken[0]
		const timer = coordinator.speak({
			channel: 'timer-critical',
			dedupeKey: 'timer-2-done',
			text: 'Rice is ready',
			interruption: 'interrupt',
		})

		expect(cancel).toHaveBeenCalledTimes(1)
		expect(spoken).toHaveLength(2)

		original.onerror?.({ error: 'canceled' })
		expect(coordinator.getSnapshot().activeChannel).toBe('timer-critical')

		spoken[1].onend?.()
		await expect(guidance).resolves.toBeUndefined()
		await expect(timer).resolves.toBeUndefined()
	})

	it('mutes guidance without muting timer chimes', () => {
		const coordinator = getKitchenAudioCoordinator()
		coordinator.chooseSpokenGuidance(true)
		coordinator.stopSpokenGuidance()

		const preferences = coordinator.getSnapshot().preferences
		expect(preferences.spokenGuidanceEnabled).toBe(false)
		expect(preferences.timerVoiceEnabled).toBe(true)
		expect(preferences.timerChimesEnabled).toBe(true)
	})
})
