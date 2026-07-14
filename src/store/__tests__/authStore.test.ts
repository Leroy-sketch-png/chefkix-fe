import {
	completeAuthHydration,
	createSafeAuthStorage,
} from '@/store/authStore'

describe('authStore hydration resilience', () => {
	afterEach(() => {
		window.localStorage.clear()
		jest.useRealTimers()
	})

	it('drops unreadable persisted auth state instead of throwing', () => {
		window.localStorage.setItem('auth-storage', '{not-json')

		const storage = createSafeAuthStorage()

		expect(storage.getItem('auth-storage')).toBeNull()
		expect(window.localStorage.getItem('auth-storage')).toBeNull()
	})

	it('marks a valid rehydrated state as hydrated without forcing loading off', () => {
		const target = {
			setHydrated: jest.fn(),
			setLoading: jest.fn(),
		}

		completeAuthHydration(target)

		expect(target.setHydrated).toHaveBeenCalledWith(true)
		expect(target.setLoading).not.toHaveBeenCalled()
	})

	it('releases the loader when Zustand reports hydration without state', () => {
		jest.useFakeTimers()
		const target = {
			setHydrated: jest.fn(),
			setLoading: jest.fn(),
		}

		completeAuthHydration(undefined, () => target)

		expect(target.setHydrated).not.toHaveBeenCalled()
		expect(target.setLoading).not.toHaveBeenCalled()

		jest.runOnlyPendingTimers()

		expect(target.setHydrated).toHaveBeenCalledWith(true)
		expect(target.setLoading).toHaveBeenCalledWith(false)
	})
})
