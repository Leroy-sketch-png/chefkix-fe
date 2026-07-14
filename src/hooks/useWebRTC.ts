import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import useSound from 'use-sound'
import { useAuthStore } from '@/store/authStore'
import { logDevError } from '@/lib/dev-log'
import {
	buildVideoSignalingProtocols,
	buildVideoSignalingUrl,
} from '@/lib/video-signaling-auth'

type SignalData = RTCSessionDescriptionInit | RTCIceCandidate

interface SignalMessage {
	type: 'join' | 'offer' | 'answer' | 'ice-candidate' | 'leave' | 'ring'
	conversationId: string
	senderId: string
	data?: SignalData
}

interface UseWebRTCProps {
	conversationId: string
	currentUserId: string
	onClose: () => void
}

export type MediaReadinessState =
	| 'idle'
	| 'requesting'
	| 'ready'
	| 'audio-only'
	| 'denied'
	| 'unavailable'
	| 'timeout'
	| 'error'

const MEDIA_PERMISSION_TIMEOUT_MS = 12_000

export function getTurnServer(): RTCIceServer {
	return {
		urls:
			process.env.NEXT_PUBLIC_TURN_URL ||
			'turn:localhost:3478?transport=udp',
		username: process.env.NEXT_PUBLIC_TURN_USERNAME || 'chefkix',
		credential:
			process.env.NEXT_PUBLIC_TURN_CREDENTIAL || 'chefkix-turn-demo',
	}
}

export function getRtcConfiguration(): RTCConfiguration {
	return {
		iceServers: [
			{ urls: 'stun:stun.l.google.com:19302' },
			getTurnServer(),
		],
		iceCandidatePoolSize: 4,
	}
}

export async function probeTurnRelay(
	timeoutMs = 10_000,
): Promise<{ ok: boolean; detail: string }> {
	if (typeof RTCPeerConnection === 'undefined') {
		return { ok: false, detail: 'WebRTC is unsupported in this browser.' }
	}

	const peer = new RTCPeerConnection({
		iceServers: [getTurnServer()],
		iceTransportPolicy: 'relay',
	})
	peer.createDataChannel('turn-probe')

	return new Promise(resolve => {
		let settled = false
		const finish = (ok: boolean, detail: string) => {
			if (settled) return
			settled = true
			window.clearTimeout(timeout)
			peer.close()
			resolve({ ok, detail })
		}
		const timeout = window.setTimeout(
			() => finish(false, 'No TURN relay candidate arrived before timeout.'),
			timeoutMs,
		)

		peer.onicecandidate = event => {
			if (event.candidate?.type === 'relay') {
				finish(true, `Relay candidate: ${event.candidate.protocol || 'udp'}`)
			} else if (!event.candidate) {
				finish(false, 'ICE gathering completed without a relay candidate.')
			}
		}

		void peer
			.createOffer()
			.then(offer => peer.setLocalDescription(offer))
			.catch(error =>
				finish(
					false,
					error instanceof Error ? error.message : 'TURN probe failed.',
				),
			)
	})
}

async function getUserMediaBounded(
	constraints: MediaStreamConstraints,
	timeoutMs = MEDIA_PERMISSION_TIMEOUT_MS,
): Promise<MediaStream> {
	if (!navigator.mediaDevices?.getUserMedia) {
		throw new DOMException('Media devices are unavailable.', 'NotSupportedError')
	}

	let timedOut = false
	const mediaRequest = navigator.mediaDevices.getUserMedia(constraints)
	mediaRequest
		.then(stream => {
			if (timedOut) {
				stream.getTracks().forEach(track => track.stop())
			}
		})
		.catch(() => undefined)

	let timeoutId = 0
	const timeout = new Promise<never>((_, reject) => {
		timeoutId = window.setTimeout(() => {
			timedOut = true
			reject(new DOMException('Media permission timed out.', 'TimeoutError'))
		}, timeoutMs)
	})

	try {
		return await Promise.race([mediaRequest, timeout])
	} finally {
		window.clearTimeout(timeoutId)
	}
}

function mediaFailureState(error: unknown): MediaReadinessState {
	if (!(error instanceof DOMException)) return 'error'
	if (error.name === 'TimeoutError') return 'timeout'
	if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
		return 'denied'
	}
	if (
		error.name === 'NotFoundError' ||
		error.name === 'NotReadableError' ||
		error.name === 'OverconstrainedError'
	) {
		return 'unavailable'
	}
	return 'error'
}

