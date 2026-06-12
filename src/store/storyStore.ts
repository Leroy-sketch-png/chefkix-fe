import { create } from 'zustand'
import { getStoryFeed } from '@/services/story'
import { logDevError } from '@/lib/dev-log'
import type { UserStoryFeedResponse } from '@/lib/types/story'

type RawStoryFeedUser = Partial<UserStoryFeedResponse> & {
	authorId?: string
	id?: string
	username?: string
	hasUnseen?: boolean
}

interface StoryStore {
	storyUsers: UserStoryFeedResponse[]
	fetchStoryFeed: () => Promise<void>
	markStoryAsViewed: (storyId: string, userId: string) => Promise<void>
}

const formatStoryUser = (story: RawStoryFeedUser): UserStoryFeedResponse => ({
	userId: story.authorId || story.userId || story.id || '',
	displayName: story.displayName || story.username || 'User',
	avatarUrl: story.avatarUrl || '/placeholder-avatar.svg',
	hasUnseenStory: story.hasUnseenStory ?? story.hasUnseen ?? false,
	hasStories: story.hasStories ?? true,
})

export const useStoryStore = create<StoryStore>(set => ({
	storyUsers: [],

	fetchStoryFeed: async () => {
		try {
			const res = await getStoryFeed()
			if (res.data && Array.isArray(res.data)) {
				set({
					storyUsers: res.data
						.map(formatStoryUser)
						.filter(story => Boolean(story.userId)),
				})
			}
		} catch (err) {
			logDevError('Failed to load story feed:', err)
		}
	},

	markStoryAsViewed: async (_storyId: string, userId: string) => {
		try {
			set(state => ({
				storyUsers: state.storyUsers.map(user =>
					user.userId === userId
						? { ...user, hasUnseenStory: false }
						: user,
				),
			}))
		} catch (err) {
			logDevError('Failed to mark story as viewed:', err)
		}
	},
}))
