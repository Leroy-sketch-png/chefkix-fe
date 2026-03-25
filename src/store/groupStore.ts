import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Group, GroupMember } from '@/lib/types/group'

interface GroupStore {
	// State
	myGroups: Group[]
	currentGroup: Group | null
	groupMembers: GroupMember[]
	isLoadingGroups: boolean
	isLoadingGroupDetail: boolean

	// Actions
	setMyGroups: (groups: Group[]) => void
	setCurrentGroup: (group: Group | null) => void
	setGroupMembers: (members: GroupMember[]) => void
	setIsLoadingGroups: (loading: boolean) => void
	setIsLoadingGroupDetail: (loading: boolean) => void

	// Helpers
	addGroup: (group: Group) => void
	removeGroup: (groupId: string) => void
	updateGroup: (group: Group) => void
	clearCurrentGroup: () => void
}

export const useGroupStore = create<GroupStore>()(
	persist(
		(set) => ({
			// Initial state
			myGroups: [],
			currentGroup: null,
			groupMembers: [],
			isLoadingGroups: false,
			isLoadingGroupDetail: false,

			// Setters
			setMyGroups: (groups) => set({ myGroups: groups }),
			setCurrentGroup: (group) => set({ currentGroup: group }),
			setGroupMembers: (members) => set({ groupMembers: members }),
			setIsLoadingGroups: (loading) => set({ isLoadingGroups: loading }),
			setIsLoadingGroupDetail: (loading) =>
				set({ isLoadingGroupDetail: loading }),

			// Helpers
			addGroup: (group) =>
				set((state) => ({
					myGroups: [group, ...state.myGroups],
				})),

			removeGroup: (groupId) =>
				set((state) => ({
					myGroups: state.myGroups.filter((g) => g.id !== groupId),
					currentGroup:
						state.currentGroup?.id === groupId ? null : state.currentGroup,
				})),

			updateGroup: (updatedGroup) =>
				set((state) => ({
					myGroups: state.myGroups.map((g) =>
						g.id === updatedGroup.id ? updatedGroup : g
					),
					currentGroup:
						state.currentGroup?.id === updatedGroup.id
							? updatedGroup
							: state.currentGroup,
				})),

			clearCurrentGroup: () => set({ currentGroup: null, groupMembers: [] }),
		}),
		{
			name: 'group-store',
			partialize: (state) => ({
				myGroups: state.myGroups,
				// Don't persist loading states or temporary selections
			}),
		}
	)
)
