'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Play, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
	TRANSITION_SPRING,
	TRANSITION_BOUNCY,
	fadeInUp,
	scaleIn,
} from '@/lib/motion'

// =============================================================================
// TYPES
// =============================================================================

interface Story {
	id: string
	userId: string
	username: string
	avatar: string
	viewed: boolean
	mediaUrl?: string
	mediaType?: 'image' | 'video'
	timestamp?: Date
	recipeTitle?: string
	xpEarned?: number
}

interface StoriesBarProps {
	stories: Story[]
	currentUserId?: string
	onAddStory?: () => void
	onViewStory?: (story: Story) => void
	className?: string
}

interface StoryItemProps {
	story: Story
	onClick?: () => void
}

interface StoryViewerProps {
	story: Story
	stories: Story[]
	onClose: () => void
	onNavigate: (direction: 'prev' | 'next') => void
}

// =============================================================================
// ADD STORY BUTTON
// =============================================================================

const AddStoryButton = ({ onClick }: { onClick?: () => void }) => {
	return (
		<motion.div
			className='group flex cursor-pointer flex-col items-center gap-2 text-center flex-shrink-0'
			whileHover={{ scale: 1.05 }}
			whileTap={{ scale: 0.95 }}
			onClick={onClick}
		>
			<motion.div
				className={cn(
					'grid h-16 w-16 place-items-center rounded-full',
					'border-2 border-dashed border-primary/60',
					'bg-primary/5 transition-colors duration-200',
					'group-hover:border-primary group-hover:bg-primary/10',
				)}
				whileHover={{ rotate: 5 }}
				transition={TRANSITION_BOUNCY}
			>
				<Plus className='h-6 w-6 text-primary' />
			</motion.div>
			<span className='text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors'>
				Add Story
			</span>
		</motion.div>
	)
}

// =============================================================================
// STORY ITEM
// =============================================================================

const StoryItem = ({ story, onClick }: StoryItemProps) => {
	const isViewed = story.viewed

	return (
		<motion.div
			className={cn(
				'group flex cursor-pointer flex-col items-center gap-2 text-center flex-shrink-0',
				isViewed && 'opacity-60 hover:opacity-80',
			)}
			whileHover={{ scale: 1.1, rotate: 5 }}
			whileTap={{ scale: 0.95 }}
			transition={TRANSITION_BOUNCY}
			onClick={onClick}
		>
			<div
				className={cn(
					'relative h-16 w-16 rounded-full p-[3px]',
					!isViewed &&
						'bg-gradient-to-br from-primary via-orange-400 to-pink-500',
					isViewed && 'bg-border',
				)}
				style={
					!isViewed
						? {
								animation: 'story-pulse 2s ease-in-out infinite',
							}
						: undefined
				}
			>
				<div className='relative h-full w-full overflow-hidden rounded-full bg-background p-0.5'>
					<Avatar className='h-full w-full'>
						<AvatarImage src={story.avatar} alt={story.username} />
						<AvatarFallback className='text-sm font-semibold'>
							{story.username.slice(0, 2).toUpperCase()}
						</AvatarFallback>
					</Avatar>
				</div>
			</div>
			<span className='text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors max-w-thumbnail-md truncate'>
				{story.username}
			</span>
		</motion.div>
	)
}

// =============================================================================
// STORY VIEWER (FULLSCREEN)
// =============================================================================

