import {
	completeAuthHydration,
	createSafeAuthStorage,
	useAuthStore,
} from '@/store/authStore'
import { useStepPhotoStore } from '@/lib/step-photo-store'
import type { User } from '@/lib/types'

const originalCreateObjectURL = Object.getOwnPropertyDescriptor(
	URL,
	'createObjectURL',
)
const originalRevokeObjectURL = Object.getOwnPropertyDescriptor(
	URL,
	'revokeObjectURL',
)

beforeAll(() => {
	Object.defineProperty(URL, 'createObjectURL', {
		configurable: true,
		value: jest.fn((file: File) => `blob:${file.name}`),
	})
	Object.defineProperty(URL, 'revokeObjectURL', {
		configurable: true,
		value: jest.fn(),
	})
})

describe('authStore hydration resilience', () => {
	afterEach(() => {
		useStepPhotoStore.getState().clearAllPhotos()
		useAuthStore.setState({
			user: null,
			accessToken: null,
			isAuthenticated: false,
			isLoggingOut: false,
		})
		window.localStorage.clear()
		jest.useRealTimers()
	})

	afterAll(() => {
		if (originalCreateObjectURL) {
			Object.defineProperty(URL, 'createObjectURL', originalCreateObjectURL)
		} else {
			Reflect.deleteProperty(URL, 'createObjectURL')
		}
		if (originalRevokeObjectURL) {
			Object.defineProperty(URL, 'revokeObjectURL', originalRevokeObjectURL)
		} else {
			Reflect.deleteProperty(URL, 'revokeObjectURL')
		}
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

	it('clears session photos synchronously when account identity changes or logs out', () => {
		const photos = useStepPhotoStore.getState()
		useAuthStore.setState({ user: { userId: 'owner-1' } as User })
		photos.setSession('session-1', 'owner-1')
		expect(
			photos.addPhoto(
				'session-1',
				'owner-1',
				1,
				new File(['private'], 'private.jpg', { type: 'image/jpeg' }),
			),
		).toBe(true)

		useAuthStore.getState().setUser({ userId: 'owner-2' } as User)
		expect(useStepPhotoStore.getState().photos).toEqual([])

		const nextPhotos = useStepPhotoStore.getState()
		nextPhotos.setSession('session-2', 'owner-2')
		expect(
			nextPhotos.addPhoto(
				'session-2',
				'owner-2',
				1,
				new File(['private'], 'next.jpg', { type: 'image/jpeg' }),
			),
		).toBe(true)
		useAuthStore.getState().logout()
		expect(useStepPhotoStore.getState()).toMatchObject({
			sessionId: null,
			ownerId: null,
			photos: [],
		})
	})

	it('marks logout before clearing the token so in-flight requests can be ignored', () => {
		useAuthStore.setState({
			isAuthenticated: true,
			user: { userId: 'owner-1' } as User,
			accessToken: 'active-token',
		})

		useAuthStore.getState().beginLogout()

		expect(useAuthStore.getState()).toMatchObject({
			isAuthenticated: true,
			isLoggingOut: true,
			accessToken: 'active-token',
		})

		useAuthStore.getState().logout()
		expect(useAuthStore.getState()).toMatchObject({
			isAuthenticated: false,
			isLoggingOut: false,
			accessToken: null,
		})
	})
})
