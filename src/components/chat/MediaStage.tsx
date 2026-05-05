import React, { RefObject } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'

interface Props {
	localVideoRef: RefObject<HTMLVideoElement>
	remoteVideoRef: RefObject<HTMLVideoElement>
	isCallActive: boolean
	isCalling: boolean
}

export default function MediaStage({
	localVideoRef,
	remoteVideoRef,
	isCallActive,
	isCalling,
}: Props) {
	const t = useTranslations('messages')

	return (
		<div className='relative w-full aspect-video bg-bg-elevated rounded-3xl overflow-hidden shadow-inner flex items-center justify-center border border-border-subtle'>
			<video
				ref={isCallActive ? remoteVideoRef : localVideoRef}
				autoPlay
				playsInline
				muted={!isCallActive}
				className={`w-full h-full object-cover ${!isCallActive ? 'transform -scale-x-100' : ''}`}
			/>

			<AnimatePresence>
				{isCalling && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='absolute inset-0 bg-white/60 flex flex-col items-center justify-center backdrop-blur-xl z-10'
					>
						<div className='flex gap-2 mb-4'>
							{[0, 150, 300].map(delay => (
								<span
									key={delay}
									className='size-2.5 bg-brand rounded-full animate-bounce'
									style={{ animationDelay: `${delay}ms` }}
								/>
							))}
						</div>
						<p className='text-text-muted text-base font-medium'>
							{t('waitingForConnection') || 'Đang gọi...'}
						</p>
					</motion.div>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{isCallActive && (
					<motion.div
						initial={{ opacity: 0, scale: 0.9, y: 10 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						className='absolute bottom-4 right-4 w-[28%] max-w-[180px] aspect-video bg-bg-elevated rounded-2xl overflow-hidden border-2 border-brand shadow-warm z-20'
					>
						<video
							ref={localVideoRef}
							autoPlay
							playsInline
							muted
							className='w-full h-full object-cover transform -scale-x-100'
						/>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}
