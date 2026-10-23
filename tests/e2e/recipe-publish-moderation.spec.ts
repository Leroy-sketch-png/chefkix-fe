import { expect, Page, test } from '@playwright/test'

const draftId = 'recipe-publish-e2e'
const moderationMessage =
	'Recipe content was flagged by moderation and cannot be published'

async function prepareRecipePublishPage(page: Page) {
	const calls = {
		guard: 0,
		validation: 0,
		publish: 0,
		saveDraft: 0,
		status: 'DRAFT',
	}
	let guardAction = 'flag'
	let allowPublish = false
	const corsHeaders = {
		'access-control-allow-origin': 'http://localhost:3200',
		'access-control-allow-credentials': 'true',
		'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
		'access-control-allow-headers':
			'authorization, content-type, accept, x-requested-with',
	}
	const draft = {
		id: draftId,
		userId: 'user-e2e',
		status: calls.status,
		title: 'E2E Tomato Pasta',
		description: 'A simple recipe used by the publish browser regression.',
		coverImageUrl: ['/images/recipes/shakshuka.webp'],
		difficulty: 'MEDIUM',
		cookTimeMinutes: 20,
		servings: 2,
		cuisineType: 'Italian',
		fullIngredientList: [{ name: 'tomato', quantity: '2', unit: 'cups' }],
		steps: [{ stepNumber: 1, description: 'Cook the tomatoes.' }],
		xpReward: 25,
		xpBreakdown: { base: 10, steps: 10, time: 5, total: 25 },
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
			statistics: { currentLevel: 1, currentXP: 0, currentXPGoal: 1000 },
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
		const json = (body: unknown, status = 200) =>
			route.fulfill({
				status,
				headers: { ...corsHeaders, 'content-type': 'application/json' },
				body: JSON.stringify(body),
			})

		if (method === 'OPTIONS') {
			await route.fulfill({ status: 204, headers: corsHeaders })
			return
		}

		if (url.pathname.endsWith('/ml/content-guard')) {
			calls.guard += 1
			await json({
				success: true,
				statusCode: 200,
				data: {
					action: guardAction,
					category: guardAction === 'approve' ? 'clean' : 'review',
					reasons:
						guardAction === 'flag' ? ['Moderation review is required.'] : [],
				},
			})
			return
		}

		if (url.pathname.endsWith('/calculate_metas')) {
			await json({
				success: true,
				statusCode: 200,
				data: {
					xpBreakdown: { base: 10, steps: 10, time: 5, total: 25 },
					xpReward: 25,
					xpValidated: false,
					badges: [],
					skillTags: [],
				},
			})
			return
		}

		if (url.pathname.endsWith('/validate_recipe')) {
			calls.validation += 1
			await json({
				success: true,
				statusCode: 200,
				data: { contentSafe: true, issues: [] },
			})
			return
		}

		if (
			url.pathname.endsWith(`/recipes/${draftId}/publish`) &&
			method === 'POST'
		) {
			calls.publish += 1
			if (!allowPublish) {
				await json(
					{
						success: false,
						statusCode: 400,
						code: 'RECIPE_MODERATION_FAILED',
						message: moderationMessage,
					},
					400,
				)
				return
			}
			calls.status = 'PUBLISHED'
			await json({
				success: true,
				statusCode: 200,
				data: { isPublished: true, qualityScore: 80, qualityTier: 'Good' },
			})
			return
		}

		if (url.pathname.endsWith(`/recipes/${draftId}`) && method === 'GET') {
			await json({
				success: true,
				statusCode: 200,
				data: { ...draft, status: calls.status },
			})
			return
		}

		if (url.pathname.endsWith(`/recipes/${draftId}`) && method === 'PATCH') {
			calls.saveDraft += 1
			await json({ success: true, statusCode: 200, data: draft })
			return
		}

		await json({ success: true, statusCode: 200, data: [] })
	})

	return {
		calls,
		setGuardAction: (action: string) => {
			guardAction = action
		},
		allowPublish: () => {
			allowPublish = true
		},
	}
}

test('recipe moderation failures keep the draft unpublished and allow a safe retry', async ({
	page,
}) => {
	const { calls, setGuardAction, allowPublish } =
		await prepareRecipePublishPage(page)
	await page.goto(`/create?draftId=${draftId}`)

	await expect(page.getByRole('textbox', { name: 'Recipe Title' })).toHaveValue(
		'E2E Tomato Pasta',
	)
	await page.getByTestId('recipe-ai-preview-xp').click()
	const preview = page.getByRole('dialog', { name: 'XP Preview' })
	await expect(preview).toBeVisible()
	await preview.getByRole('button', { name: /Publish Recipe/ }).click()
	const confirm = page.getByRole('alertdialog')
	const confirmPublish = confirm.getByRole('button', { name: 'Publish!' })
	await expect(confirmPublish).toBeVisible()

	await confirmPublish.click()
	await expect(page.getByText('Moderation review is required.')).toBeVisible()
	await expect.poll(() => calls.guard).toBe(1)
	expect(calls.publish).toBe(0)
	expect(calls.status).toBe('DRAFT')

	setGuardAction('approve')
	await confirmPublish.click()
	await expect(page.getByText(moderationMessage)).toBeVisible()
	await expect.poll(() => calls.publish).toBe(1)
	expect(calls.validation).toBe(1)
	expect(calls.status).toBe('DRAFT')
	await expect(page).toHaveURL(new RegExp(`/create\\?draftId=${draftId}$`))

	allowPublish()
	await confirmPublish.click()
	await expect(page).toHaveURL(new RegExp(`/recipes/${draftId}$`))
	await expect.poll(() => calls.publish).toBe(2)
	expect(calls.guard).toBe(3)
	expect(calls.validation).toBe(2)
	expect(calls.saveDraft).toBeGreaterThan(0)
	expect(calls.status).toBe('PUBLISHED')
})
