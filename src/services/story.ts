import { api } from '@/lib/axios'
import { API_ENDPOINTS } from '@/constants'
import { ApiResponse } from '@/lib/types'
import {
	Story,
	StoryHighlight,
	StoryInteraction,
	StoryResponse,
	UserStoryFeedResponse,
	StoryReplyRequest,
} from '@/lib/types/story'

export const createStory = async (payload: any) => {
	return await api.post<ApiResponse<Story>>(
		API_ENDPOINTS.STORIES.CREATE,
		payload,
	)
}

export const getStoryFeed = async (requestOptions?: { timeoutMs?: number }) => {
	return await api.get<ApiResponse<UserStoryFeedResponse[]>>(
		API_ENDPOINTS.STORIES.FEED,
		{ timeout: requestOptions?.timeoutMs },
	)
}

export const getStoriesByUserId = async (userId: string) => {
	return await api.get<ApiResponse<StoryResponse[]>>(
		`${API_ENDPOINTS.STORIES.BASE}/user/${userId}`,
	)
}

export const getStoryById = async (storyId: string) => {
	return await api.get<ApiResponse<StoryResponse>>(`/api/v1/stories/${storyId}`)
}

export const sendStoryReaction = async (
	storyId: string,
	reactionType: string,
) => {
	return await api.post<ApiResponse<string>>(
		`${API_ENDPOINTS.STORIES.BASE}/${storyId}/reactions?type=${reactionType}`,
	)
}

export const sendStoryReply = (storyId: string, text: string) => {
	return api.post(`/api/v1/stories/${storyId}/replies`, { text })
}

/** Record a Story view */
export const recordStoryView = async (storyId: string) => {
	return await api.post<ApiResponse<string>>(
		`${API_ENDPOINTS.STORIES.BASE}/${storyId}/views`,
	)
}
