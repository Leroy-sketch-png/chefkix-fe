import { User } from '@/lib/types'
import { create } from 'zustand'

interface AuthState {
	isAuthenticated: boolean
	user: User | null
	token: string | null
	login: (user: User, token: string) => void
	logout: () => void
}

export const useAuthStore = create<AuthState>(set => ({
	isAuthenticated: false,
	user: null,
	token: null,
	login: (user: User, token: string) =>
		set({ isAuthenticated: true, user, token }),
	logout: () => set({ isAuthenticated: false, user: null, token: null }),
}))
