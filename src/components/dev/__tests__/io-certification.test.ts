import {
	IO_CERTIFICATION_CHECKS,
	parseIoCertificationResults,
	summarizeIoCertification,
	type IoCertificationResults,
} from '@/components/dev/io-certification'

function passingResults(verifiedAt: string): IoCertificationResults {
	return IO_CERTIFICATION_CHECKS.reduce((acc, check) => {
		acc[check.id] = {
			status: 'pass',
			detail: 'Verified',
			verifiedAt,
		}
		return acc
	}, {} as IoCertificationResults)
}

describe('io certification summary', () => {
	it('requires evidence for every physical check', () => {
		const summary = summarizeIoCertification(null)

		expect(summary.ok).toBe(false)
		expect(summary.passed).toBe(0)
		expect(summary.missing).toHaveLength(IO_CERTIFICATION_CHECKS.length)
	})

	it('passes only when all evidence is recent', () => {
		const now = Date.parse('2026-06-11T08:00:00.000Z')
		const summary = summarizeIoCertification(
			passingResults('2026-06-11T07:30:00.000Z'),
			now,
		)

		expect(summary.ok).toBe(true)
		expect(summary.passed).toBe(IO_CERTIFICATION_CHECKS.length)
		expect(summary.detail).toContain('6/6')
	})

	it('rejects stale physical evidence', () => {
		const now = Date.parse('2026-06-11T08:00:00.000Z')
		const summary = summarizeIoCertification(
			passingResults('2026-06-11T02:30:00.000Z'),
			now,
		)

		expect(summary.ok).toBe(false)
		expect(summary.stale).toHaveLength(IO_CERTIFICATION_CHECKS.length)
	})

	it('preserves malformed storage as missing evidence', () => {
		expect(parseIoCertificationResults('not-json')).toBeNull()
	})
})
