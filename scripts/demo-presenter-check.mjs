#!/usr/bin/env node

import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const baseUrl = process.env.CHEFKIX_DEMO_BASE_URL || 'http://localhost:3000'
const headless = process.env.CHEFKIX_DEMO_HEADLESS !== '0'
const timeoutMs = Number(process.env.CHEFKIX_DEMO_TIMEOUT_MS || 420000)
const reportDir = path.join(rootDir, 'test-results', 'demo-presenter-check')
const seedHeadlessIoEvidence =
	headless && process.env.CHEFKIX_DEMO_SEED_IO_CERT !== '0'
const ioCertificationStorageKey = 'chefkix-demo-io-certification-v1'
const ioCertificationCheckIds = [
	'media',
	'speaker',
	'clap',
	'voice',
	'timer',
	'turn',
]

const knownBrokenImagePattern =
	/photo-1482049016530-d79f7d5e8c6e|photo-1596097635121-14b63a7a7e7b/i

const beatPlan = [
	{
		label: 'Beat 1',
		button: /Beat\s*1/i,
		url: /\/welcome(?:$|[?#])/i,
		scene: {
			label: 'Cooking Audio scene',
			button: /^Cooking Audio$/i,
			url: /\/recipes\/[^/?#]+(?:[?#].*)?$/i,
			content: /Guide me aloud|Stay quiet|Cooking|Step/i,
		},
	},
	{
		label: 'Beat 2',
		button: /Beat\s*2/i,
		url: /\/search\?q=cozy(?:%20|\+)winter(?:%20|\+)food/i,
	},
	{
		label: 'Beat 3',
		button: /Beat\s*3/i,
		url: /\/cook-together(?:\/room)?(?:$|[?#])/i,
	},
	{
		label: 'Beat 4',
		button: /Beat\s*4/i,
		url: /\/pantry(?:$|[?#])/i,
		scene: {
			label: 'Plan Today scene',
			button: /^Plan Today$/i,
			url: /\/meal-planner(?:$|[?#])/i,
		},
	},
	{
		label: 'Beat 5',
		button: /Beat\s*5/i,
		url: /\/creator(?:$|[?#])/i,
	},
	{
		label: 'Beat 6',
		button: /Beat\s*6/i,
		url: /\/admin\/reports(?:$|[?#])/i,
	},
]

function nowStamp() {
	return new Date().toISOString().replace(/[:.]/g, '-')
}

function classifyConsole(text) {
	const lower = text.toLowerCase()
	if (/err_aborted|net::err_aborted/.test(lower)) return 'abort-noise'
	if (/failed to load resource: the server responded with a status of/i.test(text))
		return 'resource-status'
	if (/wake lock|wakelock/.test(lower)) return 'wake-lock'
	if (/beforeunload/.test(lower)) return 'beforeunload'
	if (/image with src|priority property|largest contentful paint|lcp/i.test(text))
		return 'next-image'
	if (/useScroll\(\) container|position:\s*static|framer/i.test(text))
		return 'framer-scroll'
	if (/shadow-sm|forbidden design/i.test(text)) return 'design-token'
	if (/hydration|did not match/i.test(text)) return 'hydration'
	if (/error|failed|warning|warn/i.test(text)) return 'general'
	return 'other'
}

function installSignals(page, pageName, signals) {
	page.on('console', msg => {
		const text = msg.text()
		signals.console.push({
			page: pageName,
			type: msg.type(),
			bucket: classifyConsole(text),
			url: page.url(),
			text: text.slice(0, 1200),
		})
	})

	page.on('pageerror', err => {
		signals.pageErrors.push({
			page: pageName,
			url: page.url(),
			message: String(err?.message || err).slice(0, 1200),
		})
	})

	page.on('request', req => {
		const url = req.url()
		if (knownBrokenImagePattern.test(url)) {
			signals.knownBrokenImageRequests.push({
				page: pageName,
				url,
				method: req.method(),
				resourceType: req.resourceType(),
				reason: 'requested',
			})
		}
	})

	page.on('requestfailed', req => {
		const failure = req.failure()?.errorText || ''
		const row = {
			page: pageName,
			url: req.url(),
			method: req.method(),
			resourceType: req.resourceType(),
			failure,
		}
		signals.failedRequests.push(row)
		if (knownBrokenImagePattern.test(row.url)) {
			signals.knownBrokenImageRequests.push({ ...row, reason: 'failed' })
		}
	})

	page.on('response', res => {
		const status = res.status()
		if (status === 401 || status === 404 || status === 409 || status >= 500) {
			signals.statusResponses.push({
				page: pageName,
				status,
				url: res.url(),
			})
		}
	})
}

async function bodyText(page) {
	return page.evaluate(() => document.body?.innerText || '')
}

async function gateText(page) {
	return page.evaluate(() => {
		const text = document.body?.innerText || ''
		const match = text.match(
			/Cockpit Command Gate([\s\S]*?)(Panic Actions|Presenter Notes|$)/i,
		)
		return (match ? match[1] : text).trim()
	})
}

async function commandGateState(page) {
	return page.getByTestId('demo-command-gate').evaluate(element => ({
		commandId: element.getAttribute('data-command-id') || '',
		status: element.getAttribute('data-command-status') || 'idle',
		type: element.getAttribute('data-command-type') || '',
		text: element.innerText.trim(),
	}))
}

async function clickButton(page, name, label) {
	const visibleDialogs = await page.getByRole('dialog').allTextContents()
	if (visibleDialogs.length > 0) {
		throw new Error(
			`${label}: unexpected dialog blocks presenter controls: ${visibleDialogs
				.map(text => text.trim().replace(/\s+/g, ' '))
				.filter(Boolean)
				.join(' | ')}`,
		)
	}

	const button = page.getByRole('button', { name }).first()
	await button.waitFor({ state: 'visible', timeout: timeoutMs })
	await button.click({ timeout: 60000 })
	await page.waitForTimeout(150)
	const text = await bodyText(page)
	if (/Remote bus is not connected/i.test(text)) {
		throw new Error(`${label}: remote bus is not connected`)
	}
}

async function waitForBody(page, pattern, label) {
	await page.waitForFunction(
		source => new RegExp(source, 'i').test(document.body?.innerText || ''),
		pattern.source,
		{ timeout: timeoutMs },
	)
	return bodyText(page)
}

async function waitForGateTerminal(page, label, previousCommandId = '') {
	const gate = page.getByTestId('demo-command-gate')
	await gate.waitFor({ state: 'visible', timeout: 30000 })
	await page.waitForFunction(
		previousId => {
			const element = document.querySelector(
				'[data-testid="demo-command-gate"]',
			)
			const commandId = element?.getAttribute('data-command-id') || ''
			return Boolean(commandId) && commandId !== previousId
		},
		previousCommandId,
		{ timeout: 30000 },
	)

	await page.waitForFunction(
		() => {
			const element = document.querySelector(
				'[data-testid="demo-command-gate"]',
			)
			const status = element?.getAttribute('data-command-status') || ''
			return status === 'success' || status === 'failed'
		},
		undefined,
		{ timeout: timeoutMs },
	)

	const state = await commandGateState(page)
	if (state.status === 'failed') {
		throw new Error(`${label}: command gate failed: ${state.text}`)
	}
	if (state.status !== 'success') {
		throw new Error(
			`${label}: command gate did not report success: ${state.text}`,
		)
	}
	return state.text
}

async function routeSnapshot(page) {
	return page.evaluate(patternSource => {
		const pattern = new RegExp(patternSource, 'i')
		const body = document.body?.innerText || ''
		const images = Array.from(document.images).map(img => ({
			src: img.getAttribute('src') || '',
			currentSrc: img.currentSrc || '',
			alt: img.alt || '',
			complete: img.complete,
			naturalWidth: img.naturalWidth,
			naturalHeight: img.naturalHeight,
		}))

		return {
			title: document.title,
			readyState: document.readyState,
			url: location.href,
			bodyLength: body.length,
			h1: Array.from(document.querySelectorAll('h1'))
				.map(node => node.textContent?.trim())
				.filter(Boolean)
				.slice(0, 4),
			loadingMentions: (body.match(/loading|please wait|skeleton/gi) || [])
				.length,
			visibleButtons: Array.from(document.querySelectorAll('button')).filter(
				button => button.offsetParent !== null,
			).length,
			knownBrokenImagesInDom: images.filter(image =>
				pattern.test(`${image.src} ${image.currentSrc}`),
			),
			brokenRenderedImages: images
				.filter(image => image.complete && image.naturalWidth === 0)
				.slice(0, 12),
		}
	}, knownBrokenImagePattern.source)
}

async function assertCockpitRoute(page, planned) {
	const routeTimeoutMs = Math.min(timeoutMs, 60000)
	await page.waitForURL(planned.url, { timeout: routeTimeoutMs })
	await page.waitForLoadState('domcontentloaded', { timeout: 60000 }).catch(() => {})
	await page.waitForFunction(
		() => document.readyState === 'interactive' || document.readyState === 'complete',
		undefined,
		{ timeout: 60000 },
	)
	await page
		.waitForFunction(
			() => (document.body?.innerText || '').trim().length >= 200,
			undefined,
			{ timeout: 60000 },
		)
		.catch(() => {})
	if (planned.content) {
		await page.waitForFunction(
			source => new RegExp(source, 'i').test(document.body?.innerText || ''),
			planned.content.source,
			{ timeout: routeTimeoutMs },
		)
	}
	const snapshot = await routeSnapshot(page)
	if (snapshot.bodyLength < 200) {
		throw new Error(`${planned.label}: cockpit body is suspiciously sparse`)
	}
	if (snapshot.knownBrokenImagesInDom.length > 0) {
		throw new Error(`${planned.label}: known broken image is present in DOM`)
	}
	return snapshot
}

function summarizeSignals(signals) {
	const criticalConsole = signals.console.filter(item => {
		if (!['warning', 'error'].includes(item.type)) return false
		return !['abort-noise', 'other', 'resource-status'].includes(item.bucket)
	})
	const nonAbortFailedRequests = signals.failedRequests.filter(
		item => !/ERR_ABORTED|net::ERR_ABORTED/i.test(item.failure),
	)
	const clientStatusFailures = signals.statusResponses.filter(item =>
		[401, 404, 409].includes(item.status),
	)
	const serverFailures = signals.statusResponses.filter(item => item.status >= 500)

	return {
		criticalConsole,
		nonAbortFailedRequests,
		clientStatusFailures,
		serverFailures,
		hardFailureCount:
			criticalConsole.length +
			nonAbortFailedRequests.length +
			clientStatusFailures.length +
			serverFailures.length +
			signals.pageErrors.length +
			signals.knownBrokenImageRequests.length,
	}
}

async function main() {
	await mkdir(reportDir, { recursive: true })

	const signals = {
		console: [],
		pageErrors: [],
		failedRequests: [],
		statusResponses: [],
		knownBrokenImageRequests: [],
	}
	const steps = []
	const reportPath = path.join(reportDir, `presenter-check-${nowStamp()}.json`)

	const browser = await chromium.launch({ headless })
	const context = await browser.newContext({
		viewport: { width: 1440, height: 1000 },
	})
	if (seedHeadlessIoEvidence) {
		await context.addInitScript(
			({ key, ids }) => {
				const verifiedAt = new Date().toISOString()
				const evidence = Object.fromEntries(
					ids.map(id => [
						id,
						{
							status: 'pass',
							detail:
								'Headless presenter-check route seed. Physical laptop I/O still requires cockpit certification.',
							verifiedAt,
						},
					]),
				)
				window.localStorage.setItem(key, JSON.stringify(evidence))
			},
			{
				key: ioCertificationStorageKey,
				ids: ioCertificationCheckIds,
			},
		)
	}
	const cockpit = await context.newPage()
	const remote = await context.newPage()
	installSignals(cockpit, 'cockpit', signals)
	installSignals(remote, 'remote', signals)

	try {
		await cockpit.goto(`${baseUrl}/demo-cockpit`, {
			waitUntil: 'domcontentloaded',
			timeout: timeoutMs,
		})
		await remote.goto(`${baseUrl}/demo-remote`, {
			waitUntil: 'domcontentloaded',
			timeout: timeoutMs,
		})
		await waitForBody(remote, /Run Checks/, 'remote shell')
		await waitForBody(
			remote,
			/CONTROL (LIVE|WITH WAKE RISK)/,
			'remote command authority',
		)
		steps.push({
			step: 'load remote and cockpit',
			remoteUrl: remote.url(),
			cockpitUrl: cockpit.url(),
			gate: await gateText(remote),
		})

		const preflightGateBefore = await commandGateState(remote)
		await clickButton(remote, /^Run Checks$/i, 'Run Checks')
		await waitForBody(remote, /Verdict:\s*GO/, 'pre-show checklist')
		const preflightGate = await waitForGateTerminal(
			remote,
			'Run Checks',
			preflightGateBefore.commandId,
		)
		steps.push({
			step: 'Run Checks',
			gate: preflightGate,
		})

		for (const planned of beatPlan) {
			const previousGate = await commandGateState(remote)
			await clickButton(remote, planned.button, planned.label)
			const gate = await waitForGateTerminal(
				remote,
				planned.label,
				previousGate.commandId,
			)
			const snapshot = await assertCockpitRoute(cockpit, planned)
			steps.push({
				step: planned.label,
				gate,
				snapshot,
			})
			if (planned.scene) {
				const previousSceneGate = await commandGateState(remote)
				await clickButton(
					remote,
					planned.scene.button,
					planned.scene.label,
				)
				const sceneGate = await waitForGateTerminal(
					remote,
					planned.scene.label,
					previousSceneGate.commandId,
				)
				const sceneSnapshot = await assertCockpitRoute(
					cockpit,
					planned.scene,
				)
				steps.push({
					step: planned.scene.label,
					gate: sceneGate,
					snapshot: sceneSnapshot,
				})
			}
			await remote.waitForTimeout(1200)
		}

		const summary = summarizeSignals(signals)
		const report = {
			ok: summary.hardFailureCount === 0,
			baseUrl,
			headless,
			seedHeadlessIoEvidence,
			timeoutMs,
			startedAt: new Date().toISOString(),
			steps,
			signals,
			summary: {
				consoleCount: signals.console.length,
				criticalConsoleCount: summary.criticalConsole.length,
				pageErrorCount: signals.pageErrors.length,
				nonAbortFailedRequestCount: summary.nonAbortFailedRequests.length,
				statusResponseCount: signals.statusResponses.length,
				clientStatusFailureCount: summary.clientStatusFailures.length,
				serverFailureCount: summary.serverFailures.length,
				knownBrokenImageRequestCount:
					signals.knownBrokenImageRequests.length,
				hardFailureCount: summary.hardFailureCount,
				criticalConsole: summary.criticalConsole,
				nonAbortFailedRequests: summary.nonAbortFailedRequests,
				clientStatusFailures: summary.clientStatusFailures,
				serverFailures: summary.serverFailures,
			},
		}
		await writeFile(reportPath, JSON.stringify(report, null, 2))

		console.log(`Presenter check report: ${reportPath}`)
		console.log(
			`Presenter check: ${report.ok ? 'PASS' : 'FAIL'} (${steps.length} steps, ${summary.hardFailureCount} hard signal failures)`,
		)
		if (!report.ok) {
			process.exitCode = 1
		}
	} catch (error) {
		const report = {
			ok: false,
			baseUrl,
			headless,
			seedHeadlessIoEvidence,
			timeoutMs,
			error: String(error?.stack || error),
			steps,
			cockpitUrl: cockpit.url(),
			remoteUrl: remote.url(),
			cockpitText: (await bodyText(cockpit).catch(() => '')).slice(0, 5000),
			remoteText: (await bodyText(remote).catch(() => '')).slice(0, 5000),
			gate: await gateText(remote).catch(() => ''),
			signals,
		}
		await writeFile(reportPath, JSON.stringify(report, null, 2))
		console.error(`Presenter check report: ${reportPath}`)
		console.error(String(error?.stack || error))
		process.exitCode = 1
	} finally {
		await browser.close()
	}
}

await main()
