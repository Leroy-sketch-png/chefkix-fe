'use client'

import { Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { EmptyState } from '@/components/shared/EmptyStateGamified'

interface ConversationListEmptyStateProps {
	query: string
	onClearSearch: () => void
}

export function ConversationListEmptyState({
	query,
	onClearSearch,
}: ConversationListEmptyStateProps) {
	const t = useTranslations('messages')
	const hasSearch = query.trim().length > 0

	return (
		<div className='flex h-full items-center justify-center p-6'>
			<EmptyState
				variant={hasSearch ? 'search' : 'custom'}
				title={t(hasSearch ? 'noConversationsFound' : 'noConversations')}
				description={t(
					hasSearch ? 'noConversationSearchMatches' : 'noConversationsDesc',
				)}
				emoji={hasSearch ? undefined : '💬'}
				primaryAction={
					hasSearch
						? {
								label: t('clearSearch'),
								onClick: onClearSearch,
							}
						: {
								label: t('discoverChefs'),
								href: '/community',
								icon: <Users className='size-4' />,
							}
				}
			/>
		</div>
	)
}
