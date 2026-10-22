import fs from 'node:fs'
import path from 'node:path'

import { PATHS } from '@/constants/paths'

const source = fs.readFileSync(
	path.join(process.cwd(), 'src/components/layout/MobileBottomNav.tsx'),
	'utf8',
)
const desktopSource = fs.readFileSync(
	path.join(process.cwd(), 'src/components/layout/LeftSidebar.tsx'),
	'utf8',
)

describe('mobile Collections navigation contract', () => {
	it('defines and exposes the authenticated Collections destination', () => {
		expect(PATHS.COLLECTIONS).toBe('/collections')
		expect(source).toContain(
			"{ href: PATHS.COLLECTIONS, icon: FolderHeart, labelKey: 'collections' }",
		)
		expect(desktopSource).toContain('href: PATHS.COLLECTIONS')
		expect(desktopSource).not.toContain("href: '/collections'")
	})

	it('places Collections with cooking tools and keeps it out of guest navigation', () => {
		const guestMenu = source.slice(
			source.indexOf('const guestNavItems'),
			source.indexOf('const moreMenuItems'),
		)
		const cookingGroup = source.slice(
			source.indexOf("headingKey: 'moreGroupCooking'"),
			source.indexOf("headingKey: 'moreGroupAccount'"),
		)

		expect(guestMenu).not.toContain('PATHS.COLLECTIONS')
		expect(cookingGroup).toContain('PATHS.COLLECTIONS')
	})

	it('uses the shared prefix matching contract for collection detail routes', () => {
		expect(source).toContain("pathname?.startsWith(item.href + '/')")
	})
})
