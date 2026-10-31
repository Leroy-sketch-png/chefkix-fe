import { act, renderHook } from '@testing-library/react'
import { usePresence } from '@/hooks/usePresence'
import { useAuthStore } from '@/store/authStore'
import { goOffline, sendHeartbeat } from '@/services/presence'
import type { User } from '@/lib/types'

jest.mock('@/services/presence', () => ({
	goOffline: jest.fn().mockResolvedValue({ success: true }),
	sendHeartbeat: jest.fn().mockResolvedValue({ success: true }),
}))

describe('usePresence cleanup', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		act(() => {
			useAuthStore.setState({
				isAuthenticated: true,
				isLoggingOut: false,
				accessToken: 'active-token',
				user: { userId: 'owner-1' } as User,
			})
		})
	})

	afterEach(() => {
		act(() => {
			useAuthStore.setState({
				isAuthenticated: false,
				isLoggingOut: false,
				accessToken: null,
				user: null,
				isLoading: false,
			})
		})
	})

	it('does not send an offline request after logout invalidates the session', () => {
		const { unmount } = renderHook(() => usePresence())

		act(() => {
			useAuthStore.getState().beginLogout()
			useAuthStore.getState().logout()
		})
		unmount()

		expect(goOffline).not.toHaveBeenCalled()
	})

	it('sends offline when an authenticated user leaves without logging out', () => {
		const { unmount } = renderHook(() => usePresence())
		unmount()

		expect(goOffline).toHaveBeenCalledTimes(1)
	})
})
