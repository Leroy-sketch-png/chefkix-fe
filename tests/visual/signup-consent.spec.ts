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
			const continueButton = page.getByRole('button', {
				name: 'Continue securely',
			})
			const consentRow = page
				.locator('#accept-terms-label')
				.locator('xpath=../..')
			await expect(
				page.getByRole('button', { name: 'Scroll to top' }),
			).toHaveCount(0)
			await expect(checkbox).toBeVisible()
			await expect(checkbox).toHaveAttribute('aria-checked', 'false')
			await expect
				.poll(async () => {
					const bounds = await consentRow.boundingBox()
					return bounds ? bounds.y + bounds.height : Number.POSITIVE_INFINITY
				})
				.toBeLessThanOrEqual(viewport.height)
			const initialCheckboxBounds = await checkbox.boundingBox()
			expect(initialCheckboxBounds).not.toBeNull()
			expect(initialCheckboxBounds!.y).toBeGreaterThanOrEqual(0)
			expect(
				initialCheckboxBounds!.y + initialCheckboxBounds!.height,
			).toBeLessThanOrEqual(viewport.height)
			const initialConsentRowBounds = await consentRow.boundingBox()
			expect(initialConsentRowBounds).not.toBeNull()
			expect(
				initialConsentRowBounds!.y + initialConsentRowBounds!.height,
			).toBeLessThanOrEqual(viewport.height)
			const initialContinueBounds = await continueButton.boundingBox()
			expect(initialContinueBounds).not.toBeNull()
			expect(
				initialContinueBounds!.y + initialContinueBounds!.height,
			).toBeLessThanOrEqual(viewport.height)
			await continueButton.click()
			await expect(
				page.getByText('You must accept the Terms of Service to continue'),
			).toBeVisible()
			await expect(
				page.getByRole('button', { name: 'Scroll to top' }),
			).toHaveCount(0)
			await expect
				.poll(async () => {
					const control = await checkbox.boundingBox()
					const firstLabelLine = await page
						.locator('#accept-terms-label')
						.evaluate(element => {
							const range = document.createRange()
							range.selectNodeContents(element)
							const rect = range.getClientRects()[0]
							return rect ? { y: rect.y, height: rect.height } : null
						})
					if (!control || !firstLabelLine) return Number.POSITIVE_INFINITY
					return Math.abs(
						control.y +
							control.height / 2 -
							(firstLabelLine.y + firstLabelLine.height / 2),
					)
				})
				.toBeLessThanOrEqual(4)

			const geometry = await checkbox.evaluate(element => {
				const rect = element.getBoundingClientRect()
				const style = getComputedStyle(element)
				return {
					x: rect.x,
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
			const firstLabelLine = await page
				.locator('#accept-terms-label')
				.evaluate(element => {
					const range = document.createRange()
					range.selectNodeContents(element)
					const rect = range.getClientRects()[0]
					return rect ? { x: rect.x, y: rect.y, height: rect.height } : null
				})
			expect(firstLabelLine).not.toBeNull()
			expect(
				Math.abs(firstLabelLine!.x - (geometry.x + geometry.width + 12)),
			).toBeLessThanOrEqual(2)
			const errorBox = await page
				.getByText('You must accept the Terms of Service to continue')
				.boundingBox()
			expect(errorBox).not.toBeNull()
			expect(Math.abs(errorBox!.x - firstLabelLine!.x)).toBeLessThanOrEqual(2)

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
