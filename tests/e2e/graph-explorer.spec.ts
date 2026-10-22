import { expect, test } from '@playwright/test'

const graphEvidenceEnabled =
	process.env.NEXT_PUBLIC_GRAPH_EVIDENCE_ENABLED === 'true'
const graphExplorerEnabled =
	process.env.NEXT_PUBLIC_GRAPH_EXPLORER_ENABLED === 'true'

test('graph search and ingredient inspection preserve evidence labels', async ({
	page,
}) => {
	test.skip(!graphExplorerEnabled, 'Requires the explicit Explorer build flag.')
	const searchTerms: string[] = []
	const evidenceRequests: string[] = []
	let evidenceFault: 'none' | 'identity' | 'unit' = 'none'
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
			? query === 'unlisted spice'
				? {
						nodes: [],
						edges: [],
						total_node_count: 3,
						has_more: true,
					}
				: {
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
		const sourceIngredientId = url.searchParams.get('sourceIngredientId') ?? ''
		const candidateIngredientId =
			url.searchParams.get('candidateIngredientId') ?? ''
		evidenceRequests.push(`${sourceIngredientId}:${candidateIngredientId}`)
		const resolvedSourceId =
			evidenceFault === 'identity' ? 'different-source' : sourceIngredientId
		const resolvedCandidateId =
			evidenceFault === 'identity'
				? 'different-candidate'
				: candidateIngredientId
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
					identityResolution: {
						status: 'RESOLVED',
						requestedSourceIngredientId: sourceIngredientId,
						sourceIngredientId: resolvedSourceId,
						requestedCandidateIngredientId: candidateIngredientId,
						candidateIngredientId: resolvedCandidateId,
					},
					trainPairEvidence: {
						seenInTrain: true,
						trainCount: 2,
						unit: evidenceFault === 'unit' ? 'PAIR_ROWS' : 'TRAIN_PAIRS',
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

	await page
		.getByRole('textbox', { name: 'Search ingredients' })
		.fill('unlisted spice')
	await expect(page.getByTestId('graph-search-empty')).toContainText(
		'not in the current graph',
	)
	await expect(
		page.getByRole('button', { name: 'Explore Unlisted Spice' }),
	).toHaveCount(0)
	await expect(
		page.getByRole('img', {
			name: 'Ingredient force-directed knowledge graph',
		}),
	).toBeVisible()
	expect(searchTerms).toContain('unlisted spice')

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
		evidenceFault = 'identity'
		await page.getByRole('button', { name: 'Explore Butter' }).press('Enter')
		await edge.click()
		await expect(panel).toContainText(
			'Graph evidence is unavailable. No substitution decision was made.',
		)
		await expect(panel).not.toContainText('Artifact manifest SHA-256')
		evidenceFault = 'unit'
		await page.getByRole('button', { name: 'Explore Butter' }).press('Enter')
		await edge.click()
		await expect(panel).toContainText(
			'Graph evidence is unavailable. No substitution decision was made.',
		)
		await expect(panel).not.toContainText('Artifact manifest SHA-256')
		expect(evidenceRequests).toEqual([
			'butter:coconut oil',
			'butter:coconut oil',
			'butter:coconut oil',
		])
	} else {
		await expect(page.getByTestId('graph-evidence-panel')).toHaveCount(0)
		expect(evidenceRequests).toEqual([])
	}
})

test('graph explorer stays disabled without its explicit feature flag', async ({
	page,
}) => {
	test.skip(graphExplorerEnabled, 'Requires the Explorer build flag to be off.')
	const graphRequests: string[] = []
	await page.route('**/api/v1/knowledge/graph**', async route => {
		graphRequests.push(route.request().url())
		await route.abort()
	})

	await page.goto('/explore/graph')
	await expect(page.getByTestId('graph-explorer-disabled')).toContainText(
		'Graph Explorer is disabled',
	)
	await expect(page.getByTestId('graph-content')).toHaveCount(0)
	expect(graphRequests).toEqual([])
})

test('graph explorer refuses malformed identities and response shapes', async ({
	page,
}) => {
	test.skip(!graphExplorerEnabled, 'Requires the explicit Explorer build flag.')
	let graphResponse: Record<string, unknown> = {
		nodes: [{ id: '', name: 'Butter' }],
		edges: [],
	}
	await page.route('**/api/v1/knowledge/graph**', async route =>
		route.fulfill({
			contentType: 'application/json',
			body: JSON.stringify(graphResponse),
		}),
	)

	await page.goto('/explore/graph')
	await expect(page.getByRole('main').getByRole('alert')).toContainText(
		'ingredient graph could not be loaded',
	)
	await expect(
		page.getByRole('img', {
			name: 'Ingredient force-directed knowledge graph',
		}),
	).toHaveCount(0)

	graphResponse = {
		nodes: [
			{ id: 'butter', name: 'Butter' },
			{ id: 'butter', name: 'Clarified Butter' },
		],
		edges: [],
	}
	await page.reload()
	await expect(page.getByRole('main').getByRole('alert')).toContainText(
		'ingredient graph could not be loaded',
	)
	await expect(
		page.getByRole('img', {
			name: 'Ingredient force-directed knowledge graph',
		}),
	).toHaveCount(0)

	graphResponse = { nodes: [] }
	await page.reload()
	await expect(page.getByRole('main').getByRole('alert')).toContainText(
		'ingredient graph could not be loaded',
	)
	await expect(
		page.getByRole('img', {
			name: 'Ingredient force-directed knowledge graph',
		}),
	).toHaveCount(0)

	graphResponse = {
		nodes: [
			{ id: 'butter', name: 'Butter' },
			{ id: 'coconut-oil', name: 'Coconut Oil' },
		],
		edges: [{ source: 'butter', target: 'coconut-oil', type: 'similar_to' }],
	}
	await page.reload()
	await expect(page.getByRole('main').getByRole('alert')).toContainText(
		'ingredient graph could not be loaded',
	)
	await expect(
		page.getByRole('img', {
			name: 'Ingredient force-directed knowledge graph',
		}),
	).toHaveCount(0)
})

test('the latest selected edge owns evidence when requests finish out of order', async ({
	page,
}) => {
	test.skip(!graphEvidenceEnabled, 'Requires the explicit evidence build flag.')
	let releaseFirstResponse: (() => void) | undefined
	let markFirstRequestStarted: (() => void) | undefined
	const firstRequestStarted = new Promise<void>(resolve => {
		markFirstRequestStarted = resolve
	})
	await page.route('**/api/v1/knowledge/graph**', route =>
		route.fulfill({
			contentType: 'application/json',
			body: JSON.stringify({
				nodes: [
					{ id: 'butter', name: 'Butter' },
					{ id: 'coconut oil', name: 'Coconut Oil' },
					{ id: 'olive oil', name: 'Olive Oil' },
				],
				edges: [
					{
						source: 'butter',
						target: 'coconut oil',
						type: 'substitution',
						compound_overlap: 0,
					},
					{
						source: 'butter',
						target: 'olive oil',
						type: 'substitution',
						compound_overlap: 0,
					},
				],
			}),
		}),
	)
	await page.route('**/api/v1/graph/evidence**', async route => {
		const url = new URL(route.request().url())
		const sourceId = url.searchParams.get('sourceIngredientId') ?? ''
		const candidateId = url.searchParams.get('candidateIngredientId') ?? ''
		const trainCount = candidateId === 'coconut oil' ? 2 : 4
		if (candidateId === 'coconut oil') {
			markFirstRequestStarted?.()
			await new Promise<void>(resolve => {
				releaseFirstResponse = resolve
			})
		}
		await route.fulfill({
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
					identityResolution: {
						status: 'RESOLVED',
						requestedSourceIngredientId: sourceId,
						sourceIngredientId: sourceId,
						requestedCandidateIngredientId: candidateId,
						candidateIngredientId: candidateId,
					},
					trainPairEvidence: {
						seenInTrain: trainCount > 0,
						trainCount,
						unit: 'TRAIN_PAIRS',
					},
					calibration: { status: 'no_guarantee' },
					decision: { decision: 'ABSTAIN' },
				},
			}),
		})
	})

	await page.goto('/explore/graph')
	await page
		.getByRole('button', { name: 'View Butter to Coconut Oil relationship' })
		.click()
	await firstRequestStarted
	await page
		.getByRole('button', { name: 'View Butter to Olive Oil relationship' })
		.click()
	const panel = page.getByTestId('graph-evidence-panel')
	await expect(panel).toContainText('Train pair support: 4')

	const firstResponse = page.waitForResponse(response => {
		const url = new URL(response.url())
		return url.searchParams.get('candidateIngredientId') === 'coconut oil'
	})
	if (!releaseFirstResponse)
		throw new Error('First evidence request did not wait.')
	releaseFirstResponse()
	await firstResponse
	await expect(panel).toContainText('Train pair support: 4')
	await expect(panel).not.toContainText('Train pair support: 2')
})
