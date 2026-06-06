import { PATHS } from './paths'
import { getGuestBrowseHref, isPublicRoutePath } from './auth'

describe('auth route policy', () => {
	it('treats /cook as a public launcher route', () => {
		expect(isPublicRoutePath(PATHS.COOK)).toBe(true)
	})

	it('preserves /cook as a valid guest return target', () => {
		expect(getGuestBrowseHref(PATHS.COOK)).toBe(PATHS.COOK)
	})
})
