import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const readWorkspaceFile = (path: string) =>
	readFileSync(join(process.cwd(), path), 'utf8')

describe('api response guardrails', () => {
	it('guards autocomplete payloads before reading nested search data', () => {
		const discovery = readWorkspaceFile(
			'src/components/discover/UserDiscoveryClient.tsx',
		)
		const quickPost = readWorkspaceFile(
			'src/components/social/QuickPostFAB.tsx',
		)

		expect(discovery).toContain('if (!response.success || !response.data)')
		expect(discovery).toContain('return []')
		expect(quickPost).toContain('if (res.success && res.data)')
		expect(quickPost).toContain('setBattleSearchResults([])')
	})

	it('does not feed failed command palette API envelopes into result mapping', () => {
		const commandPalette = readWorkspaceFile(
			'src/components/shared/CommandPalette.tsx',
		)

		expect(commandPalette).toContain('recipeRes.data?.success')
		expect(commandPalette).toContain('userRes.data?.success')
		expect(commandPalette).toContain('setResults([])')
	})
})
