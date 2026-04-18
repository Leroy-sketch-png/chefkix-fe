'use client'

import { Plus } from 'lucide-react'
import { UserStoryFeedResponse } from '@/lib/types/story'

interface StoryAvatarProps {
	user: UserStoryFeedResponse
	isAddButton?: boolean // 🌟 Biến mới: Xác định rõ đây có phải là nút (+) không
	isCurrentUser?: boolean
}

export const StoryAvatar = ({
	user,
	isAddButton = false,
	isCurrentUser = false,
}: StoryAvatarProps) => {
	// Có hasUnseenStory = true tức là CHƯA XEM -> Lát nữa hiện màu cam
	const hasUnseen = user.hasUnseenStory

	return (
		<div className='flex flex-col items-center gap-2 w-20'>
			<div className='relative'>
				{/* VÒNG TRÒN VIỀN BÊN NGOÀI */}
				<div
					className={`w-16 h-16 rounded-full p-[3px] transition-transform active:scale-95 ${
						isAddButton
							? 'bg-transparent border border-dashed border-neutral-400' // Nút Tạo: Viền xám đứt khúc
							: hasUnseen
								? 'bg-brand' // STORY CHƯA XEM: Màu Cam (Sử dụng màu brand của dự án)
								: 'bg-neutral-300' // STORY ĐÃ XEM: Màu Xám
					}`}
				>
					{/* AVATAR BÊN TRONG */}
					<div className='bg-white w-full h-full rounded-full p-0.5'>
						<img
							src={user.avatarUrl || '/placeholder-avatar.svg'}
							alt={user.displayName || 'Avatar'}
							className='w-full h-full object-cover rounded-full'
						/>
					</div>

					{/* DẤU CỘNG (CHỈ HIỆN Ở NÚT TẠO) */}
					{isAddButton && (
						<div className='absolute -bottom-1 -right-1 bg-brand text-white rounded-full p-1 border-2 border-white flex items-center justify-center'>
							<Plus className='w-3 h-3' strokeWidth={3} />
						</div>
					)}
				</div>
			</div>

			{/* 🌟 TÊN HIỂN THỊ BÊN DƯỚI (Fix lỗi trống tên) */}
			<span className='text-xs font-medium text-text-secondary truncate w-full text-center px-1'>
				{isAddButton
					? 'Add Story'
					: isCurrentUser
						? 'Your Story'
						: user.displayName || 'User'}
			</span>
		</div>
	)
}
