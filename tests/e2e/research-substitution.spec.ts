import { expect, Page, test } from '@playwright/test'

const researchEnabled =
	process.env.NEXT_PUBLIC_GRAPH_RESEARCH_ENABLED === 'true'

const recipe = {
	id: 'recipe-e2e',
	createdAt: '2026-01-01T00:00:00Z',
	updatedAt: '2026-01-01T00:00:00Z',
	recipeStatus: 'PUBLISHED',
	title: 'Butter toast',
	description: 'Toast with butter.',
	coverImageUrl: [],
	videoUrl: [],
	difficulty: 'Beginner',
	prepTimeMinutes: 1,
	cookTimeMinutes: 2,
	totalTimeMinutes: 3,
	servings: 1,
	cuisineType: 'American',
	dietaryTags: [],
	fullIngredientList: [{ name: 'butter', quantity: '1', unit: 'tbsp' }],
	steps: [{ stepNumber: 1, title: 'Toast', description: 'Toast the bread.' }],
	xpReward: 0,
	difficultyMultiplier: 1,
	rewardBadges: [],
	skillTags: [],
	likeCount: 0,
	saveCount: 0,
	viewCount: 1,
	cookCount: 0,
	author: { userId: 'author-e2e', username: 'e2e-chef' },
	isLiked: false,
	isSaved: false,
}

async function prepareAuthenticatedPage(page: Page) {
	const calls = {
		research: 0,
		researchBody: '',
		product: 0,
		productBody: '',
		otherAi: 0,
	}
	await page.addInitScript(() => {
		const user = {
			userId: 'user-e2e',
			username: 'e2e-chef',
			email: 'e2e@example.test',
			displayName: 'E2E Chef',
			firstName: 'E2E',
			lastName: 'Chef',
			avatarUrl: '',
			statistics: {
				currentLevel: 1,
				currentXP: 0,
				currentXPGoal: 1000,
				streakCount: 0,
				recipeCount: 0,
				postCount: 0,
			},
		}
		const encode = (value: object) =>
			btoa(JSON.stringify(value))
				.replace(/=/g, '')
				.replace(/\+/g, '-')
				.replace(/\//g, '_')
		const accessToken = `${encode({ alg: 'none', typ: 'JWT' })}.${encode({
			sub: 'user-e2e',
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + 3600,
		})}.e2e-signature`
		localStorage.setItem(
			'auth-storage',
			JSON.stringify({
				state: { isAuthenticated: true, accessToken, user, isLoading: false },
				version: 0,
			}),
		)
		localStorage.setItem('accessToken', accessToken)
	})
	await page.context().addCookies([
		{
			name: 'refresh_token',
			value: 'e2e-refresh-token',
			url: 'http://localhost:3200/',
			httpOnly: true,
			sameSite: 'Strict',
		},
	])
	await page.route('**/api/v1/**', async route => {
		const request = route.request()
		const pathname = new URL(request.url()).pathname
		if (pathname.endsWith('/recipes/recipe-e2e/social-proof')) {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					success: true,
					statusCode: 200,
					data: { cookCount: 0, postCount: 0, recentCookers: [] },
				}),
			})
			return
		}
		if (
			pathname.endsWith('/recipes/recipe-e2e') &&
			request.method() === 'GET'
		) {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ success: true, statusCode: 200, data: recipe }),
			})
			return
		}
		if (pathname.endsWith('/research/suggest_substitutions')) {
			calls.research += 1
			calls.researchBody = request.postData() ?? ''
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					contractVersion: 'graph-preflight-v2',
					sourceIdentityStatus: 'unresolved',
					sourceIngredientId: null,
					graphStatus: 'not_evaluated',
					disposition: 'abstain',
					abstentionReason: 'source_identity_unresolved',
				}),
			})
			return
		}
		if (pathname.endsWith('/suggest_substitutions')) {
			calls.product += 1
			calls.productBody = request.postData() ?? ''
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					success: true,
					statusCode: 200,
					data: { substitutions: [] },
				}),
			})
			return
		}
		if (pathname.includes('/api/v1/')) calls.otherAi += 1
		await route.fulfill({
			status: 404,
			contentType: 'application/json',
			body: JSON.stringify({ success: false, statusCode: 404, data: null }),
		})
	})
	return calls
}

test('uses the normal product substitution route when research is default-off', async ({
	page,
}) => {
	test.skip(researchEnabled, 'Research route is enabled for this build.')
	const calls = await prepareAuthenticatedPage(page)
	await page.goto('/recipes/recipe-e2e')
	await page.getByRole('button', { name: 'Find substitute for butter' }).click()

	await expect(page.getByText('No substitutions found')).toBeVisible()
	await expect.poll(() => calls.product).toBe(1)
	expect(calls.research).toBe(0)
	expect(JSON.parse(calls.productBody)).toEqual({
		ingredient: 'butter',
		reason: 'unavailable',
		recipe_context: 'Recipe: Butter toast',
	})
})

test('uses the source-only research route and withholds legacy suggestions when enabled', async ({
	page,
}) => {
	test.skip(!researchEnabled, 'Requires the explicit research build flag.')
	const calls = await prepareAuthenticatedPage(page)
	await page.goto('/recipes/recipe-e2e')
	await page.getByRole('button', { name: 'Find substitute for butter' }).click()

	await expect(
		page.getByText('Ingredient identity could not be resolved exactly.'),
	).toBeVisible()
	expect(calls.research).toBe(1)
	expect(JSON.parse(calls.researchBody)).toEqual({ ingredient: 'butter' })
	expect(calls.product).toBe(0)
})
