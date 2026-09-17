import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { PATHS } from '@/constants/paths'
import { VoiceVisionCopilot } from '@/features/voice-copilot/components/VoiceVisionCopilot'

export default function VoiceVisionCopilotPage() {
	return (
		<main className='mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:py-10'>
			<div>
				<Link
					href={PATHS.COOK}
					className='inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-brand'
				>
					<ArrowLeft className='size-4' /> Back to cooking
				</Link>
				<p className='mt-6 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-brand'>
					<Sparkles className='size-4' /> Epic 12 preview
				</p>
				<h1 className='mt-2 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl'>
					Voice-Vision Copilot
				</h1>
				<p className='mt-3 max-w-3xl text-base leading-7 text-text-secondary'>
					A reviewable integration surface for wake-word cooking help, camera
					context, graph-grounded answers, and safety interventions.
				</p>
			</div>
			<VoiceVisionCopilot />
		</main>
	)
}
