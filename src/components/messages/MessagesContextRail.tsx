import Link from 'next/link'
import { motion } from 'framer-motion'
import {
	Activity,
	Compass,
	MessageSquare,
	Users,
	Wifi,
	WifiOff,
	Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessagesContextRailProps {
	totalConversations: number
	unreadConversations: number
	isConnected: boolean
	connectionError: string | null
	hasActiveConversation: boolean
	className?: string
}

interface RailCardProps {
	title: string
	description: string
	value?: string
	icon: React.ComponentType<{ className?: string }>
	tone?: 'brand' | 'xp' | 'muted'
}

const toneClasses = {
	brand: 'border-brand/20 bg-brand/6 text-brand',
	xp: 'border-xp/20 bg-xp/6 text-xp',
	muted: 'border-border-subtle bg-bg-card text-text-muted',
}

function RailCard({
	title,
	description,
	value,
	icon: Icon,
	tone = 'muted',
}: RailCardProps) {
	return (
		<article className='rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card'>
			<div className='flex items-start justify-between gap-3'>
				<div>
					<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted'>
						{title}
					</p>
					{value && (
						<p className='mt-2 text-2xl font-black text-text-primary'>
							{value}
						</p>
					)}
				</div>
				<div className={cn('rounded-lg border p-2', toneClasses[tone])}>
					<Icon className='size-4' />
				</div>
			</div>
			<p className='mt-2 text-xs leading-relaxed text-text-secondary'>
				{description}
			</p>
		</article>
	)
}

export function MessagesContextRail({
	totalConversations,
	unreadConversations,
	isConnected,
	connectionError,
	hasActiveConversation,
	className,
}: MessagesContextRailProps) {
	return (
		<motion.aside
			initial={{ opacity: 0, x: 12 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				'hidden xl:flex xl:flex-col xl:gap-4 xl:border-l xl:border-border-subtle xl:bg-bg-card xl:p-4',
				className,
			)}
		>
			<div>
				<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-brand'>
					Messages Intelligence
				</p>
				<h2 className='mt-1 text-lg font-black text-text-primary'>
					Conversation Grid
				</h2>
			</div>

			<RailCard
				title='Connection'
				value={isConnected ? 'Live' : 'Fallback'}
				description={
					isConnected
						? 'WebSocket is active for real-time delivery.'
						: connectionError || 'Using REST fallback while reconnecting.'
				}
				icon={isConnected ? Wifi : WifiOff}
				tone={isConnected ? 'brand' : 'muted'}
			/>

			<RailCard
				title='Conversations'
				value={totalConversations.toString()}
				description='Total active threads in your inbox right now.'
				icon={MessageSquare}
				tone='xp'
			/>

			<RailCard
				title='Unread Threads'
				value={unreadConversations.toString()}
				description='Threads requiring your response to keep momentum.'
				icon={Activity}
				tone={unreadConversations > 0 ? 'brand' : 'muted'}
			/>

			<div className='rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card'>
				<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted'>
					Quick Moves
				</p>
				<div className='mt-3 grid gap-2'>
					<Link
						href='/community'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/30 hover:bg-brand/8 hover:text-brand'
					>
						<Users className='size-3.5' />
						Discover people
					</Link>
					<Link
						href='/explore'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/30 hover:bg-brand/8 hover:text-brand'
					>
						<Compass className='size-3.5' />
						Explore content
					</Link>
					<Link
						href='/feed'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/30 hover:bg-brand/8 hover:text-brand'
					>
						<Zap className='size-3.5' />
						Open feed pulse
					</Link>
				</div>
			</div>

			{!hasActiveConversation && (
				<div className='rounded-xl border border-brand/20 bg-brand/6 p-4 text-xs text-text-secondary'>
					Select a conversation to activate the live chat workspace.
				</div>
			)}
		</motion.aside>
	)
}
