import { useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from './useAuth'
import { useTranslations } from '@/i18n/hooks'
import { useUiStore } from '@/store/uiStore'
import type { AuthAction } from '@/components/auth/AuthRequiredModal'

const MODAL_ACTIONS = new Set<string>([
	'like',
	'save',
	'comment',
	'follow',
	'cook',
	'default',
])

/**
 * Returns a gate function that checks auth before performing an action.
 * If the user is not authenticated:
 * - For known actions (like, save, comment, follow, cook): shows a rich modal
 * - For other actions: shows a toast with sign-up link
 *
 * Also exposes `guardAction` for wrapping onClick handlers directly.
 *
 * Usage (inline guard):
 *   const { requireAuth } = useAuthGate()
 *   const handleLike = () => {
 *     if (!requireAuth('like')) return
 *     // ... proceed with like
 *   }
 *
 * Usage (onClick wrapper):
 *   const { guardAction } = useAuthGate()
 *   <button onClick={guardAction('like', handleLike)}>Like</button>
 */
export function useAuthGate() {
	const { isAuthenticated } = useAuth()
	const router = useRouter()
	const pathname = usePathname()
	const t = useTranslations('auth')
	const openAuthGate = useUiStore(s => s.openAuthGate)

	/** Guard that blocks unauthenticated users. Shows modal for known actions, toast otherwise. */
	const requireAuth = useCallback(
		(action?: string, modalAction?: AuthAction): boolean => {
			if (isAuthenticated) return true

			// Show rich modal if a modal action type is specified
			if (modalAction && MODAL_ACTIONS.has(modalAction)) {
				openAuthGate(modalAction)
				return false
			}

			// Fallback: toast for custom action strings
			const message = action ? t('signUpTo', { action }) : t('signUpToContinue')

			const returnTo = encodeURIComponent(pathname)

			toast(message, {
				action: {
					label: t('signUpAction'),
					onClick: () => router.push(`/auth/sign-up?returnTo=${returnTo}`),
				},
				duration: 5000,
			})

			return false
		},
		[isAuthenticated, router, pathname, t],
	)

	/** Modal-based guard. Returns a click handler that either calls callback or shows modal. */
	const guardAction = useCallback(
		(actionType: AuthAction, callback: () => void) => {
			return () => {
				if (isAuthenticated) {
					callback()
				} else {
					openAuthGate(actionType)
				}
			}
		},
		[isAuthenticated, openAuthGate],
	)

	return { requireAuth, guardAction, isAuthenticated }
}
