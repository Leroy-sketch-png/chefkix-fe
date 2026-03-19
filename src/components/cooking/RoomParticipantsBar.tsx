'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Users, Crown, ChefHat } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING } from '@/lib/motion'
import type { RoomParticipant } from '@/lib/types/room'

interface RoomParticipantsBarProps {
	participants: RoomParticipant[]
	roomCode: string
	currentUserId?: string
	totalSteps?: number
	/** Compact mode for docked panel */
	compact?: boolean
	className?: string
}

/**
 * Displays co-cooking room participants with their progress.
 * Shows as an avatar row under the cooking header.
 */
export function RoomParticipantsBar({
	participants,
	roomCode,
	currentUserId,
	totalSteps = 1,
	compact = false,
	className,
}: RoomParticipantsBarProps) {
	if (!participants.length) return null

	return (
		<motion.div
			initial={{ opacity: 0, y: -8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={TRANSITION_SPRING}
			className={cn(
				'flex items-center gap-3',
				compact ? 'mt-2' : 'mt-3',
				className,
			)}
		>
			{/* Room indicator */}
			<div className='flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1'>
				<Users className='size-3.5 text-white/80' />
				<span className='font-mono text-xs font-semibold tracking-wider text-white/90'>
					{roomCode}
				</span>
			</div>

			{/* Participant avatars */}
			<div className='flex -space-x-2'>
				<AnimatePresence>
					{participants.map(participant => (
						<ParticipantAvatar
							key={participant.userId}
							participant={participant}
							isSelf={participant.userId === currentUserId}
							totalSteps={totalSteps}
							compact={compact}
						/>
					))}
				</AnimatePresence>
			</div>

			{/* Participant count */}
			<span className='text-xs text-white/70'>{participants.length}/6</span>
		</motion.div>
	)
}

// ============================================
// PARTICIPANT AVATAR
// ============================================

function ParticipantAvatar({
	participant,
	isSelf,
	totalSteps,
	compact,
}: {
	participant: RoomParticipant
	isSelf: boolean
	totalSteps: number
	compact: boolean
}) {
	const progress =
		totalSteps > 0 ? (participant.currentStep / totalSteps) * 100 : 0
	const size = compact ? 'size-7' : 'size-8'

	return (
		<motion.div
			initial={{ scale: 0, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			exit={{ scale: 0, opacity: 0 }}
			transition={TRANSITION_SPRING}
			className='relative'
			title={`${participant.displayName} — Step ${participant.currentStep}/${totalSteps}`}
		>
			{/* Progress ring */}
			<svg
				className={cn(
					'absolute -inset-0.5',
					size === 'size-7' ? 'size-8' : 'size-9',
				)}
				viewBox='0 0 36 36'
			>
				<circle
					cx='18'
					cy='18'
					r='16'
					fill='none'
					stroke='rgba(255,255,255,0.2)'
					strokeWidth='2'
				/>
				<circle
					cx='18'
					cy='18'
					r='16'
					fill='none'
					stroke={isSelf ? '#ff5a36' : '#fff'}
					strokeWidth='2'
					strokeDasharray={`${progress} ${100 - progress}`}
					strokeDashoffset='25'
					strokeLinecap='round'
					className='transition-all duration-500'
				/>
			</svg>

			{/* Avatar */}
			{participant.avatarUrl ? (
				<Image
					src={participant.avatarUrl}
					alt={participant.displayName}
					width={compact ? 28 : 36}
					height={compact ? 28 : 36}
					unoptimized
					className={cn(
						size,
						'rounded-full border-2 object-cover',
						isSelf ? 'border-brand' : 'border-white/40',
					)}
				/>
			) : (
				<div
					className={cn(
						size,
						'flex items-center justify-center rounded-full border-2 bg-white/20',
						isSelf ? 'border-brand' : 'border-white/40',
					)}
				>
					<ChefHat className='size-3.5 text-white' />
				</div>
			)}

			{/* Host crown */}
			{participant.isHost && (
				<Crown className='absolute -right-1 -top-1 size-3 text-yellow-400' />
			)}

			{/* Step indicator */}
			<div className='absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-bg-card/90 px-1 text-[10px] font-bold text-text'>
				{participant.currentStep}
			</div>
		</motion.div>
	)
}
