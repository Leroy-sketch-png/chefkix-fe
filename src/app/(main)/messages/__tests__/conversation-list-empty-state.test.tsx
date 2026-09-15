import React from 'react'
import fs from 'fs'
import path from 'path'
import { fireEvent, render, screen } from '@testing-library/react'
import { ConversationListEmptyState } from '@/app/(main)/messages/ConversationListEmptyState'

const copy: Record<string, string> = {
	noConversations: 'No conversations yet',
	noConversationsDesc: 'Start a conversation by messaging a chef!',
	noConversationsFound: 'No conversations found',
	noConversationSearchMatches:
		'No conversations match this search. Try a different name or clear the search.',
	clearSearch: 'Clear search',
	discoverChefs: 'Discover Chefs',
}

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => copy[key] ?? key,
}))

jest.mock('@/components/shared/EmptyStateGamified', () => ({
	EmptyState: ({
		title,
		description,
		primaryAction,
	}: {
		title: string
		description: string
		primaryAction?: {
			label: string
			onClick?: () => void
			href?: string
		}
	}) => (
		<section>
			<h2>{title}</h2>
			<p>{description}</p>
			{primaryAction?.href ? (
				<a href={primaryAction.href}>{primaryAction.label}</a>
			) : (
				<button type='button' onClick={primaryAction?.onClick}>
					{primaryAction?.label}
				</button>
			)}
		</section>
	),
}))

describe('ConversationListEmptyState', () => {
	it('explains a search miss and clears the query in one action', () => {
		const onClearSearch = jest.fn()
		render(
			<ConversationListEmptyState
				query='  Linh  '
				onClearSearch={onClearSearch}
			/>,
		)

		expect(screen.getByRole('heading').textContent).toBe(
			'No conversations found',
		)
		expect(screen.queryByText('No conversations yet')).toBeNull()
		fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
		expect(onClearSearch).toHaveBeenCalledTimes(1)
	})

	it('preserves the genuine empty-account path for a blank query', () => {
		render(<ConversationListEmptyState query='   ' onClearSearch={jest.fn()} />)

		expect(screen.getByRole('heading').textContent).toBe('No conversations yet')
		expect(
			screen.getByRole('link', { name: 'Discover Chefs' }).getAttribute('href'),
		).toBe('/community')
		expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull()
	})

	it('keeps drawer search misses recoverable without leaving messages', () => {
		const drawerSource = fs.readFileSync(
			path.join(process.cwd(), 'src/components/layout/MessagesDrawer.tsx'),
			'utf8',
		)

		expect(drawerSource).toContain("onClick={() => setSearchTerm('')}")
		expect(drawerSource).toContain("{t('clearSearch')}")
		expect(drawerSource).toContain('searchTerm.trim()')
	})
})
