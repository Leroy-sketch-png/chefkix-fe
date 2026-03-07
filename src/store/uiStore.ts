import { create } from 'zustand'
import { useCookingStore } from './cookingStore'

// Cooking UI modes:
// - 'hidden': No active cooking session displayed
// - 'mini': Minimal bar (mobile/collapsed)
// - 'docked': Side panel (desktop, replaces RightSidebar)
// - 'expanded': Full modal view (for detailed step view or mobile)
type CookingMode = 'hidden' | 'mini' | 'docked' | 'expanded'

interface UiState {
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
			cookingMode: state.isCookingPlayerOpen ? 'hidden' : 'expanded',
		})),

	// New cooking mode system
	cookingMode: 'hidden',
	setCookingMode: (mode: CookingMode) =>
		set({
			cookingMode: mode,
			isCookingPlayerOpen: mode === 'expanded',
		}),
	openCookingPanel: () =>
		set({
			cookingMode: 'docked',
			isCookingPlayerOpen: false, // Docked, not fullscreen
		}),
	closeCookingPanel: () => {
		// Auto-exit preview mode to prevent ghost sessions
		const cookingState = useCookingStore.getState()
		if (cookingState.isPreviewMode) {
			cookingState.exitPreview()
		}
		set({
			cookingMode: 'hidden',
			isCookingPlayerOpen: false,
		})
	},
	minimizeCookingPanel: () => {
		// Preview sessions can't be minimized — exit preview instead
		const cookingState = useCookingStore.getState()
		if (cookingState.isPreviewMode) {
			cookingState.exitPreview()
			set({ cookingMode: 'hidden', isCookingPlayerOpen: false })
			return
		}
		set({
			cookingMode: 'mini',
			isCookingPlayerOpen: false,
		})
	},
	expandCookingPanel: () =>
		set({
			cookingMode: 'expanded',
			isCookingPlayerOpen: true,
		}),
}))
