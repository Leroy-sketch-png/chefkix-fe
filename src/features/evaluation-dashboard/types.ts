export type BenchmarkMetric = 'hitAt1' | 'hitAt5' | 'hitAt10' | 'mrr' | 'ndcg'

export interface BenchmarkModel {
	id: string
	name: string
	shortName: string
	status: 'published' | 'placeholder' | 'pending'
	metrics: Partial<Record<BenchmarkMetric, number>>
	note?: string
}

export interface BenchmarkResults {
	version: string
	updatedAt: string
	metricDefinitions: Record<BenchmarkMetric, string>
	models: BenchmarkModel[]
}

export interface AblationResult {
	id: string
	label: string
	hitAt1?: number
	status: 'placeholder' | 'pending' | 'complete'
	note?: string
}

export interface AblationResults {
	version: string
	updatedAt: string
	metric: 'hitAt1'
	results: AblationResult[]
}

export interface AllergenBenchmarkModel {
	id: string
	name: string
	status: 'placeholder' | 'pending' | 'complete'
	violationRate?: number
	caughtViolations?: number
	totalCases?: number
	note?: string
}

export interface AllergenBenchmarkResults {
	version: string
	updatedAt: string
	benchmarkDescription: string
	models: AllergenBenchmarkModel[]
}

export interface BehavioralLearningResults {
	version: string
	updatedAt: string
	status: 'placeholder' | 'pending' | 'complete'
	metric: 'mrr'
	staticMrr?: number
	feedbackMrr?: number
	mrrDelta?: number
	note?: string
}

export interface EvaluationDashboardData {
	benchmarks: BenchmarkResults
	ablation: AblationResults
	allergen: AllergenBenchmarkResults
	behavioral: BehavioralLearningResults
}
