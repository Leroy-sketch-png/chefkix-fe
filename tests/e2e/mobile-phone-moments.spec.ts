import { expect, test, type Page } from '@playwright/test'
import {
	PRODUCT_GRAPH_EDGES_SHA256,
	PRODUCT_GRAPH_MANIFEST_SHA256,
	PRODUCT_GRAPH_NODES_SHA256,
} from '../../src/features/graph-explorer/services/productGraphService'

const apiOrigin = 'http://localhost:3200'
const corsHeaders = {
	'access-control-allow-origin': apiOrigin,
	'access-control-allow-credentials': 'true',
	'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
	'access-control-allow-headers':
		'authorization, content-type, accept, x-requested-with',
}

const graphProvenance = {
	manifestSha256: PRODUCT_GRAPH_MANIFEST_SHA256,
	nodesSha256: PRODUCT_GRAPH_NODES_SHA256,
	edgesSha256: PRODUCT_GRAPH_EDGES_SHA256,
	source: 'FooDB 1.0',
	releaseDate: '2020-04-07',
	license: 'CC BY-NC 4.0',
	scope: 'Top-255 profile scope; export-eligible edges only',
	interpretation:
		'Missing relations are unknown; presence is not quantity or substitution evidence.',
}

// The frontend registers its local PWA worker; keep it enabled in this isolated
// browser context rather than letting the shared e2e default block registration.
test.use({ serviceWorkers: 'allow' })

async function installIsolatedSignedInFixture(page: Page) {
	await page.addInitScript(() => {
		const accessToken = 'isolated-mobile-visual-fixture'
		localStorage.setItem(
			'auth-storage',
			JSON.stringify({
				state: {
					isAuthenticated: true,
					isHydrated: true,
					isLoading: false,
					accessToken,
					user: {
						userId: 'mobile-visual-fixture',
						username: 'mobile-fixture',
						email: 'mobile-fixture@example.test',
						displayName: 'Mobile Fixture',
						firstName: 'Mobile',
						lastName: 'Fixture',
						avatarUrl: '',
						statistics: {
							currentLevel: 1,
							currentXP: 0,
							currentXPGoal: 1000,
						},
					},
				},
				version: 0,
			}),
		)
		localStorage.setItem('accessToken', accessToken)
	})
}

async function installApiFixture(page: Page) {
	await page.route('**/api/v1/**', async route => {
		if (route.request().method() === 'OPTIONS') {
			await route.fulfill({ status: 204, headers: corsHeaders })
			return
		}
		await route.fulfill({
			status: 200,
			headers: { ...corsHeaders, 'content-type': 'application/json' },
			body: JSON.stringify({ success: true, statusCode: 200, data: [] }),
		})
	})
}

