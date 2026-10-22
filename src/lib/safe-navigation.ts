interface BackNavigationRouter {
	back: () => void
	push: (href: string) => void
}

export interface BackNavigationContext {
	historyLength: number
	referrer: string
	origin: string
}

export function hasAppLocalBackDestination({
	historyLength,
	referrer,
	origin,
}: BackNavigationContext): boolean {
	if (historyLength <= 1 || !referrer || !origin) return false

	try {
		return new URL(referrer).origin === origin
	} catch {
		return false
	}
}

function getBrowserNavigationContext(): BackNavigationContext | null {
	if (typeof window === 'undefined' || typeof document === 'undefined') {
		return null
	}

	return {
		historyLength: window.history.length,
		referrer: document.referrer,
		origin: window.location.origin,
	}
}

export function navigateBackOrFallback(
	router: BackNavigationRouter,
	fallbackHref: string,
	context = getBrowserNavigationContext(),
): void {
	if (context && hasAppLocalBackDestination(context)) {
		router.back()
		return
	}

	router.push(fallbackHref)
}
