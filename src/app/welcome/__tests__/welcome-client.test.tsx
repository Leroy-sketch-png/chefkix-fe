import fs from 'node:fs'
import path from 'node:path'

const source = fs.readFileSync(
	path.join(process.cwd(), 'src/app/welcome/WelcomeClient.tsx'),
	'utf8',
)

describe('WelcomeClient product contract', () => {
	it('keeps the public actions truthful and centrally navigated', () => {
		expect(source).toContain('href={PATHS.AUTH.SIGN_UP}')
		expect(source).toContain('href={PATHS.EXPLORE}')
		expect(source).toContain('href={PATHS.AUTH.SIGN_IN}')
		expect(source).not.toContain('useTransition')
		expect(source).not.toContain("role='status'")
		expect(source).not.toContain("router.push('/community')")
	})

	it('uses a stable food-first hero without fabricated proof or decorative motion systems', () => {
		expect(source).toContain("src='/images/hero/cacio-e-pepe.png'")
		expect(source).toContain("className='relative isolate flex min-h-[88svh]")
		expect(source).not.toMatch(
			/WordRotate|ScrollVelocity|MagicCard|StackedCards|WavyBackground|AuroraBackground|ShinyButton|AnimatedGradientText/,
		)
		expect(source).not.toMatch(/socialProofRating|socialProofStreaks/)
		expect(source).not.toContain('repeat: Infinity')
	})

	it('renders the complete scroll-to-share product loop', () => {
		for (const key of [
			'step01Title',
			'step02Title',
			'step03Title',
			'step04Title',
		]) {
			expect(source).toContain(`titleKey: '${key}'`)
		}
	})
})
