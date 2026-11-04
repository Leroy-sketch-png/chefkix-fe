import { act, renderHook } from '@testing-library/react'
import { toast } from 'sonner'
import type { User } from '@/lib/types'
import { useStepPhotoStore } from '@/lib/step-photo-store'
import { useAuthStore } from '@/store/authStore'
import { useStepPhotos } from '../useStepPhotos'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => key,
}))

jest.mock('sonner', () => ({
	toast: { error: jest.fn() },
}))

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
	useStepPhotoStore.getState().clearAllPhotos()
	useAuthStore.setState({ user: { userId: 'owner-1' } as User })
	createObjectURL.mockClear()
	revokeObjectURL.mockClear()
	jest.clearAllMocks()
})

afterEach(() => {
	useStepPhotoStore.getState().clearAllPhotos()
	useAuthStore.setState({ user: null })
	window.localStorage.clear()
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

describe('useStepPhotos account ownership', () => {
	it('explains oversized photo rejection and resets the capture input', () => {
		const { result } = renderHook(() => useStepPhotos('session-1'))
		const input = {
			files: [new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.jpg')],
			value: 'selected',
		}
		act(() => result.current.captureForStep(1))

		act(() => {
			result.current.onFileChange({
				target: input,
			} as unknown as React.ChangeEvent<HTMLInputElement>)
		})

		expect(toast.error).toHaveBeenCalledWith('photoSizeLimit')
		expect(input.value).toBe('')
		expect(result.current.getFiles()).toEqual([])
	})

	it('preserves ordered photos across a same-session hook unmount and remount', () => {
		const firstPhoto = new File(['first'], 'first.jpg', {
			type: 'image/jpeg',
		})
		const firstMount = renderHook(() => useStepPhotos('session-1'))
		const firstInput = { files: [firstPhoto], value: 'selected' }
		firstMount.result.current.fileInputRef.current = {
			click: jest.fn(),
		} as unknown as HTMLInputElement

		act(() => firstMount.result.current.captureForStep(1))
		act(() => {
			firstMount.result.current.onFileChange({
				target: firstInput,
			} as unknown as React.ChangeEvent<HTMLInputElement>)
		})
		expect(firstMount.result.current.getFiles()).toEqual([firstPhoto])
		firstMount.unmount()

		const secondPhoto = new File(['second'], 'second.jpg', {
			type: 'image/jpeg',
		})
		const secondMount = renderHook(() => useStepPhotos('session-1'))
		const secondInput = { files: [secondPhoto], value: 'selected' }
		secondMount.result.current.fileInputRef.current = {
			click: jest.fn(),
		} as unknown as HTMLInputElement

		expect(secondMount.result.current.getFiles()).toEqual([firstPhoto])
		act(() => secondMount.result.current.captureForStep(3))
		act(() => {
			secondMount.result.current.onFileChange({
				target: secondInput,
			} as unknown as React.ChangeEvent<HTMLInputElement>)
		})

		expect(secondMount.result.current.getFiles()).toEqual([
			firstPhoto,
			secondPhoto,
		])
		expect(
			useStepPhotoStore.getState().photos.map(photo => photo.stepNumber),
		).toEqual([1, 3])
		expect(revokeObjectURL).not.toHaveBeenCalled()
		secondMount.unmount()
	})

	it('shares captured files and cleanup across concurrent cooking surfaces', () => {
		const docked = renderHook(() => useStepPhotos('session-1'))
		const expanded = renderHook(() => useStepPhotos('session-1'))
		const file = new File(['step'], 'step.jpg', { type: 'image/jpeg' })
		const input = { files: [file], value: 'selected' }
		docked.result.current.fileInputRef.current = {
			click: jest.fn(),
		} as unknown as HTMLInputElement

		act(() => docked.result.current.captureForStep(2))
		act(() => {
			docked.result.current.onFileChange({
				target: input,
			} as unknown as React.ChangeEvent<HTMLInputElement>)
		})

		expect(docked.result.current.getFiles()).toEqual([file])
		expect(expanded.result.current.getFiles()).toEqual([file])
		expect(expanded.result.current.photos[0]).toMatchObject({
			stepNumber: 2,
			file,
		})

		act(() => expanded.result.current.clearPhotos())

		expect(docked.result.current.getFiles()).toEqual([])
		expect(expanded.result.current.getFiles()).toEqual([])
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:step.jpg')
		docked.unmount()
		expanded.unmount()
	})

	it('hides and revokes one account photos immediately when identity changes', () => {
		const { result, unmount } = renderHook(() => useStepPhotos('session-1'))
		const ownerOneFile = new File(['private'], 'private.jpg', {
			type: 'image/jpeg',
		})
		const fileInput = { click: jest.fn() } as unknown as HTMLInputElement
		result.current.fileInputRef.current = fileInput

		expect(result.current.ownerId).toBe('owner-1')
		act(() => {
			result.current.captureForStep(1)
		})
		expect(fileInput.click).toHaveBeenCalledTimes(1)
		const ownerOneInput = { files: [ownerOneFile], value: 'selected' }
		act(() => {
			result.current.onFileChange({
				target: ownerOneInput,
			} as unknown as React.ChangeEvent<HTMLInputElement>)
		})
		expect(ownerOneInput.value).toBe('')
		expect(result.current.photos.map(photo => photo.file)).toEqual([
			ownerOneFile,
		])
		expect(result.current.getFiles()).toEqual([ownerOneFile])
		const staleOwnerOneHandler = result.current.onFileChange

		act(() => {
			useAuthStore.getState().setUser({ userId: 'owner-2' } as User)
		})

		expect(result.current.ownerId).toBe('owner-2')
		expect(result.current.photos).toEqual([])
		expect(result.current.getFiles()).toEqual([])
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:private.jpg')
		expect(useStepPhotoStore.getState()).toMatchObject({
			sessionId: 'session-1',
			ownerId: 'owner-2',
			photos: [],
		})
		const lateOwnerOneFile = new File(
			[new Uint8Array(10 * 1024 * 1024 + 1)],
			'late.jpg',
			{ type: 'image/jpeg' },
		)
		const lateOwnerOneInput = { files: [lateOwnerOneFile], value: 'selected' }
		act(() => {
			staleOwnerOneHandler({
				target: lateOwnerOneInput,
			} as unknown as React.ChangeEvent<HTMLInputElement>)
		})
		expect(lateOwnerOneInput.value).toBe('')
		expect(result.current.photos).toEqual([])
		expect(createObjectURL).toHaveBeenCalledTimes(1)
		expect(toast.error).not.toHaveBeenCalled()

		const ownerTwoFile = new File(['new owner'], 'owner-two.jpg', {
			type: 'image/jpeg',
		})
		act(() => result.current.captureForStep(2))
		act(() => {
			result.current.onFileChange({
				target: { files: [ownerTwoFile], value: 'selected' },
			} as unknown as React.ChangeEvent<HTMLInputElement>)
		})
		expect(result.current.getFiles()).toEqual([ownerTwoFile])

		act(() => useAuthStore.getState().logout())
		expect(result.current.ownerId).toBe('')
		expect(result.current.photos).toEqual([])
		expect(useStepPhotoStore.getState()).toMatchObject({
			sessionId: null,
			ownerId: null,
			photos: [],
		})
		unmount()
	})
})
