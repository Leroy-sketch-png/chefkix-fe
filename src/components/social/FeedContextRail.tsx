import Link from 'next/link'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Compass, MessageSquare, Sparkles, Users } from 'lucide-react'
import { FriendsOnlineWidget } from '@/components/social/FriendsOnlineWidget'

interface FeedContextRailProps {
	showFriendsOnline: boolean
}

export function FeedContextRail({ showFriendsOnline }: FeedContextRailProps) {
	const t = useTranslations('feed')
	return (
		<motion.aside
			initial={{ opacity: 0, x: 10 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
			className='hidden xl:flex xl:flex-col xl:gap-4 xl:self-start xl:sticky xl:top-24'
		>
			<div className='overflow-hidden rounded-xl border border-border-subtle bg-bg-card/75 backdrop-blur-md p-4 shadow-card'>
				<div className='w-full'>
					<p className='text-2xs font-bold uppercase tracking-widest text-text-muted'>
						{t('quickMovesEyebrow')}
					</p>
					<div className='mt-3 grid gap-2'>
						<Link
							href='/community'
							className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
						>
							<Users className='size-3.5' />
							{t('quickMovesCommunity')}
						</Link>
						<Link
							href='/explore'
							className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
						>
							<Compass className='size-3.5' />
							{t('quickMovesExplore')}
						</Link>
						<Link
							href='/messages'
							className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
						>
							<MessageSquare className='size-3.5' />
							{t('quickMovesMessages')}
						</Link>
						<Link
							href='/challenges'
							className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
						>
							<Sparkles className='size-3.5' />
							{t('quickMovesChallenges')}
						</Link>
					</div>
				</div>
			</div>

			{showFriendsOnline && <FriendsOnlineWidget />}
		</motion.aside>
	)
}
