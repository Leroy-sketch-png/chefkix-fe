import { copyToClipboard, shareContent } from '@/lib/clipboard'
import { storyShareUrl, storyViewPath } from '@/lib/story-share'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('exact story sharing', () => {
	afterEach(() => {
		jest.restoreAllMocks()
	})

	it('encodes the owner and selected story without inheriting unrelated query state', () => {
		expect(storyViewPath('owner one', 'story/42')).toBe(
			'/story/view/owner%20one?startAt=story%2F42',
		)
		expect(
			storyShareUrl('https://chefkix.test/', 'owner one', 'story/42'),
		).toBe('https://chefkix.test/story/view/owner%20one?startAt=story%2F42')
	})

	it('reports native sharing without writing to the clipboard', async () => {
		const writeText = jest.fn()
		Object.defineProperty(navigator, 'share', {
			configurable: true,
			value: jest.fn().mockResolvedValue(undefined),
		})
		Object.defineProperty(navigator, 'clipboard', {
			configurable: true,
			value: { writeText },
		})

		await expect(
			shareContent({ url: 'https://chefkix.test/story' }),
		).resolves.toBe('shared')
		expect(writeText).not.toHaveBeenCalled()
	})

	it('treats native cancellation as intentional and does not copy', async () => {
		const writeText = jest.fn()
		Object.defineProperty(navigator, 'share', {
			configurable: true,
			value: jest
				.fn()
				.mockRejectedValue(
					Object.assign(new Error('cancelled'), { name: 'AbortError' }),
				),
		})
		Object.defineProperty(navigator, 'clipboard', {
			configurable: true,
			value: { writeText },
		})

		await expect(
			shareContent({ url: 'https://chefkix.test/story' }),
		).resolves.toBe('cancelled')
		expect(writeText).not.toHaveBeenCalled()
	})

	it('copies the exact URL when native sharing is unavailable', async () => {
		Object.defineProperty(navigator, 'share', {
			configurable: true,
			value: undefined,
		})
		const writeText = jest.fn().mockResolvedValue(undefined)
		Object.defineProperty(navigator, 'clipboard', {
			configurable: true,
			value: { writeText },
		})
		const url = storyShareUrl('https://chefkix.test', 'owner', 'story')

		await expect(shareContent({ url })).resolves.toBe('copied')
		expect(writeText).toHaveBeenCalledWith(url)
	})

	it('returns failure when no share or copy path succeeds', async () => {
		Object.defineProperty(navigator, 'share', {
			configurable: true,
			value: undefined,
		})
		Object.defineProperty(navigator, 'clipboard', {
			configurable: true,
			value: { writeText: jest.fn().mockRejectedValue(new Error('denied')) },
		})
		Object.defineProperty(document, 'execCommand', {
			configurable: true,
			value: jest.fn().mockReturnValue(false),
		})

		await expect(copyToClipboard('story')).resolves.toBe(false)
		await expect(shareContent({ url: 'story' })).resolves.toBe('failed')
	})

	it('keeps the viewer paused and single-flight while sharing the active story', () => {
		const source = readFileSync(
			join(process.cwd(), 'src/components/story/StoryViewer.tsx'),
			'utf8',
		)

		expect(source).toContain('if (shareInFlightRef.current) return')
		expect(source).toContain('setIsManuallyPaused(true)')
		expect(source).toContain(
			'storyShareUrl(window.location.origin, userId, currentStory.id)',
		)
		expect(source).toContain("if (result === 'copied')")
		expect(source).toContain("if (result === 'failed')")
		expect(source).toContain(
			'if (!wasManuallyPaused) setIsManuallyPaused(false)',
		)
		expect(source).toContain('aria-busy={isSharing}')
	})
})
