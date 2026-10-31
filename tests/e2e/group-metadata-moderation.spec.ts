import { expect, Page, test } from '@playwright/test'

type ModerationResult = { success: boolean; action?: string }

async function prepareGroupsPage(page: Page) {
	const calls = {
		moderation: 0,
		createGroup: 0,
		updateGroup: 0,
		changePrivacy: 0,
		requestBody: '',
		privacyRequestBody: '',
	}
	let moderation: ModerationResult = { success: true, action: 'flag' }
	const corsHeaders = {
		'access-control-allow-origin': 'http://localhost:3200',
		'access-control-allow-credentials': 'true',
		'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
		'access-control-allow-headers':
			'authorization, content-type, accept, x-requested-with',
	}

	await page.addInitScript(() => {
		const user = {
			userId: 'group-metadata-e2e-user',
			username: 'group-chef',
			email: 'group@example.test',
			displayName: 'Group Chef',
			firstName: 'Group',
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
			sub: 'group-metadata-e2e-user',
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
			value: 'group-metadata-e2e-refresh-token',
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
				status: moderation.success ? 200 : 503,
				headers: { ...corsHeaders, 'content-type': 'application/json' },
				body: JSON.stringify({
					success: moderation.success,
					statusCode: moderation.success ? 200 : 503,
					data: moderation.success
						? moderation.action === undefined
							? {}
							: { action: moderation.action }
						: null,
				}),
			})
			return
		}

		if (url.pathname === '/api/v1/group' && request.method() === 'POST') {
			calls.createGroup += 1
			calls.requestBody = request.postData() ?? ''
			await route.fulfill({
				status: 201,
				headers: { ...corsHeaders, 'content-type': 'application/json' },
				body: JSON.stringify({
					success: true,
					statusCode: 201,
					data: {
						id: 'group-metadata-e2e',
						name: 'Weeknight Cooks',
						description: 'Practical meals',
						privacyType: 'PUBLIC',
						memberCount: 1,
						tags: ['meal prep', 'weeknight'],
						createdAt: new Date().toISOString(),
					},
				}),
			})
			return
		}

		if (
			url.pathname === '/api/v1/group/group-metadata-e2e' &&
			request.method() === 'GET'
		) {
			await route.fulfill({
				status: 200,
				headers: { ...corsHeaders, 'content-type': 'application/json' },
				body: JSON.stringify({
					success: true,
					statusCode: 200,
					data: {
						id: 'group-metadata-e2e',
						name: 'Weeknight Cooks',
						description: 'Practical meals',
						privacyType: 'PUBLIC',
						creatorId: 'group-metadata-e2e-user',
						ownerId: 'group-metadata-e2e-user',
						memberCount: 1,
						tags: ['meal prep'],
						myRole: 'ADMIN',
						myStatus: 'ACTIVE',
					},
				}),
			})
			return
		}

		if (
			url.pathname === '/api/v1/group/group-metadata-e2e' &&
			request.method() === 'PATCH'
		) {
			calls.updateGroup += 1
			await route.fulfill({
				status: 200,
				headers: { ...corsHeaders, 'content-type': 'application/json' },
				body: JSON.stringify({
					success: true,
					statusCode: 200,
					data: {
						id: 'group-metadata-e2e',
						name: 'Weeknight Cooks',
						description: 'Practical meals',
						privacyType: 'PUBLIC',
						tags: ['meal prep'],
					},
				}),
			})
			return
		}

		if (
			url.pathname === '/api/v1/group/group-metadata-e2e/privacy' &&
			request.method() === 'PATCH'
		) {
			calls.changePrivacy += 1
			calls.privacyRequestBody = request.postData() ?? ''
			await route.fulfill({
				status: 200,
				headers: { ...corsHeaders, 'content-type': 'application/json' },
				body: JSON.stringify({
					success: true,
					statusCode: 200,
					data: { id: 'group-metadata-e2e', privacyType: 'PRIVATE' },
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
			moderation = result
		},
	}
}

test('group metadata needs approval and preserves tags on retry', async ({
	page,
}) => {
	const { calls, setModeration } = await prepareGroupsPage(page)
	await page.goto('/groups')
	await page
		.getByRole('button', { name: 'Create Group', exact: true })
		.first()
		.click()
	const dialog = page.getByRole('dialog')
	await dialog
		.getByRole('textbox', { name: 'Group Name *' })
		.fill('Weeknight Cooks')
	await dialog
		.getByRole('textbox', { name: 'Description' })
		.fill('Practical meals')
	await dialog
		.getByRole('textbox', { name: 'Tags' })
		.fill('meal prep, weeknight')
	await dialog.getByRole('combobox').click()
	await page.getByRole('option', { name: /Private/ }).click()
	const submit = dialog.getByRole('button', {
		name: 'Create Group',
		exact: true,
	})

	setModeration({ success: false })
	await submit.click()
	await expect.poll(() => calls.moderation).toBe(1)
	await expect.poll(() => calls.createGroup).toBe(0)
	await expect(
		dialog.getByRole('textbox', { name: 'Group Name *' }),
	).toHaveValue('Weeknight Cooks')

	setModeration({ success: true, action: 'flag' })
	await submit.click()
	await expect.poll(() => calls.moderation).toBe(2)
	await expect.poll(() => calls.createGroup).toBe(0)

	setModeration({ success: true, action: 'approve' })
	await submit.click()
	await expect.poll(() => calls.moderation).toBe(3)
	await expect.poll(() => calls.createGroup).toBe(1)
	await expect(dialog).toBeHidden()
	expect(JSON.parse(calls.requestBody)).toMatchObject({
		name: 'Weeknight Cooks',
		description: 'Practical meals',
		privacyType: 'PRIVATE',
		tags: ['meal prep', 'weeknight'],
	})
})

test('group settings blocks flagged metadata updates before saving', async ({
	page,
}) => {
	const { calls } = await prepareGroupsPage(page)
	await page.goto('/groups/group-metadata-e2e')
	await expect(
		page.getByRole('heading', { name: 'Weeknight Cooks' }),
	).toBeVisible()
	await page.getByRole('button', { name: 'Group options' }).click()
	await page.getByRole('menuitem', { name: 'Group Settings' }).click()

	const dialog = page.getByRole('dialog')
	await dialog.locator('input').first().fill('Unsafe Group')
	await dialog.locator('textarea').fill('Updated description')
	await dialog.getByRole('button', { name: 'Save Changes' }).click()

	await expect.poll(() => calls.moderation).toBe(1)
	await expect.poll(() => calls.updateGroup).toBe(0)
	await expect(dialog).toBeVisible()
})

test('privacy-only changes skip text moderation and send password confirmation', async ({
	page,
}) => {
	const { calls } = await prepareGroupsPage(page)
	await page.goto('/groups/group-metadata-e2e')
	await expect(
		page.getByRole('heading', { name: 'Weeknight Cooks' }),
	).toBeVisible()
	await page.getByRole('button', { name: 'Group options' }).click()
	await page.getByRole('menuitem', { name: 'Group Settings' }).click()

	const dialog = page.getByRole('dialog')
	await dialog.getByRole('combobox').click()
	await page.getByRole('option', { name: /Private/ }).click()
	const password = dialog.locator('input[type="password"]')
	await expect(password).toBeVisible()
	await dialog.getByRole('button', { name: 'Save Changes' }).click()
	await expect(
		page.getByText('Enter your password to change group privacy'),
	).toBeVisible()
	expect(calls.updateGroup).toBe(0)
	expect(calls.changePrivacy).toBe(0)

	await password.fill('chef-password')
	await dialog.getByRole('button', { name: 'Save Changes' }).click()

	await expect.poll(() => calls.moderation).toBe(0)
	await expect.poll(() => calls.updateGroup).toBe(1)
	await expect.poll(() => calls.changePrivacy).toBe(1)
	expect(JSON.parse(calls.privacyRequestBody)).toMatchObject({
		privacyType: 'PRIVATE',
		confirmationPassword: 'chef-password',
	})
})