const StoryViewer = ({
	story,
	stories,
	onClose,
	onNavigate,
}: StoryViewerProps) => {
	const [progress, setProgress] = useState(0)
	const currentIndex = stories.findIndex(s => s.id === story.id)
	const hasPrev = currentIndex > 0
	const hasNext = currentIndex < stories.length - 1

	// Auto-progress story (simulate)
	// In production, this would be tied to actual media duration

	return (
		<motion.div
			className='fixed inset-0 z-modal bg-black/95 flex items-center justify-center'
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
		>
			{/* Close Button */}
			<motion.button
				className='absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors'
				onClick={onClose}
				whileHover={{ scale: 1.1 }}
				whileTap={{ scale: 0.9 }}
			>
				<X className='h-6 w-6 text-white' />
			</motion.button>

			{/* Navigation Arrows */}
			{hasPrev && (
				<motion.button
					className='absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors'
					onClick={() => onNavigate('prev')}
					whileHover={{ scale: 1.1, x: -2 }}
					whileTap={{ scale: 0.9 }}
				>
					<ChevronLeft className='h-6 w-6 text-white' />
				</motion.button>
			)}
			{hasNext && (
				<motion.button
					className='absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors'
					onClick={() => onNavigate('next')}
					whileHover={{ scale: 1.1, x: 2 }}
					whileTap={{ scale: 0.9 }}
				>
					<ChevronRight className='h-6 w-6 text-white' />
				</motion.button>
			)}

			{/* Story Content */}
			<motion.div
				className='relative w-full max-w-md aspect-[9/16] rounded-2xl overflow-hidden bg-gray-900'
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={{ scale: 0.9, opacity: 0 }}
				transition={TRANSITION_SPRING}
			>
				{/* Progress Bar */}
				<div className='absolute top-4 left-4 right-4 z-10 flex gap-1'>
					{stories.map((s, i) => (
						<div
							key={s.id}
							className='flex-1 h-1 rounded-full overflow-hidden bg-white/30'
						>
							<motion.div
								className='h-full bg-white'
								initial={{ width: '0%' }}
								animate={{
									width:
										i < currentIndex
											? '100%'
											: i === currentIndex
												? `${progress}%`
												: '0%',
								}}
								transition={{ duration: 0.1 }}
							/>
						</div>
					))}
				</div>

				{/* User Info */}
				<div className='absolute top-10 left-4 right-4 z-10 flex items-center gap-3'>
					<Avatar className='h-10 w-10 ring-2 ring-white/20'>
						<AvatarImage src={story.avatar} alt={story.username} />
						<AvatarFallback>
							{story.username.slice(0, 2).toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<div className='flex-1'>
						<p className='text-white font-semibold text-sm'>{story.username}</p>
						{story.recipeTitle && (
							<p className='text-white/70 text-xs'>🍳 {story.recipeTitle}</p>
						)}
					</div>
					{story.xpEarned && (
						<span className='px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold'>
							+{story.xpEarned} XP
						</span>
					)}
				</div>

				{/* Media Content */}
				{story.mediaUrl ? (
					story.mediaType === 'video' ? (
						<video
							src={story.mediaUrl}
							className='w-full h-full object-cover'
							autoPlay
							muted
							loop
						/>
					) : (
						<Image
							src={story.mediaUrl}
							alt={story.recipeTitle || 'Story'}
							className='w-full h-full object-cover'
						/>
					)
				) : (
					<div className='w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center'>
						<Play className='h-16 w-16 text-white/50' />
					</div>
				)}
			</motion.div>
		</motion.div>
	)
}

// =============================================================================
// STORIES BAR (MAIN COMPONENT)
// =============================================================================

export const StoriesBar = ({
	stories,
	currentUserId,
	onAddStory,
	onViewStory,
	className,
}: StoriesBarProps) => {
	const [viewingStory, setViewingStory] = useState<Story | null>(null)

	const handleViewStory = (story: Story) => {
		setViewingStory(story)
		onViewStory?.(story)
	}

	const handleNavigate = (direction: 'prev' | 'next') => {
		if (!viewingStory) return
		const currentIndex = stories.findIndex(s => s.id === viewingStory.id)
		const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1
		if (newIndex >= 0 && newIndex < stories.length) {
			setViewingStory(stories[newIndex])
		}
	}

	return (
		<>
			<motion.div
				className={cn(
					'flex gap-4 pb-4 overflow-x-auto scrollbar-hide',
					className,
				)}
				variants={fadeInUp}
				initial='hidden'
				animate='visible'
			>
				{/* Add Story Button */}
				<AddStoryButton onClick={onAddStory} />

				{/* Story Items */}
				{stories.map((story, index) => (
					<motion.div
						key={story.id}
						variants={scaleIn}
						initial='hidden'
						animate='visible'
						transition={{ delay: index * 0.05 }}
					>
						<StoryItem story={story} onClick={() => handleViewStory(story)} />
					</motion.div>
				))}
			</motion.div>

			{/* Story Viewer Modal */}
			<AnimatePresence>
				{viewingStory && (
					<StoryViewer
						story={viewingStory}
						stories={stories}
						onClose={() => setViewingStory(null)}
						onNavigate={handleNavigate}
					/>
				)}
			</AnimatePresence>
		</>
	)
}

// =============================================================================
// STORIES BAR SKELETON
// =============================================================================

export const StoriesBarSkeleton = () => {
	return (
		<div className='flex gap-4 pb-4 overflow-x-auto scrollbar-hide'>
			{/* Add Story Skeleton */}
			<div className='flex flex-col items-center gap-2 flex-shrink-0'>
				<div className='h-16 w-16 rounded-full bg-muted animate-pulse' />
				<div className='h-3 w-12 rounded bg-muted animate-pulse' />
			</div>

			{/* Story Skeletons */}
			{[1, 2, 3, 4, 5].map(i => (
				<div key={i} className='flex flex-col items-center gap-2 flex-shrink-0'>
					<div className='h-16 w-16 rounded-full bg-muted animate-pulse' />
					<div className='h-3 w-12 rounded bg-muted animate-pulse' />
				</div>
			))}
		</div>
	)
}

export default StoriesBar
