import { User } from '@/lib/types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

interface AuthState {
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
					console.error(
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
					console.error('[authStore] setUser rejected: invalid user object', {
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
			// Only persist these specific fields - NOT isLoading or isHydrated
			partialize: state => ({
				isAuthenticated: state.isAuthenticated,
				user: state.user,
				accessToken: state.accessToken,
			}),
			onRehydrateStorage: () => {
				return state => {
					if (state) {
						// Validate persisted user - clear if corrupted
						if (state.user && !isValidUser(state.user)) {
							console.warn('[authStore] Clearing corrupted user from storage')
							state.user = null
						}

						// NOTE: We do NOT set axios headers here. The request interceptor
						// in axios.ts reads from this store for every request.
						// This avoids circular dependency: authStore <-> axios

						// Mark as hydrated - AuthProvider will handle loading state
						state.setHydrated(true)
						// DO NOT set isLoading here - AuthProvider controls this
					}
				}
			},
		},
	),
)
