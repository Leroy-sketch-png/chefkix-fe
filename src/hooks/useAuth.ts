import { useAuthStore } from '@/store/authStore'

export const useAuth = () => {
	const isAuthenticated = useAuthStore(state => state.isAuthenticated)
	const user = useAuthStore(state => state.user)
	const accessToken = useAuthStore(state => state.accessToken)
	const isLoading = useAuthStore(state => state.isLoading)
	const isHydrated = useAuthStore(state => state.isHydrated)
	const login = useAuthStore(state => state.login)
	const setUser = useAuthStore(state => state.setUser)
	const logout = useAuthStore(state => state.logout)
	const setLoading = useAuthStore(state => state.setLoading)

	return {
		isAuthenticated,
		user,
		accessToken,
		token: accessToken, // Alias for backwards compatibility
		isLoading,
		isHydrated,
		login,
		setUser,
		logout,
		setLoading,
	}
}
