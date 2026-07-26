import fs from 'fs'
import path from 'path'

const source = (relativePath: string) =>
	fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')

describe('runtime app preference contract', () => {
	it('composes one runtime owner after reduced-motion ownership', () => {
		const layout = source('src/app/layout.tsx')
		expect(layout).toMatch(
			/<ReducedMotionProvider>[\s\S]*<RuntimePreferencesProvider>/,
		)
	})

	it('gates both cooking wake-lock callers with the persisted preference', () => {
		for (const file of [
			'src/components/cooking/CookingPlayer.tsx',
			'src/components/cooking/CookingPanel.tsx',
		]) {
			const contents = source(file)
			expect(contents.match(/useWakeLock\(/g)).toHaveLength(1)
			expect(contents).toMatch(
				/useWakeLock\([\s\S]{0,180}runtimePreferences\.keepScreenOn/,
			)
			expect(contents).toMatch(
				/useWakeLock\([\s\S]{0,180}preferencesReady/,
			)
		}
	})

	it('gates instructional autoplay without changing communication media', () => {
		const steps = source('src/components/cooking/StepV2Renderer.tsx')
		const callMedia = source('src/components/chat/MediaStage.tsx')

		expect(steps).toContain(
			'autoPlay={preferencesReady && preferences.autoPlayVideos}',
		)
		expect(callMedia.match(/\bautoPlay\b/g)?.length).toBeGreaterThanOrEqual(2)
	})

	it('applies Settings changes immediately and restores runtime on failure', () => {
		const settings = source('src/app/(main)/settings/page.tsx')

		expect(settings).toContain('applyRuntimePreferences(newApp)')
		expect(
			settings.match(/applyRuntimePreferences\(previousSettings\.app\)/g),
		).toHaveLength(2)
		expect(settings).not.toContain('setMotionPreference(')
	})
})
