import { getEvaluationDashboardData } from '../services/evaluationDashboardService'
import { parseEvaluationDashboardData } from '../services/evaluationDashboardSchema'

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
		).toBe(20.6941)
		expect(
			data.benchmarks.models.find(model => model.id === 'mistral')?.metrics
				.hitAt1,
		).toBeUndefined()
		expect(data.ablation.results).toHaveLength(4)
		expect(data.allergen.models).toHaveLength(4)
		expect(data.behavioral.metric).toBe('mrr')
		expect(data.behavioral.status).toBe('verified-negative')
	})

	it('keeps illustrative values visibly distinguishable from published results', async () => {
		const data = await getEvaluationDashboardData()

		expect(
			data.ablation.results
				.filter(result => result.hitAt1 !== undefined)
				.every(result => result.status === 'verified-negative'),
		).toBe(true)
		expect(
			data.allergen.models.every(model => model.status === 'pending'),
		).toBe(true)
		expect(
			data.benchmarks.models.find(model => model.id === 'gismo')?.status,
		).toBe('verified')
	})

	it('validates raw and enveloped exports identically', async () => {
		const data = await getEvaluationDashboardData()
		expect(parseEvaluationDashboardData({ data })).toEqual(data)
		for (const invalid of [null, [], {}, { data: {} }, { data: null }]) {
			expect(() => parseEvaluationDashboardData(invalid)).toThrow()
		}
	})

	it('hides pending and placeholder values across all four surfaces', async () => {
		const data = await getEvaluationDashboardData()
		data.benchmarks.models[0].status = 'placeholder'
		data.benchmarks.models[0].metrics = { hitAt1: 99 }
		data.ablation.results[0].hitAt1 = 99
		data.allergen.models[0].violationRate = 0
		data.behavioral.status = 'pending'
		const parsed = parseEvaluationDashboardData(data)
		expect(parsed.benchmarks.models[0].metrics).toEqual({})
		expect(parsed.ablation.results[0].hitAt1).toBeUndefined()
		expect(parsed.allergen.models[0].violationRate).toBeUndefined()
		expect(parsed.behavioral.mrrDelta).toBeUndefined()
		// Parsing must not mutate the cached source or caller's payload.
		expect(data.benchmarks.models[0].metrics.hitAt1).toBe(99)
	})

	it('rejects nonnumeric, nonfinite, and out-of-range metrics', async () => {
		for (const value of ['20.5', null, NaN, Infinity, -1, 101]) {
			const data = await getEvaluationDashboardData()
			Object.assign(data.benchmarks.models[1].metrics, { hitAt1: value })
			expect(() => parseEvaluationDashboardData(data)).toThrow()
		}
	})

	it('rejects duplicate identities and inconsistent behavioral deltas', async () => {
		const data = await getEvaluationDashboardData()
		data.benchmarks.models.push(data.benchmarks.models[0])
		expect(() => parseEvaluationDashboardData(data)).toThrow(/duplicate/)
		data.benchmarks.models.pop()
		data.behavioral.mrrDelta = 10
		expect(() => parseEvaluationDashboardData(data)).toThrow(/delta/)
	})

	it('requires adjudication metadata before accepting a completed safety rate', async () => {
		const data = await getEvaluationDashboardData()
		const model = data.allergen.models[0]
		Object.assign(model, {
			status: 'complete',
			violationRate: 0,
			totalCases: 208,
		})
		expect(() => parseEvaluationDashboardData(data)).toThrow(/adjudication/)
		model.adjudication = {
			protocol: 'test-only-protocol',
			reviewerCount: 2,
			status: 'complete',
			resultsSha256: 'a'.repeat(64),
		}
		expect(
			parseEvaluationDashboardData(data).allergen.models[0].violationRate,
		).toBe(0)
		model.adjudication.reviewerCount = 1
		expect(() => parseEvaluationDashboardData(data)).toThrow()
	})

	it('fails closed on malformed remote exports and HTTP failures', async () => {
		const previousUrl = process.env.NEXT_PUBLIC_EVALUATION_DATA_URL
		const previousFetch = global.fetch
		try {
			process.env.NEXT_PUBLIC_EVALUATION_DATA_URL =
				'https://example.test/evaluation'
			global.fetch = jest
				.fn()
				.mockResolvedValue({ ok: true, json: async () => ({ data: {} }) })
			await expect(getEvaluationDashboardData()).rejects.toThrow()
			global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 })
			await expect(getEvaluationDashboardData()).rejects.toThrow('503')
		} finally {
			global.fetch = previousFetch
			if (previousUrl === undefined)
				delete process.env.NEXT_PUBLIC_EVALUATION_DATA_URL
			else process.env.NEXT_PUBLIC_EVALUATION_DATA_URL = previousUrl
		}
	})
})
