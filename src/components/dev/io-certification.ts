export const IO_CERTIFICATION_STORAGE_KEY = 'chefkix-demo-io-certification-v1'

export const IO_CERTIFICATION_MAX_AGE_MS = 4 * 60 * 60 * 1000

export const IO_CERTIFICATION_CHECKS = [
	{ id: 'media', label: 'Camera and microphone', stageRequired: false },
	{ id: 'speaker', label: 'Speaker output', stageRequired: true },
	{ id: 'clap', label: 'Clap calibration', stageRequired: false },
	{ id: 'voice', label: 'TTS and voice round trip', stageRequired: false },
	{ id: 'timer', label: 'Timer while narration muted', stageRequired: true },
	{ id: 'turn', label: 'TURN relay candidate', stageRequired: true },
] as const

export type IoCertificationCheckId =
	(typeof IO_CERTIFICATION_CHECKS)[number]['id']

export type IoCertificationStatus =
	| 'idle'
	| 'running'
	| 'confirm'
	| 'pass'
	| 'fail'

export interface IoCertificationResult {
	status: IoCertificationStatus
	detail: string
	verifiedAt?: string
}

export type IoCertificationResults = Record<
	IoCertificationCheckId,
	IoCertificationResult
>

export interface IoCertificationSummary {
	ok: boolean
	stageOk: boolean
	passed: number
	total: number
	stagePassed: number
	stageTotal: number
	detail: string
	stageDetail: string
	missing: string[]
	failed: string[]
	stale: string[]
	stageBlocking: string[]
	optionalUnavailable: string[]
	oldestVerifiedAt?: string
}

export function getIoCertificationGateResult(summary: IoCertificationSummary): {
	status: 'pass' | 'warn' | 'fail'
	detail: string
} {
	if (summary.ok) {
		return { status: 'pass', detail: summary.detail }
	}
	if (summary.stageOk) {
		return { status: 'warn', detail: summary.stageDetail }
	}
	return { status: 'fail', detail: summary.stageDetail }
}

export function getIoCertificationBlockers(
	requiredChecks: readonly IoCertificationCheckId[],
	results: Partial<IoCertificationResults> | null,
	nowMs = Date.now(),
	maxAgeMs = IO_CERTIFICATION_MAX_AGE_MS,
): string[] {
	return requiredChecks.flatMap(id => {
		const check = IO_CERTIFICATION_CHECKS.find(candidate => candidate.id === id)
		const label = check?.label || id
		const result = results?.[id]
		if (!result || result.status !== 'pass') return [label]
		if (!result.verifiedAt) return [`${label} (missing timestamp)`]

		const verifiedMs = Date.parse(result.verifiedAt)
		if (!Number.isFinite(verifiedMs) || verifiedMs > nowMs)
			return [`${label} (invalid timestamp)`]
		if (nowMs - verifiedMs > maxAgeMs) return [`${label} (stale)`]
		return []
	})
}

export const EMPTY_IO_CERTIFICATION_RESULTS: IoCertificationResults =
	IO_CERTIFICATION_CHECKS.reduce((acc, check) => {
		acc[check.id] = {
			status: 'idle',
			detail:
				check.id === 'clap' ? 'Requires microphone preview' : 'Not checked',
		}
		return acc
	}, {} as IoCertificationResults)

function labelFor(id: IoCertificationCheckId) {
	return IO_CERTIFICATION_CHECKS.find(check => check.id === id)?.label || id
}

