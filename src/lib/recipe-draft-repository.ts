import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { RecipeFormData } from '@/components/recipe/RecipeFormDetailed'

const DB_NAME = 'chefkix-recipe-drafts'
const DB_VERSION = 1
export const RECIPE_DRAFT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

interface StoredMedia {
	name: string
	type: string
	lastModified: number
	blob: Blob
}

interface StoredRecipeDraft {
	ownerId: string
	data: Record<string, unknown>
	coverImage?: StoredMedia
	stepImages: Record<string, StoredMedia>
	updatedAt: number
}

export interface RecipeDraftDB extends DBSchema {
	drafts: {
		key: string
		value: StoredRecipeDraft
		indexes: { 'by-updated-at': number }
	}
}

export interface RecipeDraftSnapshot {
	data: RecipeFormData
	updatedAt: number
}

export interface RecipeDraftRepository {
	save(ownerId: string, data: RecipeFormData): Promise<void>
	load(ownerId: string): Promise<RecipeDraftSnapshot | null>
	clear(ownerId: string): Promise<void>
}

type DatabaseProvider = () => Promise<IDBPDatabase<RecipeDraftDB>>

function normalizeOwner(ownerId: string) {
	const normalized = ownerId.trim()
	if (!normalized)
		throw new Error('A recipe draft requires an authenticated owner')
	return normalized
}

function toStoredMedia(file: File): StoredMedia {
	return {
		name: file.name,
		type: file.type,
		lastModified: file.lastModified,
		blob: file.slice(0, file.size, file.type),
	}
}

function hydrateMedia(media: StoredMedia) {
	return new File([media.blob], media.name, {
		type: media.type,
		lastModified: media.lastModified,
	})
}

function serializeDraft(
	ownerId: string,
	data: RecipeFormData,
	updatedAt: number,
) {
	const storedData = { ...data } as RecipeFormData & Record<string, unknown>
	const coverImage = storedData.coverImageFile
	delete storedData.coverImageFile
	const stepImages: Record<string, StoredMedia> = {}
	storedData.steps = storedData.steps.map(step => {
		const { imageFile, ...fields } = step
		if (imageFile) stepImages[step.id] = toStoredMedia(imageFile)
		return {
			...fields,
			imageUrl: fields.imageUrl?.startsWith('blob:')
				? undefined
				: fields.imageUrl,
		}
	})

	return {
		ownerId,
		data: storedData as unknown as Record<string, unknown>,
		coverImage: coverImage ? toStoredMedia(coverImage) : undefined,
		stepImages,
		updatedAt,
	}
}

function hydrateDraft(record: StoredRecipeDraft): RecipeDraftSnapshot {
	const data = { ...record.data } as unknown as RecipeFormData
	if (record.coverImage) data.coverImageFile = hydrateMedia(record.coverImage)
	data.steps = data.steps.map(step => ({
		...step,
		imageFile: record.stepImages[step.id]
			? hydrateMedia(record.stepImages[step.id])
			: undefined,
	}))
	return { data, updatedAt: record.updatedAt }
}

let databasePromise: Promise<IDBPDatabase<RecipeDraftDB>> | null = null

function getDatabase() {
	if (!databasePromise) {
		databasePromise = openDB<RecipeDraftDB>(DB_NAME, DB_VERSION, {
			upgrade(db) {
				if (db.objectStoreNames.contains('drafts')) return
				const store = db.createObjectStore('drafts', { keyPath: 'ownerId' })
				store.createIndex('by-updated-at', 'updatedAt')
			},
		}).catch(error => {
			databasePromise = null
			throw error
		})
	}
	return databasePromise
}

export function createRecipeDraftRepository(
	databaseProvider: DatabaseProvider = getDatabase,
	now: () => number = Date.now,
): RecipeDraftRepository {
	const mutations = new Map<string, Promise<void>>()
	const enqueue = (ownerId: string, mutation: () => Promise<void>) => {
		const next = (mutations.get(ownerId) ?? Promise.resolve())
			.catch(() => undefined)
			.then(mutation)
		mutations.set(ownerId, next)
		const removeCompletedMutation = () => {
			if (mutations.get(ownerId) === next) mutations.delete(ownerId)
		}
		void next.then(removeCompletedMutation, removeCompletedMutation)
		return next
	}

	return {
		async save(ownerId, data) {
			const key = normalizeOwner(ownerId)
			const record = serializeDraft(key, data, now())
			await enqueue(key, async () => {
				const db = await databaseProvider()
				await db.put('drafts', record)
			})
		},
		async load(ownerId) {
			const key = normalizeOwner(ownerId)
			await mutations.get(key)?.catch(() => undefined)
			const db = await databaseProvider()
			const record = await db.get('drafts', key)
			if (!record) return null
			if (now() - record.updatedAt > RECIPE_DRAFT_MAX_AGE_MS) {
				await enqueue(key, () => db.delete('drafts', key))
				return null
			}
			return hydrateDraft(record)
		},
		async clear(ownerId) {
			const key = normalizeOwner(ownerId)
			await enqueue(key, async () => {
				const db = await databaseProvider()
				await db.delete('drafts', key)
			})
		},
	}
}

export const recipeDraftRepository = createRecipeDraftRepository()
