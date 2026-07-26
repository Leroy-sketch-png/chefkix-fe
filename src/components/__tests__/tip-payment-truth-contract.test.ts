import fs from 'fs'
import path from 'path'

const productionFiles = [
	'src/app/(main)/recipes/[id]/page.tsx',
	'src/components/profile/ProfileHeaderGamified.tsx',
	'src/app/(main)/creator/page.tsx',
	'src/components/creator/index.ts',
]

describe('creator tip payment truth contract', () => {
	it('does not expose simulated tip payment or dollar-history components', () => {
		for (const relativePath of productionFiles) {
			const source = fs.readFileSync(
				path.join(process.cwd(), relativePath),
				'utf8',
			)
			expect(source).not.toContain('TipJarButton')
			expect(source).not.toContain('TipHistory')
		}

		expect(
			fs.existsSync(
				path.join(process.cwd(), 'src/components/tip/TipJarButton.tsx'),
			),
		).toBe(false)
		expect(
			fs.existsSync(
				path.join(process.cwd(), 'src/components/creator/TipHistory.tsx'),
			),
		).toBe(false)
	})
})
