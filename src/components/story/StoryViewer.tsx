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
import { StoryResponse, StoryItemDto } from '@/lib/types/story'
import { Rnd } from 'react-rnd'
import { useAuth } from '@/hooks/useAuth'
import { formatDistanceToNow } from 'date-fns'

interface StoryViewerProps {
	userId: string
	authorName?: string
	authorAvatar?: string
	onClose: () => void
	onNextUser?: () => void
	onPrevUser?: () => void
}

const STORY_DURATION = 7000 // 7 seconds per story

const StoryItemContent = ({ item }: { item: StoryItemDto }) => {
	const itemData = item.data || {}

	return (
		<Rnd
			size={{
				width: itemData.width || 'auto',
				height: itemData.height || 'auto',
			}}
			position={{ x: item.x, y: item.y }}
			rotation={item.rotation}
			disableDragging
			disableResizing
			className='flex items-center justify-center pointer-events-none'
		>
			<div
				style={{
					transform: `scale(${item.scale || 1})`,
					color: itemData.color || '#ffffff',
					textAlign: itemData.textAlign || 'center',
				}}
			>
				{/* 🌟 ĐÃ FIX: Đọc đúng key 'text' và 'emoji' từ DB */}
				{item.type === 'TEXT' && (
					<span className='font-bold drop-shadow-lg'>{itemData.text}</span>
				)}

				{(item.type === 'STICKER' || item.type === 'EMOJI') && (
					<span style={{ fontSize: '4rem' }}>{itemData.emoji}</span>
				)}

				{/* Nếu sau này bạn có up sticker là ảnh nhỏ */}
				{item.type === 'IMAGE_STICKER' && (
					<img
						src={itemData.imageUrl}
						className='w-full h-full object-contain'
					/>
				)}
			</div>
		</Rnd>
	)
}

export function StoryViewer({
	userId,
	authorName,
	authorAvatar,
	onClose,
	onNextUser,
	onPrevUser,
}: StoryViewerProps) {
	const [stories, setStories] = useState<StoryResponse[]>([])
	const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
	const [isLoading, setIsLoading] = useState(true)
	const [isPaused, setIsPaused] = useState(false)
	const [isMuted, setIsMuted] = useState(true)
	const timerRef = useRef<NodeJS.Timeout | null>(null)
	const { user: currentUser } = useAuth()

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
		setStories([])
		setCurrentStoryIndex(0)

		getStoriesByUserId(userId)
			.then((res: any) => {
				// 🌟 THUẬT TOÁN SĂN TÌM MẢNG (Giống hệt bên Dashboard)
				let storyArray = null

				if (Array.isArray(res)) {
					storyArray = res // Đã bóc hết vỏ
				} else if (res?.data && Array.isArray(res.data)) {
					storyArray = res.data // Vỏ của ApiResponse (Spring Boot)
				} else if (res?.data?.data && Array.isArray(res.data.data)) {
					storyArray = res.data.data // Bị bọc 2 lớp bởi Axios
				}

				// Kiểm tra xem mảng có story nào không
				if (storyArray && storyArray.length > 0) {
					setStories(storyArray) // Cập nhật state thành công!
				} else {
					console.warn(
						'⚠️ API gọi thành công nhưng không có Story hoặc sai cấu trúc:',
						res,
					)
					// Chỉ khi nào thật sự KHÔNG CÓ STORY mới đẩy người dùng quay về
					onClose()
				}
			})
			.catch(err => {
				console.error('❌ Lỗi fetch chi tiết story:', err)
				onClose()
			})
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

	if (isLoading || stories.length === 0 || !currentStory) {
		return (
			<div className='fixed inset-0 bg-black/90 z-[100] flex items-center justify-center'>
				<div className='animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand'></div>
			</div>
		)
	}

	const isMe = currentUser?.userId === userId
	const displayAuthorName = isMe
		? currentUser.displayName || currentUser.username
		: authorName || 'Story Author'
	const displayAuthorAvatar = isMe ? currentUser.avatarUrl : authorAvatar

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
				<div className='relative w-full h-full md:max-w-[420px] md:h-auto md:aspect-[9/16] bg-neutral-900 md:rounded-xl shadow-2xl overflow-hidden'>
					{currentStory.mediaUrl && (
						<img
							src={currentStory.mediaUrl}
							alt='Story media'
							className='absolute inset-0 w-full h-full object-cover'
						/>
					)}

					<div className='absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/40' />

					<div className='absolute inset-0 flex' onClick={handleTap}>
						<div className='w-[30%] h-full' />
						<div className='w-[70%] h-full' />
					</div>

					<div className='absolute top-0 left-0 right-0 p-4 z-10'>
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

						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-3'>
								<Avatar className='h-10 w-10 border-2 border-white'>
									<AvatarImage src={displayAuthorAvatar} />
									<AvatarFallback>{displayAuthorName.charAt(0)}</AvatarFallback>
								</Avatar>
								<div>
									<p className='font-bold text-white text-sm drop-shadow-md'>
										{displayAuthorName}
									</p>
									<p className='text-xs text-neutral-200 drop-shadow-md'>
										{currentStory.createdAt
											? formatDistanceToNow(new Date(currentStory.createdAt)) +
												' ago'
											: 'Just now'}
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

					<div className='absolute inset-0'>
						{/* 🌟 ĐÃ SỬA: Sửa key={item.} thành key={index} để không còn lỗi syntax */}
						{(currentStory.items || []).map((item, index) => (
							<StoryItemContent key={index} item={item} />
						))}
					</div>

					{isMe && (
						<div className='absolute bottom-0 left-0 right-0 p-4 z-10'>
							{/* Placeholder for own story controls / views count */}
						</div>
					)}
				</div>

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
