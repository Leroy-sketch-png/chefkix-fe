import { getVideoCallStatus } from '@/lib/video-call-status'

const baseStatus = {
	mediaState: 'ready' as const,
	isJoined: true,
	isCalling: false,
	isCallActive: false,
	connectionState: 'new' as RTCPeerConnectionState,
	iceConnectionState: 'new' as RTCIceConnectionState,
	relayCandidateAvailable: true,
}

describe('video call status mapper', () => {
	it('maps ready setup to product-safe copy keys', () => {
		expect(getVideoCallStatus(baseStatus)).toEqual({
			labelKey: 'callStatusReady',
			detailKey: 'callStatusReadyDetail',
			tone: 'success',
		})
	})

	it('maps connected peer state without exposing raw WebRTC labels', () => {
		const status = getVideoCallStatus({
			...baseStatus,
			isCallActive: true,
			connectionState: 'connected',
			iceConnectionState: 'completed',
		})

		expect(status).toEqual({
			labelKey: 'callStatusConnected',
			detailKey: 'callStatusConnectedDetail',
			tone: 'success',
		})
		expect(Object.values(status).join(' ').toLowerCase()).not.toMatch(
			/media|peer|ice|turn|completed/,
		)
	})

	it('turns permission and hardware failures into setup guidance', () => {
		for (const mediaState of ['denied', 'unavailable', 'timeout', 'error'] as const) {
			expect(
				getVideoCallStatus({
					...baseStatus,
					mediaState,
				}),
			).toMatchObject({
				labelKey: 'callStatusNeedsSetup',
				detailKey: 'callStatusNeedsSetupDetail',
				tone: 'warning',
			})
		}
	})

	it('marks dropped signaling as reconnecting without raw socket language', () => {
		expect(
			getVideoCallStatus({
				...baseStatus,
				isJoined: false,
			}),
		).toEqual({
			labelKey: 'callStatusReconnecting',
			detailKey: 'callStatusReconnectingDetail',
			tone: 'warning',
		})
	})
})
