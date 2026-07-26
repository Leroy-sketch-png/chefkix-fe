import fs from 'node:fs'
import path from 'node:path'

describe('grocery commerce truth contract', () => {
	it('does not expose the unavailable affiliate checkout lifecycle', () => {
		const pageSource = fs.readFileSync(
			path.join(process.cwd(), 'src/app/(main)/shopping-lists/page.tsx'),
			'utf8',
		)
		const serviceSource = fs.readFileSync(
			path.join(process.cwd(), 'src/services/shoppingList.ts'),
			'utf8',
		)

		expect(pageSource).not.toContain('checkoutShoppingList')
		expect(pageSource).not.toContain("t('shopInstacart')")
		expect(pageSource).not.toContain("t('checkoutStarted'")
		expect(pageSource).not.toContain("t('checkoutPrepared')")
		expect(pageSource).not.toContain("t('shopNow')")
		expect(serviceSource).not.toContain('checkoutShoppingList')
		expect(serviceSource).not.toContain('getGroceryProviders')
		expect(serviceSource).toContain('getIngredientBuyLinks')
	})
})
