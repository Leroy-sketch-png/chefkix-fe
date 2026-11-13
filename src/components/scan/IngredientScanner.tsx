'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
	AlertTriangle,
	Camera,
	Check,
	Compass,
	Cpu,
	Gauge,
	ImagePlus,
	Loader2,
	RotateCcw,
	SwitchCamera,
	Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { PATHS } from '@/constants'
import { getUserMediaBounded } from '@/lib/media/get-user-media-bounded'
import { detectIngredients } from '@/services/ingredient-detection'
import type {
	DetectionSpeed,
	IngredientDetection,
} from '@/lib/types/ingredient-detection'
import { IngredientDetectionOverlay } from './IngredientDetectionOverlay'
type CameraStatus = 'idle' | 'requesting' | 'ready' | 'denied' | 'unsupported'
type CameraFacingMode = 'environment' | 'user'

interface IngredientScannerProps {
	className?: string
	onConfirmedIngredientsChange?: (ingredients: string[]) => void
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

export function IngredientScanner({
	className,
	onConfirmedIngredientsChange,
}: IngredientScannerProps) {
	const t = useTranslations('cooking')
	const videoRef = useRef<HTMLVideoElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const streamRef = useRef<MediaStream | null>(null)
	const cameraTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const detectionAbortRef = useRef<AbortController | null>(null)
	const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle')
	const [cameraFacingMode, setCameraFacingMode] =
		useState<CameraFacingMode>('environment')
	const [hasVideoFrame, setHasVideoFrame] = useState(false)
	const [imageUrl, setImageUrl] = useState<string | null>(null)
	const [detections, setDetections] = useState<IngredientDetection[]>([])
	const [telemetry, setTelemetry] = useState<DetectionSpeed | null>(null)
	const [device, setDevice] = useState<string>('unknown')
	const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.2)
	const [lastImageBlob, setLastImageBlob] = useState<Blob | null>(null)
	const [isScanning, setIsScanning] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [applyScoreThreshold, setApplyScoreThreshold] = useState(true)
	const [confirmedDetectionIds, setConfirmedDetectionIds] = useState<string[]>(
		[],
	)

	const displayedDetections = useMemo(
		() =>
			applyScoreThreshold
				? detections.filter(
						detection => detection.confidence >= confidenceThreshold,
					)
				: detections,
		[detections, applyScoreThreshold, confidenceThreshold],
	)
	const confirmedNames = useMemo(
		() => [
			...new Set(
				displayedDetections
					.filter(detection => confirmedDetectionIds.includes(detection.id))
					.map(detection => detection.name),
			),
		],
		[displayedDetections, confirmedDetectionIds],
	)

