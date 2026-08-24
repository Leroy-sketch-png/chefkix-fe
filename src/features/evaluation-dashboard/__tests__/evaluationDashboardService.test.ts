import { getEvaluationDashboardData } from '../services/evaluationDashboardService'

describe('evaluation dashboard data contract', () => {
	it('loads every Epic 9 data surface from the JSON exports', async () => {
		const data = await getEvaluationDashboardData()

		expect(data.benchmarks.models.map(model => model.id)).toEqual([
			'iron-chef',
			'gismo',
			'mistral',
			'gemini',
		])
		expect(
			data.benchmarks.models.find(model => model.id === 'gismo')?.metrics
				.hitAt1,
		).toBe(20.56)
		expect(
			data.benchmarks.models.find(model => model.id === 'mistral')?.metrics
				.hitAt1,
		).toBe(21.75)
		expect(data.ablation.results).toHaveLength(4)
		expect(data.allergen.models).toHaveLength(3)
		expect(data.behavioral.metric).toBe('mrr')
		expect(data.behavioral.status).toBe('pending')
	})

	it('keeps illustrative values visibly distinguishable from published results', async () => {
		const data = await getEvaluationDashboardData()

		expect(
			data.ablation.results.every(result => result.status === 'placeholder'),
		).toBe(true)
		expect(
			data.allergen.models.every(model => model.status === 'placeholder'),
		).toBe(true)
		expect(
			data.benchmarks.models.find(model => model.id === 'gismo')?.status,
		).toBe('published')
	})
})
