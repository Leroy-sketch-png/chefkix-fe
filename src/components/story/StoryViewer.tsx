'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	X,
	ChevronLeft,
	ChevronRight,
	Pause,
	Play,
	Volume2,
	VolumeX,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getStoriesByUserId } from '@/services/story'
import { StoryResponse, Story, StoryItemDto } from '@/lib/types/story'
import { Rnd } from 'react-rnd'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/hooks/useAuth'
import { formatDistanceToNow } from 'date-fns'

interface StoryViewerProps {
	userId: string
	onClose: () => void
	onNextUser?: () => void
	onPrevUser?: () => void
}

const STORY_DURATION = 7000 // 7 seconds per story

const StoryItemContent = ({ item }: { item: StoryItemDto }) => {
	const baseStyle: React.CSSProperties = {
		position: 'absolute',
		color: item.color || '#FFFFFF',
		fontFamily: item.fontFamily || 'sans-serif',
		fontWeight: item.fontWeight || 'normal',
		textAlign: item.textAlign as any,
	}

	return (
		<Rnd
			style={baseStyle}
			size={{ width: item.width, height: item.height }}
			position={{ x: item.x, y: item.y }}
			rotation={item.rotation}
			disableDragging
			disableResizing
			className='flex items-center justify-center p-2 pointer-events-none'
		>
			{item.type === 'TEXT' && <span>{item.content}</span>}
			{item.type === 'EMOJI' && (
				<span style={{ fontSize: '4rem' }}>{item.content}</span>
			)}
		</Rnd>
	)
}

