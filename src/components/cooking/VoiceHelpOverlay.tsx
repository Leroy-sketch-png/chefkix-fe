'use client'

import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { COMMANDS } from '@/lib/voice'

/**
 * Voice command reference sheet.
 * Shows available commands and their aliases.
 *
 * Spec: vision_and_spec/22-voice-mode.txt §2
 */
export function VoiceHelpOverlay({
	show,
	onClose,
}: {
	show: boolean
	onClose: () => void
}) {
	return (
		<AnimatePresence>
			{show && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className='absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'
					onClick={onClose}
				>
					<motion.div
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.9, opacity: 0 }}
						onClick={e => e.stopPropagation()}
						className='mx-4 w-full max-w-sm rounded-2xl bg-bg-card p-6 shadow-warm'
					>
						<div className='mb-4 flex items-center justify-between'>
							<h3 className='text-lg font-bold text-text'>Voice Commands</h3>
							<button
								onClick={onClose}
								className='flex size-8 items-center justify-center rounded-full text-text-muted hover:bg-bg-elevated'
							>
								<X className='size-4' />
							</button>
						</div>

						<div className='space-y-3'>
							{COMMANDS.map(cmd => (
								<div key={cmd.action} className='flex items-start gap-3'>
									<span className='mt-0.5 text-lg'>{cmd.icon}</span>
									<div>
										<p className='text-sm font-semibold text-text'>
											{cmd.label}
										</p>
										<p className='text-xs text-text-muted'>
											Say: {cmd.keywords.map(k => `"${k}"`).join(', ')}
										</p>
									</div>
								</div>
							))}
						</div>

						<p className='mt-4 text-center text-xs text-text-muted'>
							Tip: Speak clearly and wait for the confirmation toast
						</p>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}
