'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Typewriter } from 'react-simple-typewriter'

export default function HomePage() {
	const router = useRouter()
	const { user, isLoading } = useAuth()

	useEffect(() => {
		if (!isLoading) {
			if (user) {
				// Redirect authenticated users to dashboard
				router.push('/dashboard')
			} else {
				// Redirect guests to sign-in
				router.push('/auth/sign-in')
			}
		}
	}, [user, isLoading, router])

	// Show loading state while redirecting with Typewriter effect
	return (
		<div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5'>
			<div className='text-center'>
				<h1 className='mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-4xl font-bold text-transparent'>
					Chefkix
				</h1>
				<p className='text-lg text-text-secondary'>
					<Typewriter
						words={[
							'Cook with confidence...',
							'Learn new recipes...',
							'Share your creations...',
							'Join the community...',
						]}
						loop={0}
						cursor
						cursorStyle='|'
						typeSpeed={70}
						deleteSpeed={50}
						delaySpeed={1000}
					/>
				</p>
			</div>
		</div>
	)
}
