import { api } from '@/lib/axios'
import { API_ENDPOINTS } from '@/constants'
import { ApiResponse } from '@/lib/types'
import {
	Story,
	StoryHighlight,
	StoryInteraction,
	StoryResponse,
	UserStoryFeedResponse,
} from '@/lib/types/story'

export const createStory = async (payload: any) => {
	return await api.post<ApiResponse<Story>>(
		API_ENDPOINTS.STORIES.CREATE,
		payload,
	)
}

export const getStoryFeed = async () => {
	return await api.get<ApiResponse<UserStoryFeedResponse[]>>(
		API_ENDPOINTS.STORIES.FEED,
	)
}

export const getStoriesByUserId = async (userId: string) => {
	return await api.get<ApiResponse<StoryResponse[]>>(
		`${API_ENDPOINTS.STORIES.BASE}/user/${userId}`,
	)
}

export const reactToStory = async (storyId: string, reactionType: string) => {
	return await api.post<ApiResponse<StoryInteraction>>(
		`${API_ENDPOINTS.STORIES.INTERACTIONS}/${storyId}/react`,
		{ reactionType },
	)
}
