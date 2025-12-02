'use client'

import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { UserHoverCard } from '@/components/social/UserHoverCard'

// ============================================
// STORIES DATA - Pending backend implementation
// ============================================

// Empty array until backend Stories API is available
// Will be replaced with: GET /api/v1/stories endpoint
const stories: Array<{
	id: number
	userId: string
	username: string
	avatar: string
	viewed: boolean
}> = []

// ============================================
// COMPONENT
// ============================================

interface StoriesProps {
	variant?: 'horizontal' | 'compact'
	showTitle?: boolean
	currentUserId?: string
}

export const Stories = ({
	variant = 'horizontal',
	showTitle = false,
	currentUserId,
}: StoriesProps) => {
	return (
		<div
			className={
				variant === 'compact' ? 'rounded-lg border bg-card p-4 shadow-sm' : ''
			}
		>
			{showTitle && (
				<h3 className='mb-4 text-sm font-semibold uppercase tracking-wider text-foreground'>
					Stories
				</h3>
			)}
			<div className='flex gap-4 overflow-x-auto pb-2 scrollbar-hide'>
				{/* Add Story */}
				<div className='group flex cursor-pointer flex-col items-center gap-2 text-center flex-shrink-0'>
					<div className='grid h-16 w-16 place-items-center rounded-full border-2 border-dashed border-primary bg-primary/5 transition-all duration-300 hover:scale-110 hover:rotate-6 hover:bg-primary/10'>
						<Plus className='h-6 w-6 text-primary' />
					</div>
					<span className='text-xs font-medium text-foreground'>Add Story</span>
				</div>

				{/* Story Items */}
				{stories.map(story => (
					<UserHoverCard
						key={story.id}
						userId={story.userId}
						currentUserId={currentUserId}
					>
						<div
							className={cn(
								'group flex cursor-pointer flex-col items-center gap-2 text-center flex-shrink-0',
								story.viewed && 'opacity-60 hover:opacity-80',
							)}
						>
							<div
								className={cn(
									'relative h-16 w-16 rounded-full p-[3px] transition-all duration-300',
									!story.viewed &&
										'bg-gradient-to-br from-primary to-accent animate-story-pulse',
									story.viewed && 'bg-border',
									'hover:scale-110 hover:rotate-[5deg]',
								)}
							>
								<div className='relative h-full w-full overflow-hidden rounded-full bg-background p-[2px]'>
									<Avatar className='h-full w-full'>
										<AvatarImage src={story.avatar} alt={story.username} />
										<AvatarFallback>
											{story.username.slice(0, 2).toUpperCase()}
										</AvatarFallback>
									</Avatar>
								</div>
							</div>
							<span className='text-xs font-medium text-foreground'>
								{story.username}
							</span>
						</div>
					</UserHoverCard>
				))}
			</div>
		</div>
	)
}
