import { User } from '@/lib/types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/axios'

interface AuthState {
	isAuthenticated: boolean
	user: User | null
	accessToken: string | null
	isLoading: boolean
	login: (accessToken: string, user?: User) => void
	setUser: (user: User) => void
	logout: () => void
	setLoading: (isLoading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
	persist(
		set => ({
			isAuthenticated: false,
			user: null,
			accessToken: null,
			isLoading: true,
			login: (accessToken: string, user?: User) => {
				// Critical: reject login without a valid access token
				if (!accessToken || accessToken.trim() === '') {
					console.error(
						'[authStore] Login rejected: missing or empty accessToken',
					)
					set({
						isAuthenticated: false,
						user: null,
						accessToken: null,
					})
					return
				}

				// If user is provided, validate it has userId
				if (user && !user.userId) {
					console.error(
						'[authStore] Login rejected: user missing userId field',
						{ user },
					)
					set({
						isAuthenticated: false,
						user: null,
						accessToken: null,
					})
					return
				}

				// Set auth header for all subsequent requests
				api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

				// Note: We don't set isLoading here - the caller is responsible for
				// managing loading state. This prevents race conditions where the
				// AuthProvider redirects before profile data is loaded.
				set({
					isAuthenticated: true,
					user: user || null,
					accessToken,
				})
			},
			setUser: (user: User) => {
				set({ user })
			},
			logout: () => {
				// Clear auth header
				delete api.defaults.headers.common['Authorization']
				set({
					isAuthenticated: false,
					user: null,
					accessToken: null,
					isLoading: false,
				})
			},
			setLoading: (isLoading: boolean) => set({ isLoading }),
		}),
		{
			name: 'auth-storage', // The key to use for storing the data in localStorage
			onRehydrateStorage: () => {
				return state => {
					if (state && state.accessToken) {
						api.defaults.headers.common['Authorization'] =
							`Bearer ${state.accessToken}`
					}
					if (state) {
						state.setLoading(false)
					}
				}
			},
		},
	),
)
