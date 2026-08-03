import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import {
	clearColdStartState,
	ColdStartExperience,
} from '@/components/onboarding/ColdStartExperience'

const STORAGE_KEY = 'chefkix:cold-start-state'

describe('ColdStartExperience', () => {
	beforeEach(() => {
		clearColdStartState()
	})

	it('renders feed content immediately without onboarding ceremony', () => {
		render(
			<ColdStartExperience>
				<article>Real food post</article>
			</ColdStartExperience>,
		)

		expect(screen.getByText('Real food post')).toBeTruthy()
		expect(screen.queryByText(/start here/i)).toBeNull()
		expect(screen.queryByText(/detecting your taste/i)).toBeNull()
	})

	it('persists five interactions and requests one personalized refresh', () => {
		const onColdStartComplete = jest.fn()
		render(
			<ColdStartExperience onColdStartComplete={onColdStartComplete}>
				<button type='button'>Open post</button>
			</ColdStartExperience>,
		)

		const action = screen.getByRole('button', { name: 'Open post' })
		for (let count = 0; count < 8; count += 1) {
			fireEvent.click(action)
		}

		expect(onColdStartComplete).toHaveBeenCalledTimes(1)
		expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toMatchObject({
			interactionCount: 5,
			dismissed: true,
		})
	})

	it('keeps returning users feed-first without restarting learning', () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				interactionCount: 5,
				dismissed: true,
				firstSeenAt: '2026-07-26T00:00:00.000Z',
			}),
		)
		const onColdStartComplete = jest.fn()

		render(
			<ColdStartExperience onColdStartComplete={onColdStartComplete}>
				<button type='button'>Open post</button>
			</ColdStartExperience>,
		)
		fireEvent.click(screen.getByRole('button', { name: 'Open post' }))

		expect(onColdStartComplete).not.toHaveBeenCalled()
		expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toMatchObject({
			interactionCount: 5,
			dismissed: true,
		})
	})
})
