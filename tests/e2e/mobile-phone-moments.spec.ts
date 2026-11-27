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

test('phone recipe detail keeps signed-out cook intent tied to the recipe', async ({
	page,
}, testInfo) => {
	await page.setViewportSize({ width: 360, height: 640 })
	const writeRequests: string[] = []
	await page.route('**/*', async route => {
		const url = new URL(route.request().url())
		if (url.origin !== apiOrigin) {
			await route.abort('blockedbyclient')
			return
		}
		await route.continue()
	})
	await page.route('**/api/v1/**', async route => {
		const request = route.request()
		const url = new URL(request.url())
		if (request.method() === 'OPTIONS') {
			await route.fulfill({ status: 204, headers: corsHeaders })
			return
		}
		if (request.method() !== 'GET') {
			writeRequests.push(`${request.method()} ${url.pathname}`)
			await route.abort('blockedbyclient')
			return
		}
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
			url.pathname === '/api/v1/recipes/mobile-readiness-fixture/social-proof'
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
	await expect(
		page.getByText('Recipe detail', { exact: true }),
	).not.toBeVisible()
	await expect(
		page.getByText('Cooking workspace', { exact: true }),
	).not.toBeVisible()
	const time = page.getByText('Total Time: 25 min', { exact: true })
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
	await expect
		.poll(() => writeRequests.filter(path => path.includes('cook')))
		.toHaveLength(0)
	await page.screenshot({
		path: testInfo.outputPath('phone-recipe-detail-decision.png'),
	})

	await cooking.click()
	const authGate = page.getByRole('dialog', { name: 'Ready to cook?' })
	await expect(authGate).toContainText('Ready to cook?')
	await authGate.getByRole('button', { name: 'Sign In' }).click()
	await expect(page).toHaveURL(
		/\/auth\/sign-in\?returnTo=%2Frecipes%2Fmobile-readiness-fixture$/,
	)
	await expect(writeRequests).toEqual([])

	await page.goto('/recipes/mobile-readiness-fixture')
	await page.getByRole('button', { name: /Start Cooking/ }).click()
	const secondAuthGate = page.getByRole('dialog', { name: 'Ready to cook?' })
	await expect(secondAuthGate).toContainText('Ready to cook?')
	await secondAuthGate.getByRole('button', { name: 'Create Account' }).click()
	await expect(page).toHaveURL(
		/\/auth\/sign-up\?returnTo=%2Frecipes%2Fmobile-readiness-fixture$/,
	)
	await expect(writeRequests).toEqual([])
})

test('successful fixture sign-in returns to the intended recipe without starting a cook', async ({
	page,
}) => {
	await page.setViewportSize({ width: 360, height: 640 })
	const cookingSessionWrites: string[] = []
	await page.route('**/*', async route => {
		const url = new URL(route.request().url())
		if (url.origin !== apiOrigin) {
			await route.abort('blockedbyclient')
			return
		}
		await route.continue()
	})
	await page.route('**/api/v1/**', async route => {
		const request = route.request()
		const url = new URL(request.url())
		if (request.method() === 'OPTIONS') {
			await route.fulfill({ status: 204, headers: corsHeaders })
			return
		}
		if (
			request.method() === 'POST' &&
			url.pathname === '/api/v1/auth/login'
		) {
			await route.fulfill({
				status: 200,
				headers: { ...corsHeaders, 'content-type': 'application/json' },
				body: JSON.stringify({
					success: true,
					statusCode: 200,
					data: { accessToken: 'synthetic-recipe-return-token' },
				}),
			})
			return
		}
		if (
			request.method() === 'GET' &&
			url.pathname === '/api/v1/auth/me'
		) {
			await route.fulfill({
				status: 200,
				headers: { ...corsHeaders, 'content-type': 'application/json' },
				body: JSON.stringify({
					success: true,
					statusCode: 200,
					data: {
						profileId: 'synthetic-profile',
						userId: 'fixture-chef',
						email: 'fixture@example.test',
						username: 'fixture-cook',
						firstName: 'Fixture',
						lastName: 'Cook',
						dob: '2000-01-01',
						displayName: 'Fixture Cook',
						phoneNumber: null,
						avatarUrl: '',
						bio: '',
						accountType: 'normal',
						location: '',
						preferences: [],
						statistics: {
							currentLevel: 1,
							currentXP: 0,
							currentXPGoal: 1000,
						},
						createdAt: '2026-01-01T00:00:00Z',
						updatedAt: '2026-01-01T00:00:00Z',
					},
				}),
			})
			return
		}
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
						title: 'Quick tomato chickpea skillet',
						description: 'A warm, simple skillet meal for a weeknight.',
						coverImageUrl: ['/images/recipes/shakshuka.webp'],
						difficulty: 'Beginner',
						prepTimeMinutes: 10,
						cookTimeMinutes: 15,
						totalTimeMinutes: 25,
						servings: 2,
						cuisineType: 'Mediterranean',
						fullIngredientList: [
							{ name: 'chickpeas', quantity: '1', unit: 'can' },
						],
						steps: [
							{
								stepNumber: 1,
								title: 'Warm the pan',
								description: 'Warm oil in a skillet over medium heat.',
							},
						],
						author: {
							userId: 'fixture-chef',
							username: 'fixture-chef',
							displayName: 'Fixture Chef',
						},
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
		if (request.method() !== 'GET') {
			if (url.pathname.startsWith('/api/v1/cooking-sessions')) {
				cookingSessionWrites.push(`${request.method()} ${url.pathname}`)
			}
			await route.abort('blockedbyclient')
			return
		}
		await route.fulfill({
			status: 200,
			headers: { ...corsHeaders, 'content-type': 'application/json' },
			body: JSON.stringify({ success: true, statusCode: 200, data: [] }),
		})
	})

	await page.goto(
		'/auth/sign-in?returnTo=%2Frecipes%2Fmobile-readiness-fixture',
	)
	await page.getByTestId('signin-username').fill('fixture@example.test')
	await page.getByTestId('signin-password').fill('synthetic-only-password')
	await page.getByTestId('signin-submit').click()
	await expect(page).toHaveURL(
		/\/recipes\/mobile-readiness-fixture$/,
	)
	await expect(
		page.getByRole('heading', { name: 'Quick tomato chickpea skillet' }),
	).toBeVisible()
	await expect(
		page.getByRole('button', { name: /Start Cooking/ }),
	).toBeEnabled()
	await page.getByRole('button', { name: 'Manage' }).click()
	await page
		.getByRole('menuitem', { name: 'Preview cooking', exact: true })
		.click()
	await expect(page.getByText('Preview Mode', { exact: true })).toBeVisible()
	expect(cookingSessionWrites).toEqual([])
})

test('phone local cooking preview keeps the active step readable and does not start hardware or a real session', async ({
	page,
}, testInfo) => {
	const pageErrors: string[] = []
	page.on('pageerror', error =>
		pageErrors.push(error.name + ': ' + error.message),
	)
	await page.setViewportSize({ width: 360, height: 640 })
	await page.addInitScript(() => {
		const previewWindow = window as typeof window & {
			__previewMediaRequests: number
			__previewVoiceStarts: number
			__previewWakeLockRequests: number
		}
		previewWindow.__previewMediaRequests = 0
		previewWindow.__previewVoiceStarts = 0
		previewWindow.__previewWakeLockRequests = 0

		Object.defineProperty(navigator, 'mediaDevices', {
			configurable: true,
			value: {
				getUserMedia: async () => {
					previewWindow.__previewMediaRequests += 1
					throw new DOMException(
						'Blocked by the test fixture',
						'NotAllowedError',
					)
				},
			},
		})

		class FixtureSpeechRecognition extends EventTarget {
			lang = ''
			continuous = false
			interimResults = false
			maxAlternatives = 1
			onresult: ((event: Event) => void) | null = null
			onerror: ((event: Event) => void) | null = null
			onend: (() => void) | null = null

			start() {
				previewWindow.__previewVoiceStarts += 1
				return true
			}

			stop() {}
		}

		Object.defineProperty(window, 'SpeechRecognition', {
			configurable: true,
			value: FixtureSpeechRecognition,
		})
		Object.defineProperty(navigator, 'wakeLock', {
			configurable: true,
			value: {
				request: async () => {
					previewWindow.__previewWakeLockRequests += 1
					return { release: async () => {}, addEventListener: () => {} }
				},
			},
		})
	})
	await installIsolatedSignedInFixture(page)
	const writeRequests: string[] = []
	await page.route('**/api/v1/**', async route => {
		const request = route.request()
		const url = new URL(request.url())
		if (request.method() === 'OPTIONS') {
			await route.fulfill({ status: 204, headers: corsHeaders })
			return
		}
		if (request.method() !== 'GET')
			writeRequests.push(`${request.method()} ${url.pathname}`)
		if (
			request.method() === 'GET' &&
			url.pathname === '/api/v1/recipes/mobile-preview-fixture'
		) {
			await route.fulfill({
				status: 200,
				headers: { ...corsHeaders, 'content-type': 'application/json' },
				body: JSON.stringify({
					success: true,
					statusCode: 200,
					data: {
						id: 'mobile-preview-fixture',
						createdAt: '2026-01-01T00:00:00Z',
						updatedAt: '2026-01-01T00:00:00Z',
						recipeStatus: 'DRAFT',
						title: 'Preview a simple chickpea skillet',
						description:
							'A short local preview fixture for the cooking player.',
						coverImageUrl: ['/images/recipes/shakshuka.webp'],
						videoUrl: [],
						difficulty: 'Beginner',
						prepTimeMinutes: 5,
						cookTimeMinutes: 10,
						totalTimeMinutes: 15,
						servings: 2,
						cuisineType: 'Mediterranean',
						dietaryTags: [],
						fullIngredientList: [
							{ name: 'chickpeas', quantity: '1', unit: 'can' },
						],
						steps: [
							{
								stepNumber: 1,
								title: 'Warm the pan',
								description: 'Warm oil in a skillet over medium heat.',
								timerSeconds: 90,
							},
							{
								stepNumber: 2,
								title: 'Add the chickpeas',
								description: 'Add the chickpeas and stir gently.',
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
							userId: 'mobile-visual-fixture',
							username: 'mobile-fixture',
							displayName: 'Mobile Fixture',
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
			url.pathname === '/api/v1/recipes/mobile-preview-fixture/social-proof'
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

	await page.goto('/recipes/mobile-preview-fixture')
	await expect(
		page.getByRole('heading', { name: 'Preview a simple chickpea skillet' }),
	).toBeVisible()
	await page.getByRole('button', { name: 'Manage' }).click()
	await page.getByRole('menuitem', { name: 'Preview cooking' }).click()
	const beginPreview = page.getByRole('button', { name: "Let's Cook!" })
	await expect(beginPreview).toBeInViewport()
	await page.screenshot({
		path: testInfo.outputPath('phone-cooking-preview-prep.png'),
	})
	const firstInstruction = page
		.getByText('Warm oil in a skillet over medium heat.', { exact: true })
		.last()
	const timer = page.getByRole('timer')
	const nextStep = page.getByRole('button', { name: /Next/ }).last()
	await beginPreview.click()
	await expect(firstInstruction).toBeVisible()
	await expect(firstInstruction).toBeInViewport()
	await expect(timer).toBeInViewport()
	await expect(nextStep).toBeInViewport()
	const [instructionBox, timerBox, nextBox] = await Promise.all([
		firstInstruction.boundingBox(),
		timer.boundingBox(),
		nextStep.boundingBox(),
	])
	for (const box of [instructionBox, timerBox, nextBox]) {
		expect(box).not.toBeNull()
		expect(box!.y).toBeGreaterThanOrEqual(0)
		expect(box!.y + box!.height).toBeLessThanOrEqual(640)
	}
	await expect(timer).toHaveAttribute('aria-label', /Paused/)
	await page.screenshot({
		path: testInfo.outputPath('phone-cooking-preview-active-step.png'),
	})

	await page.keyboard.press('ArrowRight')
	await expect(
		page
			.getByText('Add the chickpeas and stir gently.', { exact: true })
			.last(),
	).toBeVisible()
	await page.keyboard.press('ArrowLeft')
	await expect(firstInstruction).toBeVisible()

	// The in-player Scan escape hatch should return the same preview state, not
	// silently reset the instruction or start a real cooking session.
	const scanIngredients = page.getByRole('link', { name: 'Scan ingredients' })
	await expect(scanIngredients).toBeVisible()
	await scanIngredients.click()
	await expect(page).toHaveURL(/\/scan(?:[/?#]|$)/)
	const scanHeading = page.getByRole('heading', {
		name: 'Choose what you want from a food photo',
	})
	await expect(scanHeading).toBeInViewport()
	await expect
		.poll(() =>
			scanHeading.evaluate(element => {
				const rect = element.getBoundingClientRect()
				const hit = document.elementFromPoint(
					rect.left + rect.width / 2,
					rect.top + rect.height / 2,
				)
				return hit === element || element.contains(hit)
			}),
		)
		.toBe(true)
	await page.screenshot({
		path: testInfo.outputPath('phone-cooking-preview-scan-destination.png'),
	})
	await page.goBack()
	await expect(page).toHaveURL(/\/recipes\/mobile-preview-fixture(?:[/?#]|$)/)
	await expect(firstInstruction).toBeVisible()
	await expect(timer).toHaveAttribute('aria-label', /Paused/)
	await expect(nextStep).toBeVisible()
	await expect
		.poll(() =>
			page.evaluate(() => {
				const tracked = window as typeof window & {
					__previewMediaRequests: number
					__previewVoiceStarts: number
					__previewWakeLockRequests: number
				}
				return [
					tracked.__previewMediaRequests,
					tracked.__previewVoiceStarts,
					tracked.__previewWakeLockRequests,
				]
			}),
		)
		.toEqual([0, 0, 0])
	const previewBlocksNavigation = await page.evaluate(() => {
		const event = new Event('beforeunload', { cancelable: true })
		window.dispatchEvent(event)
		return event.defaultPrevented
	})
	expect(previewBlocksNavigation).toBe(false)
	expect(pageErrors).toEqual([])
	expect(
		writeRequests.filter(request => /\/cooking-sessions(?:\/|$)/.test(request)),
	).toEqual([])
})
