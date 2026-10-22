import {
	getStorageItem,
	removeStorageItem,
	setStorageJson,
} from '@/lib/storage'

export const LOCAL_RECIPE_DRAFT_KEY = 'chefkix-recipe-draft'
export const LOCAL_RECIPE_DRAFT_STALE_DAYS = 30

export interface LocalRecipeDraft<T> {
	type: 'manual'
	data: T
	savedAt: string
}

export type LocalRecipeDraftReadResult<T> =
	| { status: 'empty' }
	| { status: 'corrupt' }
	| { status: 'valid'; draft: LocalRecipeDraft<T> }

export function readLocalRecipeDraft<T>(): LocalRecipeDraftReadResult<T> {
	const raw = getStorageItem(LOCAL_RECIPE_DRAFT_KEY)
	if (!raw) return { status: 'empty' }

	try {
		const candidate = JSON.parse(raw) as Partial<LocalRecipeDraft<T>>
		if (
			candidate.type !== 'manual' ||
			!candidate.data ||
			typeof candidate.data !== 'object' ||
			typeof candidate.savedAt !== 'string' ||
			Number.isNaN(Date.parse(candidate.savedAt))
		) {
			return { status: 'corrupt' }
		}

		return {
			status: 'valid',
			draft: candidate as LocalRecipeDraft<T>,
		}
	} catch {
		return { status: 'corrupt' }
	}
}

export function saveLocalRecipeDraft<T>(data: T): boolean {
	return setStorageJson(LOCAL_RECIPE_DRAFT_KEY, {
		type: 'manual',
		data,
		savedAt: new Date().toISOString(),
	} satisfies LocalRecipeDraft<T>)
}

export function clearLocalRecipeDraft(): boolean {
	return removeStorageItem(LOCAL_RECIPE_DRAFT_KEY)
}

export function isLocalRecipeDraftStale(
	savedAt: string,
	now: Date = new Date(),
): boolean {
	const savedTime = Date.parse(savedAt)
	if (Number.isNaN(savedTime)) return false

	const staleAfterMs = LOCAL_RECIPE_DRAFT_STALE_DAYS * 24 * 60 * 60 * 1000
	return now.getTime() - savedTime >= staleAfterMs
}
