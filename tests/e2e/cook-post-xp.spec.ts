import { expect, Page, test } from '@playwright/test'

const sessionId = 'session-e2e'

type ApiCalls = {
	guard: number
	createPost: number
	linkPost: number
}

async function prepareAuthenticatedPage(
	page: Page,
	guardAction: 'approve' | 'block',
) {
	const calls: ApiCalls = { guard: 0, createPost: 0, linkPost: 0 }
	let activeGuardAction = guardAction
	const corsHeaders = {
		'access-control-allow-origin': 'http://localhost:3200',
		'access-control-allow-credentials': 'true',
		'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
		'access-control-allow-headers':
			'authorization, content-type, accept, x-requested-with',
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
		const url = new URL(request.url())
		const method = request.method()

		if (method === 'OPTIONS') {
			await route.fulfill({ status: 204, headers: corsHeaders })
			return
		}

		if (url.pathname.endsWith('/ml/content-guard')) {
			calls.guard += 1
			await route.fulfill({
				status: 200,
				headers: { ...corsHeaders, 'content-type': 'application/json' },
				body: JSON.stringify({
					success: true,
					statusCode: 200,
					data: {
						action: activeGuardAction,
						category: activeGuardAction === 'block' ? 'harmful' : 'clean',
						reasons:
							activeGuardAction === 'block' ? ['revise this caption'] : [],
						modelVersion: 'e2e',
					},
				}),
			})
			return
		}

		if (url.pathname.endsWith(`/cooking-sessions/${sessionId}/link-post`)) {
			calls.linkPost += 1
			await route.fulfill({
				status: 200,
				headers: { ...corsHeaders, 'content-type': 'application/json' },
				body: JSON.stringify({
					success: true,
					statusCode: 200,
					data: { xpAwarded: 80, badgesEarned: ['first-share'] },
				}),
			})
			return
		}

		if (
			url.pathname.endsWith(`/cooking-sessions/${sessionId}`) &&
			method === 'GET'
		) {
			await route.fulfill({
				status: 200,
				headers: { ...corsHeaders, 'content-type': 'application/json' },
				body: JSON.stringify({
					success: true,
					statusCode: 200,
					data: {
						sessionId,
						recipeId: 'recipe-e2e',
						recipe: {
							id: 'recipe-e2e',
							title: 'Miso Ramen',
							coverImageUrl: [],
						},
						status: 'completed',
						pendingXp: 80,
						completedAt: new Date().toISOString(),
						postDeadline: new Date(
							Date.now() + 7 * 24 * 60 * 60 * 1000,
						).toISOString(),
					},
				}),
			})
			return
		}

		if (url.pathname.endsWith('/posts') && method === 'POST') {
			calls.createPost += 1
			await route.fulfill({
				status: 200,
				headers: { ...corsHeaders, 'content-type': 'application/json' },
				body: JSON.stringify({
					success: true,
					statusCode: 200,
					data: {
						id: 'post-e2e',
						userId: 'user-e2e',
						content: 'Cooked Miso Ramen!',
						sessionId,
					},
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

	return {
		calls,
		setGuardAction: (action: 'approve' | 'block') => {
			activeGuardAction = action
		},
	}
}

test('moderation blocks unsafe captions and approved cook posts claim XP', async ({
	page,
}) => {
	const { calls, setGuardAction } = await prepareAuthenticatedPage(
		page,
		'block',
	)
	await page.goto(`/post/new?session=${sessionId}`)

	const caption = page.getByTestId('post-composer-caption')
	const submit = page.getByTestId('post-composer-submit')
	await expect(caption).toBeVisible()
	await caption.fill('blocked caption')
	await submit.click()

	await expect(submit).toBeEnabled()
	await expect.poll(() => calls.guard).toBe(1)
	expect(calls.createPost).toBe(0)
	expect(calls.linkPost).toBe(0)

	setGuardAction('approve')
	await caption.fill('Cooked Miso Ramen!')
	await expect(submit).toContainText('Post for up to 80 XP')
	await submit.click()

	await expect
		.poll(() =>
			page.evaluate(() => {
				const post = sessionStorage.getItem('newPost')
				return post ? JSON.parse(post).xpEarned : null
			}),
		)
		.toBe(80)
	await expect.poll(() => calls.guard).toBe(2)
	expect(calls.createPost).toBe(1)
	expect(calls.linkPost).toBe(1)
	await expect
		.poll(() =>
			page.evaluate(() => {
				const post = sessionStorage.getItem('newPost')
				return post ? JSON.parse(post).id : null
			}),
		)
		.toBe('post-e2e')
})
