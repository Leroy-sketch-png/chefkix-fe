import {
	exceedsPostDraftPhotoLimit,
	MAX_POST_DRAFT_PHOTOS,
	mergePostDraftPhotos,
} from '@/lib/post-draft-photos'

describe('mergePostDraftPhotos', () => {
	it('preserves existing order and appends all newly selected files', () => {
		const existing = [
			new File(['old'], 'existing.jpg', {
				type: 'image/jpeg',
				lastModified: 1,
			}),
		]
		const repeated = new File(['step'], 'step.jpg', {
			type: 'image/jpeg',
			lastModified: 2,
		})

		expect(mergePostDraftPhotos(existing, [repeated])).toEqual([
			existing[0],
			repeated,
		])
	})

	it('does not copy an existing draft photo list when there are no additions', () => {
		const existing = [new File(['old'], 'existing.jpg')]
		expect(mergePostDraftPhotos(existing)).toBe(existing)
	})
})

describe('post draft photo limit', () => {
	it('allows five photos and blocks an over-limit recovered draft', () => {
		expect(MAX_POST_DRAFT_PHOTOS).toBe(5)
		expect(exceedsPostDraftPhotoLimit(5)).toBe(false)
		expect(exceedsPostDraftPhotoLimit(6)).toBe(true)
	})
})
