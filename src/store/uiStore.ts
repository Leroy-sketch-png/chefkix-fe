import { create } from 'zustand'

interface UiState {
	isMessagesDrawerOpen: boolean
	toggleMessagesDrawer: () => void
	isNotificationsPopupOpen: boolean
	toggleNotificationsPopup: () => void
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
}))