export function summarizeIoCertification(
	results: Partial<IoCertificationResults> | null,
	nowMs = Date.now(),
	maxAgeMs = IO_CERTIFICATION_MAX_AGE_MS,
): IoCertificationSummary {
	const stageChecks = IO_CERTIFICATION_CHECKS.filter(
		check => check.stageRequired,
	)

	if (!results) {
		return {
			ok: false,
			stageOk: false,
			passed: 0,
			total: IO_CERTIFICATION_CHECKS.length,
			stagePassed: 0,
			stageTotal: stageChecks.length,
			detail:
				'No physical I/O evidence. Open the cockpit and complete camera, microphone, speaker, clap, voice, timer, and TURN checks.',
			stageDetail:
				'Core stage path is not certified. Verify speaker output, timer isolation, and TURN relay.',
			missing: IO_CERTIFICATION_CHECKS.map(check => check.label),
			failed: [],
			stale: [],
			stageBlocking: stageChecks.map(check => check.label),
			optionalUnavailable: [],
		}
	}

	const missing: string[] = []
	const failed: string[] = []
	const stale: string[] = []
	const stageBlocking: string[] = []
	const optionalUnavailable: string[] = []
	const verifiedTimes: number[] = []
	let passed = 0
	let stagePassed = 0

	for (const check of IO_CERTIFICATION_CHECKS) {
		const result = results[check.id]
		if (!result || result.status === 'idle') {
			missing.push(check.label)
			if (check.stageRequired) stageBlocking.push(check.label)
			else optionalUnavailable.push(check.label)
			continue
		}

		if (result.status === 'fail') {
			failed.push(`${check.label}: ${result.detail}`)
			if (check.stageRequired)
				stageBlocking.push(`${check.label}: ${result.detail}`)
			else optionalUnavailable.push(`${check.label}: ${result.detail}`)
			continue
		}

		if (result.status !== 'pass') {
			missing.push(`${check.label} (${result.status})`)
			if (check.stageRequired)
				stageBlocking.push(`${check.label} (${result.status})`)
			else optionalUnavailable.push(`${check.label} (${result.status})`)
			continue
		}

		const verifiedMs = result.verifiedAt
			? Date.parse(result.verifiedAt)
			: Number.NaN
		if (!Number.isFinite(verifiedMs)) {
			stale.push(`${check.label}: missing timestamp`)
			if (check.stageRequired)
				stageBlocking.push(`${check.label}: missing timestamp`)
			else optionalUnavailable.push(`${check.label}: missing timestamp`)
			continue
		}

		if (verifiedMs > nowMs) {
			stale.push(`${check.label}: timestamp is in the future`)
			if (check.stageRequired)
				stageBlocking.push(`${check.label}: timestamp is in the future`)
			else
				optionalUnavailable.push(`${check.label}: timestamp is in the future`)
			continue
		}

		if (nowMs - verifiedMs > maxAgeMs) {
			const ageMinutes = Math.round((nowMs - verifiedMs) / 60000)
			stale.push(`${check.label}: ${ageMinutes} min old`)
			if (check.stageRequired)
				stageBlocking.push(`${check.label}: ${ageMinutes} min old`)
			else optionalUnavailable.push(`${check.label}: ${ageMinutes} min old`)
			continue
		}

		passed += 1
		if (check.stageRequired) stagePassed += 1
		verifiedTimes.push(verifiedMs)
	}

	const stageOk = stagePassed === stageChecks.length
	const stageDetail = stageOk
		? optionalUnavailable.length
			? `Core stage path ready ${stagePassed}/${stageChecks.length}. Keep optional device features off: ${optionalUnavailable.join('; ')}`
			: `Core stage path ready ${stagePassed}/${stageChecks.length}.`
		: `Core stage path blocked ${stagePassed}/${stageChecks.length}. ${stageBlocking.join('; ')}`

	if (passed === IO_CERTIFICATION_CHECKS.length) {
		const oldestMs = Math.min(...verifiedTimes)
		const ageMinutes = Math.max(0, Math.round((nowMs - oldestMs) / 60000))
		const oldestVerifiedAt = new Date(oldestMs).toISOString()
		return {
			ok: true,
			stageOk,
			passed,
			total: IO_CERTIFICATION_CHECKS.length,
			stagePassed,
			stageTotal: stageChecks.length,
			detail: `${passed}/${IO_CERTIFICATION_CHECKS.length} physical I/O checks passed; oldest evidence is ${ageMinutes} min old.`,
			stageDetail,
			missing,
			failed,
			stale,
			stageBlocking,
			optionalUnavailable,
			oldestVerifiedAt,
		}
	}

	const problems = [
		missing.length ? `missing: ${missing.join(', ')}` : '',
		failed.length ? `failed: ${failed.join('; ')}` : '',
		stale.length ? `stale: ${stale.join('; ')}` : '',
	]
		.filter(Boolean)
		.join(' | ')

	return {
		ok: false,
		stageOk,
		passed,
		total: IO_CERTIFICATION_CHECKS.length,
		stagePassed,
		stageTotal: stageChecks.length,
		detail: `${passed}/${IO_CERTIFICATION_CHECKS.length} physical I/O checks passed. ${problems}`,
		stageDetail,
		missing,
		failed,
		stale,
		stageBlocking,
		optionalUnavailable,
	}
}

export function parseIoCertificationResults(
	raw: string | null,
): Partial<IoCertificationResults> | null {
	if (!raw) return null

	try {
		const parsed: unknown = JSON.parse(raw)
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
			return null

		const source = parsed as Record<string, unknown>
		const validated: Partial<IoCertificationResults> = {}
		for (const check of IO_CERTIFICATION_CHECKS) {
			const value = source[check.id]
			if (!value || typeof value !== 'object' || Array.isArray(value)) continue

			const candidate = value as Record<string, unknown>
			if (
				!['idle', 'running', 'confirm', 'pass', 'fail'].includes(
					String(candidate.status),
				) ||
				typeof candidate.detail !== 'string' ||
				(candidate.verifiedAt !== undefined &&
					typeof candidate.verifiedAt !== 'string')
			) {
				continue
			}

			validated[check.id] = {
				status: candidate.status as IoCertificationStatus,
				detail: candidate.detail,
				...(typeof candidate.verifiedAt === 'string'
					? { verifiedAt: candidate.verifiedAt }
					: {}),
			}
		}
		return validated
	} catch {
		return null
	}
}

export function getStoredIoCertificationSummary(
	storage?: Pick<Storage, 'getItem'> | null,
) {
	try {
		const target =
			storage === undefined
				? typeof window !== 'undefined'
					? window.localStorage
					: null
				: storage
		const raw = target?.getItem(IO_CERTIFICATION_STORAGE_KEY) ?? null
		return summarizeIoCertification(parseIoCertificationResults(raw))
	} catch {
		return summarizeIoCertification(null)
	}
}

export function getStoredIoCertificationResults(
	storage?: Pick<Storage, 'getItem'> | null,
) {
	try {
		const target =
			storage === undefined
				? typeof window !== 'undefined'
					? window.localStorage
					: null
				: storage
		const raw = target?.getItem(IO_CERTIFICATION_STORAGE_KEY) ?? null
		return parseIoCertificationResults(raw)
	} catch {
		return null
	}
}
