export interface HeaderRoutePolicy {
	showDesktopSearchBar: boolean
	showMobileSearchShortcut: boolean
	showMessagesButton: boolean
	showNotificationsButton: boolean
}

const defaultRoutePolicy: HeaderRoutePolicy = {
	showDesktopSearchBar: true,
	showMobileSearchShortcut: true,
	showMessagesButton: true,
	showNotificationsButton: true,
}

export function getHeaderRoutePolicy(pathname: string): HeaderRoutePolicy {
	if (
		pathname.startsWith('/search') ||
		pathname.startsWith('/explore') ||
		pathname.startsWith('/community')
	) {
		return {
			...defaultRoutePolicy,
			showDesktopSearchBar: false,
			showMobileSearchShortcut: false,
		}
	}

	if (pathname.startsWith('/messages')) {
		return {
			...defaultRoutePolicy,
			showMessagesButton: false,
		}
	}

	if (pathname.startsWith('/notifications')) {
		return {
			...defaultRoutePolicy,
			showNotificationsButton: false,
		}
	}

	return defaultRoutePolicy
}
