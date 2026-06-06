import { getHeaderRoutePolicy } from './topbar-route-policy'

describe('getHeaderRoutePolicy', () => {
	it('hides search inputs on search-like routes', () => {
		const policy = getHeaderRoutePolicy('/search')
		expect(policy.showDesktopSearchBar).toBe(false)
		expect(policy.showMobileSearchShortcut).toBe(false)
	})

	it('hides messages button on messages route', () => {
		const policy = getHeaderRoutePolicy('/messages')
		expect(policy.showMessagesButton).toBe(false)
		expect(policy.showNotificationsButton).toBe(true)
	})

	it('hides notifications button on notifications route', () => {
		const policy = getHeaderRoutePolicy('/notifications')
		expect(policy.showNotificationsButton).toBe(false)
		expect(policy.showMessagesButton).toBe(true)
	})

	it('keeps defaults on generic routes', () => {
		const policy = getHeaderRoutePolicy('/dashboard')
		expect(policy.showDesktopSearchBar).toBe(true)
		expect(policy.showMobileSearchShortcut).toBe(true)
		expect(policy.showMessagesButton).toBe(true)
		expect(policy.showNotificationsButton).toBe(true)
	})
})
