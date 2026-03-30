'use client' // This tells Next.js this is a Client Component (runs in the browser)

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { logDevError } from '@/lib/dev-log'

// Define the structure of the signaling message to match the Spring Boot backend
interface SignalMessage {
	type: 'join' | 'offer' | 'answer' | 'ice-candidate' | 'leave' | 'ring'
	conversationId: string
	senderId: string
	data?: any
}

interface VideoCallProps {
	conversationId: string // The ID of the chat/room
	currentUserId: string // The ID of the user currently using the app
	onClose: () => void // Function to call when the call ends to close the modal
}

export default function VideoCall({
	conversationId,
	currentUserId,
	onClose,
}: VideoCallProps) {
	// --- Phase 1: Refs for Media and Connections ---
	// We use useRef instead of useState for things that don't need to trigger a re-render when they change
	const localVideoRef = useRef<HTMLVideoElement>(null)
	const remoteVideoRef = useRef<HTMLVideoElement>(null)

	const localStreamRef = useRef<MediaStream | null>(null)
	const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
	const wsRef = useRef<WebSocket | null>(null)

	// Ringtone (native Audio API — no external deps)
	const ringtoneRef = useRef<HTMLAudioElement | null>(null)
	const playRingtone = useCallback(() => {
		if (!ringtoneRef.current) {
			ringtoneRef.current = new Audio('/sounds/ringtone.mp3')
			ringtoneRef.current.loop = true
		}
		ringtoneRef.current.play().catch(() => {})
	}, [])
	const stopRingtone = useCallback(() => {
		if (ringtoneRef.current) {
			ringtoneRef.current.pause()
			ringtoneRef.current.currentTime = 0
		}
	}, [])

	// UI States to control button visibility
	const [isCameraOn, setIsCameraOn] = useState(false)
	const [isMicOn, setIsMicOn] = useState(true)
	const [isJoined, setIsJoined] = useState(false)
	const [isCallActive, setIsCallActive] = useState(false)
	const [isReceivingCall, setIsReceivingCall] = useState(false)
	const [remoteOffer, setRemoteOffer] =
		useState<RTCSessionDescriptionInit | null>(null)

	// Configuration for WebRTC connecting (using Google's free public STUN server)
	const rtcConfig = {
		iceServers: [
			{
				urls: 'stun:stun.l.google.com:19302',
			},
		],
	}

	// --- Phase 1: Media Setup ---
	// Turns on the user's camera and microphone
	const startMedia = async (videoEnabled: boolean = true) => {
		try {
			// Prompt user for camera and mic permissions
			const stream = await navigator.mediaDevices.getUserMedia({
				video: videoEnabled,
				audio: true,
			})

			// Save the stream in our ref so we can use it later without re-rendering
			localStreamRef.current = stream

			// Attach the stream to the local <video> element
			if (localVideoRef.current) {
				localVideoRef.current.srcObject = stream
			}

			setIsCameraOn(videoEnabled)
			setIsMicOn(true)
		} catch (error) {
			logDevError('Error accessing media devices.', error)

			// Fallback: try audio only if video fails (maybe no webcam)
			try {
				const audioStream = await navigator.mediaDevices.getUserMedia({
					video: false,
					audio: true,
				})
				localStreamRef.current = audioStream
				if (localVideoRef.current) localVideoRef.current.srcObject = audioStream
				setIsCameraOn(false)
				setIsMicOn(true)
			} catch (audioError) {
				logDevError('Error accessing audio device.', audioError)
				toast.error(
					'Could not access your microphone. Please check browser permissions.',
				)
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
				// No video track but we want to turn it on (start from audio only)
				startMedia(true)
			}
		} else {
			startMedia(true)
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

	// --- Phase 2: Signaling Client (WebSocket) ---
	const connectWebSocket = () => {
		// Connect to the Spring Boot endpoint we just created
		const apiBase = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080'
		const wsBase = apiBase.replace(/^http/, 'ws')
		const wsUrl = `${wsBase}/api/v1/ws/video-signaling`
		const ws = new WebSocket(wsUrl)

		ws.onopen = () => {
			// As soon as we connect, tell the backend we are joining this conversation
			sendMessage(ws, 'join')
			wsRef.current = ws
			setIsJoined(true)
		}

		// Listen for messages from the backend
		ws.onmessage = async event => {
			const message: SignalMessage = JSON.parse(event.data)

			// Ignore our own messages just in case
			if (message.senderId === currentUserId) return

			switch (message.type) {
				case 'ring':
					playRingtone()
					setIsReceivingCall(true)
					break
				case 'offer':
					stopRingtone()
					setIsReceivingCall(true)
					setRemoteOffer(message.data)
					break
				case 'answer':
					stopRingtone()
					await handleReceiveAnswer(message.data)
					break
				case 'ice-candidate':
					await handleNewICECandidateMsg(message.data)
					break
				case 'leave':
					stopRingtone()
					endCall()
					toast.info('The other person left the call.')
					break
				default:
					logDevError('Unknown WebSocket message type:', message.type)
			}
		}

		ws.onerror = error => {
			logDevError('WebSocket Error:', error)
		}

		ws.onclose = () => {
			setIsJoined(false)
		}
	}

	// Helper to send JSON messages through WebSocket
	const sendMessage = (
		wsInstance: WebSocket | null,
		type: SignalMessage['type'],
		data?: any,
	) => {
		if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
			const payload: SignalMessage = {
				type,
				conversationId,
				senderId: currentUserId,
				data,
			}
			wsInstance.send(JSON.stringify(payload))
		}
	}

	// --- Phase 3: WebRTC Engine ---
	const initializePeerConnection = () => {
		// 1. Create the RTC connection
		const pc = new RTCPeerConnection(rtcConfig)
		peerConnectionRef.current = pc

		// 2. Add our local camera/mic tracks to the connection
		if (localStreamRef.current) {
			localStreamRef.current.getTracks().forEach(track => {
				pc.addTrack(track, localStreamRef.current!)
			})
		}

		// 3. Listen for the remote user's camera/mic tracks
		pc.ontrack = event => {
			// When we receive their video, attach it to our remote <video> element
			if (remoteVideoRef.current && event.streams[0]) {
				remoteVideoRef.current.srcObject = event.streams[0]
			}
		}

		// 4. Listen for ICE candidates (network paths) to send to the other user
		pc.onicecandidate = event => {
			if (event.candidate) {
				// Send our network routing info to the other person via backend
				sendMessage(wsRef.current, 'ice-candidate', event.candidate)
			}
		}

		return pc
	}

	// --- Phase 4: The Handshake Flow ---

	// Caller: "I want to call you. Here is my video setup (offer)."
	const makeCall = async () => {
		// 1. Send ring signal to start ringing on the other side
		sendMessage(wsRef.current, 'ring')
		// 2. Play ringtone locally while waiting
		playRingtone()

		const pc = initializePeerConnection()

		// Create an offer
		const offer = await pc.createOffer()
		// Set it as our local description
		await pc.setLocalDescription(offer)

		// Send it to the other user via WebSocket
		sendMessage(wsRef.current, 'offer', offer)
	}

	// Callee: Answers the incoming call
	const acceptCall = async () => {
		stopRingtone()
		setIsReceivingCall(false)

		// Attempt to start audio/video. We default to both, but fallback to audio only in startMedia.
		if (!localStreamRef.current) {
			await startMedia(true)
		}

		if (remoteOffer) {
			await handleReceiveOffer(remoteOffer)
		}
	}

	// Callee: Rejects the call
	const rejectCall = () => {
		stopRingtone()
		setIsReceivingCall(false)
		sendMessage(wsRef.current, 'leave')
		endCall()
	}

	// Callee: "I received your call. Here is my video setup (answer)."
	const handleReceiveOffer = async (offer: RTCSessionDescriptionInit) => {
		// Even if we are receiving, we need to initialize our Peer Connection
		const pc = initializePeerConnection()

		// Register the caller's setup
		await pc.setRemoteDescription(new RTCSessionDescription(offer))

		// Create our answer
		const answer = await pc.createAnswer()
		// Register our setup locally
		await pc.setLocalDescription(answer)

		// Send the answer back to the caller
		sendMessage(wsRef.current, 'answer', answer)
		setIsCallActive(true)
	}

	// Caller: "I received your answer. We are now connected."
	const handleReceiveAnswer = async (answer: RTCSessionDescriptionInit) => {
		if (peerConnectionRef.current) {
			await peerConnectionRef.current.setRemoteDescription(
				new RTCSessionDescription(answer),
			)
		}
	}

	// Both: Add network routes as they are discovered
	const handleNewICECandidateMsg = async (candidate: RTCIceCandidateInit) => {
		try {
			if (peerConnectionRef.current) {
				await peerConnectionRef.current.addIceCandidate(
					new RTCIceCandidate(candidate),
				)
			}
		} catch (e) {
			logDevError('Error adding received ice candidate', e)
		}
	}

	// --- Phase 5: Cleanup ---
	const endCall = useCallback(() => {
		// Notify the other user
		sendMessage(wsRef.current, 'leave')
		stopRingtone()

		// 1. Stop all camera/mic tracks
		if (localStreamRef.current) {
			localStreamRef.current.getTracks().forEach(track => track.stop())
			localStreamRef.current = null
		}

		// 2. Reset the video elements
		if (localVideoRef.current) localVideoRef.current.srcObject = null
		if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null

		// 3. Close the peer connection
		if (peerConnectionRef.current) {
			peerConnectionRef.current.close()
			peerConnectionRef.current = null
		}

		// 4. Close WebSocket
		if (wsRef.current) {
			wsRef.current.close()
			wsRef.current = null
		}

		// Reset UI states
		setIsCameraOn(false)
		setIsMicOn(true)
		setIsJoined(false)
		setIsCallActive(false)
		setIsReceivingCall(false)
		setRemoteOffer(null)

		// Unmount component
		onClose()
	}, [onClose, stopRingtone])

	// Automatically clean up when the user leaves the page or unmounts the component
	useEffect(() => {
		return () => {
			endCall()
		}
	}, [endCall])

	// --- Render UI ---
	return (
		<div className='flex flex-col items-center justify-center p-4 bg-bg space-y-4 rounded-xl shadow-card border border-border-subtle w-full max-w-4xl mx-auto relative'>
			{/* Incoming Call Overlay */}
			{isReceivingCall && !isCallActive && (
				<div className='absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm rounded-xl'>
					<div className='w-24 h-24 bg-brand/20 rounded-full flex items-center justify-center animate-pulse mb-6'>
						<div className='w-16 h-16 bg-brand rounded-full flex items-center justify-center'>
							<svg
								xmlns='http://www.w3.org/2000/svg'
								width='32'
								height='32'
								viewBox='0 0 24 24'
								fill='none'
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'
								className='text-white'
							>
								<path d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z'></path>
							</svg>
						</div>
					</div>
					<h2 className='text-white text-2xl font-bold mb-8'>
						Incoming Call...
					</h2>
					<div className='flex gap-6'>
						<button
							onClick={rejectCall}
							className='px-6 py-3 bg-red-500 hover:bg-red-600 outline-none text-white rounded-full font-medium shadow-lg transition-transform hover:scale-105'
						>
							Decline
						</button>
						<button
							onClick={acceptCall}
							className='px-6 py-3 bg-green-500 hover:bg-green-600 outline-none text-white rounded-full font-medium shadow-lg transition-transform hover:scale-105 flex items-center gap-2'
						>
							<svg
								xmlns='http://www.w3.org/2000/svg'
								width='20'
								height='20'
								viewBox='0 0 24 24'
								fill='none'
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'
								className='text-white'
							>
								<path d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z'></path>
							</svg>
							Answer
						</button>
					</div>
				</div>
			)}

			<h2 className='text-2xl font-semibold text-primary mb-2'>Video Call</h2>

			{/* Media Stage */}
			<div className='relative w-full aspect-video bg-bg-inverse rounded-lg overflow-hidden flex items-center justify-center shadow-inner'>
				{/* Remote Video (Large / Background) */}
				<video
					ref={remoteVideoRef}
					autoPlay
					playsInline
					className='w-full h-full object-cover'
				/>

				{/* Local Video (Small Picture-in-Picture / Bottom Right) */}
				<div className='absolute bottom-4 right-4 w-1/4 max-w-[200px] aspect-video bg-bg-elevated rounded-lg overflow-hidden border-2 border-brand shadow-lg'>
					<video
						ref={localVideoRef}
						autoPlay
						playsInline
						muted // We must mute our own video so we don't hear our own echo
						className='w-full h-full object-cover transform -scale-x-100' // scale-x-100 mirrors the camera like a real mirror
					/>
				</div>

				{/* Fallback text when there's no call active */}
				{!isCallActive && (
					<div className='absolute inset-0 flex items-center justify-center text-text-muted font-medium'>
						Waiting for video connection...
					</div>
				)}
			</div>

			{/* Control Buttons */}
			<div className='flex gap-4 flex-wrap justify-center mt-4'>
				<button
					onClick={() => startMedia()}
					className='px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600'
				>
					{isCameraOn ? 'Camera On ✅' : '1. Turn On Camera'}
				</button>

				<button
					onClick={toggleVideo}
					className='px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600'
				>
					{isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
				</button>

				<button
					onClick={toggleAudio}
					className='px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600'
				>
					{isMicOn ? 'Mute Mic' : 'Unmute Mic'}
				</button>

				{!isCallActive && (
					<button
						onClick={makeCall}
						disabled={!isCameraOn || !isJoined}
						className={`px-4 py-2 text-white rounded-md ${
							!isCameraOn || !isJoined
								? 'bg-text-muted cursor-not-allowed'
								: 'bg-green-500 hover:bg-green-600'
						}`}
					>
						2. Call the other person
					</button>
				)}

				<button
					onClick={endCall}
					className='px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600'
				>
					End Call
				</button>
			</div>
		</div>
	)
}
