import { expect, test } from '@playwright/test'

test('graph search and ingredient inspection preserve evidence labels', async ({
	page,
}) => {
	const searchTerms: string[] = []
	const nodes = [
		{
			id: 'butter',
			name: 'Butter',
			category: 'fat',
			allergen_flags: ['milk'],
		},
		{
			id: 'coconut oil',
			name: 'Coconut Oil',
			category: 'oil',
			allergen_flags: [],
		},
	]
	const edges = [
		{
			source: 'butter',
			target: 'coconut oil',
			type: 'substitution',
			substitution_ratio: 0.75,
		},
	]

	await page.route('**/api/v1/knowledge/graph**', async route => {
		const url = new URL(route.request().url())
		const query = url.searchParams.get('q')
		if (query) searchTerms.push(query)
		const data = query
			? {
					nodes: [
						{
							id: 'peanut',
							name: 'Peanut',
							category: 'legume',
							allergen_flags: ['peanut'],
						},
					],
					edges: [],
					total_node_count: 3,
					has_more: true,
				}
			: {
					nodes,
					edges,
					total_node_count: 3,
					has_more: true,
				}
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ success: true, statusCode: 200, data }),
		})
	})
	await page.route('**/api/v1/knowledge/ingredients/**', route =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				success: true,
				statusCode: 200,
				data: nodes[0],
			}),
		}),
	)
	await page.route('**/api/v1/compound/profile/**', route =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				success: true,
				statusCode: 200,
				data: { is_grounded: true, compounds: [{ name: 'Casein' }] },
			}),
		}),
	)

	await page.goto('/explore/graph')
	await expect(
		page.getByRole('heading', { name: 'Explore how ingredients connect.' }),
	).toBeVisible()
	await expect(page.getByText('Source: Knowledge API')).toBeVisible()

	await page.getByRole('button', { name: 'Explore Butter' }).press('Enter')
	await expect(page.getByLabel('Ingredient details')).toContainText('Butter')
	await expect(page.getByLabel('Ingredient details')).toContainText('milk')
	await expect(page.getByLabel('Ingredient details')).toContainText('Casein')

	await page
		.getByRole('textbox', { name: 'Search ingredients' })
		.fill('groundnut')
	await expect(page.getByText('1 search matches')).toBeVisible()
	await expect(
		page.getByRole('button', { name: 'Explore Peanut' }),
	).toBeVisible()
	expect(searchTerms).toContain('groundnut')
})
