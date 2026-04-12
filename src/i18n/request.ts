import { getRequestConfig } from 'next-intl/server'

/**
 * next-intl server config — Non-routing setup (single English locale).
 * Loads messages from /messages/en.json for all Server Components.
 *
 * When multi-locale is needed:
 * 1. Add routing.ts in this folder
 * 2. Add middleware.ts in src/
 * 3. Change this to use locale param from routing
 */
export default getRequestConfig(async () => {
	const locale = 'en'
	return {
		locale,
		messages: (await import(`../../messages/${locale}.json`)).default,
	}
})
