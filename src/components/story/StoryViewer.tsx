'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
	X,
	ChevronLeft,
	ChevronRight,
	ImageOff,
	Pause,
	Play,
	RefreshCw,
	ChefHat,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
	getStoriesByUserId,
	getStoryById,
	recordStoryView,
	sendStoryReaction,
	sendStoryReply,
} from '@/services/story'
import { getProfileByUserId } from '@/services/profile'
import { StoryResponse, StoryItemDto } from '@/lib/types/story'
import { getProfileDisplayName, Profile } from '@/lib/types/profile'
import { useAuth } from '@/hooks/useAuth'
import { useTranslations } from '@/i18n/hooks'
import { formatDistanceToNow } from 'date-fns'
import StoryInteractionBar from '@/components/story/StoryInteractionBar'
import { Heart, Smile, Zap, Frown, ThumbsDown } from 'lucide-react'
import FlyingReaction from './FlyingReaction'
import { logDevError, logDevWarn } from '@/lib/dev-log'
import { isAxiosError } from 'axios'
import { useRouter } from 'next/navigation'

export interface FlyingReactionState {
	id: number
	icon: React.ReactNode
	xOffset: number
}

const reactionIcons: Record<string, React.ReactNode> = {
	LOVE: <Heart className='text-error' fill='currentColor' />,
	HAHA: <Smile className='text-warning' fill='currentColor' />,
	WOW: <Zap className='text-xp' fill='currentColor' />,
	SAD: <Frown className='text-info' fill='currentColor' />,
	ANGRY: <ThumbsDown className='text-error' fill='currentColor' />,
}

interface StoryViewerProps {
	userId: string
	startAtStoryId?: string | null
	onClose: () => void
	onNextUser?: () => void
	onPrevUser?: () => void
}

const STORY_DURATION = 7000 // 7 seconds per story

const StoryItemContent = ({
	item,
	stickerAlt,
}: {
	item: StoryItemDto
	stickerAlt: string
}) => {
	const itemData = item.data || {}

	return (
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
			{(item.type === 'STICKER' || item.type === 'EMOJI') &&
				!itemData.imageUrl && (
					<span style={{ fontSize: '4rem' }}>{itemData.emoji}</span>
				)}
			{(item.type === 'IMAGE_STICKER' ||
				(item.type === 'STICKER' && itemData.imageUrl)) && (
				<img
					src={itemData.imageUrl}
					alt={stickerAlt}
					className='w-full h-full object-contain'
				/>
			)}
		</div>
	)
}

