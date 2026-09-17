export type VoiceCopilotStatus = 'ready' | 'integration-pending' | 'error'

export type VoiceInterventionSeverity = 'info' | 'warning' | 'critical'

export interface VoiceCopilotContext {
	recipeId?: string
	recipeTitle?: string
	currentStep?: number
	currentStepInstruction?: string
}

export interface VoiceCopilotRequest {
	command: string
	frameDataUrl?: string
	context?: VoiceCopilotContext
}

export interface VoiceIntervention {
	id: string
	severity: VoiceInterventionSeverity
	title: string
	message: string
	suggestedAction?: string
	source?: string
}

export interface VoiceCopilotEvidence {
	id: string
	label: string
	source: string
	confidence?: number
}

export interface VoiceCopilotResponse {
	status: VoiceCopilotStatus
	answer: string
	speechText: string
	interventions: VoiceIntervention[]
	evidence: VoiceCopilotEvidence[]
	source: 'leader-api' | 'integration-pending' | 'client-error'
	requestId?: string
	errorMessage?: string
}
