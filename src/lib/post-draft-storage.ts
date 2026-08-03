import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

const DB_NAME = 'chefkix-post-drafts'
const DB_VERSION = 1
export const POST_DRAFT_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000

interface StoredPostDraftPhoto {
	name: string
	type: string
	lastModified: number
	blob: Blob
}

interface StoredPostDraft {
	id: string
	ownerId: string
	sessionId: string | null
	content: string
	photos: StoredPostDraftPhoto[]
	updatedAt: number
}

interface ChefKixPostDraftDB extends DBSchema {
	'post-drafts': {
		key: string
		value: StoredPostDraft
		indexes: {
			'by-owner': string
			'by-updated-at': number
		}
	}
}

export interface SavePostDraftInput {
	ownerId: string
	sessionId?: string | null
	content?: string
	photos?: File[]
}

export interface PostDraftSnapshot {
	sessionId: string | null
	content: string
	photos: File[]
	updatedAt: number
}

export type PostDraftDatabase = IDBPDatabase<ChefKixPostDraftDB>
type DatabaseProvider = () => Promise<PostDraftDatabase>

function draftId(ownerId: string, sessionId?: string | null) {
	const normalizedOwnerId = ownerId.trim()
	if (!normalizedOwnerId) {
		throw new Error('A post draft requires an authenticated owner')
	}
	return `${normalizedOwnerId}:${sessionId || 'general'}`
}

function serializePhotos(files: File[]): StoredPostDraftPhoto[] {
	return files.map(file => ({
		name: file.name,
		type: file.type,
		lastModified: file.lastModified,
		blob: file.slice(0, file.size, file.type),
	}))
}

function hydrateDraft(record: StoredPostDraft): PostDraftSnapshot {
	return {
		sessionId: record.sessionId,
		content: record.content,
		photos: record.photos.map(
			photo =>
				new File([photo.blob], photo.name, {
					type: photo.type,
					lastModified: photo.lastModified,
				}),
		),
		updatedAt: record.updatedAt,
	}
}

let dbPromise: Promise<PostDraftDatabase> | null = null

function getDatabase(): Promise<PostDraftDatabase> {
	if (!dbPromise) {
		dbPromise = openDB<ChefKixPostDraftDB>(DB_NAME, DB_VERSION, {
			upgrade(db) {
				if (db.objectStoreNames.contains('post-drafts')) return
				const store = db.createObjectStore('post-drafts', { keyPath: 'id' })
				store.createIndex('by-owner', 'ownerId')
				store.createIndex('by-updated-at', 'updatedAt')
			},
		})
	}
	return dbPromise
}

export function createPostDraftRepository(
	databaseProvider: DatabaseProvider = getDatabase,
	now: () => number = Date.now,
) {
	const mutationChains = new Map<string, Promise<void>>()

	const enqueueMutation = (ownerId: string, mutation: () => Promise<void>) => {
		const previous = mutationChains.get(ownerId) ?? Promise.resolve()
		const next = previous.catch(() => undefined).then(mutation)
		mutationChains.set(ownerId, next)
		void next.finally(() => {
			if (mutationChains.get(ownerId) === next) {
				mutationChains.delete(ownerId)
			}
		})
		return next
	}

	const awaitOwnerMutations = async (ownerId: string) => {
		await mutationChains.get(ownerId)?.catch(() => undefined)
	}

	return {
		async save(input: SavePostDraftInput): Promise<void> {
			const id = draftId(input.ownerId, input.sessionId)
			const record: StoredPostDraft = {
				id,
				ownerId: input.ownerId.trim(),
				sessionId: input.sessionId || null,
				content: input.content ?? '',
				photos: serializePhotos(input.photos ?? []),
				updatedAt: now(),
			}

			await enqueueMutation(record.ownerId, async () => {
				const db = await databaseProvider()
				await db.put('post-drafts', record)
			})
		},

		async load(
			ownerId: string,
			sessionId?: string | null,
		): Promise<PostDraftSnapshot | null> {
			const normalizedOwnerId = ownerId.trim()
			draftId(normalizedOwnerId, sessionId)
			await awaitOwnerMutations(normalizedOwnerId)
			const db = await databaseProvider()

			let record: StoredPostDraft | undefined
			if (sessionId) {
				record = await db.get(
					'post-drafts',
					draftId(normalizedOwnerId, sessionId),
				)
			} else {
				const candidates = await db.getAllFromIndex(
					'post-drafts',
					'by-owner',
					normalizedOwnerId,
				)
				record = candidates.sort((a, b) => b.updatedAt - a.updatedAt)[0]
			}

			if (!record) return null
			if (now() - record.updatedAt > POST_DRAFT_MAX_AGE_MS) {
				await enqueueMutation(normalizedOwnerId, () =>
					db.delete('post-drafts', record.id),
				)
				return null
			}
			return hydrateDraft(record)
		},

		async clear(ownerId: string, sessionId?: string | null): Promise<void> {
			const normalizedOwnerId = ownerId.trim()
			const id = draftId(normalizedOwnerId, sessionId)
			await enqueueMutation(normalizedOwnerId, async () => {
				const db = await databaseProvider()
				await db.delete('post-drafts', id)
			})
		},
	}
}

export const postDraftRepository = createPostDraftRepository()
