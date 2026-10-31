import fs from 'fs'
import path from 'path'
import type { User } from '@/lib/types'
import { useStepPhotoStore } from '@/lib/step-photo-store'
import { useAuthStore } from '@/store/authStore'
import { useCookingStore } from '@/store/cookingStore'
import { resolveCookingCloseMode, useUiStore } from '@/store/uiStore'

const originalCreateObjectURL = Object.getOwnPropertyDescriptor(
	URL,
	'createObjectURL',
)
const originalRevokeObjectURL = Object.getOwnPropertyDescriptor(
	URL,
	'revokeObjectURL',
)
const revokeObjectURL = jest.fn()

beforeAll(() => {
	Object.defineProperty(URL, 'createObjectURL', {
		configurable: true,
		value: jest.fn((file: File) => `blob:${file.name}`),
	})
	Object.defineProperty(URL, 'revokeObjectURL', {
		configurable: true,
		value: revokeObjectURL,
	})
})

afterAll(() => {
	if (originalCreateObjectURL) {
		Object.defineProperty(URL, 'createObjectURL', originalCreateObjectURL)
	} else {
		Reflect.deleteProperty(URL, 'createObjectURL')
	}
	if (originalRevokeObjectURL) {
		Object.defineProperty(URL, 'revokeObjectURL', originalRevokeObjectURL)
	} else {
		Reflect.deleteProperty(URL, 'revokeObjectURL')
	}
})

const activeSession = {
	sessionId: 'session-1',
	recipeId: 'recipe-1',
	status: 'in_progress',
} as unknown as NonNullable<
	ReturnType<typeof useCookingStore.getState>['session']
>

const loadedRecipe = {
	id: 'recipe-1',
	title: 'Pho',
	steps: [],
} as unknown as NonNullable<
	ReturnType<typeof useCookingStore.getState>['recipe']
>

