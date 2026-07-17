import { useCallback } from 'react'
import { useAuth } from './useAuth'
import { useUiStore } from '@/store/uiStore'
import type { AuthAction } from '@/components/auth/AuthRequiredModal'

const MODAL_ACTIONS = new Set<AuthAction>([
	'like',
	'save',
	'comment',
	'follow',
	'cook',
	'default',
])

const resolveModalAction = (modalAction?: AuthAction): AuthAction =>
	modalAction && MODAL_ACTIONS.has(modalAction) ? modalAction : 'default'

/**
 * Modal-first guard for user actions that require authentication.
 *
 * Route access belongs to AuthProvider/layout protection. This hook only gates
 * click-level actions such as like, save, comment, follow, and cook.
 */
export function useAuthActionGuard() {
	const { isAuthenticated } = useAuth()
	const openAuthGate = useUiStore(s => s.openAuthGate)

	const requireAuth = useCallback(
		(_action?: string, modalAction?: AuthAction): boolean => {
			if (isAuthenticated) return true
			openAuthGate(resolveModalAction(modalAction))
			return false
		},
		[isAuthenticated, openAuthGate],
	)

	const guardAction = useCallback(
		(actionType: AuthAction, callback: () => void) => {
			return () => {
				if (isAuthenticated) {
					callback()
					return
				}
				openAuthGate(resolveModalAction(actionType))
			}
		},
		[isAuthenticated, openAuthGate],
	)

	return { requireAuth, guardAction, isAuthenticated }
}
