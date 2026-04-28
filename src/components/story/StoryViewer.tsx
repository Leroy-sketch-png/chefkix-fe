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
import { sendStoryReaction, sendStoryReply } from '@/services/story'
import { StoryResponse, StoryItemDto } from '@/lib/types/story'
import { Rnd } from 'react-rnd'
import { useAuth } from '@/hooks/useAuth'
import { formatDistanceToNow } from 'date-fns'
import StoryInteractionBar from '@/components/story/StoryInteractionBar'
import { Heart, Smile, Zap, Frown, ThumbsDown } from 'lucide-react'
import FlyingReaction from './FlyingReaction' // Đảm bảo bạn đã import component này

// 1. Định nghĩa kiểu dữ liệu cho một sticker đang bay
export interface FlyingReactionState {
	id: number
	icon: React.ReactNode
	xOffset: number // Tọa độ trục X để icon bay lên đúng vị trí nút vừa bấm
}

// 2. Map các Reaction Type với Icon tương ứng (Thêm fill để icon có màu đặc bên trong)
const reactionIcons: Record<string, React.ReactNode> = {
	LOVE: <Heart className='text-pink-400' fill='currentColor' />,
	HAHA: <Smile className='text-yellow-300' fill='currentColor' />,
	WOW: <Zap className='text-indigo-300' fill='currentColor' />,
	SAD: <Frown className='text-blue-300' fill='currentColor' />,
	ANGRY: <ThumbsDown className='text-red-400' fill='currentColor' />,
}

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
		// Chỉ dùng thẻ div và truyền className + style.
		// XÓA HẾT disableResizing, disableDragging, position... đi
		<div
			className='absolute pointer-events-none flex items-center justify-center'
			style={{
				left: `${item.x}px`,
				top: `${item.y}px`,
				transform: `rotate(${item.rotation || 0}deg) scale(${item.scale || 1})`,
				transformOrigin: 'top left',
				color: itemData.color || '#ffffff',
				width: itemData.width || 'auto',
				height: itemData.height || 'auto',
			}}
		>
			{item.type === 'TEXT' && (
				<span className='font-bold drop-shadow-lg'>{itemData.text}</span>
			)}
			{(item.type === 'STICKER' || item.type === 'EMOJI') && (
				<span style={{ fontSize: '4rem' }}>{itemData.emoji}</span>
			)}
			{item.type === 'IMAGE_STICKER' && (
				<img
					src={itemData.imageUrl}
					alt='sticker'
					className='w-full h-full object-contain'
				/>
			)}
		</div>
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
	const [flyingReactions, setFlyingReactions] = useState<FlyingReactionState[]>(
		[],
	)
	const timerRef = useRef<NodeJS.Timeout | null>(null)
	const { user: currentUser } = useAuth()

	const currentStory = stories[currentStoryIndex]

	// --- COPY ĐOẠN NÀY THAY THẾ 2 HÀM CŨ ---
	const goToNextStory = useCallback(() => {
		// Kiểm tra điều kiện ở ngoài State Updater
		if (currentStoryIndex < stories.length - 1) {
			setCurrentStoryIndex(currentStoryIndex + 1)
		} else {
			// Nếu đã hết Story thì mới gọi đóng hoặc chuyển user
			if (onNextUser) {
				onNextUser()
			} else {
				onClose()
			}
		}
	}, [currentStoryIndex, stories.length, onNextUser, onClose])

	const goToPreviousStory = useCallback(() => {
		// Kiểm tra điều kiện ở ngoài State Updater
		if (currentStoryIndex > 0) {
			setCurrentStoryIndex(currentStoryIndex - 1)
		} else {
			// Đang ở Story đầu tiên thì lùi user hoặc đóng
			if (onPrevUser) {
				onPrevUser()
			} else {
				onClose()
			}
		}
	}, [currentStoryIndex, onPrevUser, onClose])
	// ----------------------------------------

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

	const handleReact = async (
		type: string,
		event: React.MouseEvent<HTMLButtonElement>,
	) => {
		const buttonRect = event.currentTarget.getBoundingClientRect()
		const screenCenterX = window.innerWidth / 2
		const storyWidth = 400 // Kích thước md:max-w-[400px] của bạn
		const storyLeftEdge = screenCenterX - storyWidth / 2

		const relativeX = buttonRect.left - storyLeftEdge + buttonRect.width / 2

		const newReaction: FlyingReactionState = {
			id: Date.now() + Math.random(),
			icon: reactionIcons[type] || reactionIcons['LOVE'],
			xOffset: relativeX,
		}
		setFlyingReactions(prev => [...prev, newReaction])

		try {
			await sendStoryReaction(currentStory.id, type)
		} catch (err) {
			console.error('Failed to send story reaction', err)
		}
	}

	const removeReaction = useCallback((id: number) => {
		setFlyingReactions(prev => prev.filter(r => r.id !== id))
	}, [])

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
			<div className='fixed inset-0 bg-black/90 z-modal flex items-center justify-center'>
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
				className='fixed inset-0 bg-black/90 z-modal flex items-center justify-center p-0 md:p-4'
				onMouseDown={handleInteractionStart}
				onMouseUp={handleInteractionEnd}
				onTouchStart={handleInteractionStart}
				onTouchEnd={handleInteractionEnd}
			>
				<div className='relative w-full h-full md:max-w-[400px] md:h-[80vh] bg-neutral-900 md:rounded-xl shadow-2xl overflow-hidden mx-auto'>
					{/* Lớp nền Ảnh/Video */}
					{currentStory.mediaUrl && (
						<div className='absolute inset-0 overflow-hidden bg-black flex items-center justify-center'>
							<img
								src={currentStory.mediaUrl}
								alt='Story media'
								className='w-full h-full object-cover pointer-events-none'
								style={{
									// Áp dụng thông số từ DB, mặc định scale 1 và rotate 0 nếu rỗng
									transform: `scale(${currentStory.imageScale || 1}) rotate(${currentStory.imageRotation || 0}deg)`,
									transformOrigin: 'center center', // Xoay từ tâm ảnh
									transition: 'transform 0.3s ease', // Làm mượt lúc mới load
								}}
							/>
						</div>
					)}

					<div className='absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/40' />

					<div className='absolute inset-0 flex' onClick={handleTap}>
						<div className='w-[30%] h-full' />
						<div className='w-[70%] h-full' />
					</div>

					{/* Header: Thanh Progress Bar */}
					<div className='absolute top-0 left-0 right-0 p-4 z-10 pointer-events-none'>
						<div className='flex gap-1 mb-3'>
							{stories.map((_, index) => {
								const isActive = index === currentStoryIndex
								const isPast = index < currentStoryIndex

								return (
									<div
										key={index}
										className='flex-1 bg-white/30 rounded-full h-1 overflow-hidden'
									>
										<div
											// KEY ĐỘNG LÀ BẮT BUỘC: Ép React vẽ lại thanh mới khi chuyển Story
											key={`progress-${index}-${isActive ? 'playing' : 'stopped'}`}
											// Chỉ thêm class animation khi thanh này đang active
											className={`bg-white h-full rounded-full ${isActive ? 'animate-story-progress' : ''}`}
											style={{
												// Nếu là story cũ -> full 100%. Nếu là story chưa tới -> 0%.
												width: isPast ? '100%' : '0%',

												// Thời gian chạy (vd: 5000ms)
												animationDuration: isActive
													? `${STORY_DURATION}ms`
													: '0s',

												// CHÌA KHÓA PAUSE: Khi isPaused = true, CSS sẽ "đóng băng" thanh chạy tại chỗ
												animationPlayState: isPaused ? 'paused' : 'running',
											}}
										/>
									</div>
								)
							})}
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

					<div className='absolute inset-0 pointer-events-none overflow-hidden z-30'>
						{flyingReactions.map(reaction => (
							<FlyingReaction
								key={reaction.id}
								id={reaction.id}
								icon={reaction.icon}
								xOffset={reaction.xOffset}
								onAnimationComplete={removeReaction}
							/>
						))}
					</div>

					{isMe ? (
						<div className='absolute bottom-0 left-0 right-0 p-4 z-40'>
							{/* Own story controls placeholder (Sau này bạn có thể thêm nút "Xóa" hoặc "Người đã xem" ở đây) */}
						</div>
					) : (
						<div className='absolute bottom-0 left-0 right-0 p-4 z-40'>
							<StoryInteractionBar
								// SỬA QUAN TRỌNG NHẤT: Trỏ trực tiếp vào hàm handleReact đã viết ở trên
								onReact={handleReact}
								onReply={async (text: string) => {
									try {
										await sendStoryReply({
											storyId: currentStory.id,
											message: text,
										})
										// (Tùy chọn) Hiển thị Toast thông báo "Đã gửi tin nhắn"
									} catch (err) {
										console.error('Failed to send story reply', err)
									}
								}}
							/>
						</div>
					)}
				</div>{' '}
				{/* Đóng thẻ div chứa nội dung Story */}
				{/* Các nút Next/Prev (Giữ nguyên của bạn) */}
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
