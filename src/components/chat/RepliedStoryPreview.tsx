import React from 'react'
import Link from 'next/link'

interface Props {
	storyId: string
	thumbnailUrl?: string
	title?: string // Đổi tên prop cho chuẩn xác với dữ liệu BE gửi
}

export default function RepliedStoryPreview({
	storyId,
	thumbnailUrl,
	title = 'Đã phản hồi tin',
}: Props) {
	if (!thumbnailUrl || !storyId) return null

	return (
		<Link href={`/stories/${storyId}`} className='block mb-1 cursor-pointer'>
			{/* Sử dụng bg-black/5 cho nền sáng, và bg-white/10 cho nền tối */}
			<div className='flex items-center gap-2.5 p-1.5 pr-4 rounded-2xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors max-w-[240px]'>
				{/* Thumbnail Story: Hình chữ nhật đứng, bo góc nhẹ */}
				<img
					src={thumbnailUrl}
					alt='story thumbnail'
					className='w-11 h-16 object-cover rounded-xl shadow-sm border border-black/5 dark:border-white/10 flex-shrink-0'
				/>

				<div className='flex flex-col justify-center'>
					{/* In thẳng title từ BE gửi (VD: "Đã phản hồi tin của bạn") */}
					<span className='text-[13px] font-semibold text-neutral-800 dark:text-neutral-200 leading-snug line-clamp-2'>
						{title}
					</span>
					<span className='text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5'>
						Nhấn để xem tin
					</span>
				</div>
			</div>
		</Link>
	)
}
