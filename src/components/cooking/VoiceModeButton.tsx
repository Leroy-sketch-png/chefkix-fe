'use client'

import { useEffect } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ICON_BUTTON_TAP } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
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
	const t = useTranslations('cooking')
	// Surface voice events as toasts so the user gets feedback
	useEffect(() => {
		if (!voice.isSupported || !voice.lastEvent) return
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
	}, [voice.isSupported, voice.lastEvent])

	if (!voice.isSupported) return null

	const handleClick = () => {
		if (voice.isContinuous) {
			voice.stopContinuous()
		} else if (voice.isListening) {
			voice.toggleListening()
		} else {
			// Default to continuous in cooking context
			voice.startContinuous()
		}
	}

	return (
		<motion.button
			type='button'
			onClick={handleClick}
			whileTap={ICON_BUTTON_TAP}
			className={cn(
				'relative flex size-10 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-brand/50',
				voice.isListening
					? voice.isContinuous
						? 'bg-success text-white shadow-glow'
						: 'bg-brand text-white shadow-glow'
					: 'bg-bg-elevated text-text-secondary hover:bg-bg-card hover:text-text',
				className,
			)}
			title={
				voice.isContinuous
					? t('voiceContinuousActive')
					: voice.isListening
						? t('voiceStopListening')
						: t('voiceStartCommands')
			}
			aria-label={
				voice.isListening ? t('voiceStopCommands') : t('voiceStartCommands')
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
