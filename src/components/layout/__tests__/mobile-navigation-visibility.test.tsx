import fs from 'fs'
import path from 'path'

const SRC = path.join(process.cwd(), 'src')
const mobileNavigationPath = path.join(
	SRC,
	'components',
	'layout',
	'MobileBottomNav.tsx',
)
const removedScrollHookPath = path.join(
	SRC,
	'hooks',
	'useScrollDirection.ts',
)

describe('mobile navigation visibility contract', () => {
	it('keeps top-level navigation visible during ordinary mobile scrolling', () => {
		const source = fs.readFileSync(mobileNavigationPath, 'utf8')

		expect(source).not.toContain('useScrollDirection')
		expect(source).not.toContain('translate-y-full')
		expect(source).not.toContain('transition-transform')
		expect(source).toContain('fixed bottom-0 left-0 right-0')
	})

	it('preserves the desktop breakpoint and removes the invalid scroll authority', () => {
		const source = fs.readFileSync(mobileNavigationPath, 'utf8')

		expect(source).toContain('md:hidden')
		expect(fs.existsSync(removedScrollHookPath)).toBe(false)
	})
})
