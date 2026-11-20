import fs from 'fs'
import path from 'path'

describe('cooking preview exit copy', () => {
	const read = (file: string) =>
		fs.readFileSync(path.join(process.cwd(), file), 'utf8')

	it('does not promise saved progress when leaving a local-only preview', () => {
		const messages = JSON.parse(read('messages/en.json')) as {
			cooking: Record<string, string>
		}
		const player = read('src/components/cooking/CookingPlayer.tsx')
		const panel = read('src/components/cooking/CookingPanel.tsx')

		expect(messages.cooking.abandonDesc).toBe(
			'This cooking session will end and cannot be resumed.',
		)
		expect(messages.cooking.previewAbandonDesc).toMatch(
			/preview will end.*No cooking progress or XP will be saved/i,
		)
		expect(player).toContain(
			"isPreviewMode ? 'previewAbandonDesc' : 'abandonDesc'",
		)
		expect(player).toMatch(
			/useStepPhotos\(\s*isPreviewMode \? undefined : session\?\.sessionId,?\s*\)/,
		)
		expect(panel).toMatch(
			/useStepPhotos\(\s*isPreviewMode \? undefined : session\?\.sessionId,?\s*\)/,
		)
	})
})
