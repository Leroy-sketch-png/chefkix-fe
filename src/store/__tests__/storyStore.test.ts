import { getStoryFeed } from '@/services/story'
import { useStoryStore } from '@/store/storyStore'

jest.mock('@/services/story', () => ({
	getStoryFeed: jest.fn(),
}))

describe('storyStore', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		useStoryStore.setState({ storyUsers: [] })
	})

	it('hydrates Story users from the API response envelope', async () => {
		jest.mocked(getStoryFeed).mockResolvedValue({
			data: {
				success: true,
				statusCode: 200,
				data: [
					{
						userId: 'owner-1',
						displayName: 'Mai',
						avatarUrl: '/mai.webp',
						hasUnseenStory: false,
					},
				],
			},
		} as never)

		await useStoryStore.getState().fetchStoryFeed()

		expect(useStoryStore.getState().storyUsers).toEqual([
			{
				userId: 'owner-1',
				displayName: 'Mai',
				avatarUrl: '/mai.webp',
				hasUnseenStory: false,
				hasStories: true,
			},
		])
	})
})
