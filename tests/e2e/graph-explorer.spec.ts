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
	let evidenceFault: 'none' | 'identity' | 'unit' | 'fingerprint' = 'none'
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
		if (query === 'temporary failure') {
			await route.fulfill({
				status: 503,
				contentType: 'application/json',
				body: JSON.stringify({ message: 'temporary failure' }),
			})
			return
		}
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
					observedSha256:
						evidenceFault === 'fingerprint' ? 'b'.repeat(64) : 'a'.repeat(64),
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
	await expect(
		page.getByTestId('graph-explorer-preview-boundary'),
	).toContainText('not the accepted hash-pinned study graph')
	await expect(page.getByText('Source: Knowledge API')).toBeVisible()

	await page.getByRole('button', { name: 'Explore Butter' }).press('Enter')
	await expect(page.getByLabel('Ingredient details')).toContainText('Butter')
	await expect(page.getByLabel('Ingredient details')).toContainText('milk')
	await expect(page.getByLabel('Ingredient details')).toContainText('Casein')

	await page
		.getByRole('textbox', { name: 'Search ingredients' })
		.fill('temporary failure')
	const searchError = page
		.getByRole('status')
		.filter({ hasText: 'Ingredient search could not be loaded.' })
	await expect(searchError).toBeVisible()

	await page
		.getByRole('textbox', { name: 'Search ingredients' })
		.fill('groundnut')
	await expect(page.getByText('1 search matches')).toBeVisible()
	await expect(
		page
			.getByRole('status')
			.filter({ hasText: 'Ingredient search could not be loaded.' }),
	).toHaveCount(0)
	await expect(
		page.getByRole('button', { name: 'Explore Peanut' }),
	).toBeVisible()
	expect(searchTerms).toContain('groundnut')
	await page
		.getByRole('textbox', { name: 'Search ingredients' })
		.fill('temporary failure')
	await expect(searchError).toBeVisible()
	await page.getByRole('textbox', { name: 'Search ingredients' }).fill('')
	await expect(searchError).toHaveCount(0)
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
		evidenceFault = 'fingerprint'
		await page.getByRole('button', { name: 'Explore Butter' }).press('Enter')
		await edge.click()
		await expect(panel).toContainText(
			'Graph evidence is unavailable. No substitution decision was made.',
		)
		await expect(panel).not.toContainText('Artifact manifest SHA-256')
		await expect(panel).not.toContainText('Decision:')
		expect(evidenceRequests).toEqual([
			'butter:coconut oil',
			'butter:coconut oil',
			'butter:coconut oil',
			'butter:coconut oil',
		])
	} else {
		await expect(page.getByTestId('graph-evidence-panel')).toHaveCount(0)
		expect(evidenceRequests).toEqual([])
	}
})

test('relationship map fits its viewport without horizontal clipping', async ({
	page,
}) => {
	test.skip(!graphExplorerEnabled, 'Requires the explicit Explorer build flag.')
	await page.route('**/api/v1/knowledge/graph**', route =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				nodes: [
					{ id: 'butter', name: 'Butter', category: 'dairy' },
					{ id: 'olive oil', name: 'Olive Oil', category: 'oil' },
				],
				edges: [
					{ source: 'olive oil', target: 'butter', type: 'substitution' },
				],
			}),
		}),
	)

	await page.goto('/explore/graph')
	const graph = page.getByRole('img', {
		name: 'Ingredient force-directed knowledge graph',
	})
	await expect(graph).toBeVisible()
	const widths = await graph.evaluate(svg => ({
		graph: svg.getBoundingClientRect().width,
		viewport: svg.parentElement?.getBoundingClientRect().width ?? 0,
	}))
	expect(widths.graph).toBeLessThanOrEqual(widths.viewport + 1)
	const controls = page.locator('[aria-label="Relationship map controls"]')
	await expect(controls).toHaveCount(1)
	const controlsBox = await controls.boundingBox()
	const canvasBox = await graph.locator('..').boundingBox()
	expect(controlsBox).not.toBeNull()
	expect(canvasBox).not.toBeNull()
	expect(controlsBox!.y + controlsBox!.height).toBeLessThanOrEqual(
		canvasBox!.y + 1,
	)
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

