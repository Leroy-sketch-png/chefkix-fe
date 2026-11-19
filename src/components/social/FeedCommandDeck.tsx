import {
	Clock,
	MessageSquare,
	ScanLine,
	Sparkles,
	TrendingUp,
	Users2,
} from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { PATHS } from '@/constants/paths'
import { CommandDeckBase } from '@/components/layout/CommandDeckBase'
import {
	FeedTabBar,
	type FeedMode,
	type TabItem,
} from '@/components/shared/FeedTabBar'

interface FeedCommandDeckProps {
	feedMode: FeedMode
	onFeedModeChange: (mode: FeedMode) => void
	availableModes: FeedMode[]
	className?: string
}

export function FeedCommandDeck({
	feedMode,
	onFeedModeChange,
	availableModes,
	className,
}: FeedCommandDeckProps) {
	const t = useTranslations('feed')
	const tShared = useTranslations('shared')
	const nav = useTranslations('nav')
	const modeTabs: Record<FeedMode, TabItem<FeedMode>> = {
		forYou: {
			key: 'forYou',
			label: tShared('ftForYou'),
			icon: Sparkles,
		},
		trending: {
			key: 'trending',
			label: tShared('ftTrending'),
			icon: TrendingUp,
		},
		following: {
			key: 'following',
			label: tShared('ftFollowing'),
			icon: Users2,
		},
		latest: {
			key: 'latest',
			label: tShared('ftLatest'),
			icon: Clock,
		},
	}
	const tabs = availableModes.map(mode => modeTabs[mode])

	return (
		<CommandDeckBase
			eyebrow={t('commandEyebrow')}
			title={t('commandHeading')}
			gradient='brand'
			className={className}
			controls={
				<div className='flex flex-wrap items-center gap-2'>
					<div className='inline-flex items-center gap-1 rounded-full border border-brand/20 bg-brand/8 px-3 py-1.5 text-xs font-semibold text-brand'>
						<MessageSquare className='size-3.5' />
						{t('commandChip')}
					</div>
					<Link
						href={PATHS.SCAN}
						className='inline-flex min-h-9 items-center gap-2 rounded-full border border-brand/25 bg-brand/8 px-3 py-1.5 text-xs font-semibold text-brand transition-colors hover:border-brand/40 hover:bg-brand/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2'
					>
						<ScanLine className='size-3.5' aria-hidden='true' />
						{nav('kitchenScanner')}
					</Link>
				</div>
			}
		>
			<FeedTabBar
				tabs={tabs}
				activeTab={feedMode}
				onTabChange={tab => onFeedModeChange(tab)}
				variant='pill'
				size='sm'
				className='w-full'
			/>
		</CommandDeckBase>
	)
}
