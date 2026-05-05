import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { API_ENDPOINTS } from '@/constants/api'
import app from '@/configs/app'
import { useAuthStore } from '@/store/authStore'
import { logDevError } from '@/lib/dev-log'
import useSound from 'use-sound'

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

export function useWebRTC({
	conversationId,
	currentUserId,
	onClose,
}: UseWebRTCProps) {
	const t = useTranslations('messages')
	const accessToken = useAuthStore(state => state.accessToken)

	// --- Refs ---
	const localVideoRef = useRef<HTMLVideoElement>(null)
	const remoteVideoRef = useRef<HTMLVideoElement>(null)
	const localStreamRef = useRef<MediaStream | null>(null)
	const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
	const wsRef = useRef<WebSocket | null>(null)

	// Ringtones: Tách biệt nhạc chuông gọi đi và nhạc chuông gọi đến
	const incomingRingtoneRef = useRef<HTMLAudioElement | null>(null)
	const outgoingRingtoneRef = useRef<HTMLAudioElement | null>(null)

	// Quản lý thời gian chờ bắt máy (Timeout)
	const callTimeoutRef = useRef<NodeJS.Timeout | null>(null)

	// --- States ---
	const [isCameraOn, setIsCameraOn] = useState(false)
	const [isMicOn, setIsMicOn] = useState(true)
	const [isJoined, setIsJoined] = useState(false)
	const [isCallActive, setIsCallActive] = useState(false) // Đã kết nối WebRTC thành công
	const [isReceivingCall, setIsReceivingCall] = useState(false) // Đang có người gọi đến
	const [isCalling, setIsCalling] = useState(false) // Đang gọi cho người khác (chờ bắt máy)
	const [remoteOffer, setRemoteOffer] =
		useState<RTCSessionDescriptionInit | null>(null)

	const rtcConfig = {
		iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
	}

	// --- Audio Utilities (ĐÃ CHUYỂN SANG DÙNG USE-SOUND) ---
	// 1. Nhạc chuông gọi đến
	const [playIncomingRingtone, { stop: stopIncoming }] = useSound(
		'/sounds/call-ring-tone.mp3',
		{
			loop: true, // Lặp lại cho đến khi tắt
			interrupt: true, // Nếu gọi lại, sẽ ngắt tiếng cũ đi
		},
	)

	// 2. Nhạc chuông gọi đi (tút tút)
	const [playOutgoingRingtone, { stop: stopOutgoing }] = useSound(
		'/sounds/call-ring-tone.mp3',
		{
			loop: true,
			interrupt: true,
		},
	)

	// 3. Hàm tắt tất cả nhạc chuông
	const stopAllRingtones = useCallback(() => {
		stopIncoming()
		stopOutgoing()
	}, [stopIncoming, stopOutgoing])

	// --- Media Management ---
	const startMedia = async (videoEnabled: boolean = true) => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: videoEnabled,
				audio: true,
			})
			localStreamRef.current = stream
			if (localVideoRef.current) localVideoRef.current.srcObject = stream
			setIsCameraOn(videoEnabled)
			setIsMicOn(true)

			if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
				connectWebSocket()
			}
		} catch (error) {
			logDevError('Lỗi truy cập thiết bị media.', error)
			// Fallback sang Audio-only nếu bị từ chối/không có camera
			try {
				const audioStream = await navigator.mediaDevices.getUserMedia({
					video: false,
					audio: true,
				})
				localStreamRef.current = audioStream
				if (localVideoRef.current) localVideoRef.current.srcObject = audioStream
				setIsCameraOn(false)
				setIsMicOn(true)
				if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
					connectWebSocket()
			} catch (audioError) {
				toast.error(t('toastMicDenied'))
			}
		}
	}

	const toggleVideo = () => {
		if (localStreamRef.current) {
			const videoTrack = localStreamRef.current.getVideoTracks()[0]
			if (videoTrack) {
				videoTrack.enabled = !videoTrack.enabled
				setIsCameraOn(videoTrack.enabled)
			} else if (!isCameraOn) {
				startMedia(true) // Nếu đang audio-only muốn bật cam thì xin cấp quyền lại
			}
		}
	}

	const toggleAudio = () => {
		if (localStreamRef.current) {
			const audioTrack = localStreamRef.current.getAudioTracks()[0]
			if (audioTrack) {
				audioTrack.enabled = !audioTrack.enabled
				setIsMicOn(audioTrack.enabled)
			}
		}
	}

	// --- WebSocket & Signaling ---
	const sendMessage = useCallback(
		(type: SignalMessage['type'], data?: SignalData) => {
			if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
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

	const connectWebSocket = useCallback(() => {
		if (!accessToken) return toast.error(t('toastConnectionError'))

		const wsUrl = new URL(
			`${app.API_BASE_URL.replace(/^http/, 'ws')}${API_ENDPOINTS.CHAT.VIDEO_SIGNALING_WS}`,
		)
		wsUrl.searchParams.set('access_token', accessToken)
		const ws = new WebSocket(wsUrl.toString())

		ws.onopen = () => {
			sendMessage('join')
			wsRef.current = ws
			setIsJoined(true)
		}

		ws.onmessage = async event => {
			const message: SignalMessage = JSON.parse(event.data)
			if (message.senderId === currentUserId) return

			switch (message.type) {
				case 'ring':
					playIncomingRingtone()
					setIsReceivingCall(true)
					break
				case 'offer':
					setRemoteOffer(message.data as RTCSessionDescriptionInit)
					break
				case 'answer':
					stopAllRingtones()
					setIsCalling(false)
					if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current)
					await handleReceiveAnswer(message.data as RTCSessionDescriptionInit)
					break
				case 'ice-candidate':
					await handleNewICECandidateMsg(message.data as RTCIceCandidateInit)
					break
				case 'leave':
					stopAllRingtones()
					endCall()
					toast.info('Cuộc gọi đã kết thúc.')
					break
			}
		}

		ws.onclose = () => setIsJoined(false)

		// Cập nhật lại sendMessage ref để dùng ws.onopen mới nhất
		wsRef.current = ws
	}, [
		accessToken,
		currentUserId,
		sendMessage,
		playIncomingRingtone,
		stopAllRingtones,
		t,
	])

	// --- WebRTC Logic ---
	const initializePeerConnection = () => {
		const pc = new RTCPeerConnection(rtcConfig)
		peerConnectionRef.current = pc

		if (localStreamRef.current) {
			localStreamRef.current
				.getTracks()
				.forEach(track => pc.addTrack(track, localStreamRef.current!))
		}

		pc.ontrack = event => {
			if (remoteVideoRef.current && event.streams[0]) {
				remoteVideoRef.current.srcObject = event.streams[0]
			}
		}

		pc.onicecandidate = event => {
			if (event.candidate) sendMessage('ice-candidate', event.candidate)
		}
		return pc
	}

	// Call Action: Gọi người khác
	const makeCall = async () => {
		try {
			setIsCalling(true)
			sendMessage('ring')
			playOutgoingRingtone()

			// Nếu 30 giây không ai nhấc máy (Offline hoặc không trả lời) -> Tự cúp
			callTimeoutRef.current = setTimeout(() => {
				toast.error('Người nhận không phản hồi.')
				sendMessage('leave') // Báo backend huỷ kết nối
				endCall()
			}, 30000)

			const pc = initializePeerConnection()
			const offer = await pc.createOffer()
			await pc.setLocalDescription(offer)
			sendMessage('offer', offer)
		} catch (error) {
			stopAllRingtones()
			setIsCalling(false)
			toast.error('Lỗi khi bắt đầu cuộc gọi.')
		}
	}

	// Call Action: Nhận cuộc gọi (Có thể chọn Video hoặc Audio only)
	const acceptCall = async (withVideo: boolean = true) => {
		stopAllRingtones()
		setIsReceivingCall(false)
		setIsCallActive(true)

		try {
			await startMedia(withVideo)
			if (remoteOffer) {
				const pc = initializePeerConnection()
				await pc.setRemoteDescription(new RTCSessionDescription(remoteOffer))
				const answer = await pc.createAnswer()
				await pc.setLocalDescription(answer)
				sendMessage('answer', answer)
			}
		} catch (error) {
			toast.error('Không thể kết nối.')
		}
	}

	const rejectCall = () => {
		sendMessage('leave')
		endCall()
	}

	const handleReceiveAnswer = async (answer: RTCSessionDescriptionInit) => {
		if (peerConnectionRef.current) {
			await peerConnectionRef.current.setRemoteDescription(
				new RTCSessionDescription(answer),
			)
			setIsCallActive(true)
		}
	}

	const handleNewICECandidateMsg = async (candidate: RTCIceCandidateInit) => {
		if (peerConnectionRef.current) {
			await peerConnectionRef.current.addIceCandidate(
				new RTCIceCandidate(candidate),
			)
		}
	}

	// --- Phase 5: Cleanup & End Call ---

	// 1. Hàm thuần túy để dọn dẹp tài nguyên (không đụng tới UI)
	const cleanupResources = useCallback(() => {
		// Báo cho đầu dây bên kia biết mình đã thoát
		sendMessage('leave')
		stopAllRingtones()

		if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current)

		if (localStreamRef.current) {
			localStreamRef.current.getTracks().forEach(track => track.stop())
			localStreamRef.current = null
		}
		if (localVideoRef.current) localVideoRef.current.srcObject = null
		if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null

		if (peerConnectionRef.current) {
			peerConnectionRef.current.close()
			peerConnectionRef.current = null
		}
		if (wsRef.current) {
			wsRef.current.close()
			wsRef.current = null
		}
	}, [sendMessage, stopAllRingtones])

	// 2. Hàm xử lý khi người dùng chủ động cúp máy (đóng Modal)
	const endCall = useCallback(() => {
		cleanupResources()

		// Reset states
		setIsCameraOn(false)
		setIsMicOn(true)
		setIsJoined(false)
		setIsCallActive(false)
		setIsReceivingCall(false)
		setIsCalling(false)
		setRemoteOffer(null)

		// Báo cho Component cha ẩn màn hình đi
		onClose()
	}, [cleanupResources, onClose])

	// 3. Cleanup khi Component bị huỷ (bởi Strict Mode hoặc chuyển trang)
	useEffect(() => {
		return () => {
			// TUYỆT ĐỐI KHÔNG gọi onClose() ở đây, chỉ dọn rác WebRTC
			cleanupResources()
		}
	}, [cleanupResources])

	return {
		localVideoRef,
		remoteVideoRef,
		isCameraOn,
		isMicOn,
		isJoined,
		isCallActive,
		isReceivingCall,
		isCalling,
		startMedia,
		toggleVideo,
		toggleAudio,
		makeCall,
		acceptCall,
		rejectCall,
		endCall,
	}
}
