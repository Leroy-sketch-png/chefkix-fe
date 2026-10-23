import { expect, test } from '@playwright/test'

test('thesis workspace shows T56 as pending and keeps diagnostic claims bounded', async ({
	page,
}) => {
	await page.goto('/thesis')

	await expect(page.getByText('lead-v522-member-v3')).toBeVisible()
	await page
		.getByRole('button', { name: /Chapter 13.*Evaluation & Ablation/ })
		.click()

	await expect(
		page.getByRole('heading', {
			name: 'Saved-output validation exhibit (T56)',
		}),
	).toBeVisible()
	await expect(page.getByText('Pending leader data').first()).toBeVisible()
	await expect(
		page.getByText(
			'The 200-case validation diagnostic is not product-quality evidence and does not establish method superiority.',
		),
	).toBeVisible()
	await expect(
		page.getByText(
			'Record browser workflow p95 separately from inference and exhibit generation.',
		),
	).toBeVisible()
	await expect(
		page.getByText(
			'Keep presenter/listener rehearsal and backup video pending until their evidence exists.',
		),
	).toBeVisible()

	const widths = await page.evaluate(() => ({
		viewport: window.innerWidth,
		document: document.documentElement.scrollWidth,
	}))
	expect(widths.document).toBeLessThanOrEqual(widths.viewport)
})
