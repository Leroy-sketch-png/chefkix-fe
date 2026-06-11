'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
	Camera,
	Check,
	Hand,
	Mic,
	RefreshCw,
	RotateCcw,
	Speaker,
	Timer,
	Volume2,
	Wifi,
	X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { notifyTimerComplete } from '@/lib/audio'
import { getKitchenAudioCoordinator } from '@/lib/voice/KitchenAudioCoordinator'
import { getTurnServer, probeTurnRelay } from '@/hooks/useWebRTC'
import {
	EMPTY_IO_CERTIFICATION_RESULTS,
	IO_CERTIFICATION_STORAGE_KEY,
	summarizeIoCertification,
	type IoCertificationCheckId,
	type IoCertificationResults,
	type IoCertificationStatus,
} from '@/components/dev/io-certification'

function nowLabel() {
	return new Date().toISOString()
}

async function getUserMediaBounded(
	constraints: MediaStreamConstraints,
	timeoutMs: number,
): Promise<MediaStream> {
	if (!navigator.mediaDevices?.getUserMedia) {
		throw new DOMException('Media devices are unavailable.', 'NotSupportedError')
	}

	let timedOut = false
	const request = navigator.mediaDevices.getUserMedia(constraints)
	request
		.then(stream => {
			if (timedOut) stream.getTracks().forEach(track => track.stop())
		})
		.catch(() => undefined)

	let timeoutId = 0
	const timeout = new Promise<never>((_, reject) => {
		timeoutId = window.setTimeout(() => {
			timedOut = true
			reject(
				new DOMException('Permission request timed out.', 'TimeoutError'),
			)
		}, timeoutMs)
	})

	try {
		return await Promise.race([request, timeout])
	} finally {
		window.clearTimeout(timeoutId)
	}
}

function statusClasses(status: IoCertificationStatus) {
	switch (status) {
		case 'pass':
			return 'border-success/40 bg-success/5 text-success'
		case 'fail':
			return 'border-error/40 bg-error/5 text-error'
		case 'running':
			return 'border-info/40 bg-info/5 text-info'
		case 'confirm':
			return 'border-warning/40 bg-warning/5 text-warning'
		default:
			return 'border-border-medium bg-bg-elevated text-text-muted'
	}
}

