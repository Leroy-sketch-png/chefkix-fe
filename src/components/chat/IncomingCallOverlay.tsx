import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Portal } from '@/components/ui/portal'
import { BUTTON_HOVER, BUTTON_TAP } from '@/lib/motion'
import { useTranslations } from 'next-intl'
// Giả định bạn có import các Icon từ lucide-react hoặc tương tự
import { Phone, Video, PhoneOff } from 'lucide-react'

interface Props {
	isReceivingCall: boolean
	isCallActive: boolean
	onAccept: (withVideo: boolean) => void // Thêm tham số
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
							<div className='size-16 bg-brand rounded-full flex items-center justify-center shadow-lg shadow-brand/50'>
								<Phone className='text-white w-8 h-8 animate-bounce' />
							</div>
						</div>

						<h2 className='text-white text-3xl font-bold mb-2 tracking-wide'>
							{t('incomingCall')}
						</h2>
						<p className='text-text-muted mb-10 text-lg'>
							Ai đó đang gọi cho bạn...
						</p>

						<div className='flex gap-4 sm:gap-6'>
							{/* Nút Từ chối */}
							<motion.button
								whileHover={BUTTON_HOVER}
								whileTap={BUTTON_TAP}
								onClick={onReject}
								className='px-6 py-4 bg-error/90 hover:bg-error text-white rounded-full font-medium shadow-warm flex items-center gap-2 transition-colors'
							>
								<PhoneOff className='w-5 h-5' />
								Từ chối
							</motion.button>

							{/* Nút Bắt máy: Chỉ Âm Thanh */}
							<motion.button
								whileHover={BUTTON_HOVER}
								whileTap={BUTTON_TAP}
								onClick={() => onAccept(false)}
								className='px-6 py-4 bg-bg-elevated hover:bg-brand/20 text-white border border-brand/50 rounded-full font-medium flex items-center gap-2 transition-colors'
							>
								<Phone className='w-5 h-5 text-brand' />
								Answer Audio
							</motion.button>

							{/* Nút Bắt máy: Video */}
							<motion.button
								whileHover={BUTTON_HOVER}
								whileTap={BUTTON_TAP}
								onClick={() => onAccept(true)}
								className='px-6 py-4 bg-success/90 hover:bg-success text-white rounded-full font-medium shadow-warm flex items-center gap-2 transition-colors'
							>
								<Video className='w-5 h-5' />
								Answer Video
							</motion.button>
						</div>
					</motion.div>
				</Portal>
			)}
		</AnimatePresence>
	)
}
