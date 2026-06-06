import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Bookmark, Flag, Share2, Zap } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Post } from '@/lib/types'

interface PostDetailContextRailProps {
	post: Post
	className?: string
}

function QuickActionButton({
	icon: Icon,
	label,
	href,
	onClick,
	variant = 'default',
}: {
	icon: typeof Bookmark
	label: string
	href?: string
	onClick?: () => void
	variant?: 'default' | 'danger'
}) {
	const className =
		'inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'

	const dangerClassName = className.replace(
		'border-brand/25 hover:bg-brand/8 hover:text-brand',
		'border-error/25 hover:bg-error/8 hover:text-error',
	)

	const finalClassName = variant === 'danger' ? dangerClassName : className

	if (href) {
		return (
			<Link href={href} className={finalClassName}>
				<Icon className='size-3.5' />
				{label}
			</Link>
		)
	}

	return (
		<button type='button' onClick={onClick} className={finalClassName}>
			<Icon className='size-3.5' />
			{label}
		</button>
	)
}

export function PostDetailContextRail({
	post,
	className,
}: PostDetailContextRailProps) {
	const t = useTranslations('post')
	return (
		<motion.aside
			initial={{ opacity: 0, x: 10 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				'hidden xl:flex xl:flex-col xl:gap-4 xl:self-start xl:sticky xl:top-24',
				className,
			)}
		>
			<div className='rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card'>
				<p className='text-2xs font-bold uppercase tracking-widest text-text-muted'>
					{t('postEngagement')}
				</p>
				<div className='mt-3 space-y-2 border-t border-border-subtle pt-3'>
					<div className='flex items-center justify-between'>
						<span className='text-xs font-medium text-text-secondary'>
							{t('reactions')}
						</span>
						<span className='text-sm font-black text-text-primary'>
							{post.likes ?? 0}
						</span>
					</div>
					<div className='flex items-center justify-between'>
						<span className='text-xs font-medium text-text-secondary'>
							{t('commentsLabel')}
						</span>
						<span className='text-sm font-black text-text-primary'>
							{post.commentCount ?? 0}
						</span>
					</div>
					{post.sessionId && (
						<div className='flex items-center justify-between'>
							<span className='text-xs font-medium text-text-secondary'>
								{t('sessionXp')}
							</span>
							<span className='text-sm font-black text-xp'>
								+{Math.round(post.xpEarned ?? 0)}
							</span>
						</div>
					)}
				</div>
			</div>

			<div className='rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card'>
				<p className='text-2xs font-bold uppercase tracking-widest text-text-muted'>
					{t('quickActions')}
				</p>
				<div className='mt-3 grid gap-2'>
					<QuickActionButton icon={Bookmark} label={t('savePostLabel')} />
					<QuickActionButton icon={Share2} label={t('sharePost')} />
					{post.userId && (
						<QuickActionButton
							icon={Zap}
							label={t('visitAuthor')}
							href={`/${post.userId}`}
						/>
					)}
					<QuickActionButton
						icon={Flag}
						label={t('reportLabel')}
						variant='danger'
					/>
				</div>
			</div>
		</motion.aside>
	)
}
