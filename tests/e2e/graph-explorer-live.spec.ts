import { expect, test } from '@playwright/test'

const graphExplorerEnabled =
	process.env.NEXT_PUBLIC_GRAPH_EXPLORER_ENABLED === 'true'
const liveMonolithEnabled = process.env.CHEFKIX_LIVE_MONOLITH === 'true'

test('live Graph Explorer reads the Monolith and keeps unknown identities absent', async ({
	page,
}) => {
	test.skip(!graphExplorerEnabled, 'Requires the explicit Explorer build flag.')
	test.skip(
		!liveMonolithEnabled,
		'Requires an explicitly started local Monolith.',
	)

	const initialGraphResponse = page.waitForResponse(response => {
		const url = new URL(response.url())
		return (
			url.pathname === '/api/v1/knowledge/graph' && !url.searchParams.has('q')
		)
	})
	await page.goto('/explore/graph')
	await expect(
		page.getByTestId('graph-explorer-preview-boundary'),
	).toContainText(
		'Only relationships whose targets resolve to known ingredients are shown',
	)
	await expect(page.getByText('Source: Knowledge API')).toBeVisible()

	const graphResponse = await initialGraphResponse
	expect(graphResponse.status()).toBe(200)
	const graphPayload = await graphResponse.json()
	const graph = graphPayload.data ?? graphPayload
	expect(graph.nodes.length).toBeGreaterThan(0)
	expect(Array.isArray(graph.edges)).toBe(true)
	expect(graph.edges).toContainEqual(
		expect.objectContaining({ source: 'salt', target: 'lemon' }),
	)
	const firstIngredient = graph.nodes[0].name ?? graph.nodes[0].canonicalName
	expect(typeof firstIngredient).toBe('string')

	const aliasNeighborhoodResponse = page.waitForResponse(response => {
		const url = new URL(response.url())
		return (
			url.pathname === '/api/v1/knowledge/graph' &&
			url.searchParams.get('root') === 'salt'
		)
	})
	await page.getByRole('button', { name: 'Explore Salt' }).press('Enter')
	const aliasNeighborhood = await aliasNeighborhoodResponse
	expect(aliasNeighborhood.status()).toBe(200)
	const neighborhoodPayload = await aliasNeighborhood.json()
	const neighborhood = neighborhoodPayload.data ?? neighborhoodPayload
	expect(neighborhood.nodes.map((node: { id: string }) => node.id)).toEqual(
		expect.arrayContaining(['salt', 'lemon']),
	)
	expect(neighborhood.edges).toContainEqual(
		expect.objectContaining({ source: 'salt', target: 'lemon' }),
	)

	const unknownTerm = 'unlisted-spice-codex-live-smoke-20261023'
	const unknownSearchResponse = page.waitForResponse(response => {
		const url = new URL(response.url())
		return (
			url.pathname === '/api/v1/knowledge/graph' &&
			url.searchParams.get('q') === unknownTerm
		)
	})
	await page
		.getByRole('textbox', { name: 'Search ingredients' })
		.fill(unknownTerm)
	const searchResponse = await unknownSearchResponse
	expect(searchResponse.status()).toBe(200)
	const searchPayload = await searchResponse.json()
	const searchGraph = searchPayload.data ?? searchPayload
	expect(searchGraph.nodes).toHaveLength(0)
	expect(searchGraph.edges).toHaveLength(0)
	await expect(page.getByTestId('graph-search-empty')).toContainText(
		'not in the current graph',
	)
	await expect(
		page.getByRole('button', {
			name: /Explore Unlisted Spice Codex Live Smoke/,
		}),
	).toHaveCount(0)
})