test('compound detail can retry after an empty provider response', async ({
	page,
}) => {
	test.skip(!graphExplorerEnabled, 'Requires the explicit Explorer build flag.')
	let compoundRequests = 0
	await page.route('**/api/v1/knowledge/graph**', route =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				nodes: [
					{ id: 'butter', name: 'Butter' },
					{ id: 'coconut oil', name: 'Coconut Oil' },
				],
				edges: [
					{ source: 'butter', target: 'coconut oil', type: 'substitution' },
				],
			}),
		}),
	)
	await page.route('**/api/v1/graph/evidence**', route =>
		route.fulfill({
			status: 503,
			contentType: 'application/json',
			body: JSON.stringify({
				contractVersion: 'graph-evidence.v1',
				status: 'UNAVAILABLE',
				unavailableReason: 'FEATURE_DISABLED',
			}),
		}),
	)
	await page.route('**/api/v1/compound/analyze-pair', async route => {
		compoundRequests += 1
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				success: true,
				data:
					compoundRequests === 1
						? {}
						: {
								is_compound_grounded: true,
								overlap_percentage: 0.42,
								overlap_semantics: 'Jaccard of official presence profiles',
							},
			}),
		})
	})

	await page.goto('/explore/graph')
	const edge = page.getByRole('button', {
		name: 'View Butter to Coconut Oil relationship',
	})
	await expect(edge).toBeVisible()
	await edge.click()
	await expect(page.getByLabel('Relationship details')).toContainText(
		'FooDB comparison unavailable',
	)
	await expect.poll(() => compoundRequests).toBe(1)

	await edge.click()
	await expect(page.getByLabel('Relationship details')).toContainText(
		'42% Jaccard overlap of documented compound presence',
	)
	await expect.poll(() => compoundRequests).toBe(2)
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

test('provider error details stay out of the rendered graph page', async ({
	page,
}) => {
	test.skip(
		!graphExplorerEnabled || !graphEvidenceEnabled,
		'Requires the explicit Explorer and evidence build flags.',
	)
	const secretSentinel = 'CHEFKIX_T11_SECRET_SENTINEL_20261023'
	const browserOutput: string[] = []
	page.on('console', message => browserOutput.push(message.text()))
	page.on('pageerror', error => browserOutput.push(error.message))

	await page.route('**/api/v1/knowledge/graph**', route =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				success: true,
				data: {
					nodes: [
						{
							id: 'butter',
							name: 'Butter',
							category: 'fat',
							allergen_flags: [],
						},
						{
							id: 'coconut oil',
							name: 'Coconut Oil',
							category: 'oil',
							allergen_flags: [],
						},
					],
					edges: [
						{ source: 'butter', target: 'coconut oil', type: 'substitution' },
					],
					total_node_count: 2,
					has_more: false,
				},
			}),
		}),
	)
	await page.route('**/api/v1/compound/analyze-pair', route =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ success: true, data: {} }),
		}),
	)
	await page.route('**/api/v1/graph/evidence**', route =>
		route.fulfill({
			status: 503,
			contentType: 'application/json',
			body: JSON.stringify({ message: secretSentinel, debug: secretSentinel }),
		}),
	)

	await page.goto('/explore/graph')
	await page
		.getByRole('button', { name: 'View Butter to Coconut Oil relationship' })
		.click()
	const panel = page.getByTestId('graph-evidence-panel')
	await expect(panel).toContainText('Graph evidence is unavailable.')
	await expect(page.locator('body')).not.toContainText(secretSentinel)
	await expect
		.poll(() => browserOutput.join('\n'))
		.not.toContain(secretSentinel)
})

