'use client'

import React, { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
	Headphones,
	RefreshCw,
	ShieldAlert,
	ShieldCheck,
	Wifi,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { useWebRTC } from '@/hooks/useWebRTC'
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
						1:1 co-cook
					</p>
					<h2 className='text-xl font-bold tracking-tight text-brand'>
						{t('videoCallTitle')}
					</h2>
				</div>
				<div className='flex flex-wrap items-center justify-end gap-2 text-xs'>
					<span className='rounded border border-border-medium px-2 py-1 text-text-secondary'>
						Media: {webRTC.mediaState}
					</span>
					<span className='rounded border border-border-medium px-2 py-1 text-text-secondary'>
						Peer: {webRTC.connectionState}
					</span>
					<span className='rounded border border-border-medium px-2 py-1 text-text-secondary'>
						ICE: {webRTC.iceConnectionState}
					</span>
					<span
						className={`flex items-center gap-1 rounded border px-2 py-1 ${
							webRTC.relayCandidateAvailable
								? 'border-success/40 text-success'
								: 'border-warning/40 text-warning'
						}`}
					>
						{webRTC.relayCandidateAvailable ? (
							<ShieldCheck className='size-3.5' />
						) : (
							<ShieldAlert className='size-3.5' />
						)}
						{webRTC.relayCandidateAvailable ? 'TURN relay' : 'Relay pending'}
					</span>
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
					One bounded ICE restart runs automatically. Recovery remains under
					presenter control.
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
						Audio only
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
						Reconnect
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
