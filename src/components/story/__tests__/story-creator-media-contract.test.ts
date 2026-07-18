import {
	STORY_IMAGE_ACCEPT,
	STORY_IMAGE_MAX_BYTES,
	validateStoryImage,
} from '@/lib/story-media'

describe('Story image media contract', () => {
	it.each(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])(
		'accepts supported image type %s',
		type => {
			expect(validateStoryImage({ type, size: 1024 })).toBeNull()
		},
	)

	it.each(['video/mp4', 'video/webm', 'image/svg+xml', ''])(
		'rejects unsupported media type %s',
		type => {
			expect(validateStoryImage({ type, size: 1024 })).toBe('unsupported-type')
		},
	)

	it('rejects an image above the backend size limit', () => {
		expect(
			validateStoryImage({
				type: 'image/png',
				size: STORY_IMAGE_MAX_BYTES + 1,
			}),
		).toBe('too-large')
	})

	it('keeps the native picker contract exact and video-free', () => {
		expect(STORY_IMAGE_ACCEPT.split(',')).toEqual([
			'image/jpeg',
			'image/png',
			'image/webp',
			'image/gif',
		])
		expect(STORY_IMAGE_ACCEPT).not.toContain('video')
		expect(STORY_IMAGE_ACCEPT).not.toContain('image/*')
	})
})
