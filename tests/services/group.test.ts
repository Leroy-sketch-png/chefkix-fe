import { api } from '@/lib/axios'
import { API_ENDPOINTS } from '@/constants'
import { getMyGroups } from '@/services/group'

jest.mock('@/lib/axios')

const mockedApi = api as jest.Mocked<typeof api>

describe('getMyGroups', () => {
	beforeEach(() => jest.clearAllMocks())

	it('normalizes the backend Spring Slice contract for pagination', async () => {
		mockedApi.get.mockResolvedValue({
			data: {
				success: true,
				data: {
					content: [{ id: 'group-1', name: 'Weeknight Cooks' }],
					number: 2,
					size: 12,
					first: false,
					last: false,
				},
			},
		})

		const result = await getMyGroups(undefined, 2, 12)

		expect(mockedApi.get).toHaveBeenCalledWith(
			`${API_ENDPOINTS.GROUPS.MY_GROUPS}?page=2&size=12`,
		)
		expect(result.content).toHaveLength(1)
		expect(result.currentPage).toBe(2)
		expect(result.pageSize).toBe(12)
		expect(result.hasPrevious).toBe(true)
		expect(result.hasNext).toBe(true)
	})
})
