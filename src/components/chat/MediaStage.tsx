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
			{/* Remote video — always mounted so ontrack can always set srcObject.
			    Hidden (opacity-0, pointer-events-none) until the call is active. */}
			<video
				ref={remoteVideoRef}
				autoPlay
				playsInline
				className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
					isCallActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
				}`}
			/>

			{/* Local video preview — full-stage before call, PIP during call */}
			<video
				ref={localVideoRef}
				autoPlay
				playsInline
				muted
				className={`object-cover transform -scale-x-100 transition-all duration-300 ${
					isCallActive
						? 'absolute bottom-4 right-4 w-[28%] max-w-44 aspect-video rounded-2xl border-2 border-brand shadow-warm z-20'
						: 'absolute inset-0 w-full h-full'
				}`}
			/>

			{/* Calling overlay — shown while waiting for answer */}
			<AnimatePresence>
				{isCalling && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-xl z-30'
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
						<p className='text-white text-base font-medium'>
							{t('waitingForConnection') || 'Calling...'}
						</p>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}
