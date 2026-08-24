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

export async function getEvaluationDashboardData(): Promise<EvaluationDashboardData> {
	return {
		benchmarks: benchmarkResults as BenchmarkResults,
		ablation: ablationResults as AblationResults,
		allergen: allergenBenchmark as AllergenBenchmarkResults,
		behavioral: behavioralResults as BehavioralLearningResults,
	}
}
