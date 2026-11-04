import { PATHS } from './paths'
import {
	getGuestBrowseHref,
	getPostAuthRedirectPath,
	isPublicRoutePath,
	shouldRedirectExpiredSession,
} from './auth'

describe('auth route policy', () => {
	it('treats /cook as a public launcher route', () => {
		expect(isPublicRoutePath(PATHS.COOK)).toBe(true)
	})

	it('treats the referral intake as an explicit public route', () => {
		expect(isPublicRoutePath(PATHS.JOIN)).toBe(true)
		expect(shouldRedirectExpiredSession(PATHS.JOIN)).toBe(false)
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

	it('keeps My Groups private behind the centralized auth provider', () => {
		expect(isPublicRoutePath(PATHS.GROUPS.MY_GROUPS)).toBe(false)
	})

	it('keeps published post detail routes public', () => {
		expect(isPublicRoutePath('/post/published-post-id')).toBe(true)
	})

	it('does not return guests to protected post authoring', () => {
		expect(getGuestBrowseHref('/post/new')).toBe(PATHS.EXPLORE)
	})

	it('preserves an internal post-auth destination including its query', () => {
		expect(getPostAuthRedirectPath('/post/new?session=session-1')).toBe(
			'/post/new?session=session-1',
		)
	})

	it.each([
		'//outside.example/path',
		'/\\\\outside.example/path',
		'/auth/sign-in?returnTo=%2Fpost%2Fnew',
		'/auth/verify-otp',
	])('falls back for unsafe or looping post-auth target %s', returnTo => {
		expect(getPostAuthRedirectPath(returnTo)).toBe(PATHS.DASHBOARD)
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
