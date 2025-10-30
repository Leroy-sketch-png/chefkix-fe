'use client'

import { Button } from '@/components/ui/button'
import { useUiStore } from '@/store/uiStore'

export default function DashboardPage() {
	const { toggleCookingPlayer } = useUiStore()
	return (
		<div>
			<h1 className='text-2xl font-bold'>Dashboard</h1>
			<p>Welcome to your dashboard.</p>

			<div className='mt-8'>
				<h2 className='mb-4 text-lg font-semibold'>DEV: Test Triggers</h2>
				<Button onClick={toggleCookingPlayer}>Open Cooking Player</Button>
			</div>
		</div>
	)
}
