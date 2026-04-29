'use client'

import React, { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { useWebRTC } from '@/hooks/useWebRTC'
import IncomingCallOverlay from './IncomingCallOverlay'
import MediaStage from './MediaStage'
import CallControls from './CallControls'

interface VideoCallProps {
	conversationId: string
	currentUserId: string
	onClose: () => void
}

export default function VideoCall({
	conversationId,
	currentUserId,
	onClose,
}: VideoCallProps) {
	const t = useTranslations('messages')
	const webRTC = useWebRTC({ conversationId, currentUserId, onClose })

	useEffect(() => {
		webRTC.startMedia(true)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	useEscapeKey(
		webRTC.isReceivingCall && !webRTC.isCallActive,
		webRTC.rejectCall,
	)

	return (
		<div className='flex flex-col items-center justify-center p-6 bg-bg space-y-4 rounded-[32px] w-full max-w-4xl mx-auto relative'>
			<IncomingCallOverlay
				isReceivingCall={webRTC.isReceivingCall}
				isCallActive={webRTC.isCallActive}
				onAccept={webRTC.acceptCall}
				onReject={webRTC.rejectCall}
			/>

			{/* Header Title (Đã bỏ dấu X thừa) */}
			<h2 className='text-xl font-bold text-brand w-full text-center tracking-tight'>
				{t('videoCallTitle')}
			</h2>

			<MediaStage
				localVideoRef={webRTC.localVideoRef}
				remoteVideoRef={webRTC.remoteVideoRef}
				isCallActive={webRTC.isCallActive}
				isCalling={webRTC.isCalling}
			/>

			<CallControls
				isCameraOn={webRTC.isCameraOn}
				isMicOn={webRTC.isMicOn}
				isCallActive={webRTC.isCallActive}
				isCalling={webRTC.isCalling}
				onToggleVideo={webRTC.toggleVideo}
				onToggleAudio={webRTC.toggleAudio}
				onMakeCall={webRTC.makeCall}
				onEndCall={webRTC.endCall}
			/>
		</div>
	)
}
