'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { VoiceEvent } from '@/lib/voice'

/**
 * Shows recognized voice command + action taken as a temporary overlay.
 *
 * Spec: vision_and_spec/22-voice-mode.txt §4
 */
export function VoiceCommandToast({ event }: { event: VoiceEvent | null }) {
	const [visible, setVisible] = useState(false)
	const [current, setCurrent] = useState<VoiceEvent | null>(null)

	useEffect(() => {
		if (event) {
			setCurrent(event)
			setVisible(true)
			const timer = setTimeout(() => setVisible(false), 2500)
			return () => clearTimeout(timer)
		}
	}, [event])

	return (
		<AnimatePresence>
			{visible && current && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -10 }}
					role='status'
					aria-live='polite'
					className='pointer-events-none absolute bottom-16 left-1/2 z-notification flex -translate-x-1/2 items-center gap-2 rounded-full bg-bg-elevated/95 px-4 py-2 shadow-warm backdrop-blur-sm'
				>
					{current.icon && <span className='text-lg'>{current.icon}</span>}
					<span className='text-sm font-medium text-text'>
						{current.message}
					</span>
					{current.transcript && current.type !== 'command' && (
						<span className='text-xs text-text-muted'>
							&quot;{current.transcript}&quot;
						</span>
					)}
				</motion.div>
			)}
		</AnimatePresence>
	)
}
