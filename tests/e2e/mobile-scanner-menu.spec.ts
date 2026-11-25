import { expect, test, type Page } from '@playwright/test'

const loopbackOrigin = 'http://localhost:3200'

async function installLoopbackFixtures(page: Page) {
	await page.route('**/*', async route => {
		const url = new URL(route.request().url())
		if (url.origin !== loopbackOrigin) {
			await route.abort()
			return
		}

		if (url.pathname.startsWith('/api/v1/')) {
			await route.fulfill({
				status: route.request().method() === 'OPTIONS' ? 204 : 200,
				headers: { 'content-type': 'application/json' },
				body:
					route.request().method() === 'OPTIONS'
						? ''
						: JSON.stringify({ success: true, statusCode: 200, data: [] }),
			})
			return
		}

		await route.continue()
	})
}

async function tabUntilFocused(page: Page, locator: ReturnType<Page['getByRole']>) {
	for (let attempt = 0; attempt < 40; attempt += 1) {
		await page.keyboard.press('Tab')
		if (await locator.evaluate(element => element === document.activeElement)) {
			return
		}
	}
	throw new Error('Kitchen Scanner was not reachable by ordinary Tab navigation')
}

test('first pointer activation opens the guest More menu and routes to Kitchen Scanner', async ({
	page,
}) => {
	await page.setViewportSize({ width: 360, height: 640 })
	await installLoopbackFixtures(page)
	await page.goto('/explore')

	const more = page.getByRole('button', { name: 'More', exact: true })
	await expect(more).toBeVisible()
	await more.click()
	await expect(more).toHaveAttribute('aria-expanded', 'true')
	await expect(page.getByRole('dialog', { name: 'Cookie consent' })).toBeVisible()
	await expect(page.getByRole('button', { name: 'Kitchen Scanner' })).toBeVisible()

	// Adjacent shared drawer control: closing it must restore the same page.
	await page.getByRole('button', { name: 'Close menu' }).click()
	await expect(more).toHaveAttribute('aria-expanded', 'false')
	await expect(page).toHaveURL(/\/explore$/)

	await more.click()
	await page.getByRole('button', { name: 'Kitchen Scanner' }).click()
	await expect(page).toHaveURL(/\/scan$/)
	await expect(
		page.getByRole('heading', { name: 'Choose what you want from a food photo' }),
	).toBeVisible()
})

test('first keyboard navigation preserves More and Kitchen Scanner activation', async ({
	page,
}) => {
	await page.setViewportSize({ width: 360, height: 640 })
	await installLoopbackFixtures(page)
	await page.goto('/explore')
	const keyboardMore = page.getByRole('button', { name: 'More', exact: true })
	await tabUntilFocused(page, keyboardMore)
	await expect(page.getByRole('dialog', { name: 'Cookie consent' })).toBeVisible()
	await page.keyboard.press('Enter')
	await expect(keyboardMore).toHaveAttribute('aria-expanded', 'true')

	const scanner = page.getByRole('button', { name: 'Kitchen Scanner' })
	await tabUntilFocused(page, scanner)
	await page.keyboard.press('Enter')
	await expect(page).toHaveURL(/\/scan$/)
	await expect(
		page.getByRole('heading', { name: 'Choose what you want from a food photo' }),
	).toBeVisible()
})
