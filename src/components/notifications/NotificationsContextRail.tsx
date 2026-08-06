import Link from 'next/link'
import { motion } from 'framer-motion'
import { Compass, Sparkles, Users, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface NotificationsContextRailProps {
	className?: string
}

export function NotificationsContextRail({
	className,
}: NotificationsContextRailProps) {
	const t = useTranslations('notifications')
	return (
		<motion.aside
			initial={{ opacity: 0, x: 10 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				'hidden xl:flex xl:flex-col xl:gap-6 xl:sticky xl:top-24 xl:self-start',
				className,
			)}
		>
			<div className='rounded-2xl border border-border-subtle/80 bg-bg-card p-4 shadow-card'>
				<p className='text-2xs font-bold uppercase tracking-widest text-text-muted'>
					{t('railQuickMoves')}
				</p>
				<div className='mt-3 grid gap-2'>
					<Link
						href='/explore'
						className='group inline-flex items-center justify-between gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2.5 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<span className='inline-flex items-center gap-2'>
							<Compass className='size-3.5' />
							{t('railExploreRecipes')}
						</span>
						<ArrowRight className='size-3.5 text-text-muted transition-transform group-hover:translate-x-0.5' />
					</Link>
					<Link
						href='/challenges'
						className='group inline-flex items-center justify-between gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2.5 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<span className='inline-flex items-center gap-2'>
							<Sparkles className='size-3.5' />
							{t('railOpenChallenges')}
						</span>
						<ArrowRight className='size-3.5 text-text-muted transition-transform group-hover:translate-x-0.5' />
					</Link>
					<Link
						href='/community'
						className='group inline-flex items-center justify-between gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2.5 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<span className='inline-flex items-center gap-2'>
							<Users className='size-3.5' />
							{t('railVisitCommunity')}
						</span>
						<ArrowRight className='size-3.5 text-text-muted transition-transform group-hover:translate-x-0.5' />
					</Link>
				</div>
			</div>
		</motion.aside>
	)
}
