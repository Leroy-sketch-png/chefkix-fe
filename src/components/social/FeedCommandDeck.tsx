import {
	Clock,
	MessageSquare,
	Sparkles,
	TrendingUp,
	Users2,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
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
	postCount: number
	hasMore: boolean
	className?: string
}

export function FeedCommandDeck({
	feedMode,
	onFeedModeChange,
	availableModes,
	postCount,
	hasMore,
	className,
}: FeedCommandDeckProps) {
	const t = useTranslations('feed')
	const tShared = useTranslations('shared')
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
				<div className='inline-flex items-center gap-1 rounded-full border border-brand/20 bg-brand/8 px-3 py-1.5 text-xs font-semibold text-brand'>
					<MessageSquare className='size-3.5' />
					{t('commandChip')}
				</div>
			}
		>
			<div className='flex flex-col gap-3'>
				<FeedTabBar
					tabs={tabs}
					activeTab={feedMode}
					onTabChange={tab => onFeedModeChange(tab)}
					variant='pill'
					size='sm'
					className='w-full'
				/>

				<div className='flex flex-wrap items-center gap-2 text-xs font-semibold text-text-muted'>
					<span className='inline-flex items-center gap-1 rounded-full border border-border-subtle bg-bg-elevated px-2.5 py-1 tabular-nums'>
						{t('postsCount', { count: postCount })}
					</span>
					<span className='inline-flex items-center gap-1 rounded-full border border-border-subtle bg-bg-elevated px-2.5 py-1'>
						{hasMore ? t('loadMore') : t('liveFeed')}
					</span>
				</div>
			</div>
		</CommandDeckBase>
	)
}
