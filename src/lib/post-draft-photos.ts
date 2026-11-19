export const MAX_POST_DRAFT_PHOTOS = 5

export function mergePostDraftPhotos(
	existing: File[],
	additions: File[] = [],
): File[] {
	return additions.length ? [...existing, ...additions] : existing
}

export function exceedsPostDraftPhotoLimit(photoCount: number): boolean {
	return photoCount > MAX_POST_DRAFT_PHOTOS
}
