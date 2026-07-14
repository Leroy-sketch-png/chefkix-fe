export type VideoMediaState =
	| 'idle'
	| 'requesting'
	| 'ready'
	| 'audio-only'
	| 'denied'
	| 'unavailable'
	| 'timeout'
	| 'error'

export type VideoCallStatusTone = 'success' | 'warning' | 'muted'

export interface VideoCallStatusInput {
	mediaState: VideoMediaState
	isJoined: boolean
	isCalling: boolean
	isCallActive: boolean
	connectionState: RTCPeerConnectionState
	iceConnectionState: RTCIceConnectionState
	relayCandidateAvailable: boolean
}

export interface VideoCallStatus {
	labelKey: string
	detailKey: string
	tone: VideoCallStatusTone
}

export function getVideoCallStatus({
	mediaState,
	isJoined,
	isCalling,
	isCallActive,
	connectionState,
	iceConnectionState,
	relayCandidateAvailable,
}: VideoCallStatusInput): VideoCallStatus {
	if (
		mediaState === 'denied' ||
		mediaState === 'unavailable' ||
		mediaState === 'timeout' ||
		mediaState === 'error'
	) {
		return {
			labelKey: 'callStatusNeedsSetup',
			detailKey: 'callStatusNeedsSetupDetail',
			tone: 'warning',
		}
	}

	if (mediaState === 'requesting') {
		return {
			labelKey: 'callStatusChecking',
			detailKey: 'callStatusCheckingDetail',
			tone: 'muted',
		}
	}

	if (
		isCallActive &&
		(connectionState === 'connected' ||
			iceConnectionState === 'connected' ||
			iceConnectionState === 'completed')
	) {
		return {
			labelKey: 'callStatusConnected',
			detailKey: 'callStatusConnectedDetail',
			tone: 'success',
		}
	}

	if (isCalling) {
		return {
			labelKey: 'callStatusWaiting',
			detailKey: 'callStatusWaitingDetail',
			tone: relayCandidateAvailable ? 'success' : 'muted',
		}
	}

	if (!isJoined) {
		return {
			labelKey: 'callStatusReconnecting',
			detailKey: 'callStatusReconnectingDetail',
			tone: 'warning',
		}
	}

	if (mediaState === 'audio-only') {
		return {
			labelKey: 'callStatusAudioReady',
			detailKey: 'callStatusAudioReadyDetail',
			tone: 'success',
		}
	}

	return {
		labelKey: 'callStatusReady',
		detailKey: 'callStatusReadyDetail',
		tone: relayCandidateAvailable ? 'success' : 'muted',
	}
}
