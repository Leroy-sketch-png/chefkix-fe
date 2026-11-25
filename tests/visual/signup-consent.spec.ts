import { test, expect } from '@playwright/test'

const MOBILE_VIEWPORTS = [
	{ name: 'compact phone', width: 360, height: 640 },
	{ name: 'modern phone', width: 390, height: 844 },
]

test.describe('signup terms consent control', () => {
	for (const viewport of MOBILE_VIEWPORTS) {
		test(`is visible and operable on a ${viewport.name}`, async ({ page }) => {
			await page.setViewportSize({
				width: viewport.width,
				height: viewport.height,
			})
			await page.goto('/auth/sign-up', { waitUntil: 'domcontentloaded' })

			const checkbox = page.getByRole('checkbox', {
				name: 'I accept the Terms of Service and Privacy Policy',
			})
			await expect(checkbox).toBeVisible()
			await expect(checkbox).toHaveAttribute('aria-checked', 'false')
			await page.getByRole('button', { name: 'Continue securely' }).click()
			await expect(
				page.getByText('You must accept the Terms of Service to continue'),
			).toBeVisible()

			const geometry = await checkbox.evaluate(element => {
				const rect = element.getBoundingClientRect()
				const style = getComputedStyle(element)
				return {
					width: rect.width,
					height: rect.height,
					borderWidth: parseFloat(style.borderTopWidth),
					backgroundColor: style.backgroundColor,
				}
			})
			expect(geometry.width).toBeGreaterThanOrEqual(24)
			expect(geometry.height).toBeGreaterThanOrEqual(24)
			expect(geometry.borderWidth).toBeGreaterThanOrEqual(2)
			expect(geometry.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')

			await page.locator('label[for="accept-terms"]').click()
			await expect(checkbox).toHaveAttribute('aria-checked', 'true')
			await expect(
				page.getByText('You must accept the Terms of Service to continue'),
			).toHaveCount(0)

			for (const href of ['/terms', '/privacy']) {
				const link = page.locator(`a[href="${href}"]`)
				await expect(link).toBeVisible()
				expect(
					await link.evaluate(element =>
						element.closest('button, [role="checkbox"]'),
					),
				).toBeNull()
			}
		})
	}
})
