import { motion } from 'framer-motion'
import { ArrowLeft, Heart, MessageCircle, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Post } from '@/lib/types'

interface PostDetailCommandDeckProps {
	post: Post
	onBack: () => void
	className?: string
}

export function PostDetailCommandDeck({
	post,
	onBack,
	className,
}: PostDetailCommandDeckProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				'flex items-center justify-between rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card md:p-5',
				className,
			)}
		>
			<button
				type='button'
				onClick={onBack}
				className='flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-all hover:bg-bg-elevated hover:text-text-primary'
				aria-label='Go back'
			>
				<ArrowLeft className='size-4' />
				Back
			</button>

			<div className='flex items-center gap-4'>
				<div className='flex items-center gap-1 rounded-lg bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-secondary'>
					<Heart className='size-3.5' />
					{post.likes ?? 0}
				</div>
				<div className='flex items-center gap-1 rounded-lg bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-secondary'>
					<MessageCircle className='size-3.5' />
					{post.commentCount ?? 0}
				</div>
				<button
					type='button'
					className='flex items-center gap-1 rounded-lg bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-secondary transition-all hover:bg-brand/10 hover:text-brand'
					aria-label='Share post'
				>
					<Share2 className='size-3.5' />
					Share
				</button>
			</div>
		</motion.div>
	)
}