test('phone comparison keeps expanded provenance reachable and clear of the floating control', async ({
	page,
}, testInfo) => {
	await page.setViewportSize({ width: 360, height: 640 })
	await installIsolatedSignedInFixture(page)
	await installApiFixture(page)
	await page.route('**/api/v1/knowledge/product/foods**', async route => {
		const url = new URL(route.request().url())
		const foodId = url.pathname.match(/\/foods\/(\d+)\/compounds$/)?.[1]
		const food = foodId === '42' ? 'Apple' : 'Pear'
		if (foodId) {
			const compounds =
				foodId === '42'
					? [
							['Shared record', '9'],
							['Apple-listed record', '10'],
						]
					: [
							['Shared record', '9'],
							['Pear-listed record', '11'],
						]
			await route.fulfill({
				status: 200,
				headers: { ...corsHeaders, 'content-type': 'application/json' },
				body: JSON.stringify({
					success: true,
					statusCode: 200,
					data: {
						status: 'AVAILABLE',
						provenance: graphProvenance,
						food: {
							id: `foodb:1.0:food-id:${foodId}`,
							name: food,
							type: 'Food',
						},
						compounds: compounds.map(([name, id]) => ({
							id: `foodb:1.0:compound-id:${id}`,
							name,
							predicate: 'has_compound',
							presence: 'PRESENT',
							contentRowSupport: 8,
							exportEligibleSupport: 8,
						})),
						filteredKnownRelationCount: 0,
					},
				}),
			})
			return
		}

		const query = url.searchParams.get('q')?.toLowerCase()
		const foods = query?.includes('apple')
			? [{ name: 'Apple', foodId: '42' }]
			: [{ name: 'Pear', foodId: '84' }]
		await route.fulfill({
			status: 200,
			headers: { ...corsHeaders, 'content-type': 'application/json' },
			body: JSON.stringify({
				success: true,
				statusCode: 200,
				data: { provenance: graphProvenance, foods },
			}),
		})
	})

	await page.goto('/explore/graph')
	await page.getByRole('textbox', { name: 'Search first food' }).fill('Apple')
	await page.getByRole('button', { name: /Apple.*Choose/ }).click()
	await page.getByRole('textbox', { name: 'Search second food' }).fill('Pear')
	await page.getByRole('button', { name: /Pear.*Choose/ }).click()
	await page.getByRole('button', { name: /Show what they share/ }).click()
	const results = page.getByRole('region', { name: 'Food comparison results' })
	await expect(results).toContainText('Shared record')
	await expect(results).toContainText('Apple-listed record')
	await expect(results).toContainText('Pear-listed record')
	const provenance = page.locator('summary').filter({
		hasText: 'Where these records come from',
	})
	await provenance.click()
	await expect(page.getByText(PRODUCT_GRAPH_MANIFEST_SHA256)).toBeVisible()

	const scrollButton = page.locator('button[aria-label="Scroll to top"]')
	await page.keyboard.press('PageDown')
	const scrollState = await page.evaluate(() => ({
		top: window.scrollY,
		max: document.documentElement.scrollHeight - window.innerHeight,
	}))
	if (scrollState.top > 400 && scrollState.max - scrollState.top > 48) {
		await expect(scrollButton).toHaveAttribute('aria-hidden', 'false')
	}
	await page.keyboard.press('End')
	await expect(page.getByText(PRODUCT_GRAPH_MANIFEST_SHA256)).toBeVisible()
	await expect(scrollButton).toHaveAttribute('aria-hidden', 'true')
	await expect(scrollButton).toHaveAttribute('tabindex', '-1')
	await page.screenshot({
		path: testInfo.outputPath('phone-comparison-provenance-tail.png'),
	})
})