export function StoryViewer({
	userId,
	onClose,
	onNextUser,
	onPrevUser,
}: StoryViewerProps) {
	const [storyData, setStoryData] = useState<StoryResponse | null>(null)
	const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
	const [isLoading, setIsLoading] = useState(true)
	const [isPaused, setIsPaused] = useState(false)
	const [isMuted, setIsMuted] = useState(true)
	const timerRef = useRef<NodeJS.Timeout | null>(null)
	const { user: currentUser } = useAuth()

	const stories = storyData?.stories || []
	const currentStory = stories[currentStoryIndex]

	const goToNextStory = useCallback(() => {
		setCurrentStoryIndex(prev => {
			if (prev < stories.length - 1) {
				return prev + 1
			}
			onNextUser ? onNextUser() : onClose()
			return prev
		})
	}, [stories.length, onClose, onNextUser])

	const goToPreviousStory = () => {
		setCurrentStoryIndex(prev => {
			if (prev > 0) {
				return prev - 1
			}
			onPrevUser ? onPrevUser() : onClose()
			return prev
		})
	}

	useEffect(() => {
		if (!userId) return
		setIsLoading(true)
		setStoryData(null)
		setCurrentStoryIndex(0)

		getStoriesByUserId(userId)
			.then(response => {
				// Defensive check to ensure response.data is an array
				if (Array.isArray(response.data)) {
					setStoryData(response.data)
				} else {
					// If data is not an array, treat as no stories and close.
					console.warn(
						'Expected an array of stories, but received:',
						response.data,
					)
					onClose()
				}
			})
			.catch(() => onClose())
			.finally(() => setIsLoading(false))
	}, [userId, onClose])

	useEffect(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current)
		}
		if (stories.length > 0 && !isPaused && !isLoading) {
			timerRef.current = setTimeout(goToNextStory, STORY_DURATION)
		}
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current)
		}
	}, [currentStoryIndex, stories, isPaused, isLoading, goToNextStory])

	const handleInteractionStart = () => setIsPaused(true)
	const handleInteractionEnd = () => setIsPaused(false)

	const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
		const { clientX, currentTarget } = e
		const { left, width } = currentTarget.getBoundingClientRect()
		const tapPosition = (clientX - left) / width
		if (tapPosition > 0.3) {
			goToNextStory()
		} else {
			goToPreviousStory()
		}
	}

	if (isLoading || !storyData || !currentStory) {
		return (
			<div className='fixed inset-0 bg-black/90 z-[100] flex items-center justify-center'>
				<div className='animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white'></div>
			</div>
		)
	}

	const { user } = storyData

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.95 }}
				className='fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-0 md:p-4'
				onMouseDown={handleInteractionStart}
				onMouseUp={handleInteractionEnd}
				onTouchStart={handleInteractionStart}
				onTouchEnd={handleInteractionEnd}
			>
				{/* Main Viewer */}
				<div className='relative w-full h-full md:max-w-[420px] md:h-auto md:aspect-[9/16] bg-neutral-900 md:rounded-xl shadow-2xl overflow-hidden'>
					{/* Background Image */}
					{currentStory.backgroundImageUrl && (
						<img
							src={currentStory.backgroundImageUrl}
							alt='Story background'
							className='absolute inset-0 w-full h-full object-cover'
						/>
					)}
					{/* Gradient Overlay */}
					<div className='absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/40' />

					{/* Click handlers */}
					<div className='absolute inset-0 flex' onClick={handleTap}>
						<div className='w-[30%] h-full' />
						<div className='w-[70%] h-full' />
					</div>

					{/* Header */}
					<div className='absolute top-0 left-0 right-0 p-4 z-10'>
						{/* Progress Bars */}
						<div className='flex gap-1 mb-3'>
							{stories.map((_, index) => (
								<div
									key={index}
									className='flex-1 bg-white/30 rounded-full h-1'
								>
									<motion.div
										className='bg-white h-1 rounded-full'
										initial={{ width: '0%' }}
										animate={{
											width:
												index < currentStoryIndex
													? '100%'
													: index === currentStoryIndex
														? '100%'
														: '0%',
										}}
										transition={
											index === currentStoryIndex && !isPaused
												? { duration: STORY_DURATION / 1000, ease: 'linear' }
												: { duration: 0 }
										}
									/>
								</div>
							))}
						</div>
						{/* User Info & Controls */}
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-3'>
								<Avatar className='h-10 w-10 border-2 border-white'>
									<AvatarImage src={user.avatarUrl} />
									<AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
								</Avatar>
								<div>
									<p className='font-bold text-white text-sm'>
										{user.username}
									</p>
									<p className='text-xs text-neutral-300'>
										{formatDistanceToNow(new Date(currentStory.createdAt))} ago
									</p>
								</div>
							</div>
							<div className='flex items-center gap-2'>
								<button
									onClick={() => setIsPaused(!isPaused)}
									className='text-white/80 hover:text-white'
								>
									{isPaused ? <Play size={20} /> : <Pause size={20} />}
								</button>
								<button
									onClick={() => setIsMuted(!isMuted)}
									className='text-white/80 hover:text-white'
								>
									{isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
								</button>
								<button
									onClick={onClose}
									className='text-white/80 hover:text-white'
								>
									<X size={24} />
								</button>
							</div>
						</div>
					</div>

					{/* Story Items */}
					<div className='absolute inset-0'>
						{currentStory.items.map(item => (
							<StoryItemContent key={item.id} item={item} />
						))}
					</div>

					{/* Footer (Input for own story) */}
					{currentUser?.id === userId && (
						<div className='absolute bottom-0 left-0 right-0 p-4 z-10'>
							{/* Placeholder for reply input */}
						</div>
					)}
				</div>

				{/* Desktop Navigation */}
				<button
					onClick={goToPreviousStory}
					className='absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-black/30 rounded-full p-2 hidden md:block'
				>
					<ChevronLeft size={32} />
				</button>
				<button
					onClick={goToNextStory}
					className='absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-black/30 rounded-full p-2 hidden md:block'
				>
					<ChevronRight size={32} />
				</button>
			</motion.div>
		</AnimatePresence>
	)
}
