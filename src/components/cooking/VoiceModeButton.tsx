'use client'

import { useEffect } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { UseVoiceModeReturn } from '@/lib/voice'

/**
 * Floating mic button for CookingPlayer voice control.
 * Shows pulsing coral ring when listening.
 *
 * Spec: vision_and_spec/22-voice-mode.txt §4, §6
 */
export function VoiceModeButton({
	voice,
	className,
}: {
	voice: UseVoiceModeReturn
	className?: string
}) {
	if (!voice.isSupported) return null

	// Surface voice events as toasts so the user gets feedback
	// eslint-disable-next-line react-hooks/rules-of-hooks
	useEffect(() => {
		if (!voice.lastEvent) return
		const { type, message } = voice.lastEvent
		switch (type) {
			case 'command':
				toast.success(message)
				break
			case 'error':
				toast.error(message)
				break
			case 'low-confidence':
			case 'unrecognized':
				toast.info(message)
				break
		}
	}, [voice.lastEvent])

	return (
		<motion.button
			onClick={voice.toggleListening}
			whileTap={{ scale: 0.9 }}
			className={cn(
				'relative flex size-10 items-center justify-center rounded-full transition-colors',
				voice.isListening
					? 'bg-brand text-white shadow-glow'
					: 'bg-bg-elevated text-text-secondary hover:bg-bg-card hover:text-text',
				className,
			)}
			title={voice.isListening ? 'Stop listening' : 'Voice commands'}
			aria-label={
				voice.isListening ? 'Stop voice commands' : 'Start voice commands'
			}
		>
			{/* Pulsing ring when active */}
			<AnimatePresence>
				{voice.isListening && (
					<motion.span
						initial={{ scale: 1, opacity: 0.6 }}
						animate={{ scale: 1.6, opacity: 0 }}
						transition={{ duration: 1.2, repeat: Infinity }}
						className='pointer-events-none absolute inset-0 rounded-full bg-brand'
					/>
				)}
			</AnimatePresence>

			{voice.isListening ? (
				<Mic className='relative z-10 size-5' />
			) : (
				<MicOff className='size-5' />
			)}
		</motion.button>
	)
}
