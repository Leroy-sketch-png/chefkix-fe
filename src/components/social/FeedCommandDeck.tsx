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
