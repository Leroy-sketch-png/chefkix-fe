import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Stories } from '@/components/social/Stories'

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
				<Stories variant='compact' showTitle />

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
