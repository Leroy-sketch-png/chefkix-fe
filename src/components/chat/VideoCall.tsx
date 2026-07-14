'use client'

import React, { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Headphones, RefreshCw, Wifi } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { useWebRTC } from '@/hooks/useWebRTC'
import { getVideoCallStatus } from '@/lib/video-call-status'
import CallControls from './CallControls'
import IncomingCallOverlay from './IncomingCallOverlay'
import MediaStage from './MediaStage'

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
	const callStatus = getVideoCallStatus({
		mediaState: webRTC.mediaState,
		isJoined: webRTC.isJoined,
		isCalling: webRTC.isCalling,
		isCallActive: webRTC.isCallActive,
		connectionState: webRTC.connectionState,
		iceConnectionState: webRTC.iceConnectionState,
		relayCandidateAvailable: webRTC.relayCandidateAvailable,
	})
	const statusToneClass = {
		success: 'border-success/40 bg-success/10 text-success',
		warning: 'border-warning/40 bg-warning/10 text-warning',
		muted: 'border-border-medium bg-bg-elevated text-text-secondary',
	}[callStatus.tone]

	useEffect(() => {
		void webRTC.startMedia(true)
		// Media preflight is intentionally run once when the call surface opens.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	useEscapeKey(
		webRTC.isReceivingCall && !webRTC.isCallActive,
		webRTC.rejectCall,
	)

	return (
		<div className='relative mx-auto flex w-full max-w-4xl flex-col items-center justify-center space-y-4 rounded-lg bg-bg p-6'>
			<IncomingCallOverlay
				isReceivingCall={webRTC.isReceivingCall}
				isCallActive={webRTC.isCallActive}
				onAccept={webRTC.acceptCall}
				onReject={webRTC.rejectCall}
			/>

			<div className='flex w-full flex-wrap items-center justify-between gap-3'>
				<div>
					<p className='text-xs font-semibold uppercase text-text-muted'>
						{t('videoCallEyebrow')}
					</p>
					<h2 className='text-xl font-bold tracking-tight text-brand'>
						{t('videoCallTitle')}
					</h2>
				</div>
				<div className='flex max-w-sm flex-col items-end gap-1 text-right'>
					<span
						className={`rounded border px-2.5 py-1 text-xs font-medium ${statusToneClass}`}
					>
						{t(callStatus.labelKey)}
					</span>
					<p className='text-xs text-text-muted'>
						{t(callStatus.detailKey)}
					</p>
				</div>
			</div>

			<MediaStage
				localVideoRef={webRTC.localVideoRef}
				remoteVideoRef={webRTC.remoteVideoRef}
				isCallActive={webRTC.isCallActive}
				isCalling={webRTC.isCalling}
			/>

			<div className='flex w-full flex-wrap items-center justify-between gap-3 border-y border-border-subtle py-3'>
				<p className='flex items-center gap-2 text-sm text-text-muted'>
					<Wifi className='size-4' />
					{t('videoCallGuidance')}
				</p>
				<div className='flex flex-wrap gap-2'>
					<Button
						variant='outline'
						size='sm'
						onClick={() => void webRTC.useAudioOnly()}
						disabled={
							webRTC.mediaState === 'requesting' ||
							webRTC.mediaState === 'audio-only'
						}
					>
						<Headphones />
						{t('audioOnly')}
					</Button>
					<Button
						variant='outline'
						size='sm'
						onClick={() => void webRTC.reconnect()}
						disabled={
							!webRTC.isJoined || webRTC.mediaState === 'requesting'
						}
					>
						<RefreshCw />
						{t('reconnectCall')}
					</Button>
				</div>
			</div>

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
