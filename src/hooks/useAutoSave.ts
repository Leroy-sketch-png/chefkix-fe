/**
 * useAutoSave — Debounced auto-save hook for recipe drafts.
 *
 * Spec reference: vision_and_spec/19-creator-studio.txt §4
 *
 * Behaviour:
 *   1. Fires PATCH /recipes/{id} 3 seconds after the last form change.
 *   2. Persists a status indicator: idle → saving → saved → error.
 *   3. Retries on failure (5 s delay).
 *   4. beforeunload guard when unsaved changes exist.
 *   5. Compares payload by value — no-op if nothing actually changed.
 */

import { useRef, useEffect, useCallback, useState } from 'react'
import { saveDraft, type DraftSaveRequest } from '@/services/recipe'

// ── Types ───────────────────────────────────────────────────────────

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface AutoSaveResult {
	/** Current save lifecycle state */
	saveStatus: SaveStatus
	/** ISO timestamp of last successful save, or null */
	lastSavedAt: string | null
	/** Manual trigger (bypasses debounce). Useful for Ctrl+S. */
	saveNow: () => Promise<void>
}

// ── Constants ───────────────────────────────────────────────────────

const DEBOUNCE_MS = 3_000
const RETRY_MS = 5_000
const SAVED_DISPLAY_MS = 3_000

// ── Helpers ─────────────────────────────────────────────────────────

/** Cheap deep-equal via JSON — fine for serialisable DTOs. */
function payloadEqual(
	a: DraftSaveRequest | null,
	b: DraftSaveRequest | null,
): boolean {
	if (a === b) return true
	if (!a || !b) return false
	return JSON.stringify(a) === JSON.stringify(b)
}

// ── Hook ────────────────────────────────────────────────────────────

/**
 * @param draftId  – null until the draft has been created (auto-save is inert)
 * @param payload  – the DraftSaveRequest built from current form state.
 *                   Pass null to pause auto-save (e.g. during AI parsing).
 * @param enabled  – master switch; false disables everything.
 */
export function useAutoSave(
	draftId: string | null,
	payload: DraftSaveRequest | null,
	enabled = true,
): AutoSaveResult {
	const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
	const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)

	// Refs survive across renders without triggering effects.
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const savedDisplayRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const lastSavedPayloadRef = useRef<DraftSaveRequest | null>(null)
	const isSavingRef = useRef(false)
	const latestPayloadRef = useRef<DraftSaveRequest | null>(null)
	const latestDraftIdRef = useRef<string | null>(null)

	// Keep latest values in refs so the save function always reads current data.
	latestPayloadRef.current = payload
	latestDraftIdRef.current = draftId

	// ── Core save ─────────────────────────────────────────────────
	const doSave = useCallback(async () => {
		const currentPayload = latestPayloadRef.current
		const currentDraftId = latestDraftIdRef.current

		if (!currentDraftId || !currentPayload) return
		if (payloadEqual(currentPayload, lastSavedPayloadRef.current)) return
		if (isSavingRef.current) return

		isSavingRef.current = true
		setSaveStatus('saving')

		try {
			const response = await saveDraft(currentDraftId, currentPayload)

			if (response.success) {
				lastSavedPayloadRef.current = currentPayload
				setLastSavedAt(new Date().toISOString())
				setSaveStatus('saved')

				// Fade back to idle after 3 s
				if (savedDisplayRef.current) clearTimeout(savedDisplayRef.current)
				savedDisplayRef.current = setTimeout(() => {
					setSaveStatus('idle')
				}, SAVED_DISPLAY_MS)
			} else {
				console.warn('[useAutoSave] Save failed:', response.message)
				setSaveStatus('error')
				scheduleRetry()
			}
		} catch (err) {
			console.error('[useAutoSave] Save exception:', err)
			setSaveStatus('error')
			scheduleRetry()
		} finally {
			isSavingRef.current = false
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const scheduleRetry = useCallback(() => {
		if (retryRef.current) clearTimeout(retryRef.current)
		retryRef.current = setTimeout(() => {
			doSave()
		}, RETRY_MS)
	}, [doSave])

	// ── Debounced trigger on payload change ─────────────────────
	useEffect(() => {
		if (!enabled || !draftId || !payload) return

		// Skip if nothing changed
		if (payloadEqual(payload, lastSavedPayloadRef.current)) return

		if (debounceRef.current) clearTimeout(debounceRef.current)
		debounceRef.current = setTimeout(() => {
			doSave()
		}, DEBOUNCE_MS)

		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current)
		}
	}, [enabled, draftId, payload, doSave])

	// ── beforeunload guard ──────────────────────────────────────
	useEffect(() => {
		if (!enabled) return

		const hasUnsaved =
			!!payload &&
			!!draftId &&
			!payloadEqual(payload, lastSavedPayloadRef.current)

		if (!hasUnsaved) return

		const handler = (e: BeforeUnloadEvent) => {
			e.preventDefault()
			// Modern browsers ignore custom messages, but returning a string
			// is needed for the prompt to appear in some browsers.
			e.returnValue = 'You have unsaved changes. Leave anyway?'
		}

		window.addEventListener('beforeunload', handler)
		return () => window.removeEventListener('beforeunload', handler)
	}, [enabled, draftId, payload])

	// ── Cleanup all timers on unmount ───────────────────────────
	useEffect(() => {
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current)
			if (retryRef.current) clearTimeout(retryRef.current)
			if (savedDisplayRef.current) clearTimeout(savedDisplayRef.current)
		}
	}, [])

	// ── Public: bypass debounce (for Ctrl+S) ────────────────────
	const saveNow = useCallback(async () => {
		if (debounceRef.current) clearTimeout(debounceRef.current)
		await doSave()
	}, [doSave])

	return { saveStatus, lastSavedAt, saveNow }
}
