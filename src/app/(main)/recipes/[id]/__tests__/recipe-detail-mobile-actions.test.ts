import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const source = readFileSync(
	join(process.cwd(), 'src/app/(main)/recipes/[id]/page.tsx'),
	'utf8',
)

describe('recipe detail mobile actions', () => {
	it('wraps social actions below 440px and preserves the inline layout above it', () => {
		expect(source).toContain(
			"className='grid grid-cols-2 gap-2 min-[440px]:flex'",
		)
	})

	it('does not request model or shopping-link services before auth hydration or for guests', () => {
		const calibrationGuard = source.indexOf(
			'if (!isHydrated || !user || !recipe) return',
		)
		const calibrationRequest = source.indexOf('calibrateDifficulty(req)')
		const shoppingGuard = source.indexOf(
			'if (!isHydrated || !user || !recipe?.fullIngredientList?.length) return',
		)
		const shoppingRequest = source.indexOf('getIngredientBuyLinks(items)')

		expect(calibrationGuard).toBeGreaterThanOrEqual(0)
		expect(calibrationRequest).toBeGreaterThan(calibrationGuard)
		expect(shoppingGuard).toBeGreaterThanOrEqual(0)
		expect(shoppingRequest).toBeGreaterThan(shoppingGuard)
		expect(source).toContain('}, [isHydrated, recipe?.fullIngredientList, user])')
		expect(source).toContain('}, [isHydrated, recipe, user])')
	})
})
