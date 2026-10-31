import { API_ENDPOINTS } from '@/constants/api'
import { aiApi } from '@/lib/axios'
import type {
	VoiceCopilotEvidence,
	VoiceCopilotRequest,
	VoiceCopilotResponse,
	VoiceIntervention,
	VoiceInterventionSeverity,
} from '../types'

const PENDING_MESSAGE =
	'Voice-vision answers are waiting for the Leader VLM + Graph-RAG endpoint.'

interface UnknownRecord {
	[key: string]: unknown
}

/** The adapter only calls the Leader service after its endpoint is configured. */
export function getVoiceCopilotEndpoint(): string | null {
	const configuredEndpoint =
		process.env.NEXT_PUBLIC_VOICE_COPILOT_ENDPOINT?.trim()
	return configuredEndpoint || null
}

export function createIntegrationPendingResponse(): VoiceCopilotResponse {
	return {
		status: 'integration-pending',
		answer: PENDING_MESSAGE,
		speechText: PENDING_MESSAGE,
		interventions: [],
		evidence: [],
		source: 'integration-pending',
	}
}

function asRecord(value: unknown): UnknownRecord {
	return value && typeof value === 'object' ? (value as UnknownRecord) : {}
}

function asString(value: unknown, fallback: string): string {
	return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function asSeverity(value: unknown): VoiceInterventionSeverity {
	return value === 'critical' || value === 'warning' ? value : 'info'
}

function normalizeInterventions(value: unknown): VoiceIntervention[] {
	if (!Array.isArray(value)) return []

	return value.flatMap((item, index) => {
		const intervention = asRecord(item)
		const message = asString(intervention.message, '')
		if (!message) return []
		return [
			{
				id: asString(intervention.id, `intervention-${index + 1}`),
				severity: asSeverity(intervention.severity),
				title: asString(intervention.title, 'Kitchen check'),
				message,
				suggestedAction:
					typeof intervention.suggestedAction === 'string'
						? intervention.suggestedAction
						: undefined,
				source:
					typeof intervention.source === 'string'
						? intervention.source
						: undefined,
			},
		]
	})
}

function normalizeEvidence(value: unknown): VoiceCopilotEvidence[] {
	if (!Array.isArray(value)) return []

	return value.flatMap((item, index) => {
		const evidence = asRecord(item)
		const label = asString(evidence.label ?? evidence.name, '')
		const source = asString(evidence.source ?? evidence.document, '')
		if (!label || !source) return []
		return [
			{
				id: asString(evidence.id, `evidence-${index + 1}`),
				label,
				source,
				confidence:
					typeof evidence.confidence === 'number'
						? evidence.confidence
						: undefined,
			},
		]
	})
}

/** Normalize the Leader payload so the UI remains stable as the contract evolves. */
export function normalizeVoiceCopilotResponse(
	payload: unknown,
): VoiceCopilotResponse {
	const envelope = asRecord(payload)
	const data = asRecord(envelope.data ?? payload)
	const answer = asString(data.answer ?? data.response, '')
	const speechText = asString(data.speechText ?? data.speech_text, answer)

	return {
		status: answer ? 'ready' : 'error',
		answer: answer || 'The copilot returned no answer.',
		speechText: speechText || 'The copilot returned no answer.',
		interventions: normalizeInterventions(
			data.interventions ?? data.interventionAlerts,
		),
		evidence: normalizeEvidence(data.evidence ?? data.graphEvidence),
		source: 'leader-api',
		requestId:
			typeof data.requestId === 'string'
				? data.requestId
				: typeof envelope.requestId === 'string'
					? envelope.requestId
					: undefined,
	}
}

/**
 * Orchestrate voice text and an optional camera frame through the future Leader
 * VLM + Graph-RAG + TTS pipeline. No local mock answer is returned.
 */
export async function orchestrateVoiceCopilot(
	request: VoiceCopilotRequest,
): Promise<VoiceCopilotResponse> {
	const endpoint = getVoiceCopilotEndpoint()
	if (!endpoint) return createIntegrationPendingResponse()

	try {
		const response = await aiApi.post(endpoint, request)
		return normalizeVoiceCopilotResponse(response.data)
	} catch (error) {
		return {
			status: 'error',
			answer: 'The voice-vision service is unavailable. Try again shortly.',
			speechText: 'The voice-vision service is unavailable.',
			interventions: [],
			evidence: [],
			source: 'client-error',
			errorMessage: error instanceof Error ? error.message : 'Request failed',
		}
	}
}

export const VOICE_COPILOT_CONTRACT_ENDPOINT = API_ENDPOINTS.AI.VOICE_COPILOT
