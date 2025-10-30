'use client'

import { useUiStore } from '@/store/uiStore'
import {
	Sparkles,
	User,
	Clock,
	BarChart2,
	X,
	ChevronLeft,
	ChevronRight,
} from 'lucide-react'
import Image from 'next/image'

export const CookingPlayer = () => {
	const { isCookingPlayerOpen, toggleCookingPlayer } = useUiStore()

	if (!isCookingPlayerOpen) return null

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm animate-in fade-in'>
			<div className='flex h-full max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-lg animate-in slide-in-from-bottom-12'>
				{/* Header */}
				<div className='relative bg-gradient-to-r from-red-400 to-orange-400 p-6 text-center text-white'>
					<button className='absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/20 px-3 py-2 text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-white/30'>
						<Sparkles className='h-4 w-4' /> AI Remix
					</button>
					<button
						onClick={toggleCookingPlayer}
						className='absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-black/20 transition-colors hover:bg-black/40'
					>
						<X className='h-5 w-5' />
					</button>
					<h2 className='text-2xl font-bold'>Spicy Tomato Ramen</h2>
					<div className='mt-3 flex justify-center gap-6 text-sm opacity-90'>
						<span className='flex items-center gap-1.5'>
							<User className='h-4 w-4' /> by ChefAnna
						</span>
						<span className='flex items-center gap-1.5'>
							<Clock className='h-4 w-4' /> 25 Mins
						</span>
						<span className='flex items-center gap-1.5'>
							<BarChart2 className='h-4 w-4' /> Easy
						</span>
					</div>
				</div>

				{/* Progress Bar */}
				<div className='bg-muted p-4'>
					<div className='h-2.5 w-full rounded-full bg-border'>
						<div
							className='h-2.5 rounded-full bg-primary'
							style={{ width: '20%' }}
						></div>
					</div>
				</div>

				{/* Step Content */}
				<div className='flex-1 overflow-y-auto p-6 text-center'>
					<div className='relative mx-auto mb-4 h-52 w-52 overflow-hidden rounded-lg shadow-md'>
						<Image
							src='https://i.imgur.com/v8SjYfT.jpeg'
							alt='Step 1'
							fill
							className='object-cover'
						/>
					</div>
					<h3 className='mb-3 text-xl font-bold'>Step 1: Sauté Aromatics</h3>
					<p className='mx-auto mb-6 max-w-md text-muted-foreground'>
						Finely chop garlic and ginger. Heat sesame oil in a pot over medium
						heat, then add the aromatics and cook until fragrant (about 2
						minutes).
					</p>

					{/* Timer */}
					<div className='mx-auto mb-6 inline-block rounded-lg bg-orange-100 p-3'>
						<span className='text-sm'>Timer:</span>
						<div className='text-3xl font-bold text-orange-500'>02:00</div>
					</div>

					{/* Ingredients Checklist */}
					<div className='mx-auto max-w-sm rounded-lg bg-muted p-4 text-left'>
						<h4 className='mb-3 font-semibold'>Checklist for this step:</h4>
						<div className='flex flex-col gap-2'>
							<label className='flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-background'>
								<div className='h-5 w-5 flex-shrink-0 rounded-md border-2 border-border'></div>
								<span>2 cloves Garlic</span>
							</label>
							<label className='flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-background'>
								<div className='h-5 w-5 flex-shrink-0 rounded-md border-2 border-border'></div>
								<span>1 tsp Ginger</span>
							</label>
						</div>
					</div>
				</div>

				{/* Navigation */}
				<div className='flex items-center justify-between border-t bg-muted p-4'>
					<button className='flex items-center gap-2 rounded-full bg-border px-6 py-3 font-bold text-muted-foreground transition-colors hover:bg-border/80'>
						<ChevronLeft /> Back
					</button>
					<button className='flex items-center gap-2 rounded-full bg-gradient-to-r from-green-400 to-green-500 px-6 py-3 font-bold text-white transition-transform hover:scale-105'>
						Next Step <ChevronRight />
					</button>
				</div>
			</div>
		</div>
	)
}
