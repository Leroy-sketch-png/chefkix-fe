import fs from 'fs'
import path from 'path'

const read = (relativePath: string) =>
	fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')

describe('Story viewer trust contract', () => {
	it('accepts only the Story deep-link query input', () => {
		const route = read('src/app/(main)/story/view/[userId]/page.tsx')

		expect(route).toContain(
			'searchParams: Promise<{ startAt?: string | string[] }>',
		)
		expect(route).toContain('startAtStoryId={startAtStoryId || null}')
		expect(route).not.toMatch(/\bname\b.*searchParams|searchParams.*\bname\b/)
		expect(route).not.toMatch(/\bavatar\b.*searchParams|searchParams.*\bavatar\b/)
	})

	it('uses profile authority and contains no photo-only audio control', () => {
		const viewer = read('src/components/story/StoryViewer.tsx')

		expect(viewer).toContain(
			"import { getProfileByUserId } from '@/services/profile'",
		)
		expect(viewer).toContain('getProfileDisplayName(authorProfile)')
		expect(viewer).toContain('onComposingChange={setIsComposing}')
		expect(viewer).toContain(
			'const isPaused = isManuallyPaused || isHolding || isComposing',
		)
		expect(viewer).not.toMatch(/\bauthorName\b|\bauthorAvatar\b/)
		expect(viewer).not.toMatch(/\bisMuted\b|Volume2|VolumeX/)
	})

	it('keeps failure, retry, media fallback, and header controls explicit', () => {
		const viewer = read('src/components/story/StoryViewer.tsx')

		expect(viewer).toContain("setLoadError('unavailable')")
		expect(viewer).toContain("setLoadError('failed')")
		expect(viewer).toContain(
			'isAxiosError(err) && err.response?.status === 404',
		)
		expect(viewer).toContain('setLoadAttempt(attempt => attempt + 1)')
		expect(viewer).toContain('onError={() => setMediaFailed(true)}')
		expect(viewer).toContain(
			"className='pointer-events-auto flex items-center gap-1'",
		)
		expect(viewer).toContain("aria-label={t('closeButton')}")
		expect(viewer).toContain("aria-label={t('previousStory')}")
		expect(viewer).toContain("aria-label={t('nextStory')}")
		expect(viewer).not.toContain("console.warn('Story")
		expect(viewer).not.toContain("console.error('Failed to")
	})
})
