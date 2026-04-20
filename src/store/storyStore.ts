import { create } from 'zustand'
import { getStoryFeed } from '@/services/story'
import { logDevError } from '@/lib/dev-log'

interface StoryFeedUser {
	id: string
	username: string
	avatarUrl: string
	hasUnseen: boolean
	hasStories: boolean
}

interface StoryStore {
	storyUsers: StoryFeedUser[]
	fetchStoryFeed: () => Promise<void>
}

const formatStoryUser = (s: any): StoryFeedUser => ({
	id: s.authorId || s.userId || s.id,
	username: s.displayName || s.username || 'User',
	avatarUrl: s.avatarUrl,
	hasUnseen: s.hasUnseenStory ?? s.hasUnseen ?? false,
	hasStories: true,
})

export const useStoryStore = create<StoryStore>(set => ({
	storyUsers: [],
	fetchStoryFeed: async () => {
		try {
			const res = await getStoryFeed()
			if (res.data && Array.isArray(res.data)) {
				set({ storyUsers: res.data.map(formatStoryUser) })
			}
		} catch (err) {
			logDevError('Lỗi khi lấy Story feed:', err)
		}
	},
}))
