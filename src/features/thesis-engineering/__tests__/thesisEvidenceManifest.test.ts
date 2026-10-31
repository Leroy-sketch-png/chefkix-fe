import { thesisEvidenceManifest } from '../data/thesisEvidenceManifest'

describe('thesis evidence manifest', () => {
	it('maps every Epic 11 backlog chapter to capture criteria', () => {
		expect(thesisEvidenceManifest.chapters.map(chapter => chapter.id)).toEqual(
			Array.from({ length: 14 }, (_, i) => String(i + 1)),
		)
		for (const chapter of thesisEvidenceManifest.chapters) {
			expect(
				chapter.artifacts.every(artifact => artifact.chapterId === chapter.id),
			).toBe(true)
			expect(chapter.criteria.length).toBeGreaterThan(0)
			expect(chapter.artifacts.length).toBeGreaterThan(0)
		}
	})

	it('keeps artifact identifiers unique and leader-dependent evidence explicit', () => {
		const artifacts = thesisEvidenceManifest.chapters.flatMap(
			chapter => chapter.artifacts,
		)
		const ids = artifacts.map(artifact => artifact.id)

		expect(new Set(ids).size).toBe(ids.length)
		expect(artifacts.some(artifact => artifact.status === 'pending-data')).toBe(
			true,
		)
		expect(
			artifacts
				.filter(artifact => artifact.status === 'pending-data')
				.every(artifact =>
					/Leader|export|endpoint|infrastructure/i.test(artifact.dependency),
				),
		).toBe(true)
	})

	it('tracks the current Leader baseline and the pending T56 exhibit honestly', () => {
		expect(thesisEvidenceManifest.version).toBe('lead-v522-member-v3')
		expect(thesisEvidenceManifest.updatedAt).toBe('2026-10-23')
		expect(JSON.stringify(thesisEvidenceManifest)).not.toContain(
			'BACKLOG_LEAD.md v101',
		)

		const chapter13 = thesisEvidenceManifest.chapters.find(
			chapter => chapter.id === '13',
		)
		const t56 = chapter13?.artifacts.find(
			artifact => artifact.id === 'chapter-13-t56-saved-output',
		)

		expect(t56).toMatchObject({
			title: 'Saved-output validation exhibit (T56)',
			kind: 'demo',
			status: 'pending-data',
		})
		expect(t56?.description).toContain('200-case validation diagnostic')
		expect(t56?.description).toContain('not product-quality evidence')
		expect(t56?.captureBrief).toEqual(
			expect.arrayContaining([
				'Load the corrected, hash-pinned saved-output exhibit; the backlog summary is not the source artifact.',
				'Keep the 200-case validation result diagnostic; do not call it product quality or method superiority.',
				'Record browser workflow p95 separately from inference and exhibit generation.',
				'Keep presenter/listener rehearsal and backup video pending until their evidence exists.',
			]),
		)
	})

	it('keeps the compound screenshot brief within verified evidence limits', () => {
		const compoundScreenshot = thesisEvidenceManifest.chapters
			.find(chapter => chapter.id === '8')
			?.artifacts.find(artifact => artifact.id === 'chapter-8-compound-ui')

		expect(compoundScreenshot?.description).toBe(
			'Show documented compound overlap when available; keep unsupported nutrition, functional suitability, and safety claims unavailable.',
		)
		expect(compoundScreenshot?.captureBrief).toContain(
			'Do not present compound overlap as confidence, functional equivalence, or allergy safety.',
		)
	})
})
