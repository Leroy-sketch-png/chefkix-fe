import { expect, Page, test } from '@playwright/test'

type ModerationResult = { success: boolean; action?: string }

async function prepareStoryPage(page: Page, moderation: ModerationResult) {
	const calls = { moderation: 0, stories: 0 }
	let currentModeration = moderation
	const corsHeaders = {
		'access-control-allow-origin': 'http://localhost:3200',
		'access-control-allow-credentials': 'true',
		'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
		'access-control-allow-headers':
			'authorization, content-type, accept, x-requested-with',
	}

	await page.addInitScript(() => {
		const user = {
			userId: 'story-e2e-user',
			username: 'story-chef',
			email: 'story@example.test',
			displayName: 'Story Chef',
			firstName: 'Story',
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
			sub: 'story-e2e-user',
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
			value: 'story-e2e-refresh-token',
			url: 'http://localhost:3200/',
			httpOnly: true,
			sameSite: 'Strict',
		},
	])

	await page.route('**/api/v1/**', async route => {
		const request = route.request()
		const url = new URL(request.url())
		if (request.method() === 'OPTIONS') {
			await route.fulfill({ status: 204, headers: corsHeaders })
			return
		}

		if (url.pathname.endsWith('/moderate') && request.method() === 'POST') {
			calls.moderation += 1
			await route.fulfill({
				status: currentModeration.success ? 200 : 503,
				headers: { ...corsHeaders, 'content-type': 'application/json' },
				body: JSON.stringify({
					success: currentModeration.success,
					statusCode: currentModeration.success ? 200 : 503,
					data: currentModeration.success
						? currentModeration.action === undefined
							? {}
							: { action: currentModeration.action }
						: null,
				}),
			})
			return
		}

		if (url.pathname.endsWith('/stories') && request.method() === 'POST') {
			calls.stories += 1
			await route.fulfill({
				status: 201,
				headers: { ...corsHeaders, 'content-type': 'application/json' },
				body: JSON.stringify({
					success: true,
					statusCode: 201,
					data: { id: 'story-e2e' },
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
		setModeration: (result: ModerationResult) => {
			currentModeration = result
		},
	}
}

async function fillStory(page: Page, text: string) {
	await page
		.locator('input[type="file"]')
		.first()
		.setInputFiles({
			name: 'story-background.png',
			mimeType: 'image/png',
			buffer: Buffer.from(
				'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jCgAAAABJRU5ErkJggg==',
				'base64',
			),
		})
	await page.getByRole('button', { name: 'Text', exact: true }).click()
	await page.locator('textarea').first().fill(text)
}

test('story overlay text is refused unless moderation approves it', async ({
	page,
}) => {
	const { calls, setModeration } = await prepareStoryPage(page, {
		success: true,
		action: 'flag',
	})
	await page.goto('/story/create')
	await fillStory(page, 'flagged story overlay')
	const submit = page.getByRole('button', { name: 'Share to Story' })
	const attempts: ModerationResult[] = [
		{ success: true, action: 'flag' },
		{ success: true, action: 'block' },
		{ success: true, action: 'unknown' },
		{ success: true },
		{ success: false },
	]

	for (const [index, result] of attempts.entries()) {
		setModeration(result)
		await submit.click()
		await expect.poll(() => calls.moderation).toBe(index + 1)
		await expect(submit).toBeEnabled()
		await expect.poll(() => calls.stories).toBe(0)
		await expect(page.locator('textarea').first()).toHaveValue(
			'flagged story overlay',
		)
	}

	setModeration({ success: true, action: 'approve' })
	await submit.click()
	await expect.poll(() => calls.moderation).toBe(6)
	await expect.poll(() => calls.stories).toBe(1)
	await expect(page).toHaveURL(/\/dashboard$/)
})

test('approved story overlay text can be published', async ({ page }) => {
	const { calls } = await prepareStoryPage(page, {
		success: true,
		action: 'approve',
	})
	await page.goto('/story/create')
	await fillStory(page, 'A safe kitchen moment')
	await page.getByRole('button', { name: 'Share to Story' }).click()

	await expect.poll(() => calls.moderation).toBe(1)
	await expect.poll(() => calls.stories).toBe(1)
	await expect(page).toHaveURL(/\/dashboard$/)
})

test('stories without text overlays do not need moderation', async ({
	page,
}) => {
	const { calls } = await prepareStoryPage(page, { success: true })
	await page.goto('/story/create')
	await page
		.locator('input[type="file"]')
		.first()
		.setInputFiles({
			name: 'story-background.png',
			mimeType: 'image/png',
			buffer: Buffer.from(
				'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jCgAAAABJRU5ErkJggg==',
				'base64',
			),
		})
	await page.getByRole('button', { name: 'Share to Story' }).click()

	await expect.poll(() => calls.stories).toBe(1)
	expect(calls.moderation).toBe(0)
})
