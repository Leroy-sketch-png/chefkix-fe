import benchmarkResults from '../data/benchmark_results.json'
import ablationResults from '../data/ablation_results.json'
import allergenBenchmark from '../data/allergen_benchmark.json'
import behavioralResults from '../data/behavioral_results.json'
import type { EvaluationDashboardData } from '../types'
import { parseEvaluationDashboardData } from './evaluationDashboardSchema'

const remoteDataUrl = () =>
	process.env.NEXT_PUBLIC_EVALUATION_DATA_URL?.trim() || null

export async function getEvaluationDashboardData(): Promise<EvaluationDashboardData> {
	const endpoint = remoteDataUrl()
	if (endpoint) {
		const response = await fetch(endpoint, { cache: 'no-store' })
		if (!response.ok) {
			throw new Error(`Evaluation service returned ${response.status}.`)
		}
		return parseEvaluationDashboardData(await response.json())
	}

	return parseEvaluationDashboardData({
		benchmarks: benchmarkResults,
		ablation: ablationResults,
		allergen: allergenBenchmark,
		behavioral: behavioralResults,
	})
}
