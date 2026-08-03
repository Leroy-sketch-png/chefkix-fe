import fs from 'node:fs'
import path from 'node:path'

const mockDraftRecords = new Map<string, Record<string, unknown>>()

const mockDatabase = {
	put: jest.fn(
		async (_store: string, value: Record<string, unknown>): Promise<void> => {
			await Promise.resolve()
			mockDraftRecords.set(value.id as string, value)
		},
	),
	get: jest.fn(async (_store: string, id: string) => mockDraftRecords.get(id)),
	getAllFromIndex: jest.fn(
		async (_store: string, _index: string, ownerId: string) =>
			Array.from(mockDraftRecords.values()).filter(
				record => record.ownerId === ownerId,
			),
	),
	delete: jest.fn(async (_store: string, id: string): Promise<void> => {
		mockDraftRecords.delete(id)
	}),
}

jest.mock('idb', () => ({
	openDB: jest.fn(async () => mockDatabase),
}))

import {
	createPostDraftRepository,
	postDraftRepository,
	type PostDraftDatabase,
} from '@/lib/post-draft-storage'

const providerSource = fs.readFileSync(
	path.join(process.cwd(), 'src/components/providers/CelebrationProvider.tsx'),
	'utf8',
)
const rewardsSource = fs.readFileSync(
	path.join(process.cwd(), 'src/components/completion/ImmediateRewards.tsx'),
	'utf8',
)
const postPageSource = fs.readFileSync(
	path.join(process.cwd(), 'src/app/(main)/post/new/page.tsx'),
	'utf8',
)

describe('post draft storage', () => {
	beforeEach(() => {
		mockDraftRecords.clear()
		jest.clearAllMocks()
	})

	it('restores native photo metadata after repository persistence', async () => {
		const writer = createPostDraftRepository(
			async () => mockDatabase as unknown as PostDraftDatabase,
		)
		const reader = createPostDraftRepository(
			async () => mockDatabase as unknown as PostDraftDatabase,
		)
		const photo = new File(['dish-photo'], 'pho.jpg', {
			type: 'image/jpeg',
			lastModified: 1234,
		})

		await writer.save({
			ownerId: 'cook-1',
			sessionId: 'session-1',
			content: 'Dinner is ready',
			photos: [photo],
		})

		const restored = await reader.load('cook-1', 'session-1')

		expect(restored).toMatchObject({
			sessionId: 'session-1',
			content: 'Dinner is ready',
		})
		expect(restored?.photos).toHaveLength(1)
		expect(restored?.photos[0]).toMatchObject({
			name: 'pho.jpg',
			type: 'image/jpeg',
			lastModified: 1234,
			size: photo.size,
		})
	})

	it('isolates drafts by owner and returns each owner latest draft', async () => {
		await postDraftRepository.save({
			ownerId: 'cook-1',
			sessionId: 'session-a',
			content: 'Cook one',
		})
		await postDraftRepository.save({
			ownerId: 'cook-2',
			sessionId: 'session-b',
			content: 'Cook two',
		})

		expect(await postDraftRepository.load('cook-1')).toMatchObject({
			sessionId: 'session-a',
			content: 'Cook one',
		})
		expect(await postDraftRepository.load('cook-2')).toMatchObject({
			sessionId: 'session-b',
			content: 'Cook two',
		})
	})

	it('serializes clear after an in-flight save so deleted drafts stay deleted', async () => {
		const save = postDraftRepository.save({
			ownerId: 'cook-1',
			sessionId: 'session-1',
			content: 'Do not resurrect',
		})
		const clear = postDraftRepository.clear('cook-1', 'session-1')

		await Promise.all([save, clear])

		expect(await postDraftRepository.load('cook-1', 'session-1')).toBeNull()
	})

	it('routes every completion dismissal and editor autosave through the durable authority', () => {
		const lifecycleSource = `${providerSource}\n${rewardsSource}\n${postPageSource}`

		expect(providerSource).toContain('await postDraftRepository.save({')
		expect(rewardsSource).toContain('void runAction')
		expect(rewardsSource).toContain("void runAction('postLater', onClose)")
		expect(postPageSource).toContain(
			'content.trim() || photoFiles.length > 0 || sessionId',
		)
		expect(lifecycleSource).not.toMatch(
			/pendingPostSession|pendingPostPhotos|postDraftContent|postDraftPhotos|postDraftTs/,
		)
	})
})
