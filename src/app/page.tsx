'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

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

	// Show loading state while redirecting
	return (
		<div className='flex min-h-screen items-center justify-center'>
			<div className='text-center'>
				<h1 className='text-2xl font-bold'>Chefkix</h1>
				<p className='text-muted-foreground'>Loading...</p>
			</div>
		</div>
	)
}
