const records = new Map<string, Record<string, unknown>>()
const database = {
	put: jest.fn(async (_store: string, record: Record<string, unknown>) => {
		await Promise.resolve()
		records.set(record.ownerId as string, record)
	}),
	get: jest.fn(async (_store: string, ownerId: string) => records.get(ownerId)),
	delete: jest.fn(async (_store: string, ownerId: string) => {
		records.delete(ownerId)
	}),
}

jest.mock('idb', () => ({ openDB: jest.fn(async () => database) }))

import type { IDBPDatabase } from 'idb'
import {
	createRecipeDraftRepository,
	type RecipeDraftDB,
} from '@/lib/recipe-draft-repository'
import type { RecipeFormData } from '@/components/recipe/RecipeFormDetailed'

const makeDraft = (title: string): RecipeFormData => ({
	title,
	description: 'A recipe description',
	prepTimeMinutes: 5,
	cookTimeMinutes: 20,
	servings: 4,
	difficulty: 'Intermediate',
	category: 'Dinner',
	ingredients: [{ id: 'i1', amount: '1', unit: 'cup', name: 'rice' }],
	steps: [{ id: 's1', instruction: 'Cook rice' }],
	tips: 'Rest before serving',
	tags: ['weeknight'],
})

describe('recipe draft repository', () => {
	beforeEach(() => {
		records.clear()
		jest.clearAllMocks()
	})

	it('round-trips structured fields, cover files, and per-step files without blob URLs', async () => {
		const repo = createRecipeDraftRepository(
			async () => database as unknown as IDBPDatabase<RecipeDraftDB>,
			() => 100,
		)
		const draft = makeDraft('Pho')
		draft.coverImageFile = new File(['cover-bytes'], 'cover.jpg', {
			type: 'image/jpeg',
			lastModified: 123,
		})
		draft.steps[0] = {
			...draft.steps[0],
			imageUrl: 'blob:old-session-url',
			imageFile: new File(['step-bytes'], 'step.png', {
				type: 'image/png',
				lastModified: 456,
			}),
		}

		await repo.save('cook-1', draft)
		const restored = await repo.load('cook-1')

		expect(restored?.data.title).toBe('Pho')
		expect(restored?.data.coverImageFile).toMatchObject({
			name: 'cover.jpg',
			type: 'image/jpeg',
			lastModified: 123,
			size: 11,
		})
		expect(restored?.data.steps[0]).toMatchObject({
			imageUrl: undefined,
			imageFile: { name: 'step.png', type: 'image/png', lastModified: 456 },
		})
	})

	it('isolates records by owner and serializes clear after an in-flight save', async () => {
		const repo = createRecipeDraftRepository(
			async () => database as unknown as IDBPDatabase<RecipeDraftDB>,
		)
		const firstSave = repo.save('cook-1', makeDraft('First'))
		const clear = repo.clear('cook-1')
		await Promise.all([firstSave, clear])
		await repo.save('cook-2', makeDraft('Second'))

		expect(await repo.load('cook-1')).toBeNull()
		expect((await repo.load('cook-2'))?.data.title).toBe('Second')
		await expect(repo.load('   ')).rejects.toThrow('authenticated owner')
	})

	it('expires stale records without exposing them as recoverable', async () => {
		let now = 1_000
		const repo = createRecipeDraftRepository(
			async () => database as unknown as IDBPDatabase<RecipeDraftDB>,
			() => now,
		)
		await repo.save('cook-1', makeDraft('Old'))
		now += 30 * 24 * 60 * 60 * 1000 + 1

		expect(await repo.load('cook-1')).toBeNull()
		expect(records.has('cook-1')).toBe(false)
	})

	it('does not hide IndexedDB write failures', async () => {
		const failing = createRecipeDraftRepository(async () => {
			throw new Error('storage blocked')
		})

		await expect(failing.save('cook-1', makeDraft('Unsaved'))).rejects.toThrow(
			'storage blocked',
		)
	})
})
