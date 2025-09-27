import { User } from '@/lib/types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
	isAuthenticated: boolean
	user: User | null
	token: string | null
	isLoading: boolean
	login: (user: User, token: string) => void
	logout: () => void
	setLoading: (isLoading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
	persist(
		set => ({
			isAuthenticated: false,
			user: null,
			token: null,
			isLoading: true,
			login: (user: User, token: string) =>
				set({ isAuthenticated: true, user, token, isLoading: false }),
			logout: () =>
				set({
					isAuthenticated: false,
					user: null,
					token: null,
					isLoading: false,
				}),
			setLoading: (isLoading: boolean) => set({ isLoading }),
		}),
		{
			name: 'auth-storage', // The key to use for storing the data in localStorage
		},
	),
)
