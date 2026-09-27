import fs from 'node:fs'
import path from 'node:path'
import { PATHS } from '@/constants/paths'

const readSource = (relativePath: string) =>
	fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')

const leftSidebarSource = readSource('src/components/layout/LeftSidebar.tsx')
const mobileNavSource = readSource('src/components/layout/MobileBottomNav.tsx')
const messages = JSON.parse(readSource('messages/en.json')) as {
	nav: Record<string, string>
}

describe('Creator Studio navigation contract', () => {
	it('defines one canonical Creator Studio route', () => {
		expect(PATHS.CREATOR).toBe('/creator')
		expect(leftSidebarSource).toContain('href: PATHS.CREATOR')
		expect(mobileNavSource).toContain('href: PATHS.CREATOR')
	})

	it('uses one localized identity on desktop and mobile', () => {
		expect(messages.nav.creator).toBe('Creator Studio')
		expect(leftSidebarSource).toMatch(
			/href: PATHS\.CREATOR,[\s\S]*?icon: BarChart3,[\s\S]*?labelKey: 'creator',[\s\S]*?requiresAuth: true/,
		)
		expect(mobileNavSource).toMatch(
			/href: PATHS\.CREATOR, icon: BarChart3, labelKey: 'creator'/,
		)
	})

	it('keeps the mobile destination in the authenticated Account group', () => {
		expect(mobileNavSource).toContain(
			"[PATHS.CREATOR, '/settings'].includes(item.href)",
		)

		const guestMenu = mobileNavSource.slice(
			mobileNavSource.indexOf('const guestNavItems'),
			mobileNavSource.indexOf('const moreMenuItems'),
		)
		expect(guestMenu).not.toContain('PATHS.CREATOR')
	})
})
