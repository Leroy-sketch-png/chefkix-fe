import fs from 'node:fs'
import path from 'node:path'
import { formatShortcutLabel, getModifierSymbol } from '../useKeyboardShortcuts'

const productShortcutSources = [
	'src/app/(main)/post/new/page.tsx',
	'src/components/profile/ProfileHeaderGamified.tsx',
	'src/components/recipe/RecipeCreateAiFlow.tsx',
	'src/components/recipe/RecipeFormDetailed.tsx',
	'src/components/recipe/XpPreviewModal.tsx',
	'src/components/shared/CommandPalette.tsx',
]

describe('platform shortcut labels', () => {
	const originalUserAgent = Object.getOwnPropertyDescriptor(
		navigator,
		'userAgent',
	)
	const originalUserAgentData = Object.getOwnPropertyDescriptor(
		navigator,
		'userAgentData',
	)

	afterEach(() => {
		if (originalUserAgent) {
			Object.defineProperty(navigator, 'userAgent', originalUserAgent)
		}
		if (originalUserAgentData) {
			Object.defineProperty(navigator, 'userAgentData', originalUserAgentData)
		} else {
			delete (navigator as Navigator & { userAgentData?: unknown })
				.userAgentData
		}
	})

	it('resolves Apple and non-Apple modifier labels from the shared authority', () => {
		Object.defineProperty(navigator, 'userAgentData', {
			configurable: true,
			value: { platform: 'macOS' },
		})
		expect(getModifierSymbol()).toBe('⌘')

		Object.defineProperty(navigator, 'userAgentData', {
			configurable: true,
			value: { platform: 'Windows' },
		})
		Object.defineProperty(navigator, 'userAgent', {
			configurable: true,
			value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
		})
		expect(getModifierSymbol()).toBe('Ctrl')
	})

	it('formats key labels deterministically with an explicit modifier', () => {
		expect(formatShortcutLabel({ key: 'Enter', ctrl: true }, '⌘')).toBe('⌘+↵')
		expect(
			formatShortcutLabel(
				{ key: 's', ctrl: true, shift: true, alt: false },
				'Ctrl',
			),
		).toBe('Ctrl+Shift+S')
	})

	it('keeps production shortcut displays on the shared authority', () => {
		for (const relativePath of productShortcutSources) {
			const source = fs.readFileSync(
				path.join(process.cwd(), relativePath),
				'utf8',
			)
			expect(source).not.toMatch(
				/\/Mac\|iPhone\|iPad\/|navigator\.userAgentData/,
			)
		}

		expect(
			fs.readFileSync(
				path.join(process.cwd(), 'src/app/(main)/post/new/page.tsx'),
				'utf8',
			),
		).not.toContain('suppressHydrationWarning')
	})
})
