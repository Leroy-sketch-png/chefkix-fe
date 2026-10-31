export type HealthService =
	| 'frontend'
	| 'monolith'
	| 'ai-service'
	| 'keycloak'
	| 'typesense'

export interface HealthProbeResult {
	healthy: boolean
	statusCode: number | null
	detail?: string
}

type JsonObject = Record<string, unknown>

function isJsonObject(value: unknown): value is JsonObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function assessHealthResponse(
	service: HealthService,
	statusCode: number,
	payload: unknown,
): HealthProbeResult {
	if (statusCode < 200 || statusCode >= 300) {
		return { healthy: false, statusCode, detail: `HTTP ${statusCode}` }
	}
	if (service === 'frontend') return { healthy: true, statusCode }
	if (!isJsonObject(payload)) {
		return { healthy: false, statusCode, detail: 'Invalid health response' }
	}

	const semanticStatus =
		service === 'monolith'
			? payload.status === 'UP'
			: service === 'ai-service'
				? payload.status === 'healthy'
				: service === 'keycloak'
					? payload.realm === 'nottisn'
					: payload.ok === true

	if (semanticStatus) return { healthy: true, statusCode }

	const actual =
		service === 'keycloak' ? payload.realm : (payload.status ?? payload.ok)
	return {
		healthy: false,
		statusCode,
		detail:
			actual === undefined
				? 'Missing expected health identity/status'
				: `Reported ${String(actual)}`,
	}
}

export async function probeHttpService(
	service: HealthService,
	url: string,
	timeoutMs = 5000,
): Promise<HealthProbeResult> {
	try {
		const response = await fetch(url, {
			cache: 'no-store',
			signal: AbortSignal.timeout(timeoutMs),
		})
		if (!response.ok || service === 'frontend') {
			return assessHealthResponse(service, response.status, null)
		}

		let payload: unknown
		try {
			payload = await response.json()
		} catch {
			return {
				healthy: false,
				statusCode: response.status,
				detail: 'Invalid health response',
			}
		}
		return assessHealthResponse(service, response.status, payload)
	} catch {
		return { healthy: false, statusCode: null, detail: 'Request failed' }
	}
}

export function getDevDashboardProbe(
	port: number,
	backendBaseUrl: string,
): { service: HealthService; url: string } | null {
	const probes: Record<number, { service: HealthService; url: string }> = {
		3000: { service: 'frontend', url: 'http://localhost:3000' },
		8080: {
			service: 'monolith',
			url: `${backendBaseUrl}/api/v1/actuator/health`,
		},
		8000: { service: 'ai-service', url: 'http://localhost:8000/health' },
		8180: { service: 'keycloak', url: 'http://localhost:8180/realms/nottisn' },
		8108: { service: 'typesense', url: 'http://localhost:8108/health' },
	}
	return probes[port] ?? null
}
