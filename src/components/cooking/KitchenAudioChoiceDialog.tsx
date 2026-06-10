'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, VolumeX } from 'lucide-react'
import { Portal } from '@/components/ui/portal'
import { useKitchenAudio } from '@/lib/voice'
import { TRANSITION_SPRING } from '@/lib/motion'

export function KitchenAudioChoiceDialog({ active }: { active: boolean }) {
	const audio = useKitchenAudio()
	const show = active && !audio.guidanceChoiceMade

	return (
		<AnimatePresence>
			{show && (
				<Portal>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed inset-0 z-modal grid place-items-center bg-black/60 p-4'
						onClick={audio.dismissGuidanceChoice}
					>
						<motion.div
							initial={{ opacity: 0, scale: 0.96, y: 12 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.96, y: 12 }}
							transition={TRANSITION_SPRING}
							role='dialog'
							aria-modal='true'
							aria-labelledby='kitchen-audio-choice-title'
							onClick={event => event.stopPropagation()}
							className='w-full max-w-sm rounded-xl border border-border-subtle bg-bg-card p-6 shadow-warm'
						>
							<h2
								id='kitchen-audio-choice-title'
								className='text-lg font-bold text-text-primary'
							>
								How should ChefKix guide this cook?
							</h2>
							<div className='mt-5 grid gap-3'>
								<button
									type='button'
									onClick={() => audio.chooseSpokenGuidance(true)}
									className='flex min-h-12 items-center gap-3 rounded-xl bg-brand px-4 py-3 text-left font-semibold text-white transition-colors hover:bg-brand/90 focus-visible:ring-2 focus-visible:ring-brand/50'
								>
									<Volume2 className='size-5 shrink-0' />
									Guide me aloud
								</button>
								<button
									type='button'
									onClick={() => audio.chooseSpokenGuidance(false)}
									className='flex min-h-12 items-center gap-3 rounded-xl border border-border-subtle bg-bg-elevated px-4 py-3 text-left font-semibold text-text-primary transition-colors hover:bg-bg-hover focus-visible:ring-2 focus-visible:ring-brand/50'
								>
									<VolumeX className='size-5 shrink-0' />
									Stay quiet
								</button>
							</div>
							<p className='mt-4 text-xs text-text-muted'>
								Timer chimes and vibration stay available either way.
							</p>
						</motion.div>
					</motion.div>
				</Portal>
			)}
		</AnimatePresence>
	)
}
