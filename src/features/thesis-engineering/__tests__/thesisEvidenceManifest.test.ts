import { thesisEvidenceManifest } from '../data/thesisEvidenceManifest'

describe('thesis evidence manifest', () => {
	it('maps every Epic 11 backlog chapter to capture criteria', () => {
		expect(thesisEvidenceManifest.chapters.map(chapter => chapter.id)).toEqual([
			'5',
			'6',
			'7',
			'8',
			'10',
			'11',
		])
		for (const chapter of thesisEvidenceManifest.chapters) {
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
})
