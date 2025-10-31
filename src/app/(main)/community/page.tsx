'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/layout/PageContainer'

const leaderboard = [
	{
		id: 1,
		rank: 1,
		username: 'ChefAnna',
		level: 12,
		xp: '12,500 XP',
		avatar: 'https://i.pravatar.cc/40?u=1',
	},
	{
		id: 2,
		rank: 2,
		username: 'MarcoB',
		level: 11,
		xp: '11,200 XP',
		avatar: 'https://i.pravatar.cc/40?u=2',
	},
	{
		id: 3,
		rank: 3,
		username: 'Sofi_Cooks',
		level: 10,
		xp: '10,800 XP',
		avatar: 'https://i.pravatar.cc/40?u=3',
	},
]

export default function CommunityPage() {
	return (
		<PageContainer maxWidth='xl'>
			<div className='mb-8 rounded-lg border bg-card p-6 shadow-sm'>
				<h1 className='mb-2 text-3xl font-bold'>Community Hub</h1>
				<p className='mb-6 text-muted-foreground'>
					Connect, compete, and climb the ranks.
				</p>
				<div className='flex justify-around gap-4'>
					<div className='text-center'>
						<h3 className='text-2xl font-bold'>150,212</h3>
						<span className='text-muted-foreground'>Total Members</span>
					</div>
					<div className='text-center'>
						<h3 className='text-2xl font-bold'>2,408</h3>
						<span className='text-muted-foreground'>Online Now</span>
					</div>
				</div>
			</div>

			<div className='mb-8 rounded-lg border bg-card p-6 shadow-sm'>
				<h2 className='mb-4 text-2xl font-bold'>Top Chefs This Week</h2>
				<div className='flex flex-col gap-4'>
					{leaderboard.map(chef => (
						<div key={chef.id} className='flex items-center gap-4'>
							<span className='text-xl font-bold text-primary'>
								{chef.rank}
							</span>
							<div className='relative h-10 w-10 overflow-hidden rounded-full'>
								<Image
									src={chef.avatar}
									alt={chef.username}
									fill
									className='object-cover'
								/>
							</div>
							<div className='flex-grow'>
								<p className='font-semibold'>{chef.username}</p>
								<p className='text-sm text-muted-foreground'>
									Level {chef.level}
								</p>
							</div>
							<span className='font-semibold text-green-600'>{chef.xp}</span>
						</div>
					))}
				</div>
			</div>

			<div className='rounded-lg border bg-card p-6 shadow-sm'>
				<h2 className='mb-2 text-2xl font-bold'>Chef Battle Arena</h2>
				<p className='mb-6 text-muted-foreground'>
					Vote for your favorite dish!
				</p>
				<div className='flex flex-col items-center justify-center gap-6 md:flex-row'>
					<div className='flex flex-col items-center text-center'>
						<div className='relative mb-3 h-40 w-40 overflow-hidden rounded-lg'>
							<Image
								src='https://i.imgur.com/cO1mO8w.jpeg'
								alt='Tacos'
								fill
								className='object-cover'
							/>
						</div>
						<p className='text-lg font-semibold'>Taco Tuesday</p>
						<p className='mb-3 text-sm text-muted-foreground'>by @JamieO</p>
						<Button>Vote</Button>
					</div>
					<div className='text-2xl font-bold text-muted-foreground'>VS</div>
					<div className='flex flex-col items-center text-center'>
						<div className='relative mb-3 h-40 w-40 overflow-hidden rounded-lg'>
							<Image
								src='https://i.imgur.com/v8SjYfT.jpeg'
								alt='Ramen'
								fill
								className='object-cover'
							/>
						</div>
						<p className='text-lg font-semibold'>Ramen Delight</p>
						<p className='mb-3 text-sm text-muted-foreground'>by @Nigella</p>
						<Button>Vote</Button>
					</div>
				</div>
			</div>
		</PageContainer>
	)
}
