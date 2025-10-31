'use client'

import { Plus } from 'lucide-react'
import Image from 'next/image'

// Mock data - should come from API/store in production
const stories = [
	{ id: 1, username: 'ChefAnna', avatar: 'https://i.pravatar.cc/64?u=1' },
	{ id: 2, username: 'MarcoB', avatar: 'https://i.pravatar.cc/64?u=2' },
	{ id: 3, username: 'Sofi_Cooks', avatar: 'https://i.pravatar.cc/64?u=3' },
]

interface StoriesProps {
	variant?: 'horizontal' | 'compact'
	showTitle?: boolean
}

export const Stories = ({
	variant = 'horizontal',
	showTitle = false,
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
				<div className='flex cursor-pointer flex-col items-center gap-2 text-center flex-shrink-0'>
					<div className='grid h-16 w-16 place-items-center rounded-full border-2 border-dashed border-primary bg-muted'>
						<Plus className='h-6 w-6 text-primary' />
					</div>
					<span className='text-xs font-medium'>Your Story</span>
				</div>

				{/* Story Items */}
				{stories.map(story => (
					<div
						key={story.id}
						className='flex cursor-pointer flex-col items-center gap-2 text-center flex-shrink-0'
					>
						<div className='h-16 w-16 rounded-full border-2 border-primary p-1 transition-transform duration-300 ease-in-out hover:scale-105'>
							<div className='relative h-full w-full overflow-hidden rounded-full'>
								<Image
									src={story.avatar}
									alt={story.username}
									fill
									className='object-cover'
								/>
							</div>
						</div>
						<span className='text-xs font-medium'>{story.username}</span>
					</div>
				))}
			</div>
		</div>
	)
}
