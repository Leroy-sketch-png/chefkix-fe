'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useTranslations } from 'next-intl'
import {
	AlertTriangle,
	Camera,
	Check,
	ImagePlus,
	Loader2,
	RotateCcw,
	SwitchCamera,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getUserMediaBounded } from '@/lib/media/get-user-media-bounded'
import { detectIngredients } from '@/services/ingredient-detection'
import type { IngredientDetection } from '@/lib/types/ingredient-detection'
import { IngredientDetectionOverlay } from './IngredientDetectionOverlay'

type CameraStatus = 'idle' | 'requesting' | 'ready' | 'denied' | 'unsupported'
type CameraFacingMode = 'environment' | 'user'

interface IngredientScannerProps {
	className?: string
}

const getCameraError = (error: unknown) => {
	if (error instanceof DOMException && error.name === 'NotAllowedError') {
		return 'scanCameraBlocked'
	}
	if (error instanceof DOMException && error.name === 'NotFoundError') {
		return 'scanNoCamera'
	}
	if (error instanceof DOMException && error.name === 'TimeoutError') {
		return 'scanCameraTimedOut'
	}
	if (error instanceof DOMException && error.name === 'NotSupportedError') {
		return 'scanCameraUnsupported'
	}
	return 'scanCameraUnavailable'
}

