export interface DemoCockpitPresence {
	activeCockpitId: string | null
	status: 'ACTIVE' | 'STANDBY' | 'UNKNOWN'
}

export interface DemoCockpitStatusEvent {
	cockpitId?: string
	status?: string
}

export function applyDemoCockpitStatus(
	current: DemoCockpitPresence,
	event: DemoCockpitStatusEvent,
): DemoCockpitPresence {
	const cockpitId = event.cockpitId || null

	if (event.status === 'ACTIVE') {
		return {
			activeCockpitId: cockpitId,
			status: 'ACTIVE',
		}
	}

	if (
		event.status === 'STANDBY' &&
		(!current.activeCockpitId || !cockpitId || cockpitId === current.activeCockpitId)
	) {
		return {
			activeCockpitId: null,
			status: 'STANDBY',
		}
	}

	return current
}
