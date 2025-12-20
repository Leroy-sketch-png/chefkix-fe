'use client'

import { ChefHat, Sparkles } from 'lucide-react'

// ============================================
// FRIENDS COOKING WIDGET
// ============================================
// This widget shows when friends are cooking in real-time.
// Currently displays "Coming Soon" until WebSocket API is ready.
//
// Future implementation will include:
// - Real-time WebSocket subscription to friends' cooking sessions
// - Live step progress and timer displays
// - "Watch Live" spectator mode
// ============================================

export const FriendsCookingWidget = () => {
	return (
		<div className='rounded-2xl border border-border-subtle bg-bg-card p-4 shadow-card'>
			{/* Header */}
			<div className='mb-3 flex items-center gap-2'>
				<div className='grid size-8 place-items-center rounded-lg bg-success/10'>
					<ChefHat className='size-4 text-success' />
				</div>
				<div>
					<h3 className='text-sm font-bold text-text'>Friends Cooking</h3>
					<p className='text-xs text-text-muted'>Live activity</p>
				</div>
			</div>

			{/* Coming Soon State */}
			<div className='flex flex-col items-center gap-2 py-6 text-center'>
				<div className='grid size-12 place-items-center rounded-full bg-gradient-to-br from-brand/10 to-xp/10'>
					<Sparkles className='size-5 text-brand' />
				</div>
				<div>
					<p className='text-sm font-medium text-text'>Coming Soon</p>
					<p className='mt-1 text-xs text-text-muted'>
						See when friends cook in real-time
					</p>
				</div>
			</div>
		</div>
	)
}
