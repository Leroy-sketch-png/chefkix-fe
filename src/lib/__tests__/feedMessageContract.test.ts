import fs from 'fs'
import path from 'path'

describe('feed message contract', () => {
	it('defines every literal feed translation key in the feed namespace', () => {
		const source = fs.readFileSync(
			path.join(process.cwd(), 'src/app/(main)/feed/page.tsx'),
			'utf8',
		)
		const messages = JSON.parse(
			fs.readFileSync(path.join(process.cwd(), 'messages/en.json'), 'utf8'),
		) as { feed: Record<string, string> }
		const usedKeys = Array.from(
			new Set(
				Array.from(
					source.matchAll(/\bt\(['"]([^'"]+)['"]/g),
					match => match[1],
				),
			),
		)

		expect(usedKeys.filter(key => !(key in messages.feed))).toEqual([])
	})
})
