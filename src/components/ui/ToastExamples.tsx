'use client'

import { useState } from 'react'
import { toast } from '@/components/ui/toaster'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

/**
 * Toast Examples Component
 *
 * Demonstrates all toast variants, features, and use cases:
 * - Success/Error/Warning/Info variants
 * - Action buttons
 * - Promise handling
 * - Queue management
 * - Custom durations
 */

export const ToastExamples = () => {
	const [loading, setLoading] = useState(false)

	// Basic variants
	const handleSuccess = () => {
		toast.success(
			'Recipe saved!',
			'Your recipe has been added to your collection.',
		)
	}

	const handleError = () => {
		toast.error('Failed to save', 'Please try again or contact support.')
	}

	const handleWarning = () => {
		toast.warning(
			'Unsaved changes',
			'You have unsaved changes that will be lost.',
		)
	}

	const handleInfo = () => {
		toast.info(
			'New feature available',
			'Check out the new recipe timer feature!',
		)
	}

	// With action button
	const handleWithAction = () => {
		toast.success('Post deleted', 'Your post has been removed.', {
			action: {
				label: 'Undo',
				onClick: () => {
					toast.info('Post restored', 'Your post has been restored.')
				},
			},
		})
	}

	// Promise example
	const handlePromiseToast = () => {
		const fakeApiCall = new Promise((resolve, reject) => {
			setTimeout(() => {
				Math.random() > 0.5
					? resolve({ name: 'Chocolate Cake' })
					: reject(new Error('Network error'))
			}, 2000)
		})

		toast.promise(fakeApiCall, {
			loading: 'Saving recipe...',
			success: (data: any) => `${data.name} saved successfully!`,
			error: (err: any) => `Failed: ${err.message}`,
		})
	}

	// Custom duration
	const handleLongToast = () => {
		toast.info('Read carefully', 'This message stays for 10 seconds.', {
			duration: 10000,
		})
	}

	const handleNoAutoDismiss = () => {
		toast.warning('Action required', 'This toast stays until you close it.', {
			duration: 0,
		})
	}

	// Multiple toasts
	const handleMultiple = () => {
		toast.success('Step 1 complete')
		setTimeout(() => toast.success('Step 2 complete'), 500)
		setTimeout(() => toast.success('Step 3 complete'), 1000)
		setTimeout(() => toast.success('All done!'), 1500)
	}

	// Real-world scenarios
	const handleRecipeSaved = () => {
		toast.success('Recipe saved!', 'Added to your cookbook.', {
			action: {
				label: 'View',
				onClick: () => toast.info('Opening cookbook...'),
			},
		})
	}

	const handlePostCreated = () => {
		toast.success('Post published!', 'Your cooking journey is live.', {
			action: {
				label: 'Share',
				onClick: () => toast.info('Opening share menu...'),
			},
		})
	}

	const handleFollowUser = () => {
		toast.success(
			'Following @chefmaster',
			'You will see their recipes in your feed.',
		)
	}

	const handleNetworkError = () => {
		toast.error('Connection lost', 'Check your internet and try again.', {
			action: {
				label: 'Retry',
				onClick: () => toast.info('Reconnecting...'),
			},
		})
	}

	return (
		<div className='container mx-auto max-w-4xl space-y-8 py-12'>
			<div className='space-y-2'>
				<h1 className='text-3xl font-bold'>Toast Notifications</h1>
				<p className='text-text-secondary'>
					Complete toast system with variants, actions, and queue management.
				</p>
			</div>

			{/* Basic Variants */}
			<Card className='space-y-4 p-6'>
				<h2 className='text-xl font-semibold'>Basic Variants</h2>
				<div className='flex flex-wrap gap-3'>
					<Button onClick={handleSuccess} variant='outline'>
						Success Toast
					</Button>
					<Button onClick={handleError} variant='outline'>
						Error Toast
					</Button>
					<Button onClick={handleWarning} variant='outline'>
						Warning Toast
					</Button>
					<Button onClick={handleInfo} variant='outline'>
						Info Toast
					</Button>
				</div>
			</Card>

			{/* With Actions */}
			<Card className='space-y-4 p-6'>
				<h2 className='text-xl font-semibold'>With Action Buttons</h2>
				<div className='flex flex-wrap gap-3'>
					<Button onClick={handleWithAction} variant='outline'>
						Toast with Undo
					</Button>
					<Button onClick={handleRecipeSaved} variant='outline'>
						Recipe Saved (View)
					</Button>
					<Button onClick={handlePostCreated} variant='outline'>
						Post Created (Share)
					</Button>
					<Button onClick={handleNetworkError} variant='outline'>
						Network Error (Retry)
					</Button>
				</div>
			</Card>

			{/* Promise Handling */}
			<Card className='space-y-4 p-6'>
				<h2 className='text-xl font-semibold'>Promise Handling</h2>
				<p className='text-sm text-text-secondary'>
					Automatically handles loading → success/error states
				</p>
				<Button onClick={handlePromiseToast} variant='outline'>
					Save Recipe (50% fail rate)
				</Button>
			</Card>

			{/* Custom Durations */}
			<Card className='space-y-4 p-6'>
				<h2 className='text-xl font-semibold'>Custom Durations</h2>
				<div className='flex flex-wrap gap-3'>
					<Button onClick={handleLongToast} variant='outline'>
						10 Second Toast
					</Button>
					<Button onClick={handleNoAutoDismiss} variant='outline'>
						No Auto-Dismiss
					</Button>
				</div>
			</Card>

			{/* Multiple Toasts */}
			<Card className='space-y-4 p-6'>
				<h2 className='text-xl font-semibold'>Queue Management</h2>
				<p className='text-sm text-text-secondary'>
					Shows up to 5 toasts, automatically manages stack
				</p>
				<Button onClick={handleMultiple} variant='outline'>
					Show 4 Sequential Toasts
				</Button>
			</Card>

			{/* Real-world Use Cases */}
			<Card className='space-y-4 p-6'>
				<h2 className='text-xl font-semibold'>Real-world Scenarios</h2>
				<div className='flex flex-wrap gap-3'>
					<Button onClick={handleFollowUser} variant='outline'>
						Follow User
					</Button>
					<Button
						onClick={() => {
							toast.success('Badge earned!', '🏆 First Recipe Completed')
						}}
						variant='outline'
					>
						Badge Earned
					</Button>
					<Button
						onClick={() => {
							toast.warning('Timer expired', 'Check your dish!', {
								action: {
									label: 'Dismiss',
									onClick: () => {},
								},
							})
						}}
						variant='outline'
					>
						Timer Alert
					</Button>
					<Button
						onClick={() => {
							toast.info('New follower', 'ChefMaster is now following you!', {
								action: {
									label: 'Follow back',
									onClick: () => toast.success('Following ChefMaster!'),
								},
							})
						}}
						variant='outline'
					>
						New Follower
					</Button>
				</div>
			</Card>

			{/* Dismiss All */}
			<Card className='space-y-4 p-6'>
				<h2 className='text-xl font-semibold'>Dismiss Control</h2>
				<Button onClick={() => toast.dismissAll()} variant='destructive'>
					Dismiss All Toasts
				</Button>
			</Card>
		</div>
	)
}
