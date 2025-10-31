'use client'

import Image from 'next/image'
import { Clock, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ExplorePage() {
	return (
		<div className='mx-auto max-w-6xl p-4'>
			<h1 className='mb-2 text-3xl font-bold'>Explore Recipes</h1>
			<p className='mb-6 text-muted-foreground'>
				Discover new dishes and flavors from around the world.
			</p>

			<div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
				{/* Template: Recipe Card */}
				<div className='overflow-hidden rounded-lg border bg-card shadow-sm'>
					<div className='relative h-48 w-full'>
						<Image
							src='https://i.imgur.com/v8SjYfT.jpeg'
							alt='Spicy Ramen'
							fill
							className='object-cover'
						/>
					</div>
					<div className='p-4'>
						<h3 className='mb-2 text-lg font-semibold'>Spicy Tomato Ramen</h3>
						<div className='mb-4 flex items-center gap-4 text-sm text-muted-foreground'>
							<span className='flex items-center gap-1'>
								<Clock className='h-4 w-4' /> 25 min
							</span>
							<span className='flex items-center gap-1'>
								<Heart className='h-4 w-4' /> 1.2k
							</span>
						</div>
						<Button className='w-full'>Cook Now</Button>
					</div>
				</div>
				{/* More recipe cards would be populated here */}
				<div className='overflow-hidden rounded-lg border bg-card shadow-sm'>
					<div className='relative h-48 w-full'>
						<Image
							src='https://i.imgur.com/cO1mO8w.jpeg'
							alt='Tacos'
							fill
							className='object-cover'
						/>
					</div>
					<div className='p-4'>
						<h3 className='mb-2 text-lg font-semibold'>Spicy Fish Tacos</h3>
						<div className='mb-4 flex items-center gap-4 text-sm text-muted-foreground'>
							<span className='flex items-center gap-1'>
								<Clock className='h-4 w-4' /> 30 min
							</span>
							<span className='flex items-center gap-1'>
								<Heart className='h-4 w-4' /> 850
							</span>
						</div>
						<Button className='w-full'>Cook Now</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
