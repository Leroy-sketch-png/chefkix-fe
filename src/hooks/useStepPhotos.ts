'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

const SESSION_KEY = 'chefkix-step-photos'

interface StepPhotoState {
	/** Map of stepNumber -> blob URLs */
	photos: Map<number, string[]>
	/** Total photo count across all steps */
	totalCount: number
}

/**
 * useStepPhotos — Manages photos captured during cooking steps.
 *
 * Photos are stored as blob URLs in component state and serialized
 * to sessionStorage so they survive navigation to post creation.
 *
 * Wave 2: Kitchen Protocol — step photo prompts for cooking documentation.
 */
export function useStepPhotos() {
	const [state, setState] = useState<StepPhotoState>({
		photos: new Map(),
		totalCount: 0,
	})
	const fileInputRef = useRef<HTMLInputElement | null>(null)
	const pendingStepRef = useRef<number>(0)

	// Revoke blob URLs on unmount to prevent memory leaks
	useEffect(() => {
		return () => {
			state.photos.forEach(urls =>
				urls.forEach(url => URL.revokeObjectURL(url)),
			)
		}
		// Cleanup only on unmount — state.photos is intentionally omitted to avoid revoking URLs mid-session
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	/**
	 * Open the device camera/file picker for a specific step.
	 * The actual photo is captured via a hidden <input type="file">.
	 */
	const captureForStep = useCallback((stepNumber: number) => {
		pendingStepRef.current = stepNumber
		fileInputRef.current?.click()
	}, [])

	/**
	 * Handle file input change — store the captured photo.
	 */
	const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file || !pendingStepRef.current) return

		// Validate file size (max 10MB)
		if (file.size > 10 * 1024 * 1024) {
			e.target.value = ''
			return
		}

		const stepNumber = pendingStepRef.current
		const blobUrl = URL.createObjectURL(file)

		setState(prev => {
			const newPhotos = new Map(prev.photos)
			const existing = newPhotos.get(stepNumber) ?? []
			// Max 3 photos per step
			if (existing.length >= 3) return prev
			newPhotos.set(stepNumber, [...existing, blobUrl])
			return { photos: newPhotos, totalCount: prev.totalCount + 1 }
		})

		// Reset input so the same file can be re-selected
		e.target.value = ''
	}, [])

	/**
	 * Get all captured photos as flat array of blob URLs.
	 * Used when creating a post after cooking completion.
	 */
	const getAllPhotos = useCallback((): string[] => {
		const all: string[] = []
		state.photos.forEach(urls => all.push(...urls))
		return all
	}, [state.photos])

	/**
	 * Persist photo blobs to sessionStorage for post creation page.
	 * Converts blob URLs back to base64 for serialization.
	 */
	const persistForPostCreation = useCallback(async () => {
		const photoData: { stepNumber: number; dataUrl: string }[] = []

		for (const [stepNumber, urls] of state.photos) {
			for (const blobUrl of urls) {
				try {
					const response = await fetch(blobUrl)
					const blob = await response.blob()
					const dataUrl = await new Promise<string>(resolve => {
						const reader = new FileReader()
						reader.onloadend = () => resolve(reader.result as string)
						reader.readAsDataURL(blob)
					})
					photoData.push({ stepNumber, dataUrl })
				} catch {
					// ignored: blob conversion non-critical
				}
			}
		}

		if (photoData.length > 0) {
			try {
				sessionStorage.setItem(SESSION_KEY, JSON.stringify(photoData))
			} catch {
				// ignored: storage access non-critical
			}
		}
	}, [state.photos])

	/**
	 * Clear all photos and revoke blob URLs.
	 */
	const clearPhotos = useCallback(() => {
		state.photos.forEach(urls => urls.forEach(url => URL.revokeObjectURL(url)))
		setState({ photos: new Map(), totalCount: 0 })
		try {
			sessionStorage.removeItem(SESSION_KEY)
		} catch {
			// ignored: storage access non-critical
		}
	}, [state.photos])

	return {
		photos: state.photos,
		totalCount: state.totalCount,
		captureForStep,
		onFileChange,
		fileInputRef,
		getAllPhotos,
		persistForPostCreation,
		clearPhotos,
	}
}

/**
 * Retrieve step photos saved during cooking session.
 * Used by post creation page.
 */
export function getSessionPhotos(): { stepNumber: number; dataUrl: string }[] {
	try {
		const data = sessionStorage.getItem(SESSION_KEY)
		if (!data) return []
		return JSON.parse(data)
	} catch {
		return []
	}
}
