import React from 'react'

interface Props {
	thumbnailUrl?: string
	authorName?: string
}

export default function RepliedStoryPreview({
	thumbnailUrl,
	authorName,
}: Props) {
	return (
		<div className='flex items-center gap-3 border border-white/10 rounded-md p-2 bg-white/5'>
			<img
				src={thumbnailUrl}
				alt='story thumb'
				className='w-10 h-14 object-cover rounded-sm'
			/>
			<div className='text-xs text-white/90'>
				<div className='font-semibold'>Bạn đã trả lời tin của {authorName}</div>
			</div>
		</div>
	)
}
