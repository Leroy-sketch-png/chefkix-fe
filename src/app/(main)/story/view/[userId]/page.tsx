'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { StoryViewer } from '@/components/story/StoryViewer'

interface ViewStoryPageProps {
	params: Promise<{ userId: string }>
	searchParams: Promise<{ name?: string; avatar?: string }> // 🌟 Khai báo thêm searchParams
}

export default function ViewStoryPage({
	params,
	searchParams,
}: ViewStoryPageProps) {
	const router = useRouter()

	// 🌟 Bóc vỏ an toàn bằng React.use() cho Next.js 15
	const { userId } = use(params)
	const { name, avatar } = use(searchParams)

	return (
		<div className='fixed inset-0 z-[100] bg-black'>
			<StoryViewer
				userId={userId}
				authorName={name} // 🌟 Chuyền vào cho Viewer
				authorAvatar={avatar} // 🌟 Chuyền vào cho Viewer
				onClose={() => router.push('/')}
			/>
		</div>
	)
}
