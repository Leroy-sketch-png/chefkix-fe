import type { ResearchSubstitutionResponse } from '@/services/ai'

const abstentionReasons = new Set([
	'graph_unavailable',
	'calibration_not_ok',
	'empty_filtered_pool',
	'source_identity_unresolved',
	'hard_filter_unavailable',
])

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.trim().length > 0
}

function isSha256(value: unknown): value is string {
	return typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value)
}

/**
 * Runtime guard for the injected research boundary. TypeScript types do not
 * validate a remote JSON response; inconsistent evidence must never render as
 * a recommendation.
 */
export function parseResearchSubstitutionResponse(
	value: unknown,
): ResearchSubstitutionResponse | null {
	if (!isRecord(value)) return null

	if (value.contractVersion === 'graph-preflight-v2') {
		if (
			(value.sourceIdentityStatus === 'unresolved' ||
				value.sourceIdentityStatus === 'ambiguous') &&
			value.sourceIngredientId === null &&
			value.graphStatus === 'not_evaluated' &&
			value.disposition === 'abstain' &&
			(value.abstentionReason === 'source_identity_unresolved' ||
				value.abstentionReason === 'source_identity_ambiguous')
		) {
			return value as unknown as ResearchSubstitutionResponse
		}
		return null
	}

	if (value.contractVersion !== 'graph-evidence-v1') return null
	if (
		!['not_configured', 'invalid', 'ready'].includes(String(value.graphStatus))
	) {
		return null
	}
	if (!isRecord(value.calibration)) return null

	const calibration = value.calibration
	if (
		!['ok', 'uninformative', 'vacuous', 'no_guarantee', 'abstain'].includes(
			String(calibration.status),
		) ||
		!['missing', 'mismatched', 'compatible'].includes(
			String(calibration.bindingStatus),
		) ||
		!(
			calibration.manifestSha256 === null ||
			isSha256(calibration.manifestSha256)
		) ||
		!Number.isInteger(calibration.calibrationCaseCount) ||
		Number(calibration.calibrationCaseCount) < 0
	) {
		return null
	}

	const reasons = value.abstentionReasons
	if (
		!Array.isArray(reasons) ||
		!reasons.every(
			reason => typeof reason === 'string' && abstentionReasons.has(reason),
		) ||
		!Array.isArray(value.candidates)
	) {
		return null
	}

	const candidates = value.candidates
	const candidateIds = new Set<string>()
	for (const candidate of candidates) {
		if (
			!isRecord(candidate) ||
			!isNonEmptyString(candidate.candidateId) ||
			!isNonEmptyString(candidate.name) ||
			!Number.isFinite(candidate.rank) ||
			Number(candidate.rank) <= 0 ||
			!(candidate.fooDbId === null || isNonEmptyString(candidate.fooDbId)) ||
			typeof candidate.knownNode !== 'boolean' ||
			!Number.isInteger(candidate.trainPairCount) ||
			Number(candidate.trainPairCount) < 0 ||
			typeof candidate.seen !== 'boolean' ||
			candidate.seen !== Number(candidate.trainPairCount) > 0 ||
			!(candidate.ratio === null || typeof candidate.ratio === 'string') ||
			!(
				candidate.confidenceScore === null ||
				(typeof candidate.confidenceScore === 'number' &&
					Number.isFinite(candidate.confidenceScore) &&
					candidate.confidenceScore >= 0 &&
					candidate.confidenceScore <= 1)
			)
		) {
			return null
		}
		if (candidateIds.has(candidate.candidateId)) return null
		candidateIds.add(candidate.candidateId)
	}

	const graphProvenance = value.graphProvenance
	const rankerProvenance = value.rankerProvenance
	const hardFilterProvenance = value.hardFilterProvenance
	if (
		graphProvenance !== null &&
		(!isRecord(graphProvenance) ||
			!isNonEmptyString(graphProvenance.artifactId) ||
			!isSha256(graphProvenance.manifestSha256) ||
			graphProvenance.sourceSplit !== 'train' ||
			!isNonEmptyString(graphProvenance.transformationId))
	) {
		return null
	}
	if (
		rankerProvenance !== null &&
		(!isRecord(rankerProvenance) ||
			!isNonEmptyString(rankerProvenance.rankerId) ||
			!isSha256(rankerProvenance.scorerSha256))
	) {
		return null
	}
	if (
		hardFilterProvenance !== null &&
		(!isRecord(hardFilterProvenance) ||
			!isNonEmptyString(hardFilterProvenance.policyId) ||
			!isSha256(hardFilterProvenance.policySha256))
	) {
		return null
	}

	if (value.disposition === 'recommendations') {
		if (
			value.graphStatus !== 'ready' ||
			calibration.status !== 'ok' ||
			calibration.bindingStatus !== 'compatible' ||
			!graphProvenance ||
			!rankerProvenance ||
			!hardFilterProvenance ||
			reasons.length !== 0 ||
			candidates.length === 0
		) {
			return null
		}
	} else if (value.disposition === 'abstain') {
		if (reasons.length === 0) return null
	} else {
		return null
	}

	return value as unknown as ResearchSubstitutionResponse
}
