const APP_SCROLL_CONTAINER_ID = 'main-content'
let pendingFeedScrollTop: number | null = null

export function rememberFeedScrollPosition(): void {
	pendingFeedScrollTop = getAppScrollTop()
}

export function getPendingFeedScrollPosition(): number | null {
	return pendingFeedScrollTop
}

export function clearPendingFeedScrollPosition(): void {
	pendingFeedScrollTop = null
}

export function restoreFeedScrollPositionIfReady(): boolean {
	const savedTop = pendingFeedScrollTop
	if (savedTop == null) return false

	const feed = document.querySelector('[data-testid="feed-page"]')
	if (feed?.getAttribute('data-feed-ready') !== 'true') return false

	scrollAppTo(savedTop)
	clearPendingFeedScrollPosition()
	return true
}

export function getAppScrollContainer(): HTMLElement | null {
	return document.getElementById(APP_SCROLL_CONTAINER_ID)
}

export function getAppScrollTarget(): HTMLElement | Window {
	return getAppScrollContainer() ?? window
}

export function getAppScrollTop(): number {
	return getAppScrollContainer()?.scrollTop ?? window.scrollY
}

export function scrollAppTo(
	top: number,
	behavior: ScrollBehavior = 'auto',
): void {
	const container = getAppScrollContainer()
	if (container) {
		container.scrollTo({ top, behavior })
		return
	}

	window.scrollTo({ top, behavior })
}