describe('cooking UI continuity', () => {
	beforeEach(() => {
		useStepPhotoStore.getState().clearAllPhotos()
		useAuthStore.setState({ user: null })
		revokeObjectURL.mockClear()
		useCookingStore.setState({
			session: null,
			recipe: null,
			isPreviewMode: false,
		})
		useUiStore.setState({
			cookingMode: 'expanded',
			isCookingPlayerOpen: true,
		})
	})

	afterEach(() => {
		useStepPhotoStore.getState().clearAllPhotos()
		useAuthStore.setState({ user: null })
	})

	it.each(['in_progress', 'paused'])(
		'keeps a loaded %s session reopenable',
		status => {
			expect(
				resolveCookingCloseMode({
					isPreviewMode: false,
					session: { status },
					recipe: { title: 'Pho' },
				}),
			).toBe('mini')
		},
	)

	it.each([
		['preview', true, { status: 'in_progress' }, { title: 'Pho' }],
		['absent session', false, null, { title: 'Pho' }],
		['missing recipe', false, { status: 'in_progress' }, null],
		['partial session', false, {}, { title: 'Pho' }],
		['completed session', false, { status: 'completed' }, { title: 'Pho' }],
		['abandoned session', false, { status: 'abandoned' }, { title: 'Pho' }],
		['unknown status', false, { status: 'expired' }, { title: 'Pho' }],
	])('hides %s state', (_label, isPreviewMode, session, recipe) => {
		expect(resolveCookingCloseMode({ isPreviewMode, session, recipe })).toBe(
			'hidden',
		)
	})

	it.each(['closeCookingPanel', 'minimizeCookingPanel'] as const)(
		'%s collapses a live session to mini through the real store',
		action => {
			useCookingStore.setState({
				session: activeSession,
				recipe: loadedRecipe,
			})

			useUiStore.getState()[action]()

			expect(useUiStore.getState()).toMatchObject({
				cookingMode: 'mini',
				isCookingPlayerOpen: false,
			})
		},
	)

	it('closes a terminal session to hidden through the real store', () => {
		useCookingStore.setState({
			session: { ...activeSession, status: 'completed' },
			recipe: loadedRecipe,
		})

		useUiStore.getState().closeCookingPanel()

		expect(useUiStore.getState()).toMatchObject({
			cookingMode: 'hidden',
			isCookingPlayerOpen: false,
		})
	})

	it.each([
		'closeCookingPanel',
		'minimizeCookingPanel',
		'toggleCookingPlayer',
		'setCookingMode',
		'completeCooking',
		'abandonCooking',
		'clearSession',
		'resumeExistingSession',
	])('clears matching preview photos when exiting through %s', async action => {
		const previewSession = {
			sessionId: 'preview-session-1',
		} as NonNullable<ReturnType<typeof useCookingStore.getState>['session']>
		const previewPhoto = new File(['preview'], 'preview.jpg', {
			type: 'image/jpeg',
		})
		useAuthStore.setState({ user: { userId: 'owner-1' } as User })
		useStepPhotoStore.getState().setSession('preview-session-1', 'owner-1')
		expect(
			useStepPhotoStore
				.getState()
				.addPhoto('preview-session-1', 'owner-1', 1, previewPhoto),
		).toBe(true)
		useCookingStore.setState({ session: previewSession, isPreviewMode: true })

		switch (action) {
			case 'closeCookingPanel':
				useUiStore.getState().closeCookingPanel()
				break
			case 'minimizeCookingPanel':
				useUiStore.getState().minimizeCookingPanel()
				break
			case 'toggleCookingPlayer':
				useUiStore.getState().toggleCookingPlayer()
				break
			case 'setCookingMode':
				useUiStore.getState().setCookingMode('hidden')
				break
			case 'completeCooking':
				await useCookingStore.getState().completeCooking()
				break
			case 'abandonCooking':
				await useCookingStore.getState().abandonCooking()
				break
			case 'clearSession':
				useCookingStore.getState().clearSession()
				break
			case 'resumeExistingSession':
				await useCookingStore.getState().resumeExistingSession()
				break
		}

		expect(useStepPhotoStore.getState()).toMatchObject({
			sessionId: null,
			ownerId: null,
			photos: [],
		})
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview.jpg')
		expect(useCookingStore.getState()).toMatchObject({
			session: null,
			isPreviewMode: false,
		})
	})

	it.each([
		['another session', 'other-session', 'owner-1'],
		['another owner', 'preview-session-1', 'owner-2'],
	])(
		'does not clear preview photos for %s',
		(_label, photoSessionId, photoOwnerId) => {
			const previewSession = {
				sessionId: 'preview-session-1',
			} as NonNullable<ReturnType<typeof useCookingStore.getState>['session']>
			const photo = new File(['other'], 'other.jpg', { type: 'image/jpeg' })
			useAuthStore.setState({ user: { userId: 'owner-1' } as User })
			useStepPhotoStore.getState().setSession(photoSessionId, photoOwnerId)
			expect(
				useStepPhotoStore
					.getState()
					.addPhoto(photoSessionId, photoOwnerId, 1, photo),
			).toBe(true)
			useCookingStore.setState({ session: previewSession, isPreviewMode: true })

			useCookingStore.getState().exitPreview()

			expect(useStepPhotoStore.getState()).toMatchObject({
				sessionId: photoSessionId,
				ownerId: photoOwnerId,
				photos: [expect.objectContaining({ file: photo })],
			})
			expect(revokeObjectURL).not.toHaveBeenCalled()
		},
	)

	it('cleans up the legacy preview session sentinel before attempting resume', async () => {
		const legacyPreviewPhoto = new File(['legacy'], 'legacy.jpg', {
			type: 'image/jpeg',
		})
		useAuthStore.setState({ user: { userId: 'owner-1' } as User })
		useStepPhotoStore.getState().setSession('preview', 'owner-1')
		useStepPhotoStore
			.getState()
			.addPhoto('preview', 'owner-1', 1, legacyPreviewPhoto)
		useCookingStore.setState({
			session: { sessionId: 'preview' } as NonNullable<
				ReturnType<typeof useCookingStore.getState>['session']
			>,
			isPreviewMode: false,
		})

		await expect(
			useCookingStore.getState().resumeExistingSession(),
		).resolves.toBe(false)

		expect(useStepPhotoStore.getState()).toMatchObject({
			sessionId: null,
			ownerId: null,
			photos: [],
		})
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:legacy.jpg')
	})

	it('routes every close owner through one policy and preserves desktop mini mode', () => {
		const read = (file: string) =>
			fs.readFileSync(path.join(process.cwd(), file), 'utf8')
		const store = read('src/store/uiStore.ts')
		const mini = read('src/components/cooking/MiniCookingBar.tsx')

		// One declaration plus four policy consumers: legacy toggle, setter, close, minimize.
		expect(store.match(/resolveCurrentCookingCloseMode\(\)/g)).toHaveLength(5)
		// Hidden remains the initial mode, but no transition assigns it directly.
		expect(store.match(/cookingMode: 'hidden'/g)).toHaveLength(1)
		expect(mini).toContain("cookingMode === 'docked' && 'xl:hidden'")
		expect(mini).not.toContain('md:bottom-0 xl:hidden')
	})
})
