import benchmarkResults from '../data/benchmark_results.json'
import ablationResults from '../data/ablation_results.json'
import allergenBenchmark from '../data/allergen_benchmark.json'
import behavioralResults from '../data/behavioral_results.json'
import type {
	AblationResults,
	AllergenBenchmarkResults,
	BenchmarkResults,
	BehavioralLearningResults,
	EvaluationDashboardData,
} from '../types'

const remoteDataUrl = () =>
	process.env.NEXT_PUBLIC_EVALUATION_DATA_URL?.trim() || null

const unwrapEvaluationData = (value: unknown): EvaluationDashboardData => {
	if (!value || typeof value !== 'object') {
		throw new Error('Evaluation service returned an invalid payload.')
	}

	const record = value as Record<string, unknown>
	const data = record.data
	if (data && typeof data === 'object') return data as EvaluationDashboardData
	return record as unknown as EvaluationDashboardData
}

export async function getEvaluationDashboardData(): Promise<EvaluationDashboardData> {
	const endpoint = remoteDataUrl()
	if (endpoint) {
		const response = await fetch(endpoint, { cache: 'no-store' })
		if (!response.ok) {
			throw new Error(`Evaluation service returned ${response.status}.`)
		}
		return unwrapEvaluationData(await response.json())
	}

	return {
		benchmarks: benchmarkResults as BenchmarkResults,
		ablation: ablationResults as AblationResults,
		allergen: allergenBenchmark as AllergenBenchmarkResults,
		behavioral: behavioralResults as BehavioralLearningResults,
	}
}