	useEffect(() => {
		onConfirmedIngredientsChange?.(confirmedNames)
	}, [confirmedNames, onConfirmedIngredientsChange])

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
			detectionAbortRef.current?.abort()
			stopCamera()
		}
	}, [stopCamera])

	useEffect(() => {
		return () => {
			if (imageUrl) URL.revokeObjectURL(imageUrl)
		}
	}, [imageUrl])

	const scanImage = useCallback(
		async (image: Blob, threshold = confidenceThreshold) => {
			detectionAbortRef.current?.abort()
			const controller = new AbortController()
			detectionAbortRef.current = controller
			setError(null)
			setDetections([])
			setConfirmedDetectionIds([])
			setTelemetry(null)
			setDevice('unknown')
			setLastImageBlob(image)
			setImageUrl(URL.createObjectURL(image))
			setIsScanning(true)
			stopCamera()

			try {
				const result = await detectIngredients(
					image,
					controller.signal,
					threshold,
				)
				if (controller.signal.aborted) return
				setDetections(result.detections)
				setConfirmedDetectionIds([])
				if (result.speed) {
					setTelemetry(result.speed)
				}
				if (result.device) {
					setDevice(result.device)
				}
				toast.success(
					t('scanFoundResults', { count: result.detections.length }),
				)
			} catch (scanError) {
				if (!controller.signal.aborted) {
					setError(
						scanError instanceof Error && scanError.message
							? scanError.message
							: t('scanDetectionUnavailable'),
					)
				}
			} finally {
				if (detectionAbortRef.current === controller) {
					detectionAbortRef.current = null
					if (!controller.signal.aborted) setIsScanning(false)
				}
			}
		},
		[confidenceThreshold, stopCamera, t],
	)

	const handleThresholdChange = (newThreshold: number) => {
		setConfidenceThreshold(newThreshold)
		if (lastImageBlob && !isScanning) {
			void scanImage(lastImageBlob, newThreshold)
		}
	}

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
		setConfirmedDetectionIds([])
		setTelemetry(null)
		setLastImageBlob(null)
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
				{imageUrl && displayedDetections.length > 0 && (
					<IngredientDetectionOverlay detections={displayedDetections} />
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
				data-testid='ingredient-scanner-file-input'
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
				<div className='space-y-4 rounded-2xl border border-success/20 bg-success/5 p-4'>
					<div className='flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-success'>
						<div className='flex items-center gap-2'>
							<Check className='size-4' />
							<span>
								{applyScoreThreshold
									? 'Detections above score threshold'
									: 'Returned detections'}
								: <strong>{displayedDetections.length} item(s)</strong>
							</span>
						</div>
						{telemetry && (
							<div
								data-testid='telemetry-strip'
								className='flex flex-wrap items-center gap-2 rounded-xl border border-brand/20 bg-bg-card px-3 py-1 font-mono text-xs text-text-primary shadow-sm'
							>
								<span className='flex items-center gap-1 font-bold text-brand'>
									<Cpu className='size-3.5' />
									PyTorch {device.toUpperCase()}: {telemetry.total_ms}ms
								</span>
								<span className='text-text-muted'>|</span>
								<span>Infer: {telemetry.inference_ms}ms</span>
								<span>Pre: {telemetry.preprocess_ms}ms</span>
								<span>Post: {telemetry.postprocess_ms}ms</span>
							</div>
						)}
					</div>

					<label className='flex items-center gap-2 text-xs text-text-secondary'>
						<input
							type='checkbox'
							checked={applyScoreThreshold}
							onChange={event => setApplyScoreThreshold(event.target.checked)}
						/>
						Apply model score threshold
					</label>

					<div className='flex flex-wrap gap-2.5'>
						{displayedDetections.map(detection => (
							<div
								key={detection.id}
								className='flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-card px-3 py-2 text-sm shadow-sm'
							>
								<label className='inline-flex items-center gap-2'>
									<input
										type='checkbox'
										aria-label={`Use ${detection.name} in recipe search`}
										checked={confirmedDetectionIds.includes(detection.id)}
										onChange={event =>
											setConfirmedDetectionIds(ids =>
												event.target.checked
													? [...ids, detection.id]
													: ids.filter(id => id !== detection.id),
											)
										}
									/>
									<span className='font-semibold text-text-primary'>
										{detection.name}
									</span>
								</label>
								<span className='text-xs text-text-muted'>
									Score {detection.confidence.toFixed(2)}
								</span>
								<span className='text-border-subtle'>•</span>
								<Link
									href={`/explore/graph?q=${encodeURIComponent(detection.name.toLowerCase())}`}
									className='inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline'
									title={`Explore ${detection.name} in Knowledge Graph`}
								>
									<Compass className='size-3' />
									<span>Explore Graph →</span>
								</Link>
							</div>
						))}
					</div>

					{/* Model-score controls do not establish precision or recall. */}
					<div className='mt-2 rounded-xl border border-border-subtle bg-bg-card/70 p-3'>
						<div className='flex items-center justify-between gap-2 text-xs'>
							<label
								htmlFor='threshold-slider'
								className='flex items-center gap-1.5 font-medium text-text-secondary'
							>
								<Gauge className='size-3.5 text-brand' />
								<span>
									Minimum model score:{' '}
									<strong>{confidenceThreshold.toFixed(2)}</strong>
								</span>
							</label>
							<span className='text-[11px] text-text-muted'>
								Detection threshold
							</span>
						</div>
						<div className='mt-2 flex items-center gap-3'>
							<span className='font-mono text-[11px] text-text-muted'>
								0.10
							</span>
							<input
								id='threshold-slider'
								type='range'
								min='0.10'
								max='0.90'
								step='0.05'
								value={confidenceThreshold}
								onChange={e =>
									handleThresholdChange(parseFloat(e.target.value))
								}
								className='h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-bg-elevated accent-brand'
							/>
							<span className='font-mono text-[11px] text-text-muted'>
								0.90
							</span>
						</div>
						<p className='mt-1.5 text-[11px] text-text-muted'>
							Model scores are not calibrated accuracy. Confirm ingredients
							before searching.
						</p>
					</div>

					<div className='flex flex-wrap items-center gap-3'>
						{confirmedNames.length > 0 ? (
							<Link
								href={`${PATHS.SEARCH}?q=${encodeURIComponent(confirmedNames.join(' '))}`}
								className='inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white'
							>
								<Search className='size-4' /> Search recipes
							</Link>
						) : (
							<button
								type='button'
								disabled
								className='inline-flex min-h-11 items-center gap-2 rounded-lg bg-bg-elevated px-4 py-2 text-sm text-text-muted'
							>
								<Search className='size-4' /> Search recipes
							</button>
						)}
					</div>
				</div>
			)}
		</section>
	)
}
