import { writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const baseUrl = 'http://127.0.0.1:3100/welcome'
const cases = [
	{ name: 'mobile', width: 390, height: 844 },
	{ name: 'desktop', width: 1440, height: 900 },
]

const browser = await chromium.launch({ headless: true })
const results = []

for (const target of cases) {
	const context = await browser.newContext({
		viewport: { width: target.width, height: target.height },
	})
	const page = await context.newPage()
	const consoleErrors = []
	const pageErrors = []

	page.on('console', message => {
		if (message.type() === 'error') consoleErrors.push(message.text())
	})
	page.on('pageerror', error => pageErrors.push(error.message))

	const response = await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
	await page.waitForLoadState('networkidle')

	const result = await page.evaluate(() => {
		const h1 = document.querySelector('h1')
		const links = [...document.querySelectorAll('a')]
		const meta = (property, contentAttribute = 'property') =>
			document
				.querySelector(`meta[${contentAttribute}="${property}"]`)
				?.getAttribute('content') ?? null

		return {
			title: document.title,
			h1: h1?.textContent?.trim() ?? null,
			h1Count: document.querySelectorAll('h1').length,
			brandTextCount: document.body.innerText.match(/ChefKix/g)?.length ?? 0,
			promiseVisible: document.body.innerText.includes(
				"Scroll what is worth saving. Cook when you're ready.",
			),
			exploreHref:
				links
					.find(link => link.textContent?.includes('See the Community'))
					?.getAttribute('href') ?? null,
			signupHref:
				links
					.find(link =>
						link.textContent?.includes('Join Free to Save and Cook'),
					)
					?.getAttribute('href') ?? null,
			overflow:
				document.documentElement.scrollWidth -
				document.documentElement.clientWidth,
			ogImage: meta('og:image'),
			twitterImage: meta('twitter:image', 'name'),
		}
	})

	await page.screenshot({
		path: `ai/out/q100-welcome-first-impression/${target.name}.png`,
		fullPage: true,
	})

	results.push({
		viewport: target,
		status: response?.status() ?? null,
		consoleErrors,
		pageErrors,
		...result,
	})
	await context.close()
}

await browser.close()
await writeFile(
	'ai/out/q100-welcome-first-impression/runtime-results.json',
	`${JSON.stringify(results, null, 2)}\n`,
)
console.log(JSON.stringify(results, null, 2))
