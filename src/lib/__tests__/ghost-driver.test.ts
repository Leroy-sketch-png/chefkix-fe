import { queryGhostSelectors } from '../ghost-driver'

describe('queryGhostSelectors', () => {
	beforeEach(() => {
		document.body.innerHTML = `
			<main>
				<button>Start Cooking</button>
				<button>Cook Recipe</button>
				<a href="/messages">Messages</a>
				<div data-testid="stable-target">Stable target</div>
			</main>
		`
	})

	it('supports text selectors alongside standard selector fallbacks', () => {
		const matches = queryGhostSelectors(
			'[data-testid="missing"], button:has-text("Start Cooking"), a[href="/messages"]',
		)

		expect(matches).toHaveLength(2)
		expect(matches[0].textContent).toContain('Start Cooking')
		expect(matches[1].getAttribute('href')).toBe('/messages')
	})

	it('returns every matching fallback in stable selector order', () => {
		const matches = queryGhostSelectors(
			'button:has-text("Cook"), [data-testid="stable-target"]',
		)

		expect(matches).toHaveLength(3)
		expect(matches.map(element => element.textContent?.trim())).toEqual([
			'Start Cooking',
			'Cook Recipe',
			'Stable target',
		])
	})
})
