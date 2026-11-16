import fs from 'node:fs'
import path from 'node:path'

import { PATHS } from '@/constants/paths'

const readSource = (relativePath: string) =>
	fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')

const desktopSource = readSource('src/components/layout/LeftSidebar.tsx')
const mobileSource = readSource('src/components/layout/MobileBottomNav.tsx')
const feedRailSource = readSource('src/components/social/FeedContextRail.tsx')
const messages = JSON.parse(readSource('messages/en.json')) as {
	nav: Record<string, string>
}

describe('Kitchen Scanner navigation', () => {
	it('keeps the public scanner in desktop More for members and guests', () => {
		expect(PATHS.SCAN).toBe('/scan')
		expect(desktopSource).toMatch(
			/labelKey: 'kitchenScanner',\s*wrapLabel: true/,
		)
		expect(desktopSource).toContain('return [...guestSecondaryNavItems]')
		expect(desktopSource).toContain(
			"aria-current={active ? 'page' : undefined}",
		)
	})

	it('offers guests a More drawer containing only the public scanner', () => {
		const guestMoreMenu = mobileSource.slice(
			mobileSource.indexOf('const guestMoreMenuItems'),
			mobileSource.indexOf('export const MobileBottomNav'),
		)

		expect(guestMoreMenu).toContain('href: PATHS.SCAN')
		expect(guestMoreMenu).not.toContain("href: '/pantry'")
		expect(mobileSource).toMatch(
			/const activeMoreMenuItems = isAuthenticated\s*\?\s*moreMenuItems\s*:\s*guestMoreMenuItems/,
		)
		expect(mobileSource).toContain('{activeMoreMenuItems.length > 0 && (')
		expect(mobileSource).toContain('aria-expanded={showMore}')
	})

	it('groups the scanner with cooking tools and preserves drawer navigation behavior', () => {
		expect(mobileSource).toContain('PATHS.SCAN,')
		expect(mobileSource).toContain("headingKey: 'moreGroupCooking'")
		expect(mobileSource.indexOf("headingKey: 'moreGroupCooking'")).toBeLessThan(
			mobileSource.indexOf("headingKey: 'moreGroupSocial'"),
		)
		expect(mobileSource).toMatch(
			/setShowMore\(false\)\s+router\.push\(item\.href\)/,
		)
		expect(mobileSource).toContain(
			"pathname === item.href || pathname?.startsWith(item.href + '/')",
		)
	})

	it('uses one clear navigation label on desktop and mobile', () => {
		expect(messages.nav.kitchenScanner).toBe('Kitchen Scanner')
		expect(desktopSource).toContain("labelKey: 'kitchenScanner'")
		expect(mobileSource).toContain("labelKey: 'kitchenScanner'")
	})

	it('keeps the wide Feed Quick Moves scanner route', () => {
		expect(feedRailSource).toContain('href={PATHS.SCAN}')
		expect(feedRailSource).toContain("nav('kitchenScanner')")
	})
})
