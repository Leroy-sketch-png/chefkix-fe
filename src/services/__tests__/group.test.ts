import { exploreGroups, getPendingRequests, joinGroup } from '@/services/group'
import { api } from '@/lib/axios'
import { API_ENDPOINTS } from '@/constants/api'

jest.mock('@/lib/axios', () => ({
	api: {
		get: jest.fn(),
		post: jest.fn(),
	},
}))

const mockedApi = api as unknown as {
	get: jest.Mock
	post: jest.Mock
}

describe('group service contracts', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('preserves the backend membershipStatus join authority', async () => {
		mockedApi.post.mockResolvedValue({
			data: {
				success: true,
				data: {
					groupId: 'group-1',
					membershipStatus: 'PENDING',
					message: 'Waiting for approval',
				},
			},
		})

		await expect(joinGroup('group-1')).resolves.toEqual({
			groupId: 'group-1',
			membershipStatus: 'PENDING',
			message: 'Waiting for approval',
		})
		expect(mockedApi.post).toHaveBeenCalledWith(
			API_ENDPOINTS.GROUPS.JOIN('group-1'),
		)
	})

	it('maps discovery controls to backend query names and sort values', async () => {
		mockedApi.get.mockResolvedValue({
			data: {
				success: true,
				data: [],
				pagination: {
					page: 2,
					size: 12,
					totalElements: 0,
					totalPages: 0,
					first: false,
					last: true,
				},
			},
		})

		await exploreGroups(
			{
				searchTerm: 'noodles',
				privacyType: 'PRIVATE',
				sortBy: 'MEMBERS',
			},
			2,
			12,
		)

		const requestUrl = mockedApi.get.mock.calls[0][0] as string
		const query = new URL(requestUrl, 'http://chefkix.local').searchParams
		expect(query.get('keyword')).toBe('noodles')
		expect(query.get('privacy')).toBe('PRIVATE')
		expect(query.get('sortBy')).toBe('popular')
		expect(query.get('page')).toBe('2')
		expect(query.get('size')).toBe('12')
		expect(query.has('searchTerm')).toBe(false)
		expect(query.has('privacyType')).toBe(false)
	})

	it('preserves envelope pagination for list-shaped group responses', async () => {
		mockedApi.get.mockResolvedValue({
			data: {
				success: true,
				data: [
					{
						id: 'group-1',
						name: 'Weeknight Cooks',
					},
				],
				pagination: {
					page: 0,
					size: 12,
					totalElements: 25,
					totalPages: 3,
					first: true,
					last: false,
				},
			},
		})

		const result = await exploreGroups({}, 0, 12)

		expect(result).toEqual(
			expect.objectContaining({
				totalElements: 25,
				totalPages: 3,
				currentPage: 0,
				pageSize: 12,
				hasNext: true,
				hasPrevious: false,
			}),
		)
	})

	it('maps latest sorting to the backend newest contract', async () => {
		mockedApi.get.mockResolvedValue({
			data: { success: true, data: [] },
		})

		await exploreGroups({ sortBy: 'LATEST' })

		expect(mockedApi.get.mock.calls[0][0]).toContain('sortBy=newest')
	})

	it('preserves envelope pagination for pending membership requests', async () => {
		mockedApi.get.mockResolvedValue({
			data: {
				success: true,
				data: [
					{
						userId: 'user-1',
						displayName: 'Minh',
						avatarUrl: null,
						requestedAt: '2026-07-31T08:00:00Z',
					},
				],
				pagination: {
					page: 1,
					size: 20,
					totalElements: 24,
					totalPages: 2,
					first: false,
					last: true,
				},
			},
		})

		const result = await getPendingRequests('group-1', 1, 20)

		expect(result).toEqual(
			expect.objectContaining({
				totalElements: 24,
				totalPages: 2,
				currentPage: 1,
				pageSize: 20,
				hasNext: false,
				hasPrevious: true,
			}),
		)
	})
})