export function useWebRTC({
	conversationId,
	currentUserId,
	onClose,
}: UseWebRTCProps) {
	const t = useTranslations('messages')
	const accessToken = useAuthStore(state => state.accessToken)
	const localVideoRef = useRef<HTMLVideoElement>(null)
	const remoteVideoRef = useRef<HTMLVideoElement>(null)
	const localStreamRef = useRef<MediaStream | null>(null)
	const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
	const wsRef = useRef<WebSocket | null>(null)
	const callTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const iceRestartAttemptedRef = useRef(false)
	const iceCandidateBufferRef = useRef<RTCIceCandidateInit[]>([])

	const [isCameraOn, setIsCameraOn] = useState(false)
	const [isMicOn, setIsMicOn] = useState(true)
	const [isJoined, setIsJoined] = useState(false)
	const [isCallActive, setIsCallActive] = useState(false)
	const isCallActiveRef = useRef(false)
	const [isReceivingCall, setIsReceivingCall] = useState(false)
	const [isCalling, setIsCalling] = useState(false)
	const [remoteOffer, setRemoteOffer] =
		useState<RTCSessionDescriptionInit | null>(null)
	// Ref mirror so acceptCall always reads the current offer, not a stale closure
	const remoteOfferRef = useRef<RTCSessionDescriptionInit | null>(null)
	const [mediaState, setMediaState] =
		useState<MediaReadinessState>('idle')
	const [connectionState, setConnectionState] =
		useState<RTCPeerConnectionState>('new')
	const [iceConnectionState, setIceConnectionState] =
		useState<RTCIceConnectionState>('new')
	const [relayCandidateAvailable, setRelayCandidateAvailable] =
		useState(false)

	const [playIncomingRingtone, { stop: stopIncoming }] = useSound(
		'/sounds/call-ring-tone.mp3',
		{ loop: true, interrupt: true },
	)
	const [playOutgoingRingtone, { stop: stopOutgoing }] = useSound(
		'/sounds/call-ring-tone.mp3',
		{ loop: true, interrupt: true },
	)

	const stopAllRingtones = useCallback(() => {
		stopIncoming()
		stopOutgoing()
	}, [stopIncoming, stopOutgoing])

	const sendMessage = useCallback(
		(type: SignalMessage['type'], data?: SignalData) => {
			if (wsRef.current?.readyState === WebSocket.OPEN) {
				wsRef.current.send(
					JSON.stringify({
						type,
						conversationId,
						senderId: currentUserId,
						data,
					}),
				)
			}
		},
		[conversationId, currentUserId],
	)

	const restartIce = useCallback(async () => {
		const peer = peerConnectionRef.current
		if (!peer || iceRestartAttemptedRef.current) return false
		iceRestartAttemptedRef.current = true

		try {
			peer.restartIce()
			if (peer.signalingState === 'stable') {
				const offer = await peer.createOffer({ iceRestart: true })
				await peer.setLocalDescription(offer)
				sendMessage('offer', offer)
			}
			return true
		} catch (error) {
			logDevError('[WebRTC] ICE restart failed', error)
			return false
		}
	}, [sendMessage])

	const initializePeerConnection = useCallback(() => {
		peerConnectionRef.current?.close()
		iceRestartAttemptedRef.current = false
		setRelayCandidateAvailable(false)

		const peer = new RTCPeerConnection(getRtcConfiguration())
		peerConnectionRef.current = peer

		localStreamRef.current?.getTracks().forEach(track => {
			peer.addTrack(track, localStreamRef.current!)
		})

		peer.ontrack = event => {
			if (remoteVideoRef.current && event.streams[0]) {
				remoteVideoRef.current.srcObject = event.streams[0]
			}
		}
		peer.onicecandidate = event => {
			if (event.candidate?.type === 'relay') {
				setRelayCandidateAvailable(true)
			}
			if (event.candidate) {
				sendMessage('ice-candidate', event.candidate)
			}
		}
		peer.onconnectionstatechange = () => {
			setConnectionState(peer.connectionState)
		}
		peer.oniceconnectionstatechange = () => {
			setIceConnectionState(peer.iceConnectionState)
			if (peer.iceConnectionState === 'failed') {
				void restartIce()
			}
		}
		return peer
	}, [restartIce, sendMessage])

	const cleanupPeer = useCallback(() => {
		if (callTimeoutRef.current) {
			clearTimeout(callTimeoutRef.current)
			callTimeoutRef.current = null
		}
		peerConnectionRef.current?.close()
		peerConnectionRef.current = null
		iceCandidateBufferRef.current = []
		setConnectionState('closed')
		setIceConnectionState('closed')
	}, [])

	const endCall = useCallback(() => {
		sendMessage('leave')
		stopAllRingtones()
		cleanupPeer()
		localStreamRef.current?.getTracks().forEach(track => track.stop())
		localStreamRef.current = null
		if (localVideoRef.current) localVideoRef.current.srcObject = null
		if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
		wsRef.current?.close()
		wsRef.current = null
		setIsCameraOn(false)
		setIsMicOn(true)
		setIsJoined(false)
		isCallActiveRef.current = false
		setIsCallActive(false)
		setIsReceivingCall(false)
		setIsCalling(false)
		setRemoteOffer(null)
		remoteOfferRef.current = null
		setMediaState('idle')
		onClose()
	}, [cleanupPeer, onClose, sendMessage, stopAllRingtones])

	const flushIceCandidateBuffer = useCallback(async () => {
		if (!peerConnectionRef.current) return
		for (const candidate of iceCandidateBufferRef.current) {
			try {
				await peerConnectionRef.current.addIceCandidate(candidate)
			} catch (error) {
				logDevError('[WebRTC] Failed to add buffered ICE candidate', error)
			}
		}
		iceCandidateBufferRef.current = []
	}, [])

	const handleReceiveAnswer = useCallback(
		async (answer: RTCSessionDescriptionInit) => {
			if (!peerConnectionRef.current) return
			await peerConnectionRef.current.setRemoteDescription(answer)
			isCallActiveRef.current = true
			setIsCallActive(true)
			await flushIceCandidateBuffer()
		},
		[flushIceCandidateBuffer],
	)

	const handleNewIceCandidate = useCallback(
		async (candidate: RTCIceCandidateInit) => {
			if (!peerConnectionRef.current || !peerConnectionRef.current.remoteDescription) {
				iceCandidateBufferRef.current.push(candidate)
			} else {
				await peerConnectionRef.current.addIceCandidate(candidate)
			}
		},
		[],
	)

	const connectWebSocket = useCallback(() => {
		if (!accessToken) {
			toast.error(t('toastConnectionError'))
			return
		}
		if (
			wsRef.current?.readyState === WebSocket.OPEN ||
			wsRef.current?.readyState === WebSocket.CONNECTING
		) {
			return
		}

		const socket = new WebSocket(
			buildVideoSignalingUrl(),
			buildVideoSignalingProtocols(accessToken),
		)
		wsRef.current = socket

		socket.onopen = () => {
			setIsJoined(true)
			sendMessage('join')
		}
		socket.onmessage = event => {
			void (async () => {
				const message = JSON.parse(event.data) as SignalMessage
				if (message.senderId === currentUserId) return

				switch (message.type) {
					case 'ring':
						playIncomingRingtone()
						setIsReceivingCall(true)
						break
					case 'offer':
						remoteOfferRef.current = message.data as RTCSessionDescriptionInit
						setRemoteOffer(message.data as RTCSessionDescriptionInit)
						// Show incoming overlay even if ring was missed (covers race condition)
						// Use ref — onmessage closure captures the initial false, not live state
						if (!isCallActiveRef.current) {
							playIncomingRingtone()
							setIsReceivingCall(true)
						}
						break
					case 'answer':
						stopAllRingtones()
						setIsCalling(false)
						if (callTimeoutRef.current) {
							clearTimeout(callTimeoutRef.current)
						}
						await handleReceiveAnswer(
							message.data as RTCSessionDescriptionInit,
						)
						break
					case 'ice-candidate':
						await handleNewIceCandidate(
							message.data as RTCIceCandidateInit,
						)
						break
					case 'leave':
						stopAllRingtones()
						cleanupPeer()
						setIsCallActive(false)
						setIsCalling(false)
						toast.info('The co-cook call ended.')
						break
				}
			})()
		}
		socket.onclose = () => setIsJoined(false)
		socket.onerror = () => setIsJoined(false)
	}, [
		accessToken,
		cleanupPeer,
		currentUserId,
		handleNewIceCandidate,
		handleReceiveAnswer,
		playIncomingRingtone,
		sendMessage,
		stopAllRingtones,
		t,
	])

	const attachStream = useCallback((stream: MediaStream, video: boolean) => {
		localStreamRef.current?.getTracks().forEach(track => track.stop())
		localStreamRef.current = stream
		if (localVideoRef.current) localVideoRef.current.srcObject = stream
		setIsCameraOn(video && stream.getVideoTracks().length > 0)
		setIsMicOn(stream.getAudioTracks().some(track => track.enabled))
		setMediaState(video ? 'ready' : 'audio-only')
	}, [])

	const startMedia = useCallback(
		async (videoEnabled = true) => {
			setMediaState('requesting')
			try {
				const stream = await getUserMediaBounded({
					video: videoEnabled,
					audio: true,
				})
				attachStream(stream, videoEnabled)
				connectWebSocket()
				return true
			} catch (error) {
				const failure = mediaFailureState(error)
				logDevError('[WebRTC] Media preflight failed', error)

				if (
					videoEnabled &&
					(failure === 'unavailable' || failure === 'error')
				) {
					try {
						const audioStream = await getUserMediaBounded({
							video: false,
							audio: true,
						})
						attachStream(audioStream, false)
						connectWebSocket()
						toast.info('Camera unavailable. Co-cook is ready in audio-only mode.')
						return true
					} catch (audioError) {
						setMediaState(mediaFailureState(audioError))
					}
				} else {
					setMediaState(failure)
				}
				toast.error(t('toastMicDenied'))
				return false
			}
		},
		[attachStream, connectWebSocket, t],
	)

	const useAudioOnly = useCallback(async () => startMedia(false), [startMedia])

	const toggleVideo = useCallback(() => {
		const videoTrack = localStreamRef.current?.getVideoTracks()[0]
		if (videoTrack) {
			videoTrack.enabled = !videoTrack.enabled
			setIsCameraOn(videoTrack.enabled)
		} else if (!isCameraOn) {
			void startMedia(true)
		}
	}, [isCameraOn, startMedia])

	const toggleAudio = useCallback(() => {
		const audioTrack = localStreamRef.current?.getAudioTracks()[0]
		if (audioTrack) {
			audioTrack.enabled = !audioTrack.enabled
			setIsMicOn(audioTrack.enabled)
		}
	}, [])

	const makeCall = useCallback(async () => {
		try {
			if (!localStreamRef.current) {
				const mediaReady = await startMedia(true)
				if (!mediaReady) return
			}
			setIsCalling(true)
			sendMessage('ring')
			playOutgoingRingtone()
			callTimeoutRef.current = setTimeout(() => {
				toast.error('The other cook did not answer.')
				sendMessage('leave')
				stopAllRingtones()
				cleanupPeer()
				setIsCalling(false)
			}, 30_000)

			const peer = initializePeerConnection()
			const offer = await peer.createOffer()
			await peer.setLocalDescription(offer)
			sendMessage('offer', offer)
		} catch (error) {
			logDevError('[WebRTC] Call start failed', error)
			stopAllRingtones()
			setIsCalling(false)
			toast.error('Could not start the co-cook call.')
		}
	}, [
		cleanupPeer,
		initializePeerConnection,
		playOutgoingRingtone,
		sendMessage,
		startMedia,
		stopAllRingtones,
	])

	const acceptCall = useCallback(
		async (withVideo = true) => {
			stopAllRingtones()
			setIsReceivingCall(false)
			try {
				// Read from ref — immune to stale closure; always has the latest offer
				const offer = remoteOfferRef.current
				if (!offer) {
					logDevError('[WebRTC] acceptCall called but remoteOffer is null', {})
					toast.error('Call setup failed — please ask the other person to call again.')
					return
				}

				// Skip re-acquiring media if we already have an active stream from mount
				const hasLiveStream =
					localStreamRef.current !== null &&
					localStreamRef.current.getTracks().some(t => t.readyState === 'live')

				if (!hasLiveStream) {
					const mediaReady = await startMedia(withVideo)
					if (!mediaReady) return
				}

				const peer = initializePeerConnection()
				await peer.setRemoteDescription(offer)
				const answer = await peer.createAnswer()
				await peer.setLocalDescription(answer)
				sendMessage('answer', answer)
				isCallActiveRef.current = true
				setIsCallActive(true)
				await flushIceCandidateBuffer()
			} catch (error) {
				logDevError('[WebRTC] Call acceptance failed', error)
				toast.error('Could not connect the co-cook call.')
			}
		},
		[
			flushIceCandidateBuffer,
			initializePeerConnection,
			sendMessage,
			startMedia,
			stopAllRingtones,
		],
	)

	const rejectCall = useCallback(() => {
		sendMessage('leave')
		stopAllRingtones()
		setIsReceivingCall(false)
		setRemoteOffer(null)
		remoteOfferRef.current = null
	}, [sendMessage, stopAllRingtones])

	const reconnect = useCallback(async () => {
		if (!localStreamRef.current) {
			return startMedia(false)
		}
		try {
			const peer = initializePeerConnection()
			const offer = await peer.createOffer({ iceRestart: true })
			await peer.setLocalDescription(offer)
			sendMessage('offer', offer)
			return true
		} catch (error) {
			logDevError('[WebRTC] Manual reconnect failed', error)
			return false
		}
	}, [initializePeerConnection, sendMessage, startMedia])

	useEffect(() => {
		return () => {
			stopAllRingtones()
			if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current)
			localStreamRef.current?.getTracks().forEach(track => track.stop())
			peerConnectionRef.current?.close()
			wsRef.current?.close()
		}
	}, [stopAllRingtones])

	return {
		localVideoRef,
		remoteVideoRef,
		isCameraOn,
		isMicOn,
		isJoined,
		isCallActive,
		isReceivingCall,
		isCalling,
		mediaState,
		connectionState,
		iceConnectionState,
		relayCandidateAvailable,
		startMedia,
		useAudioOnly,
		toggleVideo,
		toggleAudio,
		makeCall,
		acceptCall,
		rejectCall,
		reconnect,
		endCall,
	}
}
