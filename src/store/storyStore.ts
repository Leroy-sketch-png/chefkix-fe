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

	// 🌟 THÊM HÀM NÀY VÀO INTERFACE
	markStoryAsViewed: (storyId: string, userId: string) => Promise<void>
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

	// 🌟 THÊM LOGIC XỬ LÝ ĐỔI MÀU CAM -> XÁM TẠI ĐÂY
	markStoryAsViewed: async (storyId: string, userId: string) => {
		try {
			// (Tùy chọn) Nếu Backend của bạn có API lưu lịch sử xem thì gọi ở đây
			// await api.post(`/api/v1/stories/${storyId}/view`);

			// Ép React vẽ lại giao diện lập tức: Đổi hasUnseen của người này thành false
			set(state => ({
				storyUsers: state.storyUsers.map(user =>
					user.id === userId ? { ...user, hasUnseen: false } : user,
				),
			}))
		} catch (err) {
			logDevError('Lỗi khi đánh dấu đã xem:', err)
		}
	},
}))
