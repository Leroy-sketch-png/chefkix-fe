import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const readSource = (relativePath: string) =>
	readFileSync(join(process.cwd(), relativePath), 'utf8')

const topbarSource = readSource('src/components/layout/Topbar.tsx')
const commandMenuSource = readSource('src/components/ui/command-menu.tsx')
const messages = JSON.parse(readSource('messages/en.json')) as {
	common: Record<string, string>
}

describe('Topbar search and command authority', () => {
	it('keeps direct content search distinct from the command launcher', () => {
		expect(topbarSource).toContain("href='/search'")
		expect(topbarSource).toContain("aria-label={t('tbSearchLabel')}")
		expect(topbarSource).toContain('<Menu className=')
		expect(topbarSource).toContain("aria-label={tCommon('openCommandMenu')}")
		expect(topbarSource).not.toContain(
			"aria-label={tCommon('search')}\n\t\t\t\ttitle=",
		)
	})

	it('names the dialog and command query by their actual jobs', () => {
		expect(commandMenuSource).toContain("aria-label={tCommon('commandMenu')}")
		expect(commandMenuSource).toContain(
			"aria-label={tCommon('commandPlaceholder')}",
		)
	})

	it('keeps exact common copy for launcher semantics', () => {
		expect(messages.common.commandMenu).toBe('Command menu')
		expect(messages.common.openCommandMenu).toBe('Open command menu')
		expect(messages.common.commandPlaceholder).toBe('Search commands...')
	})

	it('preserves the keyboard launcher and command destinations', () => {
		expect(topbarSource).toContain("event.key.toLowerCase() === 'k'")
		for (const commandId of [
			'create-post',
			'start-cooking',
			'search-recipes',
			'nav-feed',
			'nav-messages',
			'nav-profile',
			'nav-settings',
		]) {
			expect(topbarSource).toContain(`id: '${commandId}'`)
		}
	})
})
