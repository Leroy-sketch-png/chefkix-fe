export interface LocalImagePreview {
	id: number
	file: File
	previewStatus: 'loading' | 'ready' | 'error'
	previewUrl: string | null
}

export interface LocalImagePreviewUrlRegistry {
	create(photoId: number, file: File): string
	release(photoId: number): void
	releaseAll(): void
}

export function createLocalImagePreviewUrlRegistry(
	urlApi: Pick<typeof URL, 'createObjectURL' | 'revokeObjectURL'> = URL,
): LocalImagePreviewUrlRegistry {
	const urls = new Map<number, string>()

	return {
		create(photoId, file) {
			const previousUrl = urls.get(photoId)
			if (previousUrl) urlApi.revokeObjectURL(previousUrl)

			const url = urlApi.createObjectURL(file)
			urls.set(photoId, url)
			return url
		},
		release(photoId) {
			const url = urls.get(photoId)
			if (!url) return
			urls.delete(photoId)
			urlApi.revokeObjectURL(url)
		},
		releaseAll() {
			for (const url of urls.values()) urlApi.revokeObjectURL(url)
			urls.clear()
		},
	}
}

export function markLocalImagePreviewReady(
	photos: LocalImagePreview[],
	photoId: number,
): LocalImagePreview[] {
	return photos.map(photo =>
		photo.id === photoId ? { ...photo, previewStatus: 'ready' } : photo,
	)
}

export function failLocalImagePreview(
	photos: LocalImagePreview[],
	photoId: number,
): LocalImagePreview[] {
	return photos.map(photo =>
		photo.id === photoId
			? { ...photo, previewStatus: 'error', previewUrl: null }
			: photo,
	)
}

export function removeLocalImagePreview(
	photos: LocalImagePreview[],
	photoId: number,
): LocalImagePreview[] {
	return photos.filter(photo => photo.id !== photoId)
}
