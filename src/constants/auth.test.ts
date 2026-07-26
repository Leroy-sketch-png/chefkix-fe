import { PATHS } from './paths'
import {
	getGuestBrowseHref,
	isPublicRoutePath,
	shouldRedirectExpiredSession,
} from './auth'

describe('auth route policy', () => {
	it('treats /cook as a public launcher route', () => {
		expect(isPublicRoutePath(PATHS.COOK)).toBe(true)
	})

	it('preserves /cook as a valid guest return target', () => {
		expect(getGuestBrowseHref(PATHS.COOK)).toBe(PATHS.COOK)
	})

	it.each(['/post/new', '/post/new/from-session'])(
		'keeps post authoring route %s protected',
		pathname => {
			expect(isPublicRoutePath(pathname)).toBe(false)
			expect(shouldRedirectExpiredSession(pathname)).toBe(true)
		},
	)

	it('keeps published post detail routes public', () => {
		expect(isPublicRoutePath('/post/published-post-id')).toBe(true)
	})

	it('does not return guests to protected post authoring', () => {
		expect(getGuestBrowseHref('/post/new')).toBe(PATHS.EXPLORE)
	})

	it.each(['/demo-cockpit', '/demo-remote', PATHS.EXPLORE])(
		'keeps public route %s open after an expired session',
		pathname => {
			expect(shouldRedirectExpiredSession(pathname)).toBe(false)
		},
	)

	it('redirects an expired session away from protected routes', () => {
		expect(shouldRedirectExpiredSession(PATHS.DASHBOARD)).toBe(true)
	})
})
