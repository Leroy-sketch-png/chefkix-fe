import {
	getIoCertificationGateResult,
	getIoCertificationBlockers,
	getStoredIoCertificationResults,
	getStoredIoCertificationSummary,
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
	it('gates only required checks and rejects missing, failed, stale, or future evidence', () => {
		const now = Date.parse('2026-06-11T08:00:00.000Z')
		const recent = passingResults('2026-06-11T07:30:00.000Z')

		expect(
			getIoCertificationBlockers(['speaker', 'timer'], recent, now),
		).toEqual([])
		expect(getIoCertificationBlockers(['turn'], recent, now)).toEqual([])
		expect(getIoCertificationBlockers(['turn'], null, now)).toEqual([
			'TURN relay candidate',
		])

		recent.timer = { status: 'fail', detail: 'Not audible' }
		expect(getIoCertificationBlockers(['timer'], recent, now)).toEqual([
			'Timer while narration muted',
		])
		expect(
			getIoCertificationBlockers(
				['speaker'],
				passingResults('2026-06-11T02:30:00.000Z'),
				now,
			),
		).toEqual(['Speaker output (stale)'])
		expect(
			getIoCertificationBlockers(
				['speaker'],
				passingResults('2026-06-11T08:01:00.000Z'),
				now,
			),
		).toEqual(['Speaker output (invalid timestamp)'])
	})

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
		expect(summary.stageOk).toBe(true)
		expect(summary.passed).toBe(IO_CERTIFICATION_CHECKS.length)
		expect(summary.detail).toContain('6/6')
	})

	it('keeps the core stage path ready when optional device checks fail', () => {
		const now = Date.parse('2026-06-11T08:00:00.000Z')
		const results = passingResults('2026-06-11T07:30:00.000Z')
		results.media = {
			status: 'fail',
			detail: 'NotAllowedError: Permission denied',
			verifiedAt: '2026-06-11T07:30:00.000Z',
		}
		results.clap = {
			status: 'fail',
			detail: 'Microphone unavailable',
			verifiedAt: '2026-06-11T07:30:00.000Z',
		}
		results.voice = {
			status: 'fail',
			detail: 'Recognition error: not-allowed',
			verifiedAt: '2026-06-11T07:30:00.000Z',
		}

		const summary = summarizeIoCertification(results, now)

		expect(summary.ok).toBe(false)
		expect(summary.stageOk).toBe(true)
		expect(summary.stagePassed).toBe(summary.stageTotal)
		expect(summary.optionalUnavailable).toHaveLength(3)
		expect(summary.stageDetail).toContain('Core stage path ready')
		expect(getIoCertificationGateResult(summary).status).toBe('warn')
	})

	it('blocks the stage path when timer isolation is not verified', () => {
		const now = Date.parse('2026-06-11T08:00:00.000Z')
		const results = passingResults('2026-06-11T07:30:00.000Z')
		results.timer = {
			status: 'fail',
			detail: 'Presenter could not hear the output',
			verifiedAt: '2026-06-11T07:30:00.000Z',
		}

		const summary = summarizeIoCertification(results, now)

		expect(summary.stageOk).toBe(false)
		expect(summary.stageBlocking).toContain(
			'Timer while narration muted: Presenter could not hear the output',
		)
		expect(getIoCertificationGateResult(summary).status).toBe('fail')
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

	it('rejects future-dated physical evidence instead of extending its lifetime', () => {
		const now = Date.parse('2026-06-11T08:00:00.000Z')
		const summary = summarizeIoCertification(
			passingResults('2026-06-11T08:01:00.000Z'),
			now,
		)

		expect(summary.ok).toBe(false)
		expect(summary.stageOk).toBe(false)
		expect(summary.stale).toHaveLength(IO_CERTIFICATION_CHECKS.length)
		expect(summary.stale[0]).toContain('timestamp is in the future')
	})

	it('preserves malformed storage as missing evidence', () => {
		expect(parseIoCertificationResults('not-json')).toBeNull()
		expect(parseIoCertificationResults('{"speaker":null}')).toEqual({})
		expect(
			parseIoCertificationResults(
				'{"speaker":{"status":"pass","detail":4,"verifiedAt":"2026-06-11T07:30:00.000Z"}}',
			),
		).toEqual({})
	})

	it('fails closed without crashing when browser storage is denied', () => {
		const deniedStorage = {
			getItem: () => {
				throw new Error('SecurityError')
			},
		}

		expect(getStoredIoCertificationResults(deniedStorage)).toBeNull()
		expect(getStoredIoCertificationSummary(deniedStorage).stageOk).toBe(false)
	})
})
