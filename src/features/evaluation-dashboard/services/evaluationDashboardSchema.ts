import { z } from 'zod'
import type { EvaluationDashboardData } from '../types'

const text = z.string().trim().min(1)
const percentage = z.number().finite().min(0).max(100)
const metadata = { version: text, updatedAt: z.iso.date() }
const metrics = z
	.object({
		hitAt1: percentage.optional(),
		hitAt5: percentage.optional(),
		hitAt10: percentage.optional(),
		mrr: percentage.optional(),
		ndcg: percentage.optional(),
	})
	.strict()
const resultStatus = z.enum([
	'verified-negative',
	'placeholder',
	'pending',
	'complete',
])
const note = z.string().optional()
const provenance = z
	.object({
		dataset: text,
		split: text,
		protocol: text,
		seeds: z
			.array(z.number().int().nonnegative())
			.min(1)
			.refine(
				values => new Set(values).size === values.length,
				'Seeds must be unique',
			),
		sourceSha256: z.string().regex(/^[a-f0-9]{64}$/i),
		predictionsSha256: z.string().regex(/^[a-f0-9]{64}$/i),
		decision: z.enum(['accepted', 'rejected', 'pending', 'published']),
		claimLimits: text,
	})
	.optional()

const schema = z.object({
	benchmarks: z.object({
		...metadata,
		metricDefinitions: z.object({
			hitAt1: text,
			hitAt5: text,
			hitAt10: text,
			mrr: text,
			ndcg: text,
		}),
		models: z
			.array(
				z.object({
					id: text,
					name: text,
					shortName: text,
					status: z.enum(['verified', 'published', 'placeholder', 'pending']),
					metrics,
					note,
					provenance,
				}),
			)
			.min(1),
	}),
	ablation: z.object({
		...metadata,
		metric: z.literal('hitAt1'),
		results: z
			.array(
				z.object({
					id: text,
					label: text,
					hitAt1: percentage.optional(),
					status: resultStatus,
					note,
					provenance,
				}),
			)
			.min(1),
	}),
	allergen: z.object({
		...metadata,
		benchmarkDescription: text,
		models: z
			.array(
				z.object({
					id: text,
					name: text,
					status: z.enum(['placeholder', 'pending', 'complete']),
					violationRate: percentage.optional(),
					caughtViolations: z.number().int().nonnegative().optional(),
					totalCases: z.number().int().positive().optional(),
					adjudication: z
						.object({
							protocol: text,
							reviewerCount: z.number().int().min(2),
							status: z.literal('complete'),
							resultsSha256: z.string().regex(/^[a-f0-9]{64}$/i),
						})
						.optional(),
					note,
					provenance,
				}),
			)
			.min(1),
	}),
	behavioral: z.object({
		...metadata,
		status: resultStatus,
		metric: z.literal('mrr'),
		staticMrr: percentage.optional(),
		feedbackMrr: percentage.optional(),
		mrrDelta: z.number().finite().min(-100).max(100).optional(),
		note,
		provenance,
	}),
})

/** Validate both bundled and remote exports before any metric reaches a view. */
export function parseEvaluationDashboardData(
	value: unknown,
): EvaluationDashboardData {
	const envelope = z.object({ data: z.unknown() }).safeParse(value)
	const data = schema.parse(
		envelope.success && envelope.data.data !== undefined
			? envelope.data.data
			: value,
	)
	for (const rows of [
		data.benchmarks.models,
		data.ablation.results,
		data.allergen.models,
	]) {
		if (new Set(rows.map(row => row.id)).size !== rows.length) {
			throw new Error('Evaluation export contains duplicate result identities.')
		}
	}
	for (const model of data.benchmarks.models) {
		if (model.status === 'pending' || model.status === 'placeholder')
			model.metrics = {}
	}
	for (const result of data.ablation.results) {
		if (result.status === 'pending' || result.status === 'placeholder')
			delete result.hitAt1
	}
	for (const model of data.allergen.models) {
		if (model.status !== 'complete') {
			delete model.violationRate
			delete model.caughtViolations
			delete model.totalCases
		} else if (
			!model.adjudication ||
			model.violationRate === undefined ||
			model.totalCases === undefined ||
			(model.caughtViolations ?? 0) > model.totalCases
		) {
			throw new Error(
				'Completed allergen results require adjudication, a rate, and a valid case count.',
			)
		}
	}
	const behavioral = data.behavioral
	if (behavioral.status === 'pending' || behavioral.status === 'placeholder') {
		delete behavioral.staticMrr
		delete behavioral.feedbackMrr
		delete behavioral.mrrDelta
	} else if (
		behavioral.staticMrr === undefined ||
		behavioral.feedbackMrr === undefined ||
		behavioral.mrrDelta === undefined ||
		Math.abs(
			behavioral.feedbackMrr - behavioral.staticMrr - behavioral.mrrDelta,
		) > 0.0001
	) {
		throw new Error('Behavioral MRR values must include a consistent delta.')
	}
	return data
}
