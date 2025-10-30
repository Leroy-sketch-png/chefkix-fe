import { create } from 'zustand'

interface UiState {
	isMessagesDrawerOpen: boolean
	toggleMessagesDrawer: () => void
}

export const useUiStore = create<UiState>(set => ({
	isMessagesDrawerOpen: false,
	toggleMessagesDrawer: () =>
		set(state => ({ isMessagesDrawerOpen: !state.isMessagesDrawerOpen })),
}))
