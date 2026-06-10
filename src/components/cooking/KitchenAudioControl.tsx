'use client'

import { Volume2, VolumeX } from 'lucide-react'
import { motion } from 'framer-motion'
import { ICON_BUTTON_TAP } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useKitchenAudio } from '@/lib/voice'

export function KitchenAudioControl({ className }: { className?: string }) {
	const audio = useKitchenAudio()
	const enabled = audio.preferences.spokenGuidanceEnabled

	return (
		<motion.button
			type='button'
			onClick={() => audio.chooseSpokenGuidance(!enabled)}
			whileTap={ICON_BUTTON_TAP}
			className={cn(
				'grid size-10 place-items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-brand/50',
				enabled
					? 'bg-brand text-white shadow-glow'
					: 'bg-bg-elevated text-text-secondary hover:bg-bg-card hover:text-text-primary',
				className,
			)}
			title={enabled ? 'Mute spoken guidance' : 'Resume spoken guidance'}
			aria-label={enabled ? 'Mute spoken guidance' : 'Resume spoken guidance'}
			aria-pressed={enabled}
		>
			{enabled ? (
				<Volume2 className='size-5' />
			) : (
				<VolumeX className='size-5' />
			)}
		</motion.button>
	)
}
