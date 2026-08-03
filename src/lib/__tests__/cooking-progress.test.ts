import fs from 'fs'
import path from 'path'
import { deriveCookingProgress } from '@/lib/cooking-progress'

describe('compact cooking progress', () => {
	it('prefers authoritative session total', () => {
		expect(
			deriveCookingProgress({
				currentStep: 3,
				completedSteps: [1, 2],
				sessionTotalSteps: 6,
				recipeTotalSteps: 5,
			}),
		).toEqual({
			currentStep: 3,
			totalSteps: 6,
			completedCount: 2,
			progressPercent: 33,
		})
	})

	it('falls back defensively without understating current progress', () => {
		expect(
			deriveCookingProgress({
				currentStep: 4,
				completedSteps: [1, 2, 2, 5],
			}),
		).toEqual({
			currentStep: 4,
			totalSteps: 5,
			completedCount: 3,
			progressPercent: 60,
		})
	})

	it('bounds corrupt values', () => {
		const result = deriveCookingProgress({
			currentStep: -2,
			completedSteps: [-1, 1, 99],
			sessionTotalSteps: 3,
		})
		expect(result.totalSteps).toBe(99)
		expect(result.progressPercent).toBeGreaterThanOrEqual(0)
		expect(result.progressPercent).toBeLessThanOrEqual(100)
	})

	it('keeps both compact surfaces on the shared localized policy', () => {
		const read = (file: string) =>
			fs.readFileSync(path.join(process.cwd(), file), 'utf8')
		const banner = read('src/components/cooking/ResumeCookingBanner.tsx')
		const mini = read('src/components/cooking/MiniCookingBar.tsx')
		expect(banner).toContain('deriveCookingProgress({')
		expect(mini).toContain('deriveCookingProgress({')
		expect(mini).toContain(
			"t('stepOf', { current: currentStep, total: totalSteps })",
		)
		expect(mini).not.toMatch(/Step \{currentStep\} of \{totalSteps\}/)
	})
})
