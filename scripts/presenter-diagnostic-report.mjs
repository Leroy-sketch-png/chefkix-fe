import { sanitizeDiagnosticValue } from '../src/lib/sanitize-diagnostics.mjs'

function omitUrlFields(value) {
	if (Array.isArray(value)) return value.map(omitUrlFields)
	if (value === null || typeof value !== 'object') return value

	const output = Object.create(null)
	for (const [key, child] of Object.entries(value)) {
		if (/(?:url|href)$/i.test(key)) continue
		output[key] = omitUrlFields(child)
	}
	return output
}

export function serializePresenterDiagnosticReport(report) {
	const safeReport = omitUrlFields(sanitizeDiagnosticValue(report))
	return `${JSON.stringify(safeReport, null, 2)}\n`
}
