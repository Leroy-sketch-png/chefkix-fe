import React from 'react'
import Link from 'next/link'

interface Props {
	storyId: string
	storyOwnerId?: string // Thêm cái này nếu bạn đang dùng logic truyền cả 2 ID
	thumbnailUrl?: string
	title?: string
}

export default function RepliedStoryPreview({
	storyId,
	storyOwnerId,
	thumbnailUrl,
	title,
}: Props) {
	if (!thumbnailUrl || !storyId) return null

	// Tạo href linh hoạt: Có ownerId thì truyền cả hai, không thì truyền một
	const linkHref = `/story/view/${storyOwnerId}?startAt=${storyId}`

	return (
		<Link
			href={linkHref} // ✅ SỬA LẠI THÀNH DÒNG NÀY
			className='group block w-fit mb-1 transition-transform active:scale-95'
		>
			<div className='relative flex items-center gap-3 p-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/10 shadow-sm'>
				{/* Thumbnail Story - Tỷ lệ đứng 9:16 */}
				<div className='relative w-10 h-16 flex-shrink-0 overflow-hidden rounded-lg border border-black/5'>
					<img
						src={thumbnailUrl}
						alt='story thumb'
						className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-300'
					/>
				</div>

				<div className='flex flex-col pr-2'>
					<span className='text-[13px] font-medium text-neutral-900 dark:text-neutral-100 leading-tight'>
						{title || 'Đã phản hồi tin của bạn'}
					</span>
					<span className='text-[11px] text-neutral-500 dark:text-neutral-400 mt-1'>
						Xem tin →
					</span>
				</div>

				{/* Hiệu ứng overlay khi hover */}
				<div className='absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors' />
			</div>
		</Link>
	)
}
