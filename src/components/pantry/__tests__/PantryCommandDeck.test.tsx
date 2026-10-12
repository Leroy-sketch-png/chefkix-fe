import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { PantryCommandDeck } from '@/components/pantry/PantryCommandDeck'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => key,
}))

jest.mock('framer-motion', () => {
	const React = require('react')
	return {
		motion: new Proxy(
			{},
			{
				get:
					(_target, tag: string) =>
					({ children, ...props }: React.HTMLAttributes<HTMLElement>) =>
						React.createElement(tag, props, children),
			},
		),
	}
})

function renderDeck(open: boolean, onToggleSuggestions = jest.fn()) {
	render(
		<PantryCommandDeck
			itemCount={4}
			expiredCount={0}
			expiringCount={1}
			searchQuery=''
			onSearchChange={jest.fn()}
			showingCategory='all'
			hasSuggestionsOpen={open}
			onToggleSuggestions={onToggleSuggestions}
			onClearExpired={jest.fn()}
			canClearExpired={false}
		>
			<div>filters</div>
		</PantryCommandDeck>,
	)
	return onToggleSuggestions
}

describe('PantryCommandDeck', () => {
	it('exposes and invokes one accessible suggestion toggle', () => {
		const onToggle = renderDeck(false)
		const button = screen.getByRole('button', { name: 'whatCanICook' })

		expect(button.getAttribute('aria-expanded')).toBe('false')
		expect(button.getAttribute('aria-controls')).toBe(
			'pantry-recipe-suggestions',
		)
		fireEvent.click(button)
		expect(onToggle).toHaveBeenCalledTimes(1)
	})

	it('reports the panel as expanded when it is open', () => {
		renderDeck(true)
		expect(
			screen
				.getByRole('button', { name: 'suggestionsOpen' })
				.getAttribute('aria-expanded'),
		).toBe('true')
	})
})