export function IngredientScanner({ className }: IngredientScannerProps) {
	const t = useTranslations('cooking')
	const videoRef = useRef<HTMLVideoElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const streamRef = useRef<MediaStream | null>(null)
	const cameraTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle')
	const [cameraFacingMode, setCameraFacingMode] =
		useState<CameraFacingMode>('environment')
	const [hasVideoFrame, setHasVideoFrame] = useState(false)
	const [imageUrl, setImageUrl] = useState<string | null>(null)
	const [detections, setDetections] = useState<IngredientDetection[]>([])
	const [isScanning, setIsScanning] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const clearCameraTimeout = useCallback(() => {
		if (cameraTimeoutRef.current) {
			clearTimeout(cameraTimeoutRef.current)
			cameraTimeoutRef.current = null
		}
	}, [])

	const stopCamera = useCallback(() => {
		clearCameraTimeout()
		streamRef.current?.getTracks().forEach(track => track.stop())
		streamRef.current = null
		setHasVideoFrame(false)
		if (videoRef.current) videoRef.current.srcObject = null
	}, [clearCameraTimeout])

	const startCamera = useCallback(
		async (requestedFacingMode: CameraFacingMode = cameraFacingMode) => {
			if (!navigator.mediaDevices?.getUserMedia) {
				setCameraStatus('unsupported')
				setError(t('scanCameraUnsupported'))
				return
			}

			setError(null)
			setCameraStatus('requesting')
			setHasVideoFrame(false)
			stopCamera()

			try {
				const stream = await getUserMediaBounded({
					video: {
						facingMode: { ideal: requestedFacingMode },
						width: { ideal: 1280 },
						height: { ideal: 960 },
					},
					audio: false,
				})
				streamRef.current = stream
				const video = videoRef.current
				if (!video) {
					stopCamera()
					setCameraStatus('idle')
					setError(t('scanCameraUnavailable'))
					return
				}
				video.srcObject = stream
				await video.play()
				setCameraStatus('ready')
				cameraTimeoutRef.current = setTimeout(() => {
					if (video.readyState < 2 || video.videoWidth === 0) {
						stopCamera()
						setCameraStatus('idle')
						setError(t('scanCameraPreviewUnavailable'))
					}
				}, 4000)
			} catch (cameraError) {
				stopCamera()
				setCameraStatus(
					cameraError instanceof DOMException &&
						cameraError.name === 'NotAllowedError'
						? 'denied'
						: 'idle',
				)
				setError(t(getCameraError(cameraError)))
			}
		},
		[cameraFacingMode, stopCamera, t],
	)

	const flipCamera = useCallback(() => {
		const nextFacingMode =
			cameraFacingMode === 'environment' ? 'user' : 'environment'
		setCameraFacingMode(nextFacingMode)
		void startCamera(nextFacingMode)
	}, [cameraFacingMode, startCamera])

	const handleVideoPlaying = useCallback(() => {
		setHasVideoFrame(true)
		clearCameraTimeout()
	}, [clearCameraTimeout])

	useEffect(() => {
		return () => {
			stopCamera()
		}
	}, [stopCamera])

	useEffect(() => {
		return () => {
			if (imageUrl) URL.revokeObjectURL(imageUrl)
		}
	}, [imageUrl])

	const scanImage = useCallback(
		async (image: Blob) => {
			setError(null)
			setDetections([])
			setImageUrl(URL.createObjectURL(image))
			setIsScanning(true)
			stopCamera()

			try {
				const result = await detectIngredients(image)
				setDetections(result.detections)
				toast.success(
					t('scanFoundResults', { count: result.detections.length }),
				)
			} catch {
				setError(t('scanDetectionUnavailable'))
			} finally {
				setIsScanning(false)
			}
		},
		[stopCamera, t],
	)

	const captureFrame = useCallback(() => {
		const video = videoRef.current
		const canvas = canvasRef.current
		if (!video || !canvas || video.videoWidth === 0) {
			setError(t('scanCameraNotReady'))
			return
		}

		canvas.width = video.videoWidth
		canvas.height = video.videoHeight
		const context = canvas.getContext('2d')
		if (!context) {
			setError(t('scanCaptureUnsupported'))
			return
		}

		context.drawImage(video, 0, 0, canvas.width, canvas.height)
		canvas.toBlob(
			blob => {
				if (blob) void scanImage(blob)
				else setError(t('scanEmptyFrame'))
			},
			'image/jpeg',
			0.9,
		)
	}, [scanImage, t])

	const handleFileChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0]
			if (file) void scanImage(file)
			event.target.value = ''
		},
		[scanImage],
	)

	const resetScan = () => {
		setImageUrl(null)
		setDetections([])
		setError(null)
		void startCamera()
	}

	const showCamera = !imageUrl && cameraStatus === 'ready' && hasVideoFrame
	const showEmptyState = !imageUrl && !showCamera
	const isConnecting =
		cameraStatus === 'requesting' ||
		(cameraStatus === 'ready' && !hasVideoFrame)

	return (
		<section
			className={cn('space-y-5', className)}
			aria-label={t('scanKitchenScanner')}
		>
			<div className='relative aspect-[4/3] overflow-hidden rounded-3xl border border-border-subtle bg-gradient-to-br from-bg-elevated via-bg-card to-bg-elevated shadow-warm'>
				<video
					ref={videoRef}
					muted
					playsInline
					autoPlay
					onPlaying={handleVideoPlaying}
					aria-label={t('scanCameraPreview')}
					className={cn(
						'absolute inset-0 size-full object-cover transition-opacity duration-500',
						!showCamera && 'opacity-0',
					)}
				/>
				{imageUrl && (
					<img
						src={imageUrl}
						alt={t('scanCapturedImage')}
						className='absolute inset-0 z-10 size-full object-cover'
					/>
				)}
				{imageUrl && detections.length > 0 && (
					<div className='relative z-20'>
						<IngredientDetectionOverlay detections={detections} />
					</div>
				)}
				{showEmptyState && (
					<div className='absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-bg-elevated/95 via-bg-card/95 to-bg-elevated/95 p-6 text-center'>
						<div className='flex size-16 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-brand shadow-glow'>
							<Camera className='size-8' />
						</div>
						<p className='font-semibold text-text-primary'>
							{isConnecting ? t('scanConnectingTitle') : t('scanReadyTitle')}
						</p>
						<p className='max-w-xs text-sm text-text-secondary'>
							{isConnecting
								? t('scanConnectingDescription')
								: t('scanReadyDescription')}
						</p>
					</div>
				)}
				{showCamera && (
					<div className='pointer-events-none absolute inset-0 z-20'>
						<div className='absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm'>
							<span className='size-2 rounded-full bg-success shadow-[0_0_0_4px_rgba(34,197,94,0.2)]' />
							{t('scanLivePreview')} ·{' '}
							{t(
								cameraFacingMode === 'environment'
									? 'scanBackCamera'
									: 'scanFrontCamera',
							)}
						</div>
						<button
							type='button'
							onClick={flipCamera}
							disabled={isScanning}
							aria-label={t('scanFlipCamera')}
							title={t('scanFlipCamera')}
							className='pointer-events-auto absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/65 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-white/80'
						>
							<SwitchCamera className='size-5' />
						</button>
						<div className='absolute inset-[18%] rounded-[2rem] border border-white/60 shadow-[0_0_0_999px_rgba(0,0,0,0.14)]' />
						<p className='absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm'>
							{t('scanFrameInstruction')}
						</p>
					</div>
				)}
				{isScanning && (
					<div className='absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-black/55 text-white backdrop-blur-sm'>
						<Loader2 className='size-8 animate-spin text-brand-light' />
						<span className='font-semibold'>{t('scanChecking')}</span>
					</div>
				)}
			</div>

			<canvas ref={canvasRef} className='hidden' aria-hidden='true' />
			<input
				ref={fileInputRef}
				type='file'
				accept='image/*'
				capture='environment'
				className='hidden'
				onChange={handleFileChange}
			/>

			{error && (
				<div
					className='flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning/8 p-3 text-sm text-warning-vivid'
					role='alert'
				>
					<AlertTriangle className='mt-0.5 size-4 shrink-0' />
					<span>{error}</span>
				</div>
			)}

			<div className='flex flex-wrap gap-3'>
				{showCamera ? (
					<button
						type='button'
						onClick={captureFrame}
						disabled={isScanning}
						className='inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 font-semibold text-white shadow-warm transition-colors hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-brand/50'
					>
						<Camera className='size-4' />
						{t('scanIngredients')}
					</button>
				) : (
					<button
						type='button'
						onClick={() => void startCamera()}
						disabled={isConnecting || isScanning}
						className='inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 font-semibold text-white shadow-warm transition-colors hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-brand/50'
					>
						{isConnecting ? (
							<Loader2 className='size-4 animate-spin' />
						) : (
							<Camera className='size-4' />
						)}
						{isConnecting ? t('scanStartingCamera') : t('scanUseCamera')}
					</button>
				)}
				<button
					type='button'
					onClick={() => fileInputRef.current?.click()}
					disabled={isScanning}
					className='inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-5 py-2.5 font-semibold text-text-primary transition-colors hover:bg-bg-card disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-brand/50'
				>
					<ImagePlus className='size-4' />
					{t('scanUploadPhoto')}
				</button>
				{imageUrl && !isScanning && (
					<button
						type='button'
						onClick={resetScan}
						className='inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2.5 font-semibold text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary focus-visible:ring-2 focus-visible:ring-brand/50'
					>
						<RotateCcw className='size-4' />
						{t('scanScanAnother')}
					</button>
				)}
			</div>
			<p className='text-xs leading-5 text-text-muted'>
				{t('scanCameraPermissionHint')}
			</p>

			{imageUrl && detections.length > 0 && !isScanning && (
				<div className='rounded-2xl border border-success/20 bg-success/5 p-4'>
					<div className='mb-3 flex items-center gap-2 text-sm font-semibold text-success'>
						<Check className='size-4' />
						{t('scanFoundResults', { count: detections.length })}
					</div>
					<div className='flex flex-wrap gap-2'>
						{detections.map(detection => (
							<span
								key={detection.id}
								className='rounded-full bg-bg-card px-3 py-1.5 text-sm font-medium text-text-primary shadow-sm'
							>
								{detection.name} · {Math.round(detection.confidence * 100)}%
							</span>
						))}
					</div>
				</div>
			)}
		</section>
	)
}
