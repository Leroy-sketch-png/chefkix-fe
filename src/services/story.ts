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

export const sendStoryReaction = async (
	storyId: string,
	reactionType: string,
) => {
	return await api.post<ApiResponse<string>>(
		`${API_ENDPOINTS.STORIES.BASE}/${storyId}/reactions?type=${reactionType}`,
	)
}

/**
 * Gửi tin nhắn trả lời Story (Khớp với @PostMapping("/{storyId}/replies"))
 * Lưu ý: Backend dùng @RequestBody StoryReplyRequest
 */
export const sendStoryReply = async (payload: StoryReplyRequest) => {
	return await api.post<ApiResponse<string>>(
		`${API_ENDPOINTS.STORIES.BASE}/${payload.storyId}/replies`,
		payload,
	)
}

/**
 * Ghi nhận lượt xem Story (Khớp với @PostMapping("/{storyId}/views"))
 */
export const recordStoryView = async (storyId: string) => {
	return await api.post<ApiResponse<string>>(
		`${API_ENDPOINTS.STORIES.BASE}/${storyId}/views`,
	)
}