export function IoReadinessPanel() {
	const videoRef = useRef<HTMLVideoElement>(null)
	const streamRef = useRef<MediaStream | null>(null)
	const audioContextRef = useRef<AudioContext | null>(null)
	const analyserRef = useRef<AnalyserNode | null>(null)
	const animationRef = useRef<number | null>(null)
	const currentLevelRef = useRef(0)
	const [micLevel, setMicLevel] = useState(0)
	const [results, setResults] = useState<IoCertificationResults>(() => {
		if (typeof window === 'undefined') return EMPTY_IO_CERTIFICATION_RESULTS
		try {
			const stored = window.localStorage.getItem(IO_CERTIFICATION_STORAGE_KEY)
			return stored
				? {
						...EMPTY_IO_CERTIFICATION_RESULTS,
						...(JSON.parse(stored) as Partial<IoCertificationResults>),
					}
				: EMPTY_IO_CERTIFICATION_RESULTS
		} catch {
			return EMPTY_IO_CERTIFICATION_RESULTS
		}
	})

	const summary = useMemo(
		() => summarizeIoCertification(results),
		[results],
	)

	useEffect(() => {
		window.localStorage.setItem(
			IO_CERTIFICATION_STORAGE_KEY,
			JSON.stringify(results),
		)
	}, [results])

	useEffect(() => {
		return () => {
			if (animationRef.current) cancelAnimationFrame(animationRef.current)
			streamRef.current?.getTracks().forEach(track => track.stop())
			void audioContextRef.current?.close()
		}
	}, [])

	const setResult = (
		id: IoCertificationCheckId,
		status: IoCertificationStatus,
		detail: string,
	) => {
		setResults(current => ({
			...current,
			[id]: {
				status,
				detail,
				verifiedAt:
					status === 'pass' || status === 'fail'
						? nowLabel()
						: current[id].verifiedAt,
			},
		}))
	}

	const startMeter = async (stream: MediaStream) => {
		if (animationRef.current !== null) {
			cancelAnimationFrame(animationRef.current)
			animationRef.current = null
		}
		if (audioContextRef.current) {
			await audioContextRef.current.close()
		}
		const context = new AudioContext()
		const analyser = context.createAnalyser()
		analyser.fftSize = 256
		context.createMediaStreamSource(stream).connect(analyser)
		audioContextRef.current = context
		analyserRef.current = analyser
		const data = new Uint8Array(analyser.frequencyBinCount)

		const sample = () => {
			analyser.getByteFrequencyData(data)
			const average =
				data.reduce((total, value) => total + value, 0) / data.length / 255
			currentLevelRef.current = average
			setMicLevel(average)
			animationRef.current = requestAnimationFrame(sample)
		}
		sample()
	}

	const runMediaPreflight = async () => {
		setResult('media', 'running', 'Waiting for camera and microphone')
		try {
			const stream = await getUserMediaBounded(
				{
					video: true,
					audio: true,
				},
				12_000,
			)
			streamRef.current?.getTracks().forEach(track => track.stop())
			streamRef.current = stream
			if (videoRef.current) videoRef.current.srcObject = stream
			await startMeter(stream)
			setResult(
				'media',
				'pass',
				`${stream.getVideoTracks().length} camera and ${stream.getAudioTracks().length} microphone track ready`,
			)
		} catch (error) {
			const detail =
				error instanceof DOMException
					? `${error.name}: ${error.message}`
					: 'Media preflight failed'
			setResult('media', 'fail', detail)
		}
	}

	const playSpeakerTest = () => {
		setResult('speaker', 'confirm', 'Tone played; confirm it was audible')
		const context = new AudioContext()
		const oscillator = context.createOscillator()
		const gain = context.createGain()
		oscillator.connect(gain)
		gain.connect(context.destination)
		oscillator.frequency.setValueAtTime(660, context.currentTime)
		oscillator.frequency.setValueAtTime(880, context.currentTime + 0.2)
		gain.gain.setValueAtTime(0.25, context.currentTime)
		gain.gain.linearRampToValueAtTime(0, context.currentTime + 0.5)
		oscillator.start()
		oscillator.stop(context.currentTime + 0.5)
		oscillator.onended = () => void context.close()
	}

	const runClapCalibration = async () => {
		if (!analyserRef.current) {
			setResult('clap', 'fail', 'Run camera and microphone preview first')
			return
		}
		setResult('clap', 'running', 'Sampling room noise, then clap once')
		const baselineSamples: number[] = []
		for (let index = 0; index < 10; index += 1) {
			baselineSamples.push(currentLevelRef.current)
			await new Promise(resolve => window.setTimeout(resolve, 120))
		}
		const baseline =
			baselineSamples.reduce((sum, value) => sum + value, 0) /
			baselineSamples.length
		const threshold = Math.min(0.85, Math.max(0.18, baseline + 0.16))
		const deadline = Date.now() + 8_000
		while (Date.now() < deadline) {
			if (currentLevelRef.current >= threshold) {
				setResult(
					'clap',
					'pass',
					`Clap peak ${currentLevelRef.current.toFixed(2)} over baseline ${baseline.toFixed(2)}`,
				)
				return
			}
			await new Promise(resolve => window.setTimeout(resolve, 60))
		}
		setResult(
			'clap',
			'fail',
			`No clap exceeded ${threshold.toFixed(2)}; baseline was ${baseline.toFixed(2)}`,
		)
	}

	const runVoiceRoundTrip = () => {
		const Recognition = (
			window as typeof window & {
				SpeechRecognition?: new () => {
					lang: string
					continuous: boolean
					interimResults: boolean
					start: () => void
					stop: () => void
					onresult: ((event: {
						results: ArrayLike<ArrayLike<{ transcript: string }>>
					}) => void) | null
					onerror: ((event: { error: string }) => void) | null
					onend: (() => void) | null
				}
				webkitSpeechRecognition?: new () => {
					lang: string
					continuous: boolean
					interimResults: boolean
					start: () => void
					stop: () => void
					onresult: ((event: {
						results: ArrayLike<ArrayLike<{ transcript: string }>>
					}) => void) | null
					onerror: ((event: { error: string }) => void) | null
					onend: (() => void) | null
				}
			}
		).SpeechRecognition ||
			(
				window as typeof window & {
					webkitSpeechRecognition?: new () => {
						lang: string
						continuous: boolean
						interimResults: boolean
						start: () => void
						stop: () => void
						onresult: ((event: {
							results: ArrayLike<ArrayLike<{ transcript: string }>>
						}) => void) | null
						onerror: ((event: { error: string }) => void) | null
						onend: (() => void) | null
					}
				}
			).webkitSpeechRecognition

		if (!Recognition || !window.speechSynthesis) {
			setResult('voice', 'fail', 'Speech synthesis or recognition unsupported')
			return
		}

		setResult(
			'voice',
			'running',
			'Listen to the prompt, then say "ChefKix ready"',
		)
		const recognition = new Recognition()
		recognition.lang = 'en-US'
		recognition.continuous = false
		recognition.interimResults = false
		let completed = false
		const timeout = window.setTimeout(() => {
			if (completed) return
			completed = true
			recognition.stop()
			setResult('voice', 'fail', 'No matching phrase before timeout')
		}, 10_000)
		recognition.onresult = event => {
			if (completed) return
			completed = true
			window.clearTimeout(timeout)
			const transcript = event.results[0]?.[0]?.transcript || ''
			const matched = /chef\s*kix|chef\s*kicks/i.test(transcript)
			setResult(
				'voice',
				matched ? 'pass' : 'fail',
				`Heard: "${transcript || 'nothing'}"`,
			)
		}
		recognition.onerror = event => {
			if (completed) return
			completed = true
			window.clearTimeout(timeout)
			setResult('voice', 'fail', `Recognition error: ${event.error}`)
		}

		const utterance = new SpeechSynthesisUtterance(
			'Voice check. Please say ChefKix ready.',
		)
		utterance.onend = () => recognition.start()
		utterance.onerror = () => {
			if (completed) return
			completed = true
			window.clearTimeout(timeout)
			setResult('voice', 'fail', 'Text to speech failed')
		}
		window.speechSynthesis.speak(utterance)
	}

	const playTimerTest = () => {
		const coordinator = getKitchenAudioCoordinator()
		const preferences = coordinator.getSnapshot().preferences
		coordinator.setPreferences({
			spokenGuidanceEnabled: false,
			timerChimesEnabled: true,
		})
		notifyTimerComplete()
		window.setTimeout(() => coordinator.setPreferences(preferences), 1000)
		setResult(
			'timer',
			'confirm',
			'Timer chime and vibration fired while narration was muted',
		)
	}

	const runTurnProbe = async () => {
		setResult('turn', 'running', 'Gathering relay-only ICE candidates')
		const result = await probeTurnRelay()
		setResult('turn', result.ok ? 'pass' : 'fail', result.detail)
	}

	const confirm = (id: 'speaker' | 'timer', heard: boolean) => {
		setResult(
			id,
			heard ? 'pass' : 'fail',
			heard ? 'Confirmed by presenter' : 'Presenter could not hear the output',
		)
	}

	const reset = () => {
		setResults(EMPTY_IO_CERTIFICATION_RESULTS)
		window.localStorage.removeItem(IO_CERTIFICATION_STORAGE_KEY)
	}

	const checks: Array<{
		id: IoCertificationCheckId
		title: string
		icon: React.ReactNode
		action: () => void
		actionLabel: string
	}> = [
		{
			id: 'media',
			title: 'Camera and microphone',
			icon: <Camera className='size-4' />,
			action: () => void runMediaPreflight(),
			actionLabel: 'Preview',
		},
		{
			id: 'speaker',
			title: 'Speaker output',
			icon: <Speaker className='size-4' />,
			action: playSpeakerTest,
			actionLabel: 'Play tone',
		},
		{
			id: 'clap',
			title: 'Clap calibration',
			icon: <Hand className='size-4' />,
			action: () => void runClapCalibration(),
			actionLabel: 'Calibrate',
		},
		{
			id: 'voice',
			title: 'TTS and voice round trip',
			icon: <Mic className='size-4' />,
			action: runVoiceRoundTrip,
			actionLabel: 'Run voice check',
		},
		{
			id: 'timer',
			title: 'Timer while narration muted',
			icon: <Timer className='size-4' />,
			action: playTimerTest,
			actionLabel: 'Fire timer',
		},
		{
			id: 'turn',
			title: 'TURN relay candidate',
			icon: <Wifi className='size-4' />,
			action: () => void runTurnProbe(),
			actionLabel: 'Probe relay',
		},
	]

	return (
		<section className='w-full border-t border-border-subtle pt-6 text-left'>
			<div className='mb-4 flex items-start justify-between gap-4'>
				<div>
					<p className='text-xs font-semibold uppercase text-brand'>
						Private readiness
					</p>
					<h2 className='mt-1 text-xl font-bold text-text-primary'>
						I/O certification
					</h2>
					<p className='mt-1 text-sm text-text-muted'>
						{summary.detail} Evidence expires after 4 hours.
					</p>
					<p
						className={`mt-2 text-sm font-semibold ${
							summary.stageOk ? 'text-success' : 'text-error'
						}`}
					>
						{summary.stageDetail}
					</p>
				</div>
				<Button variant='outline' size='icon' onClick={reset} title='Reset evidence'>
					<RotateCcw />
				</Button>
			</div>

			<div className='grid gap-5 lg:grid-cols-[18rem_1fr]'>
				<div className='space-y-3'>
					<div className='relative aspect-video overflow-hidden rounded-lg border border-border-medium bg-black'>
						<video
							ref={videoRef}
							autoPlay
							muted
							playsInline
							className='size-full object-cover'
						/>
						{results.media.status !== 'pass' ? (
							<div className='absolute inset-0 grid place-items-center text-sm text-white/70'>
								<Camera className='size-7' />
							</div>
						) : null}
					</div>
					<div>
						<div className='mb-1 flex items-center justify-between text-xs text-text-muted'>
							<span>Microphone level</span>
							<span className='tabular-nums'>{Math.round(micLevel * 100)}%</span>
						</div>
						<div className='h-2 overflow-hidden rounded bg-bg-elevated'>
							<div
								className='h-full bg-success transition-[width] duration-75'
								style={{ width: `${Math.min(100, micLevel * 180)}%` }}
							/>
						</div>
					</div>
					<div className='rounded-lg border border-border-subtle bg-bg-elevated p-3 text-xs text-text-muted'>
						<p className='font-semibold text-text-secondary'>Configured TURN</p>
						<p className='mt-1 break-all'>{String(getTurnServer().urls)}</p>
						<p className='mt-2'>
							A relay pass certifies allocation from this browser. Two-device,
							separate-network certification is still a distinct physical gate.
						</p>
					</div>
				</div>

				<div className='grid gap-2 md:grid-cols-2'>
					{checks.map(check => {
						const result = results[check.id]
						return (
							<div
								key={check.id}
								className='flex min-h-32 flex-col justify-between rounded-lg border border-border-subtle bg-bg-card p-4'
							>
								<div>
									<div className='flex items-center justify-between gap-3'>
										<h3 className='flex items-center gap-2 text-sm font-semibold text-text-primary'>
											{check.icon}
											{check.title}
										</h3>
										<span
											className={`rounded border px-2 py-1 text-xs font-semibold ${statusClasses(result.status)}`}
										>
											{result.status}
										</span>
									</div>
									<p className='mt-2 text-xs leading-5 text-text-muted'>
										{result.detail}
									</p>
									{result.verifiedAt ? (
										<p className='mt-1 text-2xs text-text-muted'>
											{new Date(result.verifiedAt).toLocaleString()}
										</p>
									) : null}
								</div>
								<div className='mt-3 flex flex-wrap gap-2'>
									<Button
										variant='outline'
										size='sm'
										onClick={check.action}
										disabled={result.status === 'running'}
									>
										{result.status === 'running' ? (
											<RefreshCw className='animate-spin' />
										) : check.id === 'speaker' ? (
											<Volume2 />
										) : (
											check.icon
										)}
										{check.actionLabel}
									</Button>
									{result.status === 'confirm' &&
									(check.id === 'speaker' || check.id === 'timer') ? (
										<>
											<Button
												variant='success'
												size='sm'
												onClick={() =>
													confirm(check.id as 'speaker' | 'timer', true)
												}
											>
												<Check />
												Heard it
											</Button>
											<Button
												variant='destructive'
												size='sm'
												onClick={() =>
													confirm(check.id as 'speaker' | 'timer', false)
												}
											>
												<X />
												Failed
											</Button>
										</>
									) : null}
								</div>
							</div>
						)
					})}
				</div>
			</div>
		</section>
	)
}
