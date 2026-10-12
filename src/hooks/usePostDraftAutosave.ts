'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { postDraftRepository } from '@/lib/post-draft-storage'

export type PostDraftSaveState =
	'idle' | 'unsaved' | 'saving' | 'saved' | 'error'

interface PostDraftRepository {
	save: typeof postDraftRepository.save
	clear: typeof postDraftRepository.clear
}

interface UsePostDraftAutosaveOptions {
	ownerId?: string
	sessionId?: string | null
	content: string
	photos: File[]
	enabled: boolean
	initiallyPersisted: boolean
	delayMs?: number
	repository?: PostDraftRepository
}

interface DraftSnapshot {
	ownerId?: string
	sessionId?: string | null
	content: string
	photos: File[]
	contextKey: string
	signature: string
	hasDraftContent: boolean
}

const fileIdentity = new WeakMap<File, number>()
let nextFileIdentity = 1

function getFileIdentity(file: File) {
	const existing = fileIdentity.get(file)
	if (existing) return existing
	const identity = nextFileIdentity++
	fileIdentity.set(file, identity)
	return identity
}

export function createPostDraftSignature(
	sessionId: string | null | undefined,
	content: string,
	photos: File[],
) {
	return JSON.stringify({
		sessionId: sessionId ?? null,
		content,
		photos: photos.map(file => ({
			identity: getFileIdentity(file),
			name: file.name,
			size: file.size,
			type: file.type,
			lastModified: file.lastModified,
		})),
	})
}

export function usePostDraftAutosave({
	ownerId,
	sessionId,
	content,
	photos,
	enabled,
	initiallyPersisted,
	delayMs = 1500,
	repository = postDraftRepository,
}: UsePostDraftAutosaveOptions) {
	const [state, setState] = useState<PostDraftSaveState>('idle')
	const contextKey = `${ownerId ?? ''}:${sessionId ?? 'general'}`
	const signature = useMemo(
		() => createPostDraftSignature(sessionId, content, photos),
		[content, photos, sessionId],
	)
	const hasDraftContent = Boolean(content.trim() || photos.length || sessionId)

	const initializedContextRef = useRef<string | null>(null)
	const persistedSignatureRef = useRef<string | null>(null)
	const latestContextRef = useRef(contextKey)
	const latestSignatureRef = useRef(signature)
	const latestSnapshotRef = useRef<DraftSnapshot>({
		ownerId,
		sessionId,
		content,
		photos,
		contextKey,
		signature,
		hasDraftContent,
	})

	latestContextRef.current = contextKey
	latestSignatureRef.current = signature
	latestSnapshotRef.current = {
		ownerId,
		sessionId,
		content,
		photos,
		contextKey,
		signature,
		hasDraftContent,
	}

	const persistSnapshot = useCallback(
		async (snapshot: DraftSnapshot) => {
			if (!snapshot.ownerId) return false

			const targetContext = snapshot.contextKey
			const targetSignature = snapshot.signature
			setState('saving')

			try {
				if (snapshot.hasDraftContent) {
					await repository.save({
						ownerId: snapshot.ownerId,
						sessionId: snapshot.sessionId,
						content: snapshot.content,
						photos: snapshot.photos,
					})
				} else {
					await repository.clear(snapshot.ownerId, snapshot.sessionId)
				}

				if (
					latestContextRef.current === targetContext &&
					latestSignatureRef.current === targetSignature
				) {
					persistedSignatureRef.current = targetSignature
					setState(snapshot.hasDraftContent ? 'saved' : 'idle')
				}
				return true
			} catch {
				if (
					latestContextRef.current === targetContext &&
					latestSignatureRef.current === targetSignature
				) {
					setState('error')
				}
				return false
			}
		},
		[repository],
	)

	useEffect(() => {
		if (!enabled || !ownerId) {
			setState('idle')
			return
		}

		if (initializedContextRef.current !== contextKey) {
			initializedContextRef.current = contextKey
			persistedSignatureRef.current = initiallyPersisted ? signature : null

			if (initiallyPersisted) {
				setState(hasDraftContent ? 'saved' : 'idle')
				return
			}
		}

		if (persistedSignatureRef.current === signature) {
			setState(hasDraftContent ? 'saved' : 'idle')
			return
		}

		if (!hasDraftContent && persistedSignatureRef.current === null) {
			persistedSignatureRef.current = signature
			setState('idle')
			return
		}

		setState('unsaved')
		const snapshot = latestSnapshotRef.current
		const timer = window.setTimeout(() => {
			void persistSnapshot(snapshot)
		}, delayMs)

		return () => window.clearTimeout(timer)
	}, [
		contextKey,
		delayMs,
		enabled,
		hasDraftContent,
		initiallyPersisted,
		ownerId,
		persistSnapshot,
		signature,
	])

	const retry = useCallback(
		() => persistSnapshot(latestSnapshotRef.current),
		[persistSnapshot],
	)

	return {
		state,
		retry,
		hasUnresolvedChanges:
			state === 'unsaved' || state === 'saving' || state === 'error',
	}
}
