import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Portal } from '@/components/ui/portal'
import { BUTTON_HOVER, BUTTON_TAP } from '@/lib/motion'
import { useTranslations } from 'next-intl'
import { Phone, Video, PhoneOff } from 'lucide-react'

interface Props {
	isReceivingCall: boolean
	isCallActive: boolean
	onAccept: (withVideo: boolean) => void
	onReject: () => void
}

export default function IncomingCallOverlay({
	isReceivingCall,
	isCallActive,
	onAccept,
	onReject,
}: Props) {
	const t = useTranslations('messages')

	return (
		<AnimatePresence>
			{isReceivingCall && !isCallActive && (
				<Portal>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed inset-0 z-modal flex flex-col items-center justify-center bg-black/85 backdrop-blur-md'
					>
						<div className='size-24 bg-brand/20 rounded-full flex items-center justify-center animate-pulse mb-6'>
							<div className='size-16 bg-brand rounded-full flex items-center justify-center shadow-warm shadow-brand/50'>
								<Phone className='text-white w-8 h-8 animate-bounce' />
							</div>
						</div>

						<h2 className='mb-2 text-2xl font-bold text-white'>
							{t('incomingCall')}
						</h2>
						<p className='mb-8 text-base text-text-muted'>
							{t('incomingCallDetail')}
						</p>

						<div className='flex gap-4 sm:gap-6'>
							<motion.button
								whileHover={BUTTON_HOVER}
								whileTap={BUTTON_TAP}
								onClick={onReject}
								className='flex items-center gap-2 rounded-full bg-error/90 px-5 py-3 font-medium text-white shadow-warm transition-colors hover:bg-error'
							>
								<PhoneOff className='w-5 h-5' />
								{t('declineCall')}
							</motion.button>

							<motion.button
								whileHover={BUTTON_HOVER}
								whileTap={BUTTON_TAP}
								onClick={() => onAccept(false)}
								className='flex items-center gap-2 rounded-full border border-brand/50 bg-bg-elevated px-5 py-3 font-medium text-white transition-colors hover:bg-brand/20'
							>
								<Phone className='w-5 h-5 text-brand' />
								{t('answerAudio')}
							</motion.button>

							<motion.button
								whileHover={BUTTON_HOVER}
								whileTap={BUTTON_TAP}
								onClick={() => onAccept(true)}
								className='flex items-center gap-2 rounded-full bg-success/90 px-5 py-3 font-medium text-white shadow-warm transition-colors hover:bg-success'
							>
								<Video className='w-5 h-5' />
								{t('answerVideo')}
							</motion.button>
						</div>
					</motion.div>
				</Portal>
			)}
		</AnimatePresence>
	)
}
