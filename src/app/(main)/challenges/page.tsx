'use client'

import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/layout/PageContainer'

export default function ChallengesPage() {
	return (
		<PageContainer maxWidth='md'>
			<h1 className='mb-2 text-3xl font-bold'>Weekly Challenges</h1>
			<p className='mb-6 text-muted-foreground'>
				Test your skills and earn exclusive badges!
			</p>

			{/* Template: Challenge Card */}
			<div className='rounded-lg border bg-card p-6 shadow-sm'>
				<h3 className='mb-2 text-lg font-semibold text-primary'>
					Weekly Challenge
				</h3>
				<h2 className='mb-4 text-2xl font-bold'>The Ultimate Pasta-Off</h2>
				<p className='mb-6 text-muted-foreground'>
					Create an original pasta dish using only 5 ingredients. Most creative
					recipe wins!
				</p>
				<Button size='sm'>Join Challenge</Button>
				<div className='mt-6 h-2.5 w-full rounded-full bg-muted'>
					<div
						className='h-full rounded-full bg-primary'
						style={{ width: '40%' }}
					></div>
				</div>
				<p className='mt-2 text-sm text-muted-foreground'>
					3 days left • 1,204 participants
				</p>
			</div>
		</PageContainer>
	)
}
