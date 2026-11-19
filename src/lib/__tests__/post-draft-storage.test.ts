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
const firstCookSource = fs.readFileSync(
	path.join(
		process.cwd(),
		'src/components/completion/FirstCookCelebration.tsx',
	),
	'utf8',
)
const postPageSource = fs.readFileSync(
	path.join(process.cwd(), 'src/app/(main)/post/new/page.tsx'),
	'utf8',
)
const autosaveSource = fs.readFileSync(
	path.join(process.cwd(), 'src/hooks/usePostDraftAutosave.ts'),
	'utf8',
)
const stepPhotosSource = fs.readFileSync(
	path.join(process.cwd(), 'src/hooks/useStepPhotos.ts'),
	'utf8',
)
const cookingPlayerSource = fs.readFileSync(
	path.join(process.cwd(), 'src/components/cooking/CookingPlayer.tsx'),
	'utf8',
)
const messages = JSON.parse(
	fs.readFileSync(path.join(process.cwd(), 'messages/en.json'), 'utf8'),
) as Record<string, Record<string, string>>

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

	it('does not detach an unhandled rejection when an IndexedDB write fails', async () => {
		const failure = new DOMException(
			'Storage quota exceeded',
			'QuotaExceededError',
		)
		const unhandled: unknown[] = []
		const onUnhandled = (reason: unknown) => unhandled.push(reason)
		const repository = createPostDraftRepository(
			async () => mockDatabase as unknown as PostDraftDatabase,
		)
		mockDatabase.put.mockRejectedValueOnce(failure)
		process.on('unhandledRejection', onUnhandled)

		try {
			await expect(
				repository.save({
					ownerId: 'cook-quota',
					sessionId: 'session-quota',
				}),
			).rejects.toBe(failure)
			await new Promise(resolve => setTimeout(resolve, 0))
			expect(unhandled).toEqual([])

			await repository.save({
				ownerId: 'cook-quota',
				sessionId: 'session-quota',
			})
			expect(
				await repository.load('cook-quota', 'session-quota'),
			).toMatchObject({
				sessionId: 'session-quota',
				content: '',
			})
		} finally {
			process.off('unhandledRejection', onUnhandled)
		}
	})

	it('routes every completion dismissal and editor autosave through the durable authority', () => {
		const lifecycleSource = `${providerSource}\n${rewardsSource}\n${postPageSource}`

		expect(providerSource).toContain('await postDraftRepository.save({')
		expect(rewardsSource).toContain('void runAction')
		expect(rewardsSource).toContain("void runAction('postLater', onClose)")
		expect(postPageSource).toContain('usePostDraftAutosave({')
		expect(autosaveSource).toContain('await repository.save({')
		expect(autosaveSource).toContain('await repository.clear(')
		expect(autosaveSource).toContain('latestSignatureRef.current')
		expect(messages.post).toMatchObject({
			draftUnsaved: 'Unsaved changes',
			draftSaving: 'Saving draft...',
			draftSaved: 'Draft saved',
			draftSaveFailed: 'Draft not saved',
			draftRetry: 'Try saving again',
			draftLeaveWarning: 'Your latest post changes have not been saved yet.',
		})
		expect(lifecycleSource).not.toMatch(
			/pendingPostSession|pendingPostPhotos|postDraftContent|postDraftPhotos|postDraftTs/,
		)
	})

	it('hands captured cooking photos into the owner-scoped post draft', () => {
		expect(stepPhotosSource).not.toContain('sessionStorage')
		expect(stepPhotosSource).toContain('useStepPhotoStore')
		expect(cookingPlayerSource).toContain(
			'canOfferStepPhotoPrompt(interactionMode)',
		)
		expect(cookingPlayerSource).toContain('onCaptureFinalStepPhoto={')
		expect(cookingPlayerSource).toContain(
			'stepPhotos.captureForStep(totalSteps)',
		)
		expect(cookingPlayerSource).toContain('stepPhotos: capturedStepPhotos')
		expect(cookingPlayerSource).toMatch(
			/if \(isPreviewMode\) \{[\s\S]{0,180}stepPhotos\.clearPhotos\(\)/,
		)
		expect(providerSource).toContain(
			'stepPhotos={immediateRewardsData.stepPhotos}',
		)
		expect(providerSource).toMatch(
			/persistCompletionDraft\(\s*data\.ownerId,\s*data\.sessionId,\s*data\.stepPhotos/,
		)
		expect(providerSource).toContain(
			'mergePostDraftPhotos(existing?.photos ?? [], capturedPhotos)',
		)
		expect(postPageSource).toContain(
			'exceedsPostDraftPhotoLimit(photoFiles.length)',
		)
		expect(postPageSource).toMatch(
			/disabled=\{\s*isSubmitting \|\|\s*exceedsPostDraftPhotoLimit\(photoFiles\.length\) \|\|/,
		)
		expect(messages.post.photoLimit).toBe(
			'Remove photos to continue (maximum 5).',
		)
	})

	it('resolves completion draft feedback from the post translation namespace', () => {
		expect(providerSource).toContain("const tp = useTranslations('post')")
		const literalKeysFor = (translator: string) =>
			Array.from(
				providerSource.matchAll(
					new RegExp(`\\b${translator}\\(\\s*['"]([^'"]+)['"]`, 'g'),
				),
				match => match[1],
			)
		expect(
			literalKeysFor('t').filter(key => !Object.hasOwn(messages.social, key)),
		).toEqual([])
		expect(
			literalKeysFor('tp').filter(key => !Object.hasOwn(messages.post, key)),
		).toEqual([])
		expect(messages.post).toMatchObject({
			failedToSaveDraft: "Couldn't save draft",
			draftSaved: 'Draft saved',
			xpDecay: 'XP decreases if you post later',
		})
	})

	it('claims the first-cook celebration against the authenticated account', () => {
		expect(cookingPlayerSource).toMatch(
			/claimFirstCookCelebration\(\s*stepPhotos\.ownerId,\s*recipesCooked/,
		)
		expect(cookingPlayerSource).not.toContain(
			"localStorage.setItem(firstCookKey, '1')",
		)
	})

	it('keeps the First Cook save promise observable to its pending UI', () => {
		expect(providerSource).toContain('onPostNow={handleFirstCookPostNow}')
		expect(providerSource).not.toContain(
			'onPostNow={() => void handleFirstCookPostNow()}',
		)
		expect(firstCookSource).toContain(
			'useEscapeKey(isOpen && !isPostPending, onClose)',
		)
		expect(firstCookSource).toContain('disabled={isPostPending}')
	})

	it('binds completion media to its original account through save and navigation', () => {
		expect(
			cookingPlayerSource.match(/ownerId: stepPhotos\.ownerId/g),
		).toHaveLength(2)
		expect(providerSource).toContain(
			'useAuthStore.getState().user?.userId === ownerId',
		)
		expect(providerSource).toMatch(
			/postDraftRepository\.load\(ownerId, sessionId\)[\s\S]{0,120}isCurrentCompletionOwner\(ownerId\)/,
		)
		expect(providerSource).toContain('firstCookData.ownerId === user?.userId')
		expect(providerSource).toContain(
			'immediateRewardsData.ownerId === user?.userId',
		)
	})
})
