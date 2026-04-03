import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from './useAuth'

/**
 * Returns a gate function that checks auth before performing an action.
 * If the user is not authenticated, shows a sign-up prompt toast and returns false.
 *
 * Usage:
 *   const requireAuth = useAuthGate()
 *   const handleLike = () => {
 *     if (!requireAuth('like this recipe')) return
 *     // ... proceed with like
 *   }
 */
export function useAuthGate() {
	const { isAuthenticated } = useAuth()
	const router = useRouter()

	return useCallback(
		(action?: string): boolean => {
			if (isAuthenticated) return true

			const message = action
				? `Sign up to ${action}`
				: 'Sign up to continue'

			toast(message, {
				action: {
					label: 'Sign Up',
					onClick: () => router.push('/auth/sign-up'),
				},
				duration: 5000,
			})

			return false
		},
		[isAuthenticated, router],
	)
}
