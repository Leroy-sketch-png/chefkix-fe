export const STORY_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'
export const STORY_IMAGE_MAX_BYTES = 10 * 1024 * 1024

const STORY_IMAGE_TYPES = new Set(STORY_IMAGE_ACCEPT.split(','))

export type StoryImageValidationError = 'unsupported-type' | 'too-large'

export function validateStoryImage(
	file: Pick<File, 'size' | 'type'>,
): StoryImageValidationError | null {
	if (!STORY_IMAGE_TYPES.has(file.type.toLowerCase())) {
		return 'unsupported-type'
	}

	if (file.size > STORY_IMAGE_MAX_BYTES) {
		return 'too-large'
	}

	return null
}
