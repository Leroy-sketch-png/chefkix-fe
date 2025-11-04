'use client'

import { Trophy, Calendar, Users, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/layout/PageContainer'

export default function ChallengesPage() {
	return (
		<PageContainer maxWidth='md'>
			{/* Header */}
			<div className='mb-8 animate-fadeIn'>
				<h1 className='mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-3xl font-bold text-transparent'>
					Weekly Challenges
				</h1>
				<p className='text-muted-foreground'>
					Test your skills and earn exclusive badges!
				</p>
			</div>

			{/* Active Challenge Card */}
			<div className='group animate-scaleIn rounded-2xl border border-border bg-gradient-to-br from-card to-card/50 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-glow'>
				{/* Badge */}
				<div className='mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary'>
					<Sparkles className='h-4 w-4' />
					Weekly Challenge
				</div>
				{/* Title */}
				<h2 className='mb-3 text-2xl font-bold'>The Ultimate Pasta-Off</h2>
				{/* Description */}
				<p className='mb-6 leading-relaxed text-muted-foreground'>
					Create an original pasta dish using only 5 ingredients. Most creative
					recipe wins!
				</p>
				{/* CTA Button */}
				<Button
					size='lg'
					className='group/btn mb-6 w-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 sm:w-auto'
				>
					<Trophy className='mr-2 h-5 w-5 transition-transform group-hover/btn:scale-110' />
					Join Challenge
				</Button>
				{/* Progress Bar */}
				<div className='mb-3 h-3 w-full overflow-hidden rounded-full bg-muted'>
					<div
						className='h-full rounded-full bg-gradient-to-r from-primary to-accent shadow-glow transition-all duration-500'
						style={{ width: '40%' }}
					></div>
				</div>{' '}
				{/* Stats */}
				<div className='flex items-center gap-4 text-sm text-muted-foreground'>
					<div className='flex items-center gap-1.5'>
						<Calendar className='h-4 w-4' />
						<span>3 days left</span>
					</div>
					<div className='h-1 w-1 rounded-full bg-muted-foreground/40'></div>
					<div className='flex items-center gap-1.5'>
						<Users className='h-4 w-4' />
						<span>1,204 participants</span>
					</div>
				</div>
			</div>
		</PageContainer>
	)
}
