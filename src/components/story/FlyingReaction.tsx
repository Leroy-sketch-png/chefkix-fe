// @components/Story/FlyingReaction.tsx
import { motion } from 'framer-motion'
import React from 'react'

interface FlyingReactionProps {
	id: number // Dùng id để Framer Motion nhận diện
	icon: React.ReactNode // Icon React (ví dụ: <Heart />)
	xOffset: number // Tọa độ ngang bắt đầu bay (px)
	onAnimationComplete: (id: number) => void // Callback để xóa sticker khỏi state cha
}

export default function FlyingReaction({
	id,
	icon,
	xOffset,
	onAnimationComplete,
}: FlyingReactionProps) {
	return (
		<motion.div
			key={id}
			// Vị trí bắt đầu (initial state)
			initial={{
				opacity: 1,
				y: 0, // Bắt đầu ở vị trí nút bấm
				x: xOffset,
				scale: 1,
			}}
			// Hiệu ứng bay (animate state)
			animate={{
				opacity: 0, // Làm mờ dần
				y: -300, // Bay lên trên 300px
				// Thêm một chút dao động ngang ngẫu nhiên cho đẹp
				x: xOffset + (Math.random() * 40 - 20),
				scale: 2, // Phóng to gấp đôi
			}}
			// Cấu hình chuyển động
			transition={{
				duration: 1.5, // Bay trong 1.5 giây
				ease: 'easeOut', // Chậm dần đều
			}}
			// Khi animation kết thúc thì gọi callback để xóa khỏi DOM
			onAnimationComplete={() => onAnimationComplete(id)}
			className='absolute bottom-16 pointer-events-none z-50 text-2xl' // Đặt vị trí bắt đầu phía trên interaction bar một chút
		>
			{icon}
		</motion.div>
	)
}
