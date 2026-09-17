'use client'

import { useMemo } from 'react'
import {
	Camera,
	CameraOff,
	Loader2,
	Mic,
	MicOff,
	RefreshCw,
	ShieldAlert,
	SwitchCamera,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DEFAULT_WAKE_WORD } from '@/lib/voice'
import { VoiceInterventionAlert } from './VoiceInterventionAlert'
import { useCopilotCamera } from '../hooks/useCopilotCamera'
import { useVoiceVisionCopilot } from '../hooks/useVoiceVisionCopilot'
import type { VoiceCopilotContext } from '../types'

export function VoiceVisionCopilot({
	context,
}: {
	context?: VoiceCopilotContext
}) {
	const camera = useCopilotCamera()
	const copilot = useVoiceVisionCopilot({
		captureFrame: camera.captureFrame,
		context,
	})
	const response = copilot.response
	const statusLabel = useMemo(() => {
		if (copilot.isProcessing) return 'Analyzing your frame and question…'
		if (copilot.isArmed) return 'Wake word heard — listening for your question'
		if (copilot.isListening) return `Listening for “${DEFAULT_WAKE_WORD}”`
		return 'Ready when you are'
	}, [copilot.isArmed, copilot.isListening, copilot.isProcessing])

	return (
		<section className='grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]'>
			<div className='rounded-3xl border border-border-subtle bg-bg-card p-4 shadow-card sm:p-6'>
				<div className='mb-5 flex items-start justify-between gap-4'>
					<div>
						<p className='text-xs font-semibold uppercase tracking-[0.16em] text-brand'>
							Voice + vision
						</p>
						<h2 className='mt-1 text-xl font-bold text-text-primary'>
							Kitchen copilot
						</h2>
						<p className='mt-2 text-sm leading-6 text-text-secondary'>
							Ask ChefKix about what is happening in front of the camera.
						</p>
					</div>
					<span className='rounded-full bg-bg-elevated px-3 py-1 text-xs font-semibold text-text-secondary'>
						{statusLabel}
					</span>
				</div>

				<div className='relative aspect-video overflow-hidden rounded-2xl border border-border-subtle bg-bg-elevated'>
					<video
						ref={camera.videoRef}
						muted
						playsInline
						autoPlay
						onPlaying={camera.onVideoPlaying}
						className={cn(
							'size-full object-cover transition-opacity',
							camera.hasFrame ? 'opacity-100' : 'opacity-0',
						)}
						aria-label='Kitchen copilot camera preview'
					/>
					{!camera.hasFrame && (
						<div className='absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center'>
							<div className='grid size-14 place-items-center rounded-2xl bg-brand/10 text-brand'>
								{camera.status === 'requesting' ? (
									<Loader2 className='size-7 animate-spin' />
								) : (
									<CameraOff className='size-7' />
								)}
							</div>
							<p className='font-semibold text-text-primary'>
								{camera.status === 'requesting'
									? 'Starting camera…'
									: 'Camera is off'}
							</p>
							<p className='max-w-sm text-sm text-text-secondary'>
								The copilot can still hear your question, but a live frame makes
								visual checks possible.
							</p>
						</div>
					)}
					{camera.hasFrame && (
						<div className='absolute left-3 top-3 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm'>
							Live · {camera.facingMode === 'environment' ? 'back' : 'front'}{' '}
							camera
						</div>
					)}
				</div>
				<canvas ref={camera.canvasRef} className='hidden' aria-hidden='true' />

				{(camera.error || copilot.lastMessage) && (
					<div
						className='mt-4 rounded-2xl border border-border-subtle bg-bg-elevated p-3 text-sm text-text-secondary'
						role='status'
					>
						{camera.error || copilot.lastMessage}
					</div>
				)}

				<div className='mt-4 flex flex-wrap gap-3'>
					<button
						type='button'
						onClick={() => void camera.startCamera()}
						disabled={camera.status === 'requesting'}
						className='inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 py-2.5 font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-60'
					>
						<Camera className='size-4' />
						{camera.hasFrame ? 'Refresh camera' : 'Enable camera'}
					</button>
					<button
						type='button'
						onClick={camera.flipCamera}
						disabled={!camera.hasFrame}
						className='inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-4 py-2.5 font-semibold text-text-primary transition-colors hover:bg-bg-hover disabled:opacity-50'
					>
						<SwitchCamera className='size-4' /> Flip camera
					</button>
				</div>
			</div>

			<div className='space-y-6'>
				<div className='rounded-3xl border border-border-subtle bg-bg-card p-5 shadow-card sm:p-6'>
					<div className='flex items-start gap-3'>
						<div className='grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand'>
							<Mic className='size-5' />
						</div>
						<div>
							<h2 className='font-semibold text-text-primary'>
								Hands-free questions
							</h2>
							<p className='mt-1 text-sm leading-6 text-text-secondary'>
								Continuous listening is gated by the wake word, so kitchen
								chatter is not sent to the AI service.
							</p>
						</div>
					</div>
					<button
						type='button'
						onClick={copilot.isListening ? copilot.stop : copilot.start}
						disabled={!copilot.isSupported || copilot.isProcessing}
						className={cn(
							'mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white transition-colors disabled:opacity-60',
							copilot.isListening
								? 'bg-error hover:bg-error/90'
								: 'bg-brand hover:bg-brand/90',
						)}
					>
						{copilot.isListening ? (
							<MicOff className='size-5' />
						) : (
							<Mic className='size-5' />
						)}
						{copilot.isListening ? 'Stop listening' : 'Start listening'}
					</button>
					<p className='mt-3 text-center text-xs text-text-muted'>
						Say “{DEFAULT_WAKE_WORD}, what should I watch for?”
					</p>
				</div>

				{copilot.lastTranscript && (
					<div className='rounded-3xl border border-border-subtle bg-bg-elevated p-5'>
						<p className='text-xs font-semibold uppercase tracking-[0.14em] text-text-tertiary'>
							Last question
						</p>
						<p className='mt-2 text-sm leading-6 text-text-primary'>
							{copilot.lastTranscript}
						</p>
						{copilot.isProcessing && (
							<Loader2 className='mt-3 size-4 animate-spin text-brand' />
						)}
					</div>
				)}

				{response?.status === 'integration-pending' && (
					<div className='rounded-3xl border border-warning/20 bg-warning/8 p-5 text-sm leading-6 text-warning-vivid'>
						<p className='font-semibold'>Integration seam ready</p>
						<p className='mt-1'>
							The UI is wired for the Leader VLM + Graph-RAG response contract.
							Add the endpoint when it is published; no mock answer is being
							shown.
						</p>
					</div>
				)}

				{response?.evidence.length ? (
					<div className='rounded-3xl border border-border-subtle bg-bg-card p-5'>
						<p className='text-xs font-semibold uppercase tracking-[0.14em] text-text-tertiary'>
							Graph evidence
						</p>
						<div className='mt-3 flex flex-wrap gap-2'>
							{response.evidence.map(item => (
								<span
									key={item.id}
									className='rounded-full bg-bg-elevated px-3 py-1.5 text-xs text-text-secondary'
								>
									{item.label} · {item.source}
								</span>
							))}
						</div>
					</div>
				) : null}

				{response?.interventions.length ? (
					<div className='space-y-3'>
						<div className='flex items-center gap-2 text-sm font-semibold text-text-primary'>
							<ShieldAlert className='size-4 text-warning-vivid' />
							Kitchen interventions
						</div>
						{response.interventions.map(intervention => (
							<VoiceInterventionAlert
								key={intervention.id}
								intervention={intervention}
							/>
						))}
					</div>
				) : null}

				{response?.status === 'error' && (
					<div
						className='flex items-start gap-3 rounded-2xl border border-error/20 bg-error/8 p-4 text-sm text-text-secondary'
						role='alert'
					>
						<RefreshCw className='size-5 shrink-0 text-error' />
						<span>{response.answer}</span>
					</div>
				)}
			</div>
		</section>
	)
}
