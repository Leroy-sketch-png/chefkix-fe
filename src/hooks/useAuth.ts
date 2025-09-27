import { useAuthStore } from '@/store/authStore'

export const useAuth = () => {
	const isAuthenticated = useAuthStore(state => state.isAuthenticated)
	const user = useAuthStore(state => state.user)
	const token = useAuthStore(state => state.token)
	const isLoading = useAuthStore(state => state.isLoading)
	const login = useAuthStore(state => state.login)
	const logout = useAuthStore(state => state.logout)
	const setLoading = useAuthStore(state => state.setLoading)

	return {
		isAuthenticated,
		user,
		token,
		isLoading,
		login,
		logout,
		setLoading,
	}
}
