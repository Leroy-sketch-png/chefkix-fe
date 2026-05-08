'use client'

import { StoryAvatar } from './StoryAvatar'
import { useAuth } from '@/hooks/useAuth'
import { UserStoryFeedResponse } from '@/lib/types/story'
import { Skeleton } from '@/components/ui/skeleton'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

interface StoryFeedProps {
	stories: UserStoryFeedResponse[]
	isLoading: boolean
	onStoryClick: (user: UserStoryFeedResponse) => void
}

interface CreateStoryCardProps {
	avatarUrl: string
	hasStories: boolean
	onClick: () => void
	fullWidth?: boolean
}

const StorySkeleton = () => (
	<div className='flex flex-col items-center gap-2 w-20'>
		<Skeleton className='w-16 h-16 rounded-full' />
		<Skeleton className='w-14 h-4' />
	</div>
)

const CreateStoryCard = ({
	avatarUrl,
	hasStories,
	onClick,
	fullWidth = false,
}: CreateStoryCardProps) => (
	<button
		type='button'
		onClick={onClick}
		className={
			fullWidth
				? 'group flex w-full items-center justify-between gap-3 rounded-xl border border-brand/15 bg-gradient-to-r from-brand/10 via-bg-card to-bg-elevated p-3 text-left shadow-card transition-transform hover:-translate-y-0.5 hover:bg-bg-card focus-visible:ring-2 focus-visible:ring-brand/50'
				: 'group flex h-full w-36 shrink-0 snap-start flex-col justify-between rounded-2xl border border-brand/15 bg-gradient-to-br from-brand/10 via-bg-card to-bg-elevated p-3.5 text-left shadow-card transition-transform hover:-translate-y-0.5 hover:bg-bg-card focus-visible:ring-2 focus-visible:ring-brand/50'
		}
	>
		<div
			className={fullWidth ? 'flex min-w-0 items-center gap-2.5' : 'space-y-3'}
		>
			<div
				className={
					fullWidth
						? 'relative shrink-0'
						: 'flex items-start justify-between gap-2'
				}
			>
				<div className='flex size-10 items-center justify-center rounded-xl border border-brand/15 bg-bg-card shadow-sm'>
					<img
						src={avatarUrl}
						alt='Your story avatar'
						className='size-8 rounded-xl object-cover'
					/>
				</div>
				{!fullWidth ? (
					<div className='flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-sm'>
						<Plus className='size-4' strokeWidth={2.8} />
					</div>
				) : null}
			</div>
			<div className='min-w-0 space-y-0.5'>
				<p className='text-sm font-semibold leading-tight text-text'>
					{hasStories ? 'Add to your story' : 'Start your story'}
				</p>
				<p className='line-clamp-1 text-xs leading-4 text-text-secondary'>
					{hasStories
						? 'Drop in a fresh kitchen moment.'
						: 'Share a quick kitchen moment.'}
				</p>
			</div>
		</div>
		<span className='inline-flex shrink-0 w-fit items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white'>
			Create
			<Plus className='size-3.5' strokeWidth={3} />
		</span>
	</button>
)

const shellClassName =
	'rounded-[1.5rem] border border-border-subtle bg-bg-card/70 p-3 shadow-card backdrop-blur-sm'

export const StoryFeed = ({
	stories = [],
	isLoading,
	onStoryClick,
}: StoryFeedProps) => {
	const { user: currentUser } = useAuth()
	const router = useRouter()
	const handleCreateStory = () => router.push('/story/create')
	const hasStories = stories.length > 0
	const stripClassName =
		'flex items-stretch gap-3 overflow-x-auto pb-1 pt-1 snap-x scrollbar-hide -mx-1 px-1'

	const header = (
		<div className='flex items-center justify-between gap-3'>
			<div className='min-w-0'>
				<p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted'>
					Stories
				</p>
				<p className='text-xs text-text-secondary'>
					Kitchen moments from your circle.
				</p>
			</div>
			{hasStories ? (
				<span className='inline-flex h-6 shrink-0 items-center rounded-full bg-bg-elevated px-2 py-0.5 text-xs font-semibold text-text-secondary'>
					{stories.length}
				</span>
			) : null}
		</div>
	)

	if (isLoading) {
		return (
			<section className={shellClassName}>
				<div className='space-y-3'>
					{header}
					<div className={stripClassName}>
						{Array.from({ length: 5 }).map((_, i) => (
							<StorySkeleton key={i} />
						))}
					</div>
				</div>
			</section>
		)
	}

	const addStoryData: UserStoryFeedResponse = {
		userId: currentUser?.userId || 'add-btn',
		displayName: 'Add Story',
		avatarUrl: currentUser?.avatarUrl || '/placeholder-avatar.svg',
		hasUnseenStory: false,
	}

	if (!hasStories) {
		return (
			<section className={shellClassName}>
				<div className='space-y-3'>
					{header}
					<div>
						<CreateStoryCard
							avatarUrl={addStoryData.avatarUrl}
							hasStories={false}
							onClick={handleCreateStory}
							fullWidth={true}
						/>
					</div>
				</div>
			</section>
		)
	}

	return (
		<section className={shellClassName}>
			<div className='space-y-3'>
				{header}
				<div className={stripClassName}>
					<CreateStoryCard
						avatarUrl={addStoryData.avatarUrl}
						hasStories={hasStories}
						onClick={handleCreateStory}
					/>

					{stories.map((storyUser, index) => {
						const isMe =
							!!currentUser && storyUser.userId === currentUser.userId

						return (
							<button
								type='button'
								key={`${storyUser.userId}-${index}`}
								className='snap-start shrink-0 text-left'
								onClick={() => onStoryClick(storyUser)}
							>
								<StoryAvatar user={storyUser} isCurrentUser={isMe} />
							</button>
						)
					})}
				</div>
			</div>
		</section>
	)
}
