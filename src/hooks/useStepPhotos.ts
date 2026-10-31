'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
	getStepPhotoFiles,
	MAX_STEP_PHOTO_BYTES,
	MAX_STEP_PHOTOS,
	selectStepPhotosForSession,
	useStepPhotoStore,
} from '@/lib/step-photo-store'
import { useAuthStore } from '@/store/authStore'

/** Shares one session-scoped photo set between docked and expanded cook UIs. */
export function useStepPhotos(sessionId?: string) {
	const t = useTranslations('social')
	const ownerId = useAuthStore(state => state.user?.userId)
	const photos = useStepPhotoStore(state =>
		selectStepPhotosForSession(state, sessionId, ownerId),
	)
	const setSession = useStepPhotoStore(state => state.setSession)
	const addPhoto = useStepPhotoStore(state => state.addPhoto)
	const fileInputRef = useRef<HTMLInputElement | null>(null)
	const pendingStepRef = useRef<number>(0)

	useEffect(() => {
		if (!ownerId) {
			useStepPhotoStore.getState().clearAllPhotos()
			return
		}
		if (sessionId) setSession(sessionId, ownerId)
	}, [ownerId, sessionId, setSession])

	const captureForStep = useCallback((stepNumber: number) => {
		pendingStepRef.current = stepNumber
		fileInputRef.current?.click()
	}, [])

	const onFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			try {
				const file = e.target.files?.[0]
				if (!file || !sessionId || !ownerId || pendingStepRef.current <= 0)
					return

				const state = useStepPhotoStore.getState()
				if (state.sessionId !== sessionId || state.ownerId !== ownerId) return
				if (file.size > MAX_STEP_PHOTO_BYTES) {
					toast.error(t('photoSizeLimit'))
					return
				}
				if (state.photos.length >= MAX_STEP_PHOTOS) {
					toast.error(t('stepPhotoLimitReached'))
					return
				}

				if (!addPhoto(sessionId, ownerId, pendingStepRef.current, file)) {
					toast.error(t('stepPhotoCaptureFailed'))
				}
			} finally {
				e.target.value = ''
			}
		},
		[addPhoto, ownerId, sessionId, t],
	)

	const clearPhotos = useCallback(() => {
		if (sessionId && ownerId)
			useStepPhotoStore.getState().clearPhotos(sessionId, ownerId)
	}, [ownerId, sessionId])

	return {
		ownerId: ownerId ?? '',
		photos,
		totalCount: photos.length,
		maxPhotos: MAX_STEP_PHOTOS,
		captureForStep,
		onFileChange,
		fileInputRef,
		getFiles: () =>
			sessionId && ownerId ? getStepPhotoFiles(sessionId, ownerId) : [],
		clearPhotos,
	}
}
