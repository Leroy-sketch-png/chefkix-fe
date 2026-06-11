import { shouldSuppressCookieConsent } from '@/lib/cookie-consent-policy'

describe('cookie consent route policy', () => {
	it.each([
		'/',
		'/auth/sign-in',
		'/privacy',
		'/terms',
		'/demo-cockpit',
		'/demo-remote',
		'/_dev',
		'/_dev/demo-tools',
	])('suppresses consent on operational or exempt route %s', pathname => {
		expect(shouldSuppressCookieConsent(pathname)).toBe(true)
	})

	it('suppresses consent throughout an armed cockpit session', () => {
		expect(shouldSuppressCookieConsent('/meal-planner', true)).toBe(true)
	})

	it.each(['/welcome', '/meal-planner', '/explore'])(
		'keeps consent eligible on regular product route %s',
		pathname => {
			expect(shouldSuppressCookieConsent(pathname)).toBe(false)
		},
	)
})
