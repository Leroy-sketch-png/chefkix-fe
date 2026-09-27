import { api } from '@/lib/axios'
import { API_ENDPOINTS } from '@/constants/api'
import {
	getNotificationPage,
	getNotifications,
} from '@/services/notification'

jest.mock('@/lib/axios', () => ({
	api: {
		get: jest.fn(),
	},
}))

const mockedGet = api.get as jest.Mock

describe('notification service contracts', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('preserves page authority from the backend Slice without fabricating totals', async () => {
		mockedGet.mockResolvedValue({
			data: {
				success: true,
				statusCode: 200,
				data: {
					content: [
						{
							id: 'notification-51',
							type: 'POST_COMMENT',
							isRead: false,
							content: 'Mai commented on your post',
							createdAt: '2026-08-11T06:00:00Z',
							count: 1,
						},
					],
					number: 1,
					size: 50,
					last: false,
				},
			},
		})

		await expect(
			getNotificationPage({ page: 1, size: 50, unreadOnly: true }),
		).resolves.toEqual({
			success: true,
			statusCode: 200,
			data: {
				notifications: [expect.objectContaining({ id: 'notification-51' })],
				page: 1,
				size: 50,
				hasNext: true,
			},
		})
		expect(mockedGet).toHaveBeenCalledWith(
			API_ENDPOINTS.NOTIFICATIONS.PAGE,
			{
				params: { page: 1, size: 50, unreadOnly: true },
			},
		)
	})

	it('fails closed when a page response omits Slice authority', async () => {
		mockedGet.mockResolvedValue({
			data: {
				success: true,
				data: { content: [], number: 0, size: 50 },
			},
		})

		await expect(getNotificationPage({ size: 50 })).resolves.toEqual(
			expect.objectContaining({
				success: false,
				statusCode: 502,
			}),
		)
	})

	it('sends unreadOnly through the backward-compatible list endpoint', async () => {
		mockedGet.mockResolvedValue({
			data: { success: true, statusCode: 200, data: [] },
		})

		const result = await getNotifications({ size: 20, unreadOnly: true })

		expect(mockedGet).toHaveBeenCalledWith(
			API_ENDPOINTS.NOTIFICATIONS.GET,
			{
				params: { limit: 20, unreadOnly: true },
			},
		)
		expect(result.data).toEqual({ notifications: [] })
	})

	it('fails closed when the bounded list payload is malformed', async () => {
		mockedGet.mockResolvedValue({
			data: { success: true, statusCode: 200, data: { content: [] } },
		})

		await expect(getNotifications()).resolves.toEqual(
			expect.objectContaining({ success: false, statusCode: 502 }),
		)
	})
})
