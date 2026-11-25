import fs from 'fs'
import path from 'path'
import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { AppShell } from '@/components/layout/AppShell'
import {
	clearPendingFeedScrollPosition,
	getAppScrollDistanceToBottom,
	getAppScrollContainer,
	getAppScrollTarget,
	getAppScrollTop,
	getPendingFeedScrollPosition,
	rememberFeedScrollPosition,
	restoreFeedScrollPositionIfReady,
	scrollAppTo,
} from '@/lib/app-scroll'
import { ScrollToTop } from '@/components/ui/scroll-to-top'

let mockPathname = '/feed'

jest.mock('next/navigation', () => ({
	usePathname: () => mockPathname,
}))

const SRC = path.join(process.cwd(), 'src')

describe('application scroll authority', () => {
	afterEach(() => {
		clearPendingFeedScrollPosition()
		document.body.innerHTML = ''
		mockPathname = '/feed'
		jest.restoreAllMocks()
	})

	it('uses the AppShell container when it is present', () => {
		const container = document.createElement('main')
		container.id = 'main-content'
		Object.defineProperty(container, 'scrollTop', {
			configurable: true,
			value: 720,
			writable: true,
		})
		container.scrollTo = jest.fn()
		document.body.appendChild(container)

		expect(getAppScrollContainer()).toBe(container)
		expect(getAppScrollTarget()).toBe(container)
		expect(getAppScrollTop()).toBe(720)

		scrollAppTo(0, 'smooth')
		expect(container.scrollTo).toHaveBeenCalledWith({
			top: 0,
			behavior: 'smooth',
		})
	})

	it('reveals and operates the global control from AppShell scroll events', () => {
		const container = document.createElement('main')
		container.id = 'main-content'
		Object.defineProperties(container, {
			scrollTop: { configurable: true, value: 450, writable: true },
			scrollHeight: { configurable: true, value: 2000 },
			clientHeight: { configurable: true, value: 640 },
		})
		container.scrollTo = jest.fn()
		document.body.appendChild(container)

		render(React.createElement(ScrollToTop, { threshold: 400 }))
		fireEvent.scroll(container)

		const button = screen.getByRole('button', { name: 'Scroll to top' })
		expect(button.className.split(' ')).not.toContain('pointer-events-none')
		fireEvent.click(button)
		expect(container.scrollTo).toHaveBeenCalledWith({
			top: 0,
			behavior: 'smooth',
		})
	})

	it('hides the floating control before it can cover end-of-page content', () => {
		const container = document.createElement('main')
		container.id = 'main-content'
		Object.defineProperties(container, {
			scrollHeight: { configurable: true, value: 2000 },
			clientHeight: { configurable: true, value: 640 },
			scrollTop: { configurable: true, value: 450, writable: true },
		})
		document.body.appendChild(container)

		const { getByRole } = render(
			React.createElement(ScrollToTop, { threshold: 400 }),
		)
		const button = getByRole('button', { name: 'Scroll to top' })
		fireEvent.scroll(container)
		expect(button).toHaveAttribute('aria-hidden', 'false')
		expect(button).toHaveAttribute('tabindex', '0')
		button.focus()
		expect(button).toHaveFocus()

		container.scrollTop = 1312 // Exactly 48px remain in the shared scroll area.
		fireEvent.scroll(container)
		expect(button).toHaveAttribute('aria-hidden', 'true')
		expect(button).toHaveAttribute('tabindex', '-1')
		expect(button).not.toHaveFocus()
	})

	it('measures remaining distance in the shared AppShell scroll area', () => {
		const container = document.createElement('main')
		container.id = 'main-content'
		Object.defineProperties(container, {
			scrollHeight: { configurable: true, value: 2000 },
			clientHeight: { configurable: true, value: 640 },
			scrollTop: { configurable: true, value: 450, writable: true },
		})
		document.body.appendChild(container)

		expect(getAppScrollDistanceToBottom()).toBe(910)
	})

	it('falls back to window scrolling outside AppShell', () => {
		Object.defineProperty(window, 'scrollY', {
			configurable: true,
			value: 320,
		})
		const scrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => {})

		expect(getAppScrollContainer()).toBeNull()
		expect(getAppScrollTarget()).toBe(window)
		expect(getAppScrollTop()).toBe(320)

		scrollAppTo(0, 'smooth')
		expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
	})

	it('measures remaining distance from the document when AppShell is absent', () => {
		Object.defineProperty(document.documentElement, 'scrollHeight', {
			configurable: true,
			value: 2000,
		})
		Object.defineProperty(window, 'innerHeight', {
			configurable: true,
			value: 640,
		})
		Object.defineProperty(window, 'scrollY', {
			configurable: true,
			value: 320,
		})

		expect(getAppScrollDistanceToBottom()).toBe(1040)
	})

	it('rechecks end clearance after a window-scrolling viewport resize', () => {
		Object.defineProperty(document.documentElement, 'scrollHeight', {
			configurable: true,
			value: 2000,
		})
		Object.defineProperty(window, 'innerHeight', {
			configurable: true,
			value: 640,
		})
		Object.defineProperty(window, 'scrollY', {
			configurable: true,
			value: 1300,
		})

		const { getByRole } = render(
			React.createElement(ScrollToTop, { threshold: 400 }),
		)
		const button = getByRole('button', { name: 'Scroll to top' })
		expect(button).toHaveAttribute('aria-hidden', 'false')

		Object.defineProperty(window, 'innerHeight', {
			configurable: true,
			value: 660,
		})
		fireEvent.resize(window)
		expect(button).toHaveAttribute('aria-hidden', 'true')
	})

	it('waits for actual Feed readiness without frame polling or expiry', () => {
		mockPathname = '/recipes/example'
		const view = render(
			React.createElement(
				AppShell,
				null,
				React.createElement('div', { 'data-testid': 'recipe-detail' }),
			),
		)
		const container = document.getElementById('main-content') as HTMLElement
		Object.defineProperty(container, 'scrollTop', {
			configurable: true,
			value: 704,
			writable: true,
		})
		container.scrollTo = jest.fn()
		rememberFeedScrollPosition()
		const requestFrame = jest.spyOn(window, 'requestAnimationFrame')
		mockPathname = '/feed'
		const feed = React.createElement('div', {
			'data-testid': 'feed-page',
			'data-feed-ready': 'false',
		})
		view.rerender(React.createElement(AppShell, null, feed))

		for (let frame = 0; frame < 200; frame += 1) {
			expect(restoreFeedScrollPositionIfReady()).toBe(false)
		}
		expect(requestFrame).not.toHaveBeenCalled()
		expect(getPendingFeedScrollPosition()).toBe(704)
		expect(container.scrollTo).not.toHaveBeenCalled()

		view.rerender(
			React.createElement(
				AppShell,
				null,
				React.createElement('div', {
					'data-testid': 'feed-page',
					'data-feed-ready': 'true',
				}),
			),
		)
		expect(restoreFeedScrollPositionIfReady()).toBe(true)

		expect(container.scrollTo).toHaveBeenCalledWith({
			top: 704,
			behavior: 'instant',
		})
		expect(getPendingFeedScrollPosition()).toBeNull()
	})

	it('cancels a delayed Feed restore when the user resumes scrolling', () => {
		mockPathname = '/recipes/example'
		const view = render(
			React.createElement(
				AppShell,
				null,
				React.createElement('div', { 'data-testid': 'recipe-detail' }),
			),
		)
		const container = document.getElementById('main-content') as HTMLElement
		container.scrollTo = jest.fn()
		Object.defineProperty(container, 'scrollTop', {
			configurable: true,
			value: 704,
			writable: true,
		})
		rememberFeedScrollPosition()

		mockPathname = '/feed'
		view.rerender(
			React.createElement(
				AppShell,
				null,
				React.createElement('div', {
					'data-testid': 'feed-page',
					'data-feed-ready': 'false',
				}),
			),
		)

		fireEvent.wheel(window)
		view.rerender(
			React.createElement(
				AppShell,
				null,
				React.createElement('div', {
					'data-testid': 'feed-page',
					'data-feed-ready': 'true',
				}),
			),
		)

		expect(getPendingFeedScrollPosition()).toBeNull()
		expect(restoreFeedScrollPositionIfReady()).toBe(false)
		expect(container.scrollTo).not.toHaveBeenCalled()
	})

	it('clears a pending Feed restore when navigating to an unrelated route', () => {
		mockPathname = '/recipes/example'
		const view = render(
			React.createElement(
				AppShell,
				null,
				React.createElement('div', { 'data-testid': 'recipe-detail' }),
			),
		)
		const container = document.getElementById('main-content') as HTMLElement
		container.scrollTo = jest.fn()
		Object.defineProperty(container, 'scrollTop', {
			configurable: true,
			value: 704,
			writable: true,
		})
		rememberFeedScrollPosition()

		mockPathname = '/profile'
		view.rerender(
			React.createElement(
				AppShell,
				null,
				React.createElement('div', { 'data-testid': 'profile' }),
			),
		)

		expect(getPendingFeedScrollPosition()).toBeNull()
		expect(container.scrollTo).toHaveBeenCalledWith({
			top: 0,
			behavior: 'instant',
		})
	})

	it('preserves Explore history restoration but resets forward recipe navigation', () => {
		mockPathname = '/recipes/example'
		const view = render(
			React.createElement(
				AppShell,
				null,
				React.createElement('div', { 'data-testid': 'recipe-detail' }),
			),
		)
		const container = document.getElementById('main-content') as HTMLElement
		container.scrollTo = jest.fn()

		window.history.pushState({}, '', '/explore')
		fireEvent.popState(window)
		mockPathname = '/explore'
		view.rerender(
			React.createElement(
				AppShell,
				null,
				React.createElement('div', { 'data-testid': 'explore' }),
			),
		)
		expect(container.scrollTo).not.toHaveBeenCalled()

		window.history.pushState({}, '', '/recipes/next')
		fireEvent.popState(window)
		mockPathname = '/recipes/next'
		view.rerender(
			React.createElement(
				AppShell,
				null,
				React.createElement('div', { 'data-testid': 'recipe-detail' }),
			),
		)
		expect(container.scrollTo).toHaveBeenCalledWith({
			top: 0,
			behavior: 'instant',
		})
		window.history.replaceState({}, '', '/')
	})

	it('removes duplicate and direct AppShell window-scroll authorities', () => {
		const feed = fs.readFileSync(
			path.join(SRC, 'app', '(main)', 'feed', 'page.tsx'),
			'utf8',
		)
		const explore = fs.readFileSync(
			path.join(SRC, 'app', '(main)', 'explore', 'ExploreClient.tsx'),
			'utf8',
		)
		const globalControl = fs.readFileSync(
			path.join(SRC, 'components', 'ui', 'scroll-to-top.tsx'),
			'utf8',
		)
		const groups = fs.readFileSync(
			path.join(SRC, 'components', 'groups', 'GroupsExploreGrid.tsx'),
			'utf8',
		)
		const cookieConsent = fs.readFileSync(
			path.join(SRC, 'components', 'ui', 'cookie-consent.tsx'),
			'utf8',
		)

		expect(feed).not.toContain('showBackToTop')
		expect(feed).not.toContain('window.scrollY')
		expect(explore).not.toContain('window.scrollY')
		expect(explore).not.toContain('window.scrollTo')
		expect(groups).not.toContain('window.scrollTo')
		expect(groups).toContain("scrollAppTo(0, 'smooth')")
		expect(cookieConsent).not.toContain(
			"window.addEventListener('scroll', revealConsent",
		)
		expect(cookieConsent).toContain('getAppScrollTarget')
		expect(globalControl).toContain('getAppScrollTarget')
		expect(globalControl).toContain('scrollAppTo')
	})
})
