import { localDateKey } from '@/lib/local-date-key'

describe('localDateKey', () => {
	it('keeps a local late-evening date from rolling into the UTC day', () => {
		const lateEvening = new Date(2026, 9, 14, 23, 30)

		expect(localDateKey(lateEvening)).toBe('2026-10-14')
	})
})
