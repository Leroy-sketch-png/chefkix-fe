import fs from 'fs'
import path from 'path'
import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import {
	getAppScrollContainer,
	getAppScrollTarget,
	getAppScrollTop,
	scrollAppTo,
} from '@/lib/app-scroll'
import { ScrollToTop } from '@/components/ui/scroll-to-top'

jest.mock('next/navigation', () => ({
	usePathname: () => '/feed',
}))

const SRC = path.join(process.cwd(), 'src')

describe('application scroll authority', () => {
	afterEach(() => {
		document.body.innerHTML = ''
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
		Object.defineProperty(container, 'scrollTop', {
			configurable: true,
			value: 450,
			writable: true,
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
