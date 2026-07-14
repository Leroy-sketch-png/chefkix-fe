import React from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from 'lucide-react'
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

const CircleBtn = ({
	active,
	onClick,
	icon,
	label,
	isDanger = false,
}: {
	active?: boolean
	onClick: () => void
	icon: React.ReactNode
	label: string
	isDanger?: boolean
}) => {
	const baseStyle =
		'size-14 rounded-full flex items-center justify-center transition-all duration-200 focus-visible:ring-2 focus-visible:ring-brand/50 outline-none shadow-card'
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
			aria-label={label}
			title={label}
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
	const t = useTranslations('messages')

	return (
		<div className='flex w-full items-center justify-center gap-5 pt-4'>
			<CircleBtn
				active={isMicOn}
				onClick={onToggleAudio}
				label={isMicOn ? t('muteMic') : t('unmuteMic')}
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
				label={isCameraOn ? t('turnOffCamera') : t('turnOnCamera')}
				icon={
					isCameraOn ? (
						<Video size={22} strokeWidth={1.8} />
					) : (
						<VideoOff size={22} strokeWidth={1.8} />
					)
				}
			/>

			<div className='mx-1 h-8 w-px bg-border-subtle' />

			{!isCallActive && !isCalling ? (
				<motion.button
					whileHover={BUTTON_HOVER}
					whileTap={BUTTON_TAP}
					onClick={onMakeCall}
					className='flex h-14 items-center gap-2 rounded-full bg-brand px-8 font-medium text-white shadow-warm hover:opacity-90'
					aria-label={t('callOtherPerson')}
				>
					<Phone size={22} strokeWidth={1.8} />
					<span>{t('callOtherPerson')}</span>
				</motion.button>
			) : (
				<CircleBtn
					isDanger
					onClick={onEndCall}
					label={t('ariaEndVideoCall')}
					icon={<PhoneOff size={24} strokeWidth={1.8} />}
				/>
			)}
		</div>
	)
}
