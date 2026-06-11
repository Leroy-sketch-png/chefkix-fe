export function shouldSuppressCookieConsent(
	pathname: string | null,
	isDemoCockpitSession = false,
): boolean {
	if (isDemoCockpitSession) return true

	return (
		pathname === '/' ||
		pathname?.startsWith('/auth') === true ||
		pathname === '/privacy' ||
		pathname === '/terms' ||
		pathname === '/demo-cockpit' ||
		pathname === '/demo-remote' ||
		pathname === '/_dev' ||
		pathname?.startsWith('/_dev/') === true
	)
}
