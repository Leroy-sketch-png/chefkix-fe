import { expect, test } from '@playwright/test'

const graphEvidenceEnabled =
	process.env.NEXT_PUBLIC_GRAPH_EVIDENCE_ENABLED === 'true'

test('graph search and ingredient inspection preserve evidence labels', async ({
	page,
}) => {
	const searchTerms: string[] = []
	const evidenceRequests: string[] = []
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
	await page.route('**/api/v1/compound/analyze-pair', route =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				success: true,
				data: {
					is_compound_grounded: true,
					overlap_percentage: 0.42,
					overlap_semantics: 'Jaccard of official presence profiles',
				},
			}),
		}),
	)
	await page.route('**/api/v1/graph/evidence**', async route => {
		const url = new URL(route.request().url())
		evidenceRequests.push(
			`${url.searchParams.get('sourceIngredientId')}:${url.searchParams.get('candidateIngredientId')}`,
		)
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				contractVersion: 'graph-evidence.v1',
				status: 'AVAILABLE',
				artifactIntegrity: {
					status: 'VERIFIED',
					expectedSha256: 'a'.repeat(64),
					observedSha256: 'a'.repeat(64),
				},
				evidence: {
					identityResolution: { status: 'RESOLVED' },
					trainPairEvidence: {
						seenInTrain: true,
						trainCount: 2,
						unit: 'TRAIN_PAIRS',
					},
					calibration: { status: 'no_guarantee' },
					decision: {
						decision: 'ABSTAIN',
						reason: 'No approved decision rule.',
					},
				},
			}),
		})
	})

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

	await page.getByRole('textbox', { name: 'Search ingredients' }).fill('')
	const edge = page.getByRole('button', {
		name: 'View Butter to Coconut Oil relationship',
	})
	await expect(edge).toBeVisible()
	await edge.click()
	if (graphEvidenceEnabled) {
		const panel = page.getByTestId('graph-evidence-panel')
		await expect(panel).toContainText('Artifact manifest SHA-256')
		await expect(panel).toContainText('Decision: Abstain')
		expect(evidenceRequests).toEqual(['butter:coconut oil'])
	} else {
		await expect(page.getByTestId('graph-evidence-panel')).toHaveCount(0)
		expect(evidenceRequests).toEqual([])
	}
})
