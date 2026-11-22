import { shouldSuppressCookieConsent } from '@/lib/cookie-consent-policy'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const cookieConsentSource = readFileSync(
	join(process.cwd(), 'src/components/ui/cookie-consent.tsx'),
	'utf8',
)

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

	it('keeps desktop placement aligned with the 768px mobile-nav breakpoint', () => {
		expect(cookieConsentSource).toContain("useMediaQuery('(max-width: 767px)')")
		expect(cookieConsentSource).toContain('md:bottom-4 md:right-4 md:left-auto')
		expect(cookieConsentSource).not.toContain('sm:bottom-4')
	})
})
