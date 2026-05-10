import Link from 'next/link'
import { motion } from 'framer-motion'
import {
	Activity,
	ChefHat,
	Compass,
	Flame,
	Layers,
	Medal,
	Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RailTab {
	id: string
	label: string
	icon: React.ComponentType<{ className?: string }>
	count?: number
}

interface ProfileCommandRailProps {
	displayName: string
	username: string
	level: number
	xp: number
	xpGoal: number
	streakCount: number
	followers: number
	recipesCooked: number
	postCount: number
	pendingPosts: number
	isOwnProfile: boolean
	activeTab: string
	tabs: RailTab[]
	onTabChange: (tab: string) => void
	className?: string
}

function StatChip({ label, value }: { label: string; value: string }) {
	return (
		<div className='rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2'>
			<p className='text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted'>
				{label}
			</p>
			<p className='mt-1 text-sm font-bold text-text-primary'>{value}</p>
		</div>
	)
}

export function ProfileCommandRail({
	displayName,
	username,
	level,
	xp,
	xpGoal,
	streakCount,
	followers,
	recipesCooked,
	postCount,
	pendingPosts,
	isOwnProfile,
	activeTab,
	tabs,
	onTabChange,
	className,
}: ProfileCommandRailProps) {
	return (
		<motion.aside
			initial={{ opacity: 0, x: 12 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				'hidden xl:flex xl:flex-col xl:gap-4 xl:self-start xl:sticky xl:top-24',
				className,
			)}
		>
			<div className='rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card'>
				<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-brand'>
					Profile Command
				</p>
				<h3 className='mt-1 text-lg font-black text-text-primary'>
					{displayName}
				</h3>
				<p className='text-xs text-text-muted'>@{username}</p>
				<div className='mt-3 grid grid-cols-2 gap-2'>
					<StatChip label='Level' value={`Lv.${level}`} />
					<StatChip label='XP' value={`${xp}/${xpGoal}`} />
					<StatChip label='Streak' value={`${streakCount}d`} />
					<StatChip label='Followers' value={followers.toString()} />
				</div>
			</div>

			<div className='rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card'>
				<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted'>
					Jump To Section
				</p>
				<div className='mt-3 grid gap-2'>
					{tabs.map(tab => {
						const Icon = tab.icon
						const isActive = activeTab === tab.id
						return (
							<button
								type='button'
								key={tab.id}
								onClick={() => onTabChange(tab.id)}
								className={cn(
									'inline-flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-all',
									isActive
										? 'border-brand/30 bg-brand/10 text-brand'
										: 'border-border-subtle bg-bg-elevated text-text-secondary hover:border-brand/20 hover:bg-brand/8 hover:text-brand',
								)}
							>
								<span className='inline-flex items-center gap-2'>
									<Icon className='size-3.5' />
									{tab.label}
								</span>
								{typeof tab.count === 'number' && (
									<span className='rounded-full bg-bg-card px-2 py-0.5 text-[10px] font-bold text-text-muted'>
										{tab.count}
									</span>
								)}
							</button>
						)
					})}
				</div>
			</div>

			<div className='rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card'>
				<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted'>
					Intensity Signals
				</p>
				<div className='mt-3 grid gap-2 text-xs text-text-secondary'>
					<div className='flex items-center gap-2 rounded-lg bg-bg-elevated px-3 py-2'>
						<ChefHat className='size-3.5 text-brand' />
						<span>{recipesCooked} recipes cooked</span>
					</div>
					<div className='flex items-center gap-2 rounded-lg bg-bg-elevated px-3 py-2'>
						<Activity className='size-3.5 text-xp' />
						<span>{postCount} posts published</span>
					</div>
					<div className='flex items-center gap-2 rounded-lg bg-bg-elevated px-3 py-2'>
						<Flame className='size-3.5 text-streak' />
						<span>{pendingPosts} pending story loops</span>
					</div>
				</div>
			</div>

			<div className='rounded-xl border border-brand/20 bg-gradient-to-br from-brand/8 via-bg-card to-xp/8 p-4 shadow-card'>
				<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted'>
					Quick moves
				</p>
				<div className='mt-3 grid gap-2'>
					<Button asChild variant='brand' className='justify-start gap-2'>
						<Link href='/explore'>
							<Compass className='size-4' />
							Explore recipes
						</Link>
					</Button>
					{isOwnProfile ? (
						<Button asChild variant='outline' className='justify-start gap-2'>
							<Link href='/create'>
								<Sparkles className='size-4' />
								Create content
							</Link>
						</Button>
					) : (
						<Button asChild variant='outline' className='justify-start gap-2'>
							<Link href='/community'>
								<Layers className='size-4' />
								Find creators
							</Link>
						</Button>
					)}
					<Button asChild variant='outline' className='justify-start gap-2'>
						<Link href='/profile/badges'>
							<Medal className='size-4' />
							Badge catalog
						</Link>
					</Button>
				</div>
			</div>
		</motion.aside>
	)
}
