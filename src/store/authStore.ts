import { User } from '@/lib/types'
import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { logDevError, logDevWarn } from '@/lib/dev-log'

/**
 * IMPORTANT: This store does NOT import axios to avoid circular dependency.
 * The request interceptor in axios.ts reads from this store to attach tokens.
 * This is the correct pattern: store manages state, axios manages requests.
 */

/**
 * Validates that a user object has the minimum required fields.
 * Returns true if valid, false if invalid or null/undefined.
 */
const isValidUser = (user: unknown): user is User => {
	if (!user || typeof user !== 'object') return false
	const u = user as Record<string, unknown>
	// userId is the minimum required field
	return typeof u.userId === 'string' && u.userId.length > 0
}

const isBrowser = () => typeof window !== 'undefined'

export const createSafeAuthStorage = (): StateStorage => ({
	getItem: (name: string) => {
		if (!isBrowser()) return null

		try {
			const value = window.localStorage.getItem(name)
			if (!value) return null

			// Zustand parses the returned string later. Parse once here so corrupt
			// auth JSON degrades to a guest session instead of trapping the app loader.
			JSON.parse(value)
			return value
		} catch (error) {
			logDevError('[authStore] Ignoring unreadable persisted auth state:', error)
			try {
				window.localStorage.removeItem(name)
			} catch (removeError) {
				logDevWarn(
					'[authStore] Failed to remove unreadable persisted auth state:',
					removeError,
				)
			}
			return null
		}
	},
	setItem: (name: string, value: string) => {
		if (!isBrowser()) return

		try {
			window.localStorage.setItem(name, value)
		} catch (error) {
			logDevError('[authStore] Failed to persist auth state:', error)
		}
	},
	removeItem: (name: string) => {
		if (!isBrowser()) return

		try {
			window.localStorage.removeItem(name)
		} catch (error) {
			logDevWarn('[authStore] Failed to remove persisted auth state:', error)
		}
	},
})

export interface AuthState {
	isAuthenticated: boolean
	user: User | null
	accessToken: string | null
	isLoading: boolean
	isHydrated: boolean // Track hydration state explicitly
	login: (accessToken: string) => void
	setUser: (user: User) => void
	logout: () => void
	setLoading: (isLoading: boolean) => void
	setHydrated: (isHydrated: boolean) => void
}

type HydrationTarget = Pick<AuthState, 'setHydrated' | 'setLoading'>

export const completeAuthHydration = (
	state: HydrationTarget | undefined,
	fallback?: () => HydrationTarget,
) => {
	if (state) {
		state.setHydrated(true)
		return
	}

	setTimeout(() => {
		const target = fallback ? fallback() : useAuthStore.getState()
		target.setHydrated(true)
		target.setLoading(false)
	}, 0)
}

export const useAuthStore = create<AuthState>()(
	persist(
		set => ({
			isAuthenticated: false,
			user: null,
			accessToken: null,
			isLoading: true, // Start as loading until hydration + validation complete
			isHydrated: false, // Not hydrated until persist rehydrates

			/**
			 * login() ONLY sets the access token and marks as authenticated.
			 * The user profile should be set separately via setUser().
			 * This separation prevents bugs where token refresh tries to re-validate user.
			 *
			 * NOTE: We do NOT set axios headers here. The request interceptor in
			 * axios.ts reads the token from this store for every request.
			 */
			login: (accessToken: string) => {
				// Critical: reject login without a valid access token
				if (!accessToken || accessToken.trim() === '') {
					logDevError(
						'[authStore] Login rejected: missing or empty accessToken',
					)
					return
				}

				set({
					isAuthenticated: true,
					accessToken,
				})
			},

			/**
			 * setUser() sets the user profile after validation.
			 * Should be called after login() once profile is fetched.
			 */
			setUser: (user: User) => {
				if (!isValidUser(user)) {
					logDevError('[authStore] setUser rejected: invalid user object', {
						user,
					})
					return
				}
				set({ user })
			},

			/**
			 * logout() clears all auth state.
			 * NOTE: We do NOT clear axios headers here. The request interceptor
			 * checks for accessToken on every request and won't attach if null.
			 */
			logout: () => {
				// Stop notification polling to prevent memory leaks
				// Dynamically import to avoid circular dependency
				import('./notificationStore').then(({ useNotificationStore }) => {
					useNotificationStore.getState().stopPolling()
				})
				// Clear all persisted stores to prevent cross-account data leakage
				import('./groupStore').then(({ useGroupStore }) => {
					useGroupStore.getState().clearCurrentGroup()
				})
				import('./blockedUsersStore').then(({ useBlockedUsersStore }) => {
					useBlockedUsersStore.getState().clearBlockedUsers()
				})
				import('./cookingStore').then(({ useCookingStore }) => {
					useCookingStore.getState().clearSession()
				})
				set({
					isAuthenticated: false,
					user: null,
					accessToken: null,
					isLoading: false,
				})
			},
			setLoading: (isLoading: boolean) => set({ isLoading }),
			setHydrated: (isHydrated: boolean) => set({ isHydrated }),
		}),
		{
			name: 'auth-storage', // The key to use for storing the data in localStorage
			storage: createJSONStorage(createSafeAuthStorage),
			// Only persist these specific fields - NOT isLoading or isHydrated
			partialize: state => ({
				isAuthenticated: state.isAuthenticated,
				user: state.user,
				accessToken: state.accessToken,
			}),
			onRehydrateStorage: () => {
				return (state, error) => {
					if (error) {
						logDevError('[authStore] Failed to rehydrate auth state:', error)
					}

					if (state) {
						// Validate persisted user - clear if corrupted
						if (state.user && !isValidUser(state.user)) {
							logDevWarn('[authStore] Clearing corrupted user from storage')
							state.user = null
						}

						// A persisted access token is the source of truth for session presence.
						// Repair stale flags so auth-dependent UI doesn't split between guest and user states.
						if (state.accessToken && !state.isAuthenticated) {
							logDevWarn(
								'[authStore] Repairing stale isAuthenticated flag from persisted token',
							)
							state.isAuthenticated = true
						}

						// NOTE: We do NOT set axios headers here. The request interceptor
						// in axios.ts reads from this store for every request.
						// This avoids circular dependency: authStore <-> axios
					}

					// Mark as hydrated even when Zustand reports an error and omits state.
					// AuthProvider owns normal loading completion; the fallback releases
					// the loader only for failed hydration where AuthProvider would never run.
					completeAuthHydration(state)
				}
			},
		},
	),
)
