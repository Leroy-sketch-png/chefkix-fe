import React from 'react'
import { motion } from 'framer-motion'
import { Mic, MicOff, Video, VideoOff, Phone, PhoneOff } from 'lucide-react'
import { BUTTON_HOVER, BUTTON_TAP } from '@/lib/motion'

interface Props {
	isCameraOn: boolean
	isMicOn: boolean
	isCallActive: boolean
	isCalling: boolean
	onToggleVideo: () => void
	onToggleAudio: () => void
	onMakeCall: () => void
	onEndCall: () => void
}

// Sub-component giúp code DRY (Don't Repeat Yourself)
const CircleBtn = ({
	active,
	onClick,
	icon,
	isDanger = false,
}: {
	active?: boolean
	onClick: () => void
	icon: React.ReactNode
	isDanger?: boolean
}) => {
	const baseStyle =
		'size-14 rounded-full flex items-center justify-center transition-all duration-200 focus-visible:ring-2 focus-visible:ring-brand/50 outline-none shadow-sm'
	const colorStyle = isDanger
		? 'bg-error text-white hover:bg-error-dark shadow-error/30'
		: active
			? 'bg-brand/10 text-brand hover:bg-brand/20'
			: 'bg-bg-elevated text-text-muted border border-border-subtle hover:bg-border-subtle'

	return (
		<motion.button
			whileHover={BUTTON_HOVER}
			whileTap={BUTTON_TAP}
			onClick={onClick}
			className={`${baseStyle} ${colorStyle}`}
		>
			{icon}
		</motion.button>
	)
}

export default function CallControls({
	isCameraOn,
	isMicOn,
	isCallActive,
	isCalling,
	onToggleVideo,
	onToggleAudio,
	onMakeCall,
	onEndCall,
}: Props) {
	return (
		<div className='flex gap-5 items-center justify-center pt-4 w-full'>
			<CircleBtn
				active={isMicOn}
				onClick={onToggleAudio}
				icon={
					isMicOn ? (
						<Mic size={22} strokeWidth={1.8} />
					) : (
						<MicOff size={22} strokeWidth={1.8} />
					)
				}
			/>
			<CircleBtn
				active={isCameraOn}
				onClick={onToggleVideo}
				icon={
					isCameraOn ? (
						<Video size={22} strokeWidth={1.8} />
					) : (
						<VideoOff size={22} strokeWidth={1.8} />
					)
				}
			/>

			<div className='w-px h-8 bg-border-subtle mx-1' />

			{!isCallActive && !isCalling ? (
				<motion.button
					whileHover={BUTTON_HOVER}
					whileTap={BUTTON_TAP}
					onClick={onMakeCall}
					className='h-14 px-8 bg-brand text-white rounded-full font-medium flex items-center gap-2 shadow-warm hover:opacity-90'
				>
					<Phone size={22} strokeWidth={1.8} />
					<span>Bắt đầu gọi</span>
				</motion.button>
			) : (
				<CircleBtn
					isDanger
					onClick={onEndCall}
					icon={<PhoneOff size={24} strokeWidth={1.8} />}
				/>
			)}
		</div>
	)
}
