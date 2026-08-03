import fs from 'fs'
import path from 'path'

describe('cooking assistant localization contract', () => {
	it('uses the existing cooking namespace for every visible helper', () => {
		const panel = fs.readFileSync(
			path.join(process.cwd(), 'src/components/cooking/AiAssistPanel.tsx'),
			'utf8',
		)
		const messages = JSON.parse(
			fs.readFileSync(path.join(process.cwd(), 'messages/en.json'), 'utf8'),
		)

		for (const key of ['aiTips', 'aiEnterToAsk', 'aiEscToClose']) {
			expect(panel).toContain(`t('${key}')`)
			expect(messages.cooking[key]).toEqual(expect.any(String))
		}

		expect(panel).not.toMatch(/>\s*Tips\s*</)
		expect(panel).not.toMatch(/\s+to close\s*</)
	})
})
