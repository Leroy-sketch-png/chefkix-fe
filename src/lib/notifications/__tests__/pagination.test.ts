import { appendUniqueById } from '@/lib/notifications/pagination'

describe('notification history pagination', () => {
	it('appends unseen notifications in server order without replacing local state', () => {
		const current = [
			{ id: 'newest', read: true },
			{ id: 'boundary', read: true },
		]
		const incoming = [
			{ id: 'boundary', read: false },
			{ id: 'older', read: false },
			{ id: 'older', read: false },
		]

		expect(appendUniqueById(current, incoming)).toEqual([
			{ id: 'newest', read: true },
			{ id: 'boundary', read: true },
			{ id: 'older', read: false },
		])
	})
})
