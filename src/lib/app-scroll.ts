const APP_SCROLL_CONTAINER_ID = 'main-content'

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
