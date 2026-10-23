import { expect, Page, test } from '@playwright/test'

const groupId = 'group-moderation-e2e'

type ModerationResult = {
	success: boolean
	action?: string
	reason?: string
}

type ApiCalls = {
	moderation: number
	groupPost: number
	groupPostBody: string
}

async function prepareAuthenticatedPage(page: Page) {
	const calls: ApiCalls = { moderation: 0, groupPost: 0, groupPostBody: '' }
	let moderation: ModerationResult = {
		success: true,
		action: 'flag',
		reason: 'Needs a moderation check',
	}
	let groupPostStatus = 201
	let groupPostSuccess = true
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

		if (url.pathname.endsWith('/moderate') && method === 'POST') {
			calls.moderation += 1
			await route.fulfill({
				status: 200,
				headers: { ...corsHeaders, 'content-type': 'application/json' },
				body: JSON.stringify({
					success: moderation.success,
					statusCode: moderation.success ? 200 : 503,
					message: moderation.success ? 'OK' : 'Moderation unavailable',
					data: moderation.success
						? {
								action: moderation.action,
								reason: moderation.reason,
							}
						: null,
				}),
			})
			return
		}

		if (url.pathname.endsWith(`/group/${groupId}`) && method === 'GET') {
			await route.fulfill({
				status: 200,
				headers: { ...corsHeaders, 'content-type': 'application/json' },
				body: JSON.stringify({
					success: true,
					statusCode: 200,
					data: {
						id: groupId,
						name: 'Weeknight Cooks',
						description: 'Practical dinner ideas',
						coverImageUrl: null,
						privacyType: 'PUBLIC',
						creatorId: 'owner-e2e',
						ownerId: 'owner-e2e',
						memberCount: 2,
						tags: [],
						rules: [],
						createdAt: new Date().toISOString(),
						myRole: 'MEMBER',
						myStatus: 'ACTIVE',
					},
				}),
			})
			return
		}

		if (url.pathname.endsWith(`/posts/groups/${groupId}/posts`)) {
			if (method === 'POST') {
				calls.groupPost += 1
				calls.groupPostBody = request.postData() ?? ''
				await route.fulfill({
					status: groupPostStatus,
					headers: { ...corsHeaders, 'content-type': 'application/json' },
					body: JSON.stringify(
						groupPostSuccess
							? {
									success: true,
									statusCode: 201,
									data: {
										id: 'group-post-e2e',
										content: 'Approved group dinner update',
									},
								}
							: {
									success: false,
									statusCode: 400,
									message: 'Content moderation failed',
									data: null,
								},
					),
				})
				return
			}

			await route.fulfill({
				status: 200,
				headers: { ...corsHeaders, 'content-type': 'application/json' },
				body: JSON.stringify({ success: true, statusCode: 200, data: [] }),
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
			moderation = result
		},
		setGroupPostResult: (success: boolean, status: number) => {
			groupPostSuccess = success
			groupPostStatus = status
		},
	}
}

test('group posts require moderation approval and preserve refused drafts', async ({
	page,
}) => {
	const { calls, setModeration, setGroupPostResult } =
		await prepareAuthenticatedPage(page)
	await page.goto(`/groups/${groupId}`)
	await expect(page.getByText('Weeknight Cooks').first()).toBeVisible()
	await page.getByRole('tab', { name: 'Posts' }).click()

	const composer = page.locator('[data-group-post-box]')
	await composer.getByRole('button', { name: "What's on your mind?" }).click()
	const caption = composer.getByRole('textbox')
	const submit = composer.getByRole('button', { name: 'Post', exact: true })

	await caption.fill('flagged group caption')
	await submit.click()
	await expect.poll(() => calls.moderation, { timeout: 2_000 }).toBe(1)
	await expect(
		page.getByText(
			"Your post needs a moderation check and wasn't published. Please try again later.",
		),
	).toBeVisible()
	await expect(caption).toHaveValue('flagged group caption')
	expect(calls.groupPost).toBe(0)

	setModeration({ success: true, action: 'block' })
	await caption.fill('blocked group caption')
	await submit.click()
	await expect.poll(() => calls.moderation).toBe(2)
	await expect(
		page.getByText(
			'Your post contains content that violates our community guidelines.',
		),
	).toBeVisible()
	await expect(caption).toHaveValue('blocked group caption')
	expect(calls.groupPost).toBe(0)

	setModeration({ success: true, action: 'unrecognized' })
	await caption.fill('unconfirmed group caption')
	await submit.click()
	await expect.poll(() => calls.moderation).toBe(3)
	await expect(caption).toHaveValue('unconfirmed group caption')
	expect(calls.groupPost).toBe(0)

	setModeration({ success: true })
	await caption.fill('missing group moderation result')
	await submit.click()
	await expect.poll(() => calls.moderation).toBe(4)
	await expect(caption).toHaveValue('missing group moderation result')
	expect(calls.groupPost).toBe(0)

	setModeration({ success: false })
	await caption.fill('unchecked group caption')
	await submit.click()
	await expect.poll(() => calls.moderation).toBe(5)
	await expect(caption).toHaveValue('unchecked group caption')
	expect(calls.groupPost).toBe(0)

	setModeration({ success: true, action: 'approve' })
	setGroupPostResult(false, 400)
	await caption.fill('server-rejected group caption')
	await submit.click()
	await expect.poll(() => calls.moderation).toBe(6)
	await expect.poll(() => calls.groupPost).toBe(1)
	await expect(page.getByText("Couldn't create post")).toBeVisible()
	await expect(caption).toHaveValue('server-rejected group caption')

	setGroupPostResult(true, 201)
	await caption.fill('Approved group dinner update')
	await submit.click()
	await expect.poll(() => calls.moderation).toBe(7)
	await expect.poll(() => calls.groupPost).toBe(2)
	await expect(composer.getByRole('button', { name: 'Post' })).toHaveCount(0)
	await expect(
		composer.getByRole('button', { name: "What's on your mind?" }),
	).toBeVisible()
	expect(calls.groupPostBody).toContain('Approved group dinner update')
})
