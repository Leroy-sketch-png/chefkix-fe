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

	scrollAppTo(savedTop, 'instant')
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

export function getAppScrollDistanceToBottom(): number {
	const container = getAppScrollContainer()
	const scrollHeight =
		container?.scrollHeight ?? document.documentElement.scrollHeight
	const clientHeight = container?.clientHeight ?? window.innerHeight
	const scrollTop = container?.scrollTop ?? window.scrollY

	return Math.max(0, scrollHeight - clientHeight - scrollTop)
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
