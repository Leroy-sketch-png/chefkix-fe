'use client'

import { Button } from '@/components/ui/button'
import { useUiStore } from '@/store/uiStore'
import { Stories } from '@/components/social/Stories'
import { PageContainer } from '@/components/layout/PageContainer'
import {
	Globe,
	Heart,
	MessageCircle,
	Share2,
	Bookmark,
	Play,
} from 'lucide-react'
import Image from 'next/image'
import { Input } from '@/components/ui/input'

const feedItems = [
	{
		id: 1,
		username: 'ChefAnna',
		avatar: 'https://i.pravatar.cc/48?u=1',
		postTime: '2 hours ago',
		text: 'Just perfected my Spicy Tomato Ramen! 🍜 You HAVE to try this. The broth is everything.',
		media: 'https://i.imgur.com/v8SjYfT.jpeg',
		videoSrc:
			'https://assets.mixkit.co/videos/preview/mixkit-chef-grating-cheese-on-a-delicious-pasta-34080-large.mp4',
		likes: '1.2k',
		comments: '201',
		shares: '98',
	},
]

export default function DashboardPage() {
	const { toggleCookingPlayer } = useUiStore()
	return (
		<PageContainer maxWidth='xl'>
			<div className='flex flex-col gap-6'>
				{/* Stories Bar - Only show on mobile/tablet, hidden on desktop where RightSidebar shows it */}
				<div className='lg:hidden'>
					<Stories variant='horizontal' />
				</div>

				{/* Main Social Feed */}
				<div className='flex flex-col gap-6'>
					{feedItems.map(item => (
						<div
							key={item.id}
							className='rounded-lg border bg-card p-4 shadow-sm'
						>
							<div className='mb-4 flex items-center gap-3'>
								<div className='relative h-12 w-12 overflow-hidden rounded-full'>
									<Image
										src={item.avatar}
										alt={item.username}
										fill
										className='object-cover'
									/>
								</div>
								<div className='flex flex-col'>
									<span className='font-semibold'>{item.username}</span>
									<span className='flex items-center gap-1 text-xs text-muted-foreground'>
										{item.postTime} <Globe className='h-3 w-3' />
									</span>
								</div>
							</div>
							<div className='mb-4'>
								<p className='mb-4'>{item.text}</p>
								<div
									className='relative cursor-pointer overflow-hidden rounded-lg'
									onClick={toggleCookingPlayer}
								>
									<Image
										src={item.media}
										alt='Post media'
										width={600}
										height={400}
										className='h-auto w-full object-cover'
									/>
									<div className='absolute inset-0 flex items-center justify-center bg-black/30'>
										<Play className='h-10 w-10 text-white' />
									</div>
								</div>
							</div>
							<div className='mb-4 flex items-center gap-4'>
								<Button
									variant='ghost'
									size='sm'
									className='flex items-center gap-1'
								>
									<Heart className='h-4 w-4 text-red-500' /> {item.likes}
								</Button>
								<Button
									variant='ghost'
									size='sm'
									className='flex items-center gap-1'
								>
									<MessageCircle className='h-4 w-4' /> {item.comments}
								</Button>
								<Button
									variant='ghost'
									size='sm'
									className='flex items-center gap-1'
								>
									<Share2 className='h-4 w-4' /> {item.shares}
								</Button>
								<Button
									variant='ghost'
									size='sm'
									className='ml-auto flex items-center gap-1'
								>
									<Bookmark className='h-4 w-4' /> Save
								</Button>
							</div>
							{/* Comments Section */}
							<div className='flex items-center gap-2'>
								<Input placeholder='Add a comment...' className='flex-1' />
								<Button>Post</Button>
							</div>
						</div>
					))}
				</div>

				{/* DEV: Test Triggers */}
				<div className='mt-8 rounded-lg border bg-card p-4 shadow-sm'>
					<h2 className='mb-4 text-lg font-semibold'>DEV: Test Triggers</h2>
					<Button onClick={toggleCookingPlayer}>Open Cooking Player</Button>
				</div>
			</div>
		</PageContainer>
	)
}
