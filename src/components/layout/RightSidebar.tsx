import { Plus } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

const stories = [
	{ id: 1, username: 'ChefAnna', avatar: 'https://i.pravatar.cc/64?u=1' },
	{ id: 2, username: 'MarcoB', avatar: 'https://i.pravatar.cc/64?u=2' },
	{ id: 3, username: 'Sofi_Cooks', avatar: 'https://i.pravatar.cc/64?u=3' },
]

const suggestions = [
	{
		id: 1,
		name: 'Gordon',
		username: '@gordon',
		avatar: 'https://i.pravatar.cc/40?u=4',
	},
	{
		id: 2,
		name: 'Jamie O',
		username: '@jamieo',
		avatar: 'https://i.pravatar.cc/40?u=5',
	},
	{
		id: 3,
		name: 'Nigella',
		username: '@nigella',
		avatar: 'https://i.pravatar.cc/40?u=6',
	},
]

export const RightSidebar = () => {
	return (
		<aside className='hidden lg:block border-l bg-background p-6'>
			<div className='flex flex-col gap-6'>
				{/* Stories */}
				<div className='rounded-lg border bg-card p-4 shadow-sm'>
					<h3 className='mb-4 text-sm font-semibold uppercase tracking-wider text-foreground'>
						Stories
					</h3>
					<div className='flex gap-4 overflow-x-auto pb-2 scrollbar-hide'>
						<div className='flex cursor-pointer flex-col items-center gap-2 text-center'>
							<div className='grid h-16 w-16 place-items-center rounded-full border-2 border-dashed border-primary bg-muted'>
								<Plus className='h-6 w-6 text-primary' />
							</div>
							<span className='text-xs font-medium'>Your Story</span>
						</div>
						{stories.map(story => (
							<div
								key={story.id}
								className='flex cursor-pointer flex-col items-center gap-2 text-center'
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

				{/* Friend Activity / Who to follow */}
				<div className='rounded-lg border bg-card p-4 shadow-sm'>
					<h3 className='mb-4 text-sm font-semibold uppercase tracking-wider text-foreground'>
						Who to Follow
					</h3>
					<div className='flex flex-col gap-3'>
						{suggestions.map(suggestion => (
							<div key={suggestion.id} className='flex items-center gap-3'>
								<div className='relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full'>
									<Image
										src={suggestion.avatar}
										alt={suggestion.name}
										fill
										className='object-cover'
									/>
								</div>
								<div className='flex-grow overflow-hidden'>
									<p className='truncate text-sm font-semibold'>
										{suggestion.name}
									</p>
									<p className='truncate text-xs text-muted-foreground'>
										{suggestion.username}
									</p>
								</div>
								<Button size='sm' className='rounded-full text-xs'>
									Follow
								</Button>
							</div>
						))}
					</div>
				</div>
			</div>
		</aside>
	)
}
