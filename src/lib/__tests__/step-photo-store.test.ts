import {
	getStepPhotoFiles,
	getStepPhotosForSession,
	MAX_STEP_PHOTOS,
	useStepPhotoStore,
} from '@/lib/step-photo-store'

const originalCreateObjectURL = Object.getOwnPropertyDescriptor(
	URL,
	'createObjectURL',
)
const originalRevokeObjectURL = Object.getOwnPropertyDescriptor(
	URL,
	'revokeObjectURL',
)
const createObjectURL = jest.fn((file: File) => `blob:${file.name}`)
const revokeObjectURL = jest.fn()

beforeAll(() => {
	Object.defineProperty(URL, 'createObjectURL', {
		configurable: true,
		value: createObjectURL,
	})
	Object.defineProperty(URL, 'revokeObjectURL', {
		configurable: true,
		value: revokeObjectURL,
	})
})

beforeEach(() => {
	useStepPhotoStore.getState().setSession('test-session', 'owner-1')
	useStepPhotoStore.getState().clearPhotos('test-session', 'owner-1')
	createObjectURL.mockClear()
	revokeObjectURL.mockClear()
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

describe('cooking step photo store', () => {
	it('shares one ordered session photo set across consumers', () => {
		const store = useStepPhotoStore.getState()
		const first = new File(['one'], 'one.jpg', { type: 'image/jpeg' })
		const second = new File(['two'], 'two.jpg', { type: 'image/jpeg' })

		expect(store.addPhoto('test-session', 'owner-1', 2, first)).toBe(true)
		expect(store.addPhoto('test-session', 'owner-1', 1, second)).toBe(true)
		store.setSession('test-session', 'owner-1')

		expect(getStepPhotoFiles('test-session', 'owner-1')).toEqual([
			first,
			second,
		])
		expect(useStepPhotoStore.getState().photos.map(p => p.stepNumber)).toEqual([
			2, 1,
		])
	})

	it('never exposes another or missing session photos to a consumer', () => {
		const store = useStepPhotoStore.getState()
		const photo = new File(['private'], 'session-photo.jpg', {
			type: 'image/jpeg',
		})
		store.addPhoto('test-session', 'owner-1', 1, photo)

		expect(getStepPhotosForSession('test-session', 'owner-1')).toHaveLength(1)
		expect(getStepPhotosForSession('test-session', 'owner-2')).toEqual([])
		expect(getStepPhotosForSession('other-session', 'owner-1')).toEqual([])
		expect(getStepPhotosForSession(undefined, 'owner-1')).toEqual([])
		expect(getStepPhotosForSession('test-session', undefined)).toEqual([])
		expect(getStepPhotoFiles('test-session', 'owner-2')).toEqual([])
	})

	it('enforces the completion-flow cap and rejects stale-session writes', () => {
		const store = useStepPhotoStore.getState()
		for (let index = 0; index < MAX_STEP_PHOTOS; index++) {
			expect(
				store.addPhoto(
					'test-session',
					'owner-1',
					index + 1,
					new File([String(index)], `${index}.jpg`, { type: 'image/jpeg' }),
				),
			).toBe(true)
		}
		expect(
			store.addPhoto(
				'test-session',
				'owner-1',
				4,
				new File(['four'], 'four.jpg', { type: 'image/jpeg' }),
			),
		).toBe(false)
		expect(
			store.addPhoto(
				'other-session',
				'owner-1',
				4,
				new File(['wrong'], 'wrong.jpg', { type: 'image/jpeg' }),
			),
		).toBe(false)
	})

	it('revokes old session URLs on session change and on explicit cleanup', () => {
		const store = useStepPhotoStore.getState()
		store.addPhoto(
			'test-session',
			'owner-1',
			1,
			new File(['one'], 'one.jpg', { type: 'image/jpeg' }),
		)
		store.setSession('next-session', 'owner-1')
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:one.jpg')
		expect(useStepPhotoStore.getState().photos).toEqual([])

		store.addPhoto(
			'next-session',
			'owner-1',
			1,
			new File(['two'], 'two.jpg', { type: 'image/jpeg' }),
		)
		store.clearPhotos('next-session', 'owner-1')
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:two.jpg')
	})

	it('revokes previous-owner files on account transition and rejects stale writes', () => {
		const store = useStepPhotoStore.getState()
		store.addPhoto(
			'test-session',
			'owner-1',
			1,
			new File(['private'], 'private.jpg', { type: 'image/jpeg' }),
		)

		store.setSession('test-session', 'owner-2')

		expect(revokeObjectURL).toHaveBeenCalledWith('blob:private.jpg')
		expect(getStepPhotoFiles('test-session', 'owner-2')).toEqual([])
		expect(
			store.addPhoto(
				'test-session',
				'owner-1',
				2,
				new File(['stale'], 'stale.jpg', { type: 'image/jpeg' }),
			),
		).toBe(false)
	})
})
