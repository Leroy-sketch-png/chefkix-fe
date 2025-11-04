'use client'

import Image from 'next/image'
import { Users, Wifi, Trophy, Medal, Award, Flame } from 'lucide-react'
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

const rankIcons = [Trophy, Medal, Award]
const rankColors = ['text-gold', 'text-muted-foreground', 'text-gold'] as const

export default function CommunityPage() {
	return (
		<PageContainer maxWidth='xl'>
			{/* Community Stats Card */}
			<div className='mb-8 animate-fadeIn rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-accent/5 p-6 shadow-[0_8px_16px_rgba(0,0,0,0.08)] backdrop-blur-sm'>
				<h1 className='mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-3xl font-bold text-transparent'>
					Community Hub
				</h1>
				<p className='mb-6 text-muted-foreground'>
					Connect, compete, and climb the ranks.
				</p>
				<div className='grid grid-cols-2 gap-6'>
					<div className='group text-center transition-transform duration-300 hover:scale-105'>
						<div className='mb-2 flex items-center justify-center gap-2'>
							<Users className='h-5 w-5 text-primary' />
							<h3 className='text-2xl font-bold'>150,212</h3>
						</div>
						<span className='text-sm text-muted-foreground'>Total Members</span>
					</div>
					<div className='group text-center transition-transform duration-300 hover:scale-105'>
						<div className='mb-2 flex items-center justify-center gap-2'>
							<Wifi className='h-5 w-5 text-accent' />
							<h3 className='text-2xl font-bold'>2,408</h3>
						</div>
						<span className='text-sm text-muted-foreground'>Online Now</span>
					</div>
				</div>
			</div>

			{/* Leaderboard Card */}
			<div className='mb-8 animate-scaleIn rounded-2xl border border-border bg-card p-6 shadow-[0_8px_16px_rgba(0,0,0,0.08)] backdrop-blur-sm'>
				<div className='mb-6 flex items-center gap-2'>
					<Flame className='h-6 w-6 text-orange-500' />
					<h2 className='text-2xl font-bold'>Top Chefs This Week</h2>
				</div>
				<div className='flex flex-col gap-3'>
					{leaderboard.map((chef, index) => {
						const RankIcon = rankIcons[index]
						const rankColor = rankColors[index]
						return (
							<div
								key={chef.id}
								className='group flex items-center gap-4 rounded-xl border border-border bg-card/50 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card hover:shadow-[0_4px_12px_rgba(102,126,234,0.1)]'
							>
								{/* Rank Badge */}
								<div className='flex h-12 w-12 shrink-0 items-center justify-center'>
									<RankIcon className={`h-8 w-8 ${rankColor}`} />
								</div>

								{/* Avatar */}
								<div className='relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-border transition-all duration-300 group-hover:ring-primary'>
									<Image
										src={chef.avatar}
										alt={chef.username}
										fill
										className='object-cover'
									/>
								</div>

								{/* User Info */}
								<div className='min-w-0 flex-1'>
									<p className='truncate font-semibold'>{chef.username}</p>
									<p className='text-sm text-muted-foreground'>
										Level {chef.level}
									</p>
								</div>

								{/* XP Badge */}
								<div className='shrink-0 rounded-full bg-gradient-to-r from-accent/10 to-accent-strong/10 px-4 py-1.5 text-sm font-semibold text-accent-foreground transition-all duration-300 group-hover:shadow-[0_0_12px_rgba(34,197,94,0.2)]'>
									{chef.xp}
								</div>
							</div>
						)
					})}
				</div>
			</div>

			{/* Battle Arena Card */}
			<div className='animate-scaleIn rounded-2xl border border-border bg-card p-6 shadow-[0_8px_16px_rgba(0,0,0,0.08)] backdrop-blur-sm'>
				<h2 className='mb-2 text-2xl font-bold'>Chef Battle Arena</h2>
				<p className='mb-6 text-muted-foreground'>
					Vote for your favorite dish!
				</p>
				<div className='flex flex-col items-center justify-center gap-8 md:flex-row'>
					{/* Dish 1 */}
					<div className='group w-full max-w-xs transition-transform duration-300 hover:scale-105'>
						<div className='relative mb-4 aspect-square overflow-hidden rounded-2xl shadow-[0_8px_16px_rgba(0,0,0,0.1)] transition-all duration-300 group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.15)]'>
							<Image
								src='https://i.imgur.com/cO1mO8w.jpeg'
								alt='Tacos'
								fill
								className='object-cover transition-transform duration-300 group-hover:scale-110'
							/>
						</div>
						<p className='mb-1 text-center text-lg font-semibold'>
							Taco Tuesday
						</p>
						<p className='mb-4 text-center text-sm text-muted-foreground'>
							by @JamieO
						</p>
						<Button
							className='w-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(102,126,234,0.3)] active:scale-95'
							size='lg'
						>
							Vote
						</Button>
					</div>

					{/* VS Divider */}
					<div className='flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-2xl font-bold text-primary-foreground shadow-[0_4px_12px_rgba(102,126,234,0.3)]'>
						VS
					</div>

					{/* Dish 2 */}
					<div className='group w-full max-w-xs transition-transform duration-300 hover:scale-105'>
						<div className='relative mb-4 aspect-square overflow-hidden rounded-2xl shadow-[0_8px_16px_rgba(0,0,0,0.1)] transition-all duration-300 group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.15)]'>
							<Image
								src='https://i.imgur.com/v8SjYfT.jpeg'
								alt='Ramen'
								fill
								className='object-cover transition-transform duration-300 group-hover:scale-110'
							/>
						</div>
						<p className='mb-1 text-center text-lg font-semibold'>
							Ramen Delight
						</p>
						<p className='mb-4 text-center text-sm text-muted-foreground'>
							by @Nigella
						</p>
						<Button
							className='w-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(102,126,234,0.3)] active:scale-95'
							size='lg'
						>
							Vote
						</Button>
					</div>
				</div>
			</div>
		</PageContainer>
	)
}
