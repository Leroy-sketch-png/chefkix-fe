import { createFirstCookCelebrationGate } from '../first-cook-celebration'

jest.mock('@/lib/dev-log', () => ({
	logDevWarn: jest.fn(),
}))

function createStorage() {
	const values = new Map<string, string>()
	return {
		values,
		getItem: jest.fn((key: string) => values.get(key) ?? null),
		setItem: jest.fn((key: string, value: string) => {
			values.set(key, value)
		}),
	}
}

describe('first-cook celebration gate', () => {
	it('keeps celebration state isolated by account on a shared browser', () => {
		const storage = createStorage()
		const claim = createFirstCookCelebrationGate(() => storage)

		expect(claim('cook-a', 0)).toBe(true)
		expect(claim('cook-a', 0)).toBe(false)
		expect(claim('cook-b', 0)).toBe(true)
		expect(storage.values.get('chefkix:first-cook-celebrated:cook-a')).toBe('1')
		expect(storage.values.get('chefkix:first-cook-celebrated:cook-b')).toBe('1')
	})

	it('respects only the current account persistent marker', () => {
		const storage = createStorage()
		storage.values.set('chefkix:first-cook-celebrated:cook-a', '1')
		const claim = createFirstCookCelebrationGate(() => storage)

		expect(claim('cook-a', 0)).toBe(false)
		expect(claim('cook-b', 0)).toBe(true)
	})

	it('falls back to one celebration per account if storage access throws', () => {
		const claim = createFirstCookCelebrationGate(() => {
			throw new Error('Storage is blocked')
		})

		expect(claim('cook-a', 0)).toBe(true)
		expect(claim('cook-a', 0)).toBe(false)
		expect(claim('cook-b', 0)).toBe(true)
	})

	it.each(['read', 'write'] as const)(
		'falls back if persistent marker %s fails',
		failurePoint => {
			const storage = {
				getItem: jest.fn(() => {
					if (failurePoint === 'read') throw new Error('Storage read failed')
					return null
				}),
				setItem: jest.fn(() => {
					if (failurePoint === 'write') throw new Error('Storage write failed')
				}),
			}
			const claim = createFirstCookCelebrationGate(() => storage)

			expect(claim('cook-a', 0)).toBe(true)
			expect(claim('cook-a', 0)).toBe(false)
		},
	)

	it('does not claim a first-cook celebration for existing cooks', () => {
		const storage = createStorage()
		const claim = createFirstCookCelebrationGate(() => storage)

		expect(claim('cook-a', 1)).toBe(false)
		expect(storage.getItem).not.toHaveBeenCalled()
	})
})