test('phone recipe detail makes time, servings, ingredients and cook entry findable without starting a session', async ({
	page,
}, testInfo) => {
	await page.setViewportSize({ width: 360, height: 640 })
	const writeRequests: string[] = []
	await page.route('**/api/v1/**', async route => {
		const request = route.request()
		const url = new URL(request.url())
		if (request.method() === 'OPTIONS') {
			await route.fulfill({ status: 204, headers: corsHeaders })
			return
		}
		if (request.method() !== 'GET') writeRequests.push(`${request.method()} ${url.pathname}`)
		if (
			request.method() === 'GET' &&
			url.pathname === '/api/v1/recipes/mobile-readiness-fixture'
		) {
			await route.fulfill({
				status: 200,
				headers: { ...corsHeaders, 'content-type': 'application/json' },
				body: JSON.stringify({
					success: true,
					statusCode: 200,
					data: {
						id: 'mobile-readiness-fixture',
						createdAt: '2026-01-01T00:00:00Z',
						updatedAt: '2026-01-01T00:00:00Z',
						recipeStatus: 'PUBLISHED',
						title: 'Quick tomato chickpea skillet',
						description: 'A warm, simple skillet meal for a weeknight.',
						coverImageUrl: ['/images/recipes/shakshuka.webp'],
						videoUrl: [],
						difficulty: 'Beginner',
						prepTimeMinutes: 10,
						cookTimeMinutes: 15,
						totalTimeMinutes: 25,
						servings: 2,
						cuisineType: 'Mediterranean',
						dietaryTags: [],
						fullIngredientList: [
							{ name: 'chickpeas', quantity: '1', unit: 'can' },
							{ name: 'tomatoes', quantity: '2', unit: 'cups' },
							{ name: 'olive oil', quantity: '1', unit: 'tbsp' },
						],
						steps: [
							{
								stepNumber: 1,
								title: 'Warm the pan',
								description: 'Warm oil in a skillet over medium heat.',
							},
						],
						xpReward: 25,
						difficultyMultiplier: 1,
						rewardBadges: [],
						skillTags: [],
						likeCount: 0,
						saveCount: 0,
						viewCount: 0,
						cookCount: 0,
						author: {
							userId: 'fixture-chef',
							username: 'fixture-chef',
						displayName: 'Fixture Chef',
						},
						isLiked: false,
						isSaved: false,
					},
				}),
			})
			return
		}
		if (
			request.method() === 'GET' &&
			url.pathname ===
				'/api/v1/recipes/mobile-readiness-fixture/social-proof'
		) {
			await route.fulfill({
				status: 200,
				headers: { ...corsHeaders, 'content-type': 'application/json' },
				body: JSON.stringify({
					success: true,
					statusCode: 200,
					data: { cookCount: 0, postCount: 0, recentCookers: [] },
				}),
			})
			return
		}
		await route.fulfill({
			status: 200,
			headers: { ...corsHeaders, 'content-type': 'application/json' },
			body: JSON.stringify({ success: true, statusCode: 200, data: [] }),
		})
	})

	await page.goto('/recipes/mobile-readiness-fixture')
	await expect(
		page.getByRole('heading', { name: 'Quick tomato chickpea skillet' }),
	).toBeVisible()
	await expect(page.getByText('Recipe detail', { exact: true })).not.toBeVisible()
	await expect(page.getByText('Cooking workspace', { exact: true })).not.toBeVisible()
	const time = page.getByText('25 min', { exact: true })
	const servings = page.getByText('2 servings', { exact: true })
	const cooking = page.getByRole('button', { name: /Start Cooking/ })
	const nav = page.getByRole('navigation', { name: 'Mobile navigation' })
	const [timeBox, servingsBox, cookingBox] = await Promise.all([
		time.boundingBox(),
		servings.boundingBox(),
		cooking.boundingBox(),
	])
	expect(timeBox).not.toBeNull()
	expect(servingsBox).not.toBeNull()
	expect(cookingBox).not.toBeNull()
	expect(timeBox!.y).toBeLessThan(cookingBox!.y)
	expect(servingsBox!.y).toBeLessThan(cookingBox!.y)
	await page.screenshot({
		path: testInfo.outputPath('phone-recipe-detail-after-order-fix.png'),
	})

	await cooking.scrollIntoViewIfNeeded()
	await expect(cooking).toBeInViewport()
	const [cookingVisibleBox, navBox] = await Promise.all([
		cooking.boundingBox(),
		nav.boundingBox(),
	])
	expect(cookingVisibleBox).not.toBeNull()
	expect(navBox).not.toBeNull()
	expect(cookingVisibleBox!.y + cookingVisibleBox!.height).toBeLessThanOrEqual(
		navBox!.y,
	)
	await expect(time).toBeVisible()
	await expect(servings).toBeVisible()
	await expect(page.getByRole('heading', { name: 'Ingredients' })).toBeVisible()
	const firstIngredient = page
		.locator('li')
		.filter({ hasText: '1 can chickpeas' })
	.first()
	await firstIngredient.scrollIntoViewIfNeeded()
	await expect(firstIngredient).toBeInViewport()
	await cooking.scrollIntoViewIfNeeded()
	await expect(cooking).toBeInViewport()
	await expect(cooking).toBeEnabled()
	await expect.poll(() => writeRequests.filter(path => path.includes('cook'))).toHaveLength(0)
	await page.screenshot({
		path: testInfo.outputPath('phone-recipe-detail-decision.png'),
	})
})
