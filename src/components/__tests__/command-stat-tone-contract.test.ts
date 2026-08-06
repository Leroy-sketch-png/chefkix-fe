import fs from 'node:fs'
import path from 'node:path'
import {
	getCommandStatToneClass,
	type CommandStatTone,
} from '@/components/layout/command-stat-tone'

const expectedClasses: Record<CommandStatTone, string> = {
	brand: 'border-brand/20 bg-brand/8 text-brand',
	info: 'border-info/20 bg-info/8 text-info',
	success: 'border-success/20 bg-success/8 text-success',
	warning: 'border-warning/20 bg-warning/8 text-warning',
	xp: 'border-xp/20 bg-xp/8 text-xp',
	streak: 'border-streak/20 bg-streak/8 text-streak',
	error: 'border-error/20 bg-error/8 text-error',
	muted: 'border-border-subtle bg-bg-elevated text-text-muted',
}

const consumers = [
	'layout/CommandDeckBase.tsx',
	'community/CommunityCommandDeck.tsx',
	'challenges/ChallengesCommandDeck.tsx',
	'settings/SettingsCommandDeck.tsx',
	'pantry/PantryCommandDeck.tsx',
	'shopping-lists/ShoppingListsCommandDeck.tsx',
]

function readComponent(relativePath: string): string {
	return fs.readFileSync(
		path.join(process.cwd(), 'src/components', relativePath),
		'utf8',
	)
}

describe('command-stat tone authority', () => {
	it('owns every semantic token combination in one typed resolver', () => {
		for (const [tone, className] of Object.entries(expectedClasses)) {
			expect(getCommandStatToneClass(tone as CommandStatTone)).toBe(className)
		}
	})

	it('removes private canonical maps and the ambiguous social tone', () => {
		for (const consumer of consumers) {
			const source = readComponent(consumer)
			expect(source).toContain('getCommandStatToneClass')
			expect(source).not.toMatch(/const toneClass = \{/)
			expect(source).not.toMatch(/tone=['"]social['"]/)
			expect(source).not.toMatch(/'brand' \| 'xp' \| 'social'/)
		}
	})

	it('keeps positive social counts successful and zero counts neutral', () => {
		expect(readComponent('community/CommunityCommandDeck.tsx')).toContain(
			"tone={counts.friends > 0 ? 'success' : 'muted'}",
		)
		expect(readComponent('challenges/ChallengesCommandDeck.tsx')).toContain(
			"tone={counts.community > 0 ? 'success' : 'muted'}",
		)
	})
})
