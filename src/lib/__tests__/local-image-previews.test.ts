import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
	createLocalImagePreviewUrlRegistry,
	failLocalImagePreview,
	markLocalImagePreviewReady,
	removeLocalImagePreview,
	type LocalImagePreview,
} from '../local-image-previews'

describe('local image previews', () => {
	it('keeps file selection order when image loads finish out of order', () => {
		const firstFile = new File(['first'], 'first.jpg', { type: 'image/jpeg' })
		const secondFile = new File(['second'], 'second.jpg', {
			type: 'image/jpeg',
		})
		const selected: LocalImagePreview[] = [
			{
				id: 1,
				file: firstFile,
				previewStatus: 'loading',
				previewUrl: 'blob:first',
			},
			{
				id: 2,
				file: secondFile,
				previewStatus: 'loading',
				previewUrl: 'blob:second',
			},
		]

		const secondFinishesFirst = markLocalImagePreviewReady(selected, 2)
		const bothFinished = markLocalImagePreviewReady(secondFinishesFirst, 1)

		expect(bothFinished.map(photo => photo.file)).toEqual([
			firstFile,
			secondFile,
		])
		expect(bothFinished.map(photo => photo.previewUrl)).toEqual([
			'blob:first',
			'blob:second',
		])
		expect(bothFinished.map(photo => photo.previewStatus)).toEqual([
			'ready',
			'ready',
		])
	})

	it('removes a pending image without shifting loaded siblings', () => {
		const firstFile = new File(['first'], 'first.jpg', { type: 'image/jpeg' })
		const secondFile = new File(['second'], 'second.jpg', {
			type: 'image/jpeg',
		})
		const thirdFile = new File(['third'], 'third.jpg', { type: 'image/jpeg' })
		const selected: LocalImagePreview[] = [
			{
				id: 1,
				file: firstFile,
				previewStatus: 'ready',
				previewUrl: 'blob:first',
			},
			{
				id: 2,
				file: secondFile,
				previewStatus: 'loading',
				previewUrl: 'blob:second',
			},
			{
				id: 3,
				file: thirdFile,
				previewStatus: 'ready',
				previewUrl: 'blob:third',
			},
		]

		const remaining = removeLocalImagePreview(selected, 2)
		const lateSecondLoad = markLocalImagePreviewReady(remaining, 2)

		expect(lateSecondLoad.map(photo => photo.file)).toEqual([
			firstFile,
			thirdFile,
		])
		expect(lateSecondLoad.map(photo => photo.previewUrl)).toEqual([
			'blob:first',
			'blob:third',
		])
	})

	it('clears a failed preview URL and enters a terminal error state', () => {
		const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' })
		const photos: LocalImagePreview[] = [
			{ id: 1, file, previewStatus: 'loading', previewUrl: 'blob:photo' },
		]

		expect(failLocalImagePreview(photos, 1)[0]).toMatchObject({
			previewStatus: 'error',
			previewUrl: null,
		})
	})

	it('releases removed and remaining URLs exactly once', () => {
		const firstFile = new File(['first'], 'first.jpg', { type: 'image/jpeg' })
		const secondFile = new File(['second'], 'second.jpg', {
			type: 'image/jpeg',
		})
		const createObjectURL = jest
			.fn()
			.mockReturnValueOnce('blob:first')
			.mockReturnValueOnce('blob:second')
		const revokeObjectURL = jest.fn()
		const registry = createLocalImagePreviewUrlRegistry({
			createObjectURL,
			revokeObjectURL,
		})

		registry.create(1, firstFile)
		registry.create(2, secondFile)
		registry.release(1)
		registry.release(1)
		registry.releaseAll()

		expect(createObjectURL).toHaveBeenCalledTimes(2)
		expect(revokeObjectURL.mock.calls).toEqual([
			['blob:first'],
			['blob:second'],
		])
	})

	it('releases replaced URLs and makes cleanup idempotent', () => {
		const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' })
		const createObjectURL = jest
			.fn()
			.mockReturnValueOnce('blob:old')
			.mockReturnValueOnce('blob:new')
		const revokeObjectURL = jest.fn()
		const registry = createLocalImagePreviewUrlRegistry({
			createObjectURL,
			revokeObjectURL,
		})

		registry.create(1, file)
		expect(registry.create(1, file)).toBe('blob:new')
		registry.releaseAll()
		registry.releaseAll()

		expect(revokeObjectURL.mock.calls).toEqual([['blob:old'], ['blob:new']])
	})

	it('keeps both active social composers off base64 image previews', () => {
		const postComposer = readFileSync(
			join(process.cwd(), 'src/app/(main)/post/new/page.tsx'),
			'utf8',
		)
		const immediateRewards = readFileSync(
			join(process.cwd(), 'src/components/completion/ImmediateRewards.tsx'),
			'utf8',
		)

		for (const source of [postComposer, immediateRewards]) {
			expect(source).not.toContain('readAsDataURL')
			expect(source).toContain('createLocalImagePreviewUrlRegistry()')
			expect(source).toContain('registry.releaseAll()')
			expect(source).toContain('onLoad={() =>')
			expect(source).toContain('onError={() =>')
		}
	})
})
