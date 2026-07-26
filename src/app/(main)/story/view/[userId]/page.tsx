'use client'

import { use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { StoryViewer } from '@/components/story/StoryViewer'

interface ViewStoryPageProps {
	params: Promise<{ userId: string }>
	searchParams: Promise<{ startAt?: string | string[] }>
}

export default function ViewStoryPage({
	params,
	searchParams,
}: ViewStoryPageProps) {
	const router = useRouter()
	const { userId } = use(params)
	const { startAt } = use(searchParams)
	const startAtStoryId = Array.isArray(startAt) ? startAt[0] : startAt
	const handleClose = useCallback(() => router.push('/'), [router])

	return (
		<div className='fixed inset-0 z-modal bg-black'>
			<StoryViewer
				userId={userId}
				startAtStoryId={startAtStoryId || null}
				onClose={handleClose}
			/>
		</div>
	)
}
