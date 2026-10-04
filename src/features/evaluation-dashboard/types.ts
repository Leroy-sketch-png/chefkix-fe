export interface ResultProvenance {
	dataset: string
	split: string
	protocol: string
	seeds: number[]
	sourceSha256: string
	predictionsSha256: string
	decision: 'accepted' | 'rejected' | 'pending' | 'published'
	claimLimits: string
}

export type BenchmarkMetric = 'hitAt1' | 'hitAt5' | 'hitAt10' | 'mrr' | 'ndcg'

export interface BenchmarkModel {
	provenance?: ResultProvenance
	id: string
	name: string
	shortName: string
	status: 'verified' | 'published' | 'placeholder' | 'pending'
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
	provenance?: ResultProvenance
	id: string
	label: string
	hitAt1?: number
	status: 'verified-negative' | 'placeholder' | 'pending' | 'complete'
	note?: string
}

export interface AblationResults {
	version: string
	updatedAt: string
	metric: 'hitAt1'
	results: AblationResult[]
}

export interface AllergenBenchmarkModel {
	provenance?: ResultProvenance
	id: string
	name: string
	status: 'placeholder' | 'pending' | 'complete'
	violationRate?: number
	caughtViolations?: number
	totalCases?: number
	adjudication?: {
		protocol: string
		reviewerCount: number
		status: 'complete'
		resultsSha256: string
	}
	note?: string
}

export interface AllergenBenchmarkResults {
	version: string
	updatedAt: string
	benchmarkDescription: string
	models: AllergenBenchmarkModel[]
}

export interface BehavioralLearningResults {
	provenance?: ResultProvenance
	version: string
	updatedAt: string
	status: 'verified-negative' | 'placeholder' | 'pending' | 'complete'
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