export function StoryViewer({
	userId,
	startAtStoryId,
	onClose,
	onNextUser,
	onPrevUser,
}: StoryViewerProps) {
	const [stories, setStories] = useState<StoryResponse[]>([])
	const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
	const [isLoading, setIsLoading] = useState(true)
	const [loadError, setLoadError] = useState<'unavailable' | 'failed' | null>(
		null,
	)
	const [loadAttempt, setLoadAttempt] = useState(0)
	const [mediaFailed, setMediaFailed] = useState(false)
	const [isManuallyPaused, setIsManuallyPaused] = useState(false)
	const [isHolding, setIsHolding] = useState(false)
	const [isComposing, setIsComposing] = useState(false)
	const [authorProfile, setAuthorProfile] = useState<Profile | null>(null)
	const [isAuthorLoading, setIsAuthorLoading] = useState(true)
	const [authorLookupFailed, setAuthorLookupFailed] = useState(false)
	const [flyingReactions, setFlyingReactions] = useState<FlyingReactionState[]>(
		[],
	)
	const timerRef = useRef<NodeJS.Timeout | null>(null)
	const router = useRouter()
	const { user: currentUser } = useAuth()
	const t = useTranslations('story')

	const currentStory = stories[currentStoryIndex]
	const isMe = currentUser?.userId === userId
	const isPaused = isManuallyPaused || isHolding || isComposing

	useEffect(() => {
		let cancelled = false

		if (!userId || isMe) {
			setAuthorProfile(null)
			setAuthorLookupFailed(false)
			setIsAuthorLoading(false)
			return
		}

		setAuthorProfile(null)
		setAuthorLookupFailed(false)
		setIsAuthorLoading(true)

		getProfileByUserId(userId)
			.then(response => {
				if (cancelled) return
				if (response.success && response.data) {
					setAuthorProfile(response.data)
					return
				}
				setAuthorLookupFailed(true)
			})
			.catch(() => {
				if (!cancelled) setAuthorLookupFailed(true)
			})
			.finally(() => {
				if (!cancelled) setIsAuthorLoading(false)
			})

		return () => {
			cancelled = true
		}
	}, [isMe, userId])

	const goToNextStory = useCallback(() => {
		if (currentStoryIndex < stories.length - 1) {
			setCurrentStoryIndex(currentStoryIndex + 1)
		} else {
			if (onNextUser) {
				onNextUser()
			} else {
				onClose()
			}
		}
	}, [currentStoryIndex, stories.length, onNextUser, onClose])

	const goToPreviousStory = useCallback(() => {
		if (currentStoryIndex > 0) {
			setCurrentStoryIndex(currentStoryIndex - 1)
		} else {
			if (onPrevUser) {
				onPrevUser()
			} else {
				onClose()
			}
		}
	}, [currentStoryIndex, onPrevUser, onClose])

	useEffect(() => {
		if (!userId && !startAtStoryId) {
			onClose()
			return
		}

		const fetchStoriesData = async () => {
			setIsLoading(true)
			setLoadError(null)
			setMediaFailed(false)
			setStories([])
			setCurrentStoryIndex(0)

			try {
				let isStoryFound = false

				if (userId) {
					const res = await getStoriesByUserId(userId)
					const storyArray = res.data.data ?? []

					if (storyArray && storyArray.length > 0) {
						if (startAtStoryId) {
							const targetIndex = storyArray.findIndex(
								story => story.id === startAtStoryId,
							)
							if (targetIndex !== -1) {
								setStories(storyArray)
								setCurrentStoryIndex(targetIndex)
								isStoryFound = true
							}
						} else {
							setStories(storyArray)
							setCurrentStoryIndex(0)
							isStoryFound = true
						}
					}
				}

				if (!isStoryFound && startAtStoryId) {
					const res = await getStoryById(startAtStoryId)

					let singleStory = null
					if (res?.data?.data) {
						singleStory = res.data.data
					} else if (res?.data) {
						singleStory = res.data
					} else {
						singleStory = res
					}

					if (singleStory && singleStory.id) {
						setStories([singleStory])
						setCurrentStoryIndex(0)
						isStoryFound = true
					}
				}

				if (!isStoryFound) {
					logDevWarn('Story is unavailable or expired.')
					setLoadError('unavailable')
				}
			} catch (err) {
				if (isAxiosError(err) && err.response?.status === 404) {
					logDevWarn('Story is unavailable or expired.')
					setLoadError('unavailable')
				} else {
					logDevError('Failed to load Story details', err)
					setLoadError('failed')
				}
			} finally {
				setIsLoading(false)
			}
		}

		fetchStoriesData()
	}, [userId, startAtStoryId, loadAttempt, onClose])

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

	useEffect(() => {
		if (currentStory?.id) {
			recordStoryView(currentStory.id).catch(error =>
				logDevError('Failed to record Story view', error),
			)
		}
	}, [currentStory?.id])

	const handleInteractionStart = () => setIsHolding(true)
	const handleInteractionEnd = () => setIsHolding(false)

	const handleReact = async (
		event: React.MouseEvent<HTMLButtonElement>,
		type: string,
	) => {
		if (!event || !event.currentTarget) return

		const buttonRect = event.currentTarget.getBoundingClientRect()
		const screenCenterX = window.innerWidth / 2
		const storyWidth = 400
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
			logDevError('Failed to send Story reaction', err)
			toast.error(t('reactionFailed'))
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

	if (isLoading) {
		return (
			<div
				className='fixed inset-0 z-modal flex flex-col items-center justify-center gap-4 bg-black/90 text-white'
				role='status'
				aria-live='polite'
			>
				<div
					className='size-12 animate-spin rounded-full border-2 border-white/25 border-t-brand'
					aria-hidden='true'
				/>
				<p className='text-sm font-medium'>{t('loadingStory')}</p>
			</div>
		)
	}

	if (loadError || stories.length === 0 || !currentStory) {
		const unavailable = loadError === 'unavailable'
		return (
			<div className='fixed inset-0 z-modal flex items-center justify-center bg-black px-6 text-white'>
				<div className='flex max-w-sm flex-col items-center text-center'>
					<div className='mb-5 flex size-14 items-center justify-center rounded-full bg-white/10'>
						<ImageOff className='size-6' aria-hidden='true' />
					</div>
					<h1 className='text-xl font-semibold'>
						{unavailable ? t('storyUnavailable') : t('storyLoadFailed')}
					</h1>
					<p className='mt-2 text-sm leading-6 text-white/70'>
						{unavailable
							? t('storyUnavailableDescription')
							: t('storyLoadFailedDescription')}
					</p>
					<div className='mt-6 flex items-center gap-3'>
						{!unavailable && (
							<button
								type='button'
								onClick={() => setLoadAttempt(attempt => attempt + 1)}
								className='inline-flex h-11 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'
							>
								<RefreshCw className='size-4' aria-hidden='true' />
								{t('retryButton')}
							</button>
						)}
						<button
							type='button'
							onClick={onClose}
							className='inline-flex h-11 items-center rounded-md border border-white/25 bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'
						>
							{t('closeButton')}
						</button>
					</div>
				</div>
			</div>
		)
	}

	const displayAuthorName = isMe
		? currentUser?.displayName || currentUser?.username || t('storyAuthor')
		: isAuthorLoading
			? t('authorLoading')
			: authorLookupFailed || !authorProfile
				? t('authorUnavailable')
				: getProfileDisplayName(authorProfile)
	const displayAuthorAvatar = isMe
		? currentUser?.avatarUrl
		: authorProfile?.avatarUrl

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.95 }}
				className='fixed inset-0 bg-black/90 z-modal flex items-center justify-center p-0 md:p-4'
				onPointerDown={handleInteractionStart}
				onPointerUp={handleInteractionEnd}
				onPointerCancel={handleInteractionEnd}
				onPointerLeave={handleInteractionEnd}
			>
				<div className='relative w-full h-full md:max-w-md md:h-[80vh] bg-neutral-900 md:rounded-xl shadow-2xl overflow-hidden mx-auto'>
					{currentStory.mediaUrl && !mediaFailed ? (
						<div className='absolute inset-0 overflow-hidden bg-black flex items-center justify-center'>
							<img
								src={currentStory.mediaUrl}
								alt={t('storyMediaAlt')}
								onError={() => setMediaFailed(true)}
								className='w-full h-full object-cover pointer-events-none'
								style={{
									transform: `scale(${currentStory.imageScale || 1}) rotate(${currentStory.imageRotation || 0}deg)`,
									transformOrigin: 'center center',
									transition: 'transform 0.3s ease',
								}}
							/>
						</div>
					) : (
						<div className='absolute inset-0 flex flex-col items-center justify-center gap-3 bg-neutral-900 px-8 text-center text-white'>
							<ImageOff className='size-10 text-white/65' aria-hidden='true' />
							<p className='text-sm font-medium'>
								{t('storyMediaUnavailable')}
							</p>
						</div>
					)}

					<div className='absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/40' />

					<div className='absolute inset-0 flex' onClick={handleTap}>
						<div className='w-[30%] h-full' />
						<div className='w-[70%] h-full' />
					</div>

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
											key={`progress-${index}-${isActive ? 'playing' : 'stopped'}`}
											className={`bg-white h-full rounded-full ${isActive ? 'animate-story-progress' : ''}`}
											style={{
												width: isPast ? '100%' : '0%',
												animationDuration: isActive
													? `${STORY_DURATION}ms`
													: '0s',
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
												' ' +
												t('storyTimestamp')
											: t('justNow')}
									</p>
								</div>
							</div>
							<div className='pointer-events-auto flex items-center gap-1'>
								<button
									type='button'
									onClick={() => setIsManuallyPaused(paused => !paused)}
									className='inline-flex size-10 items-center justify-center rounded-full bg-black/35 text-white/80 hover:bg-black/55 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'
									aria-label={
										isManuallyPaused ? t('playButton') : t('pauseButton')
									}
									title={isManuallyPaused ? t('playButton') : t('pauseButton')}
								>
									{isManuallyPaused ? <Play size={20} /> : <Pause size={20} />}
								</button>
								<button
									type='button'
									onClick={onClose}
									className='inline-flex size-10 items-center justify-center rounded-full bg-black/35 text-white/80 hover:bg-black/55 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'
									aria-label={t('closeButton')}
									title={t('closeButton')}
								>
									<X size={24} />
								</button>
							</div>
						</div>
					</div>

					<div className='absolute inset-0'>
						{(currentStory.items || []).map((item, index) => (
							<StoryItemContent
								key={index}
								item={item}
								stickerAlt={t('storyStickerAlt')}
							/>
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

					{(currentStory.linkedRecipeId || !isMe) && (
						<div className='absolute bottom-0 left-0 right-0 z-40 flex flex-col gap-3 p-4'>
							{currentStory.linkedRecipeId ? (
								<button
									type='button'
									onPointerDown={event => event.stopPropagation()}
									onClick={event => {
										event.stopPropagation()
										setIsManuallyPaused(true)
										router.push(`/recipes/${currentStory.linkedRecipeId}`)
									}}
									className='inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-neutral-950 shadow-card transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'
								>
									<ChefHat className='size-4' aria-hidden='true' />
									{t('cookLinkedRecipe')}
								</button>
							) : null}

							{!isMe ? (
								<StoryInteractionBar
									onReact={handleReact}
									onComposingChange={setIsComposing}
									onReply={async (content: string) => {
										try {
											await sendStoryReply(currentStory.id, content)
											toast.success(t('replyPrompt'))
										} catch (err) {
											logDevError('Failed to send Story reply', err)
											throw err
										}
									}}
								/>
							) : null}
						</div>
					)}
				</div>
				<button
					type='button'
					onClick={goToPreviousStory}
					className='absolute left-4 top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white/80 hover:bg-black/55 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:inline-flex'
					aria-label={t('previousStory')}
				>
					<ChevronLeft size={32} />
				</button>
				<button
					type='button'
					onClick={goToNextStory}
					className='absolute right-4 top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white/80 hover:bg-black/55 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:inline-flex'
					aria-label={t('nextStory')}
				>
					<ChevronRight size={32} />
				</button>
			</motion.div>
		</AnimatePresence>
	)
}
