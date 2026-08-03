import fs from 'node:fs'
import path from 'node:path'
import { settleOptimisticMutation } from '@/lib/optimistic-mutation'

describe('optimistic mutation settlement', () => {
	it('commits only successful responses with data', async () => {
		const onSuccess = jest.fn()
		const onFailure = jest.fn()
		const onSettled = jest.fn()

		await expect(
			settleOptimisticMutation({
				request: async () => ({
					success: true,
					statusCode: 200,
					data: { isSaved: true },
				}),
				onSuccess,
				onFailure,
				onSettled,
			}),
		).resolves.toBe(true)
		expect(onSuccess).toHaveBeenCalledWith({ isSaved: true })
		expect(onFailure).not.toHaveBeenCalled()
		expect(onSettled).toHaveBeenCalledTimes(1)
	})

	it.each([
		['structured rejection', { success: false, statusCode: 409 }],
		['missing command data', { success: true, statusCode: 200 }],
	])('rolls back %s', async (_label, response) => {
		const onSuccess = jest.fn()
		const onFailure = jest.fn()
		const onSettled = jest.fn()

		await expect(
			settleOptimisticMutation({
				request: async () => response,
				onSuccess,
				onFailure,
				onSettled,
			}),
		).resolves.toBe(false)
		expect(onSuccess).not.toHaveBeenCalled()
		expect(onFailure).toHaveBeenCalledTimes(1)
		expect(onSettled).toHaveBeenCalledTimes(1)
	})

	it('rolls back thrown failures', async () => {
		const onSuccess = jest.fn()
		const onFailure = jest.fn()
		const onSettled = jest.fn()

		await expect(
			settleOptimisticMutation({
				request: async () => {
					throw new Error('offline')
				},
				onSuccess,
				onFailure,
				onSettled,
			}),
		).resolves.toBe(false)
		expect(onSuccess).not.toHaveBeenCalled()
		expect(onFailure).toHaveBeenCalledTimes(1)
		expect(onSettled).toHaveBeenCalledTimes(1)
	})

	it('releases settlement without misclassifying a client callback fault', async () => {
		const callbackError = new Error('tracking callback failed')
		const onFailure = jest.fn()
		const onSettled = jest.fn()

		await expect(
			settleOptimisticMutation({
				request: async () => ({
					success: true,
					statusCode: 200,
					data: { isSaved: true },
				}),
				onSuccess: () => {
					throw callbackError
				},
				onFailure,
				onSettled,
			}),
		).rejects.toBe(callbackError)
		expect(onFailure).not.toHaveBeenCalled()
		expect(onSettled).toHaveBeenCalledTimes(1)
	})
})

describe('recipe mutation ownership', () => {
	const read = (file: string) =>
		fs.readFileSync(path.join(process.cwd(), file), 'utf8')

	it('routes every defective recipe toggle through the settlement authority', () => {
		const correctedSources = [
			'src/app/(main)/recipes/[id]/page.tsx',
			'src/app/(main)/explore/ExploreClient.tsx',
		].map(read)
		const combined = correctedSources.join('\n')

		expect(combined.match(/settleOptimisticMutation\(\{/g)).toHaveLength(3)
		expect(combined.match(/toggle(?:Like|Save)Recipe\(/g)).toHaveLength(3)
		for (const source of correctedSources) {
			expect(source).not.toMatch(
				/const (?:response|res) = await toggle(?:Like|Save)Recipe/,
			)
		}
	})

	it('leaves the already-correct Search rollback lifecycle local', () => {
		const search = read('src/app/(main)/search/page.tsx')
		expect(search).toContain('const res = await toggleSaveRecipe(recipe.id)')
		expect(search).toMatch(
			/if \(res\.success && res\.data\)[\s\S]*?else \{[\s\S]*?setSaved\(prev\)[\s\S]*?catch \{[\s\S]*?setSaved\(prev\)/,
		)
	})
})
