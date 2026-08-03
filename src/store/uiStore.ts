import { create } from 'zustand'
import { useCookingStore } from './cookingStore'
import type { AuthAction } from '@/components/auth/AuthRequiredModal'

// Cooking UI modes:
// - 'hidden': No active cooking session displayed
// - 'mini': Minimal bar (mobile/collapsed)
// - 'docked': Side panel (desktop, replaces RightSidebar)
// - 'expanded': Full modal view (for detailed step view or mobile)
export type CookingMode = 'hidden' | 'mini' | 'docked' | 'expanded'

interface CookingVisibilityContext {
	isPreviewMode: boolean
	session: { status?: string } | null
	recipe: unknown | null
}

export function resolveCookingCloseMode({
	isPreviewMode,
	session,
	recipe,
}: CookingVisibilityContext): CookingMode {
	if (isPreviewMode || !session || !recipe || !session.status) return 'hidden'
	return session.status === 'in_progress' || session.status === 'paused'
		? 'mini'
		: 'hidden'
}

function resolveCurrentCookingCloseMode(): CookingMode {
	const cookingState = useCookingStore.getState()
	const mode = resolveCookingCloseMode(cookingState)
	if (cookingState.isPreviewMode) cookingState.exitPreview()
	return mode
}

interface UiState {
	// Auth gate modal (global singleton)
	authGateOpen: boolean
	authGateAction: AuthAction
	openAuthGate: (action: AuthAction) => void
	closeAuthGate: () => void

	isMessagesDrawerOpen: boolean
	toggleMessagesDrawer: () => void
	isNotificationsPopupOpen: boolean
	toggleNotificationsPopup: () => void

	// Legacy: kept for backward compatibility during migration
	isCookingPlayerOpen: boolean
	toggleCookingPlayer: () => void

	// New: Cooking mode for docked panel UX
	cookingMode: CookingMode
	setCookingMode: (mode: CookingMode) => void
	openCookingPanel: () => void
	closeCookingPanel: () => void
	minimizeCookingPanel: () => void
	expandCookingPanel: () => void
}

export const useUiStore = create<UiState>(set => ({
	// Auth gate modal
	authGateOpen: false,
	authGateAction: 'default' as AuthAction,
	openAuthGate: (action: AuthAction) =>
		set({ authGateOpen: true, authGateAction: action }),
	closeAuthGate: () => set({ authGateOpen: false }),

	isMessagesDrawerOpen: false,
	toggleMessagesDrawer: () =>
		set(state => ({ isMessagesDrawerOpen: !state.isMessagesDrawerOpen })),
	isNotificationsPopupOpen: false,
	toggleNotificationsPopup: () =>
		set(state => ({
			isNotificationsPopupOpen: !state.isNotificationsPopupOpen,
		})),

	// Legacy toggle - still works, maps to expanded mode
	isCookingPlayerOpen: false,
	toggleCookingPlayer: () =>
		set(state => ({
			isCookingPlayerOpen: !state.isCookingPlayerOpen,
			cookingMode: state.isCookingPlayerOpen
				? resolveCurrentCookingCloseMode()
				: 'expanded',
		})),

	// New cooking mode system
	cookingMode: 'hidden',
	setCookingMode: (mode: CookingMode) =>
		set({
			cookingMode: mode === 'hidden' ? resolveCurrentCookingCloseMode() : mode,
			isCookingPlayerOpen: mode === 'expanded',
		}),
	openCookingPanel: () =>
		set({
			cookingMode: 'docked',
			isCookingPlayerOpen: false, // Docked, not fullscreen
		}),
	closeCookingPanel: () => {
		const cookingMode = resolveCurrentCookingCloseMode()
		set({
			cookingMode,
			isCookingPlayerOpen: false,
		})
	},
	minimizeCookingPanel: () => {
		const cookingMode = resolveCurrentCookingCloseMode()
		set({
			cookingMode,
			isCookingPlayerOpen: false,
		})
	},
	expandCookingPanel: () =>
		set({
			cookingMode: 'expanded',
			isCookingPlayerOpen: true,
		}),
}))
