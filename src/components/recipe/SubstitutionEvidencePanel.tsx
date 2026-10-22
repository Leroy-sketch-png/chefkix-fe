'use client'

import { useTranslations } from 'next-intl'
import type {
	ResearchAbstentionReason,
	ResearchSubstitutionResponse,
} from '@/services/ai'

interface SubstitutionEvidencePanelProps {
	evidence: ResearchSubstitutionResponse
}

function translateAbstentionReason(
	t: ReturnType<typeof useTranslations<'recipe'>>,
	reason: ResearchAbstentionReason,
) {
	switch (reason) {
		case 'source_identity_unresolved':
			return t('researchIdentityUnresolved')
		case 'graph_unavailable':
			return t('researchGraphUnavailable')
		case 'calibration_not_ok':
			return t('researchCalibrationUnavailable')
		case 'hard_filter_unavailable':
			return t('researchAllergenEvidenceUnavailable')
		case 'empty_filtered_pool':
			return t('researchNoCandidatesAfterFilter')
		default:
			return t('researchGenericAbstention')
	}
}

function GraphProvenanceFooter({ evidence }: SubstitutionEvidencePanelProps) {
	const t = useTranslations('recipe')
	const provenance =
		evidence.contractVersion === 'graph-evidence-v1' && evidence.graphProvenance

	if (!provenance) return null

	return (
		<dl className='mt-3 border-t border-border-subtle pt-2 text-xs text-text-muted'>
			<div>
				<dt className='font-medium'>{t('researchGraphManifestHashLabel')}</dt>
				<dd className='break-all font-mono'>{provenance.manifestSha256}</dd>
			</div>
			<div className='mt-1'>
				<dt className='font-medium'>{t('researchGraphSourceSplitLabel')}</dt>
				<dd>{provenance.sourceSplit}</dd>
			</div>
		</dl>
	)
}

/** Render only evidence actually present in the versioned research response. */
export function SubstitutionEvidencePanel({
	evidence,
}: SubstitutionEvidencePanelProps) {
	const t = useTranslations('recipe')

	if (evidence.contractVersion === 'graph-preflight-v2') {
		return (
			<div
				role='status'
				className='rounded-lg border border-border-subtle bg-bg-elevated p-3'
			>
				<p className='text-sm font-medium text-text-primary'>
					{t(
						evidence.sourceIdentityStatus === 'ambiguous'
							? 'researchIdentityAmbiguous'
							: 'researchIdentityUnresolved',
					)}
				</p>
				<p className='mt-1 text-xs text-text-muted'>
					{t('researchIdentityNotQueried')}
				</p>
			</div>
		)
	}

	if (evidence.disposition === 'abstain') {
		const reasons = evidence.abstentionReasons.map(reason =>
			translateAbstentionReason(t, reason),
		)
		return (
			<div
				role='status'
				className='rounded-lg border border-border-subtle bg-bg-elevated p-3'
			>
				<p className='text-sm font-medium text-text-primary'>
					{t('researchRecommendationsWithheld')}
				</p>
				<ul className='mt-1 list-disc space-y-1 pl-5 text-xs text-text-muted'>
					{reasons.map((reason, index) => (
						<li key={`${evidence.abstentionReasons[index]}-${index}`}>
							{reason}
						</li>
					))}
				</ul>
				{evidence.abstentionReasons.includes('hard_filter_unavailable') && (
					<p className='mt-2 text-xs font-medium text-warning'>
						{t('researchNotSafetyAssessment')}
					</p>
				)}
				<GraphProvenanceFooter evidence={evidence} />
			</div>
		)
	}

	return (
		<div className='space-y-2' aria-label={t('researchEvidenceResults')}>
			<p className='text-xs text-text-muted'>{t('researchEvidenceBoundary')}</p>
			<ul className='max-h-64 space-y-2 overflow-y-auto'>
				{evidence.candidates.map(candidate => (
					<li
						key={candidate.candidateId}
						className='rounded-xl border border-border-subtle bg-bg-elevated p-3'
					>
						<div className='flex items-start justify-between gap-3'>
							<span className='text-sm font-medium text-text-primary'>
								{candidate.name}
							</span>
							<span className='shrink-0 text-xs text-text-muted'>
								{t('researchRank', { rank: candidate.rank })}
							</span>
						</div>
						<p className='mt-1 break-all text-xs text-text-muted'>
							{candidate.fooDbId
								? t('researchFooDbId', { id: candidate.fooDbId })
								: t('researchFooDbIdUnavailable')}
						</p>
						<p className='mt-1 text-xs text-text-muted'>
							{candidate.seen
								? t('researchPreviouslySupported', {
										count: candidate.trainPairCount,
									})
								: t('researchNoPriorPairSupport')}
						</p>
					</li>
				))}
			</ul>
			<GraphProvenanceFooter evidence={evidence} />
		</div>
	)
}
