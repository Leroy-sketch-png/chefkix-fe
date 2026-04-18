'use client'

import { StoryAvatar } from './StoryAvatar'
import { useAuth } from '@/hooks/useAuth'
import { UserStoryFeedResponse } from '@/lib/types/story'
import { Skeleton } from '@/components/ui/skeleton'
import { useRouter } from 'next/navigation'

interface StoryFeedProps {
	stories: UserStoryFeedResponse[]
	isLoading: boolean
	onStoryClick: (user: UserStoryFeedResponse) => void
}

const StorySkeleton = () => (
	<div className='flex flex-col items-center gap-2 w-20'>
		<Skeleton className='w-16 h-16 rounded-full' />
		<Skeleton className='w-14 h-4' />
	</div>
)

export const StoryFeed = ({
	stories = [],
	isLoading,
	onStoryClick,
}: StoryFeedProps) => {
	const { user: currentUser } = useAuth()
	const router = useRouter()

	if (isLoading) {
		return (
			<div className='flex gap-4 overflow-x-auto pb-4 pt-1 px-4 md:px-0'>
				{Array.from({ length: 5 }).map((_, i) => (
					<StorySkeleton key={i} />
				))}
			</div>
		)
	}

	// 1️⃣ Tạo sẵn 1 cục Data giả định để vẽ nút "Add Story" tĩnh
	const addStoryData: UserStoryFeedResponse = {
		userId: currentUser?.userId || 'add-btn',
		displayName: 'Add Story',
		avatarUrl: currentUser?.avatarUrl || '/placeholder-avatar.svg',
		hasUnseenStory: false,
	}

	return (
		<div className='flex gap-4 overflow-x-auto pb-4 pt-1 px-4 md:px-0 snap-x scrollbar-hide'>
			{/* 1️⃣ NÚT TẠO STORY LUÔN LUÔN NẰM ĐẦU TIÊN BÊN TRÁI */}
			<div
				className='snap-start shrink-0 cursor-pointer'
				onClick={() => router.push('/story/create')}
			>
				<StoryAvatar
					user={addStoryData}
					isAddButton={true} // Báo cho Component biết đây là nút tĩnh
				/>
			</div>

			{/* 2️⃣ DANH SÁCH STORY TỪ API (CỦA MÌNH VÀ CỦA NGƯỜI KHÁC NỐI TIẾP NHAU) */}
			{stories.map((storyUser, index) => {
				// Kiểm tra xem Story này có phải là của chính mình không
				const isMe = storyUser.userId === currentUser?.userId

				return (
					<div
						key={`${storyUser.userId}-${index}`} // Tránh lỗi trùng key của React
						className='snap-start shrink-0 cursor-pointer'
						onClick={() => onStoryClick(storyUser)} // Nhấn vào thì gọi hàm View Story
					>
						<StoryAvatar
							user={storyUser}
							isAddButton={false} // Đây là Story thật, không phải nút thêm
							isCurrentUser={isMe}
						/>
					</div>
				)
			})}
		</div>
	)
}
