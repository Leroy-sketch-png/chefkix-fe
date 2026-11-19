import { create } from 'zustand'

export const MAX_STEP_PHOTOS = 3
export const MAX_STEP_PHOTO_BYTES = 10 * 1024 * 1024

export interface CookingStepPhoto {
	id: number
	stepNumber: number
	file: File
	previewUrl: string
}

interface StepPhotoState {
	sessionId: string | null
	ownerId: string | null
	photos: CookingStepPhoto[]
	setSession: (sessionId: string, ownerId: string) => void
	addPhoto: (
		sessionId: string,
		ownerId: string,
		stepNumber: number,
		file: File,
	) => boolean
	clearPhotos: (sessionId: string, ownerId: string) => void
	clearAllPhotos: () => void
}

const EMPTY_STEP_PHOTOS: CookingStepPhoto[] = []

let nextPhotoId = 0

function revokePhotos(photos: CookingStepPhoto[]) {
	photos.forEach(photo => URL.revokeObjectURL(photo.previewUrl))
}

export const useStepPhotoStore = create<StepPhotoState>((set, get) => ({
	sessionId: null,
	ownerId: null,
	photos: [],
	setSession: (sessionId, ownerId) => {
		const current = get()
		if (current.sessionId === sessionId && current.ownerId === ownerId) return
		revokePhotos(current.photos)
		set({ sessionId, ownerId, photos: [] })
	},
	addPhoto: (sessionId, ownerId, stepNumber, file) => {
		const current = get()
		if (
			current.sessionId !== sessionId ||
			current.ownerId !== ownerId ||
			file.size > MAX_STEP_PHOTO_BYTES ||
			current.photos.length >= MAX_STEP_PHOTOS
		) {
			return false
		}

		try {
			const photo = {
				id: nextPhotoId++,
				stepNumber,
				file,
				previewUrl: URL.createObjectURL(file),
			}
			set({ photos: [...current.photos, photo] })
			return true
		} catch {
			return false
		}
	},
	clearPhotos: (sessionId, ownerId) => {
		const current = get()
		if (current.sessionId !== sessionId || current.ownerId !== ownerId) return
		revokePhotos(current.photos)
		set({ photos: [] })
	},
	clearAllPhotos: () => {
		const current = get()
		revokePhotos(current.photos)
		set({ sessionId: null, ownerId: null, photos: [] })
	},
}))

export function getStepPhotoFiles(sessionId: string, ownerId: string): File[] {
	const current = useStepPhotoStore.getState()
	return current.sessionId === sessionId && current.ownerId === ownerId
		? current.photos.map(photo => photo.file)
		: []
}

export function getStepPhotosForSession(
	sessionId: string | undefined,
	ownerId: string | undefined,
): CookingStepPhoto[] {
	if (!sessionId || !ownerId) return EMPTY_STEP_PHOTOS
	return selectStepPhotosForSession(
		useStepPhotoStore.getState(),
		sessionId,
		ownerId,
	)
}

export function selectStepPhotosForSession(
	state: StepPhotoState,
	sessionId: string | undefined,
	ownerId: string | undefined,
): CookingStepPhoto[] {
	if (
		!sessionId ||
		!ownerId ||
		state.sessionId !== sessionId ||
		state.ownerId !== ownerId
	)
		return EMPTY_STEP_PHOTOS
	return state.photos
}

export function clearStepPhotos(sessionId: string, ownerId: string) {
	useStepPhotoStore.getState().clearPhotos(sessionId, ownerId)
}
