import fs from 'node:fs'
import path from 'node:path'

const layoutSource = fs.readFileSync(
	path.join(process.cwd(), 'src/app/layout.tsx'),
	'utf8',
)
const packageJson = JSON.parse(
	fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'),
) as { dependencies: Record<string, string> }
const fontLicense = fs.readFileSync(
	path.join(process.cwd(), 'public/fonts/LICENSES.txt'),
	'utf8',
)

describe('self-hosted typography assets', () => {
	it('uses pinned local font packages instead of the network-dependent Google loader', () => {
		for (const fontPackage of [
			'@fontsource-variable/plus-jakarta-sans',
			'@fontsource-variable/space-grotesk',
			'@fontsource-variable/playfair-display',
		]) {
			expect(packageJson.dependencies[fontPackage]).toBe('5.3.0')
			expect(layoutSource).toContain(`import '${fontPackage}/wght.css'`)
		}

		expect(layoutSource).not.toContain('next/font/google')
		expect(layoutSource).toContain('Plus Jakarta Sans Variable')
		expect(layoutSource).toContain('Space Grotesk Variable')
		expect(layoutSource).toContain('Playfair Display Variable')
		expect(fontLicense).toContain('SIL OPEN FONT LICENSE Version 1.1')
		expect(fontLicense).toContain('The Plus Jakarta Sans Project Authors')
		expect(fontLicense).toContain('The Space Grotesk Project Authors')
		expect(fontLicense).toContain('The Playfair Display Project Authors')
	})
})