test('edge selection keeps colon-containing ingredient IDs distinct', async ({
	page,
}, testInfo) => {
	test.skip(!graphExplorerEnabled, 'Requires the explicit Explorer build flag.')
	const evidencePairs: string[] = []
	await page.route('**/api/v1/knowledge/graph**', route =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				success: true,
				data: {
					nodes: [
						{ id: 'a:b', name: 'A:B', category: 'ingredient' },
						{ id: 'c', name: 'C', category: 'ingredient' },
						{ id: 'a', name: 'A', category: 'ingredient' },
						{ id: 'b:c', name: 'B:C', category: 'ingredient' },
					],
					edges: [
						{ source: 'a:b', target: 'c', type: 'substitution' },
						{ source: 'a', target: 'b:c', type: 'substitution' },
					],
					total_node_count: 4,
					has_more: false,
				},
			}),
		}),
	)
	await page.route('**/api/v1/compound/analyze-pair', route =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ success: true, data: {} }),
		}),
	)
	await page.route('**/api/v1/graph/evidence**', async route => {
		const url = new URL(route.request().url())
		evidencePairs.push(
			JSON.stringify([
				url.searchParams.get('sourceIngredientId'),
				url.searchParams.get('candidateIngredientId'),
			]),
		)
		await route.fulfill({
			status: 503,
			contentType: 'application/json',
			body: JSON.stringify({
				contractVersion: 'graph-evidence.v1',
				status: 'UNAVAILABLE',
				unavailableReason: 'PROVIDER_ERROR',
			}),
		})
	})

	await page.goto('/explore/graph')
	await page.getByRole('button', { name: 'View A to B:C relationship' }).click()
	await expect(page.getByLabel('Relationship details')).toContainText('A → B:C')
	if (graphEvidenceEnabled) {
		await expect
			.poll(() => evidencePairs)
			.toContain(JSON.stringify(['a', 'b:c']))
		await expect(page.getByTestId('graph-evidence-panel')).toContainText(
			'Graph evidence is unavailable.',
		)
	}
	await page.getByRole('button', { name: 'Dismiss' }).click()
	if (testInfo.project.name === 'desktop-chromium') {
		await page.screenshot({
			path: testInfo.outputPath('graph-edge-colon-ids.png'),
			fullPage: true,
		})
	}
})

test('graph demo uses only local assets and graph API arms when evidence falls back', async ({
	page,
}, testInfo) => {
	test.skip(
		!graphExplorerEnabled || !graphEvidenceEnabled,
		'Requires the explicit Explorer and evidence build flags.',
	)
	const appOrigin = 'http://localhost:3200'
	const graphApiPaths = new Set([
		'/api/v1/knowledge/graph',
		'/api/v1/compound/analyze-pair',
		'/api/v1/graph/evidence',
	])
	const blockedRequests: string[] = []
	const graphApiRequests = new Set<string>()
	await page.route('**/api/v1/knowledge/graph**', route =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				success: true,
				data: {
					nodes: [
						{
							id: 'butter',
							name: 'Butter',
							category: 'fat',
							allergen_flags: [],
						},
						{
							id: 'coconut oil',
							name: 'Coconut Oil',
							category: 'oil',
							allergen_flags: [],
						},
					],
					edges: [
						{ source: 'butter', target: 'coconut oil', type: 'substitution' },
					],
					total_node_count: 2,
					has_more: false,
				},
			}),
		}),
	)
	await page.route('**/api/v1/compound/analyze-pair', route =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ success: true, data: {} }),
		}),
	)
	await page.route('**/api/v1/graph/evidence**', route =>
		route.fulfill({
			status: 503,
			contentType: 'application/json',
			body: JSON.stringify({
				contractVersion: 'graph-evidence.v1',
				status: 'UNAVAILABLE',
				unavailableReason: 'PROVIDER_ERROR',
			}),
		}),
	)
	await page.route('**/*', async route => {
		const url = new URL(route.request().url())
		const localHost = ['localhost', '127.0.0.1'].includes(url.hostname)
		if (url.origin === appOrigin && !url.pathname.startsWith('/api/')) {
			await route.continue()
			return
		}
		if (localHost && graphApiPaths.has(url.pathname)) {
			graphApiRequests.add(`${route.request().method()} ${url.pathname}`)
			await route.fallback()
			return
		}
		blockedRequests.push(url.origin + url.pathname)
		await route.abort()
	})

	await page.goto('/explore/graph')
	await page
		.getByRole('button', { name: 'View Butter to Coconut Oil relationship' })
		.click()
	const panel = page.getByTestId('graph-evidence-panel')
	await expect(panel).toContainText('Graph evidence is unavailable.')
	await expect(panel).toContainText('No substitution decision was made.')
	await page.getByRole('button', { name: 'Dismiss' }).click()
	await expect.poll(() => graphApiRequests.size).toBe(3)
	await page.waitForLoadState('networkidle')
	expect(blockedRequests).toEqual([])
	expect([...graphApiRequests].sort()).toEqual(
		[
			'POST /api/v1/compound/analyze-pair',
			'GET /api/v1/graph/evidence',
			'GET /api/v1/knowledge/graph',
		].sort(),
	)
	if (testInfo.project.name === 'desktop-chromium') {
		await page.screenshot({
			path: testInfo.outputPath('graph-demo-fallback.png'),
			fullPage: true,
		})
	}
})
