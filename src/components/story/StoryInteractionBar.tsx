import React, { useState } from 'react'
import { Heart, Smile, Zap, Frown, ThumbsDown } from 'lucide-react'

interface Props {
	onReact: (event: React.MouseEvent<HTMLButtonElement>, type: string) => void
	onReply: (text: string) => void
}

export default function StoryInteractionBar({ onReact, onReply }: Props) {
	const [text, setText] = useState('')

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' && text.trim().length > 0) {
			onReply(text.trim())
			setText('')
		}
	}

	return (
		<div className='w-full flex items-center gap-3'>
			<div className='flex-1'>
				<input
					value={text}
					onChange={e => setText(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder='Gửi tin nhắn...'
					className='w-full py-2 px-4 rounded-full bg-white/10 backdrop-blur-sm text-sm text-white placeholder:text-white/60 outline-none'
				/>
			</div>

			<div className='flex items-center gap-2'>
				<button
					onClick={event => onReact(event, 'LOVE')}
					className='p-2 rounded-full bg-white/10 hover:bg-white/20'
					aria-label='love'
				>
					<Heart size={18} className='text-pink-400' />
				</button>
				<button
					onClick={event => onReact(event, 'HAHA')}
					className='p-2 rounded-full bg-white/10 hover:bg-white/20'
					aria-label='haha'
				>
					<Smile size={18} className='text-yellow-300' />
				</button>
				<button
					onClick={event => onReact(event, 'WOW')}
					className='p-2 rounded-full bg-white/10 hover:bg-white/20'
					aria-label='wow'
				>
					<Zap size={18} className='text-indigo-300' />
				</button>
				<button
					onClick={event => onReact(event, 'SAD')}
					className='p-2 rounded-full bg-white/10 hover:bg-white/20'
					aria-label='sad'
				>
					<Frown size={18} className='text-blue-300' />
				</button>
				<button
					onClick={event => onReact(event, 'ANGRY')}
					className='p-2 rounded-full bg-white/10 hover:bg-white/20'
					aria-label='angry'
				>
					<ThumbsDown size={18} className='text-red-400' />
				</button>
			</div>
		</div>
	)
}
