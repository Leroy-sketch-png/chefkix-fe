'use client'

import { useAuthStore } from '@/store/authStore'
import { GroupsExploreGrid } from '@/components/groups'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Groups explore page
 * Allows users to discover and create groups
 */
export default function GroupsExplorePage() {
	const user = useAuthStore((state) => state.user)
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
	const router = useRouter()

	useEffect(() => {
		if (!isAuthenticated) {
			router.push('/auth/sign-in')
		}
	}, [isAuthenticated, router])

	if (!isAuthenticated) {
		return null
	}

	return (
		<main className='min-h-screen py-8'>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
				<GroupsExploreGrid currentUserId={user?.userId} />
			</div>
		</main>
	)
}
