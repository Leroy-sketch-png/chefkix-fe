'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getUserMediaBounded } from '@/lib/media/get-user-media-bounded'

export type CopilotCameraStatus =
	| 'idle'
	| 'requesting'
	| 'ready'
	| 'denied'
	| 'unsupported'

export type CopilotCameraFacingMode = 'environment' | 'user'

export function useCopilotCamera() {
	const videoRef = useRef<HTMLVideoElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const streamRef = useRef<MediaStream | null>(null)
	const [status, setStatus] = useState<CopilotCameraStatus>('idle')
	const [facingMode, setFacingMode] =
		useState<CopilotCameraFacingMode>('environment')
	const [hasFrame, setHasFrame] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const stopCamera = useCallback(() => {
		streamRef.current?.getTracks().forEach(track => track.stop())
		streamRef.current = null
		setHasFrame(false)
		if (videoRef.current) videoRef.current.srcObject = null
	}, [])

	const startCamera = useCallback(
		async (requestedFacingMode: CopilotCameraFacingMode = facingMode) => {
			if (!navigator.mediaDevices?.getUserMedia) {
				setStatus('unsupported')
				setError('This browser does not provide camera access.')
				return
			}

			setStatus('requesting')
			setError(null)
			stopCamera()

			try {
				const stream = await getUserMediaBounded(
					{
						video: {
							facingMode: { ideal: requestedFacingMode },
							width: { ideal: 1280 },
							height: { ideal: 960 },
						},
						audio: false,
					},
					5000,
				)
				streamRef.current = stream
				if (!videoRef.current) {
					stopCamera()
					setStatus('idle')
					return
				}
				videoRef.current.srcObject = stream
				await videoRef.current.play()
				setStatus('ready')
			} catch (cameraError) {
				stopCamera()
				setStatus(
					cameraError instanceof DOMException &&
						cameraError.name === 'NotAllowedError'
						? 'denied'
						: 'idle',
				)
				setError(
					cameraError instanceof DOMException &&
						cameraError.name === 'NotAllowedError'
						? 'Camera permission was denied.'
						: 'Camera preview is unavailable right now.',
				)
			}
		},
		[facingMode, stopCamera],
	)

	const flipCamera = useCallback(() => {
		const nextFacingMode = facingMode === 'environment' ? 'user' : 'environment'
		setFacingMode(nextFacingMode)
		void startCamera(nextFacingMode)
	}, [facingMode, startCamera])

	const captureFrame = useCallback(async (): Promise<string | undefined> => {
		const video = videoRef.current
		const canvas = canvasRef.current
		if (
			!video ||
			!canvas ||
			video.videoWidth === 0 ||
			video.videoHeight === 0
		) {
			return undefined
		}

		canvas.width = video.videoWidth
		canvas.height = video.videoHeight
		const context = canvas.getContext('2d')
		if (!context) return undefined

		context.drawImage(video, 0, 0, canvas.width, canvas.height)
		return canvas.toDataURL('image/jpeg', 0.86)
	}, [])

	useEffect(() => {
		return () => stopCamera()
	}, [stopCamera])

	return {
		videoRef,
		canvasRef,
		status,
		facingMode,
		hasFrame,
		error,
		startCamera,
		stopCamera,
		flipCamera,
		captureFrame,
		onVideoPlaying: () => setHasFrame(true),
	}
}
