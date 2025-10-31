import { create } from 'zustand'

interface UiState {
	isMessagesDrawerOpen: boolean
	toggleMessagesDrawer: () => void
	isNotificationsPopupOpen: boolean
	toggleNotificationsPopup: () => void
	isCookingPlayerOpen: boolean
	toggleCookingPlayer: () => void
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
	isCookingPlayerOpen: false,
	toggleCookingPlayer: () =>
		set(state => ({ isCookingPlayerOpen: !state.isCookingPlayerOpen })),
}))
