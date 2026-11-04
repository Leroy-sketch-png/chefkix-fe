import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { logDevError } from '@/lib/dev-log'
import { PullToRefresh } from '../pull-to-refresh'

jest.mock('framer-motion', () => {
	const React = require('react')
	return {
		AnimatePresence: ({ children }: { children: React.ReactNode }) => (
			<>{children}</>
		),
		motion: {
			div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
				<div {...props}>{children}</div>
			),
		},
	}
})

jest.mock('lucide-react', () => ({
	RefreshCw: () => <svg data-testid='refresh-indicator' />,
}))

jest.mock('@/lib/dev-log', () => ({
	logDevError: jest.fn(),
}))

describe('PullToRefresh', () => {
	it.each(['async rejection', 'synchronous throw'] as const)(
		'clears the refresh state and handles %s',
		async failureMode => {
			const failure = new Error('refresh failed')
			const onRefresh = jest.fn(() => {
				if (failureMode === 'synchronous throw') throw failure
				return Promise.reject(failure)
			})
			const { container } = render(
				<PullToRefresh onRefresh={onRefresh}>Feed</PullToRefresh>,
			)
			const surface = container.firstElementChild as HTMLElement

			fireEvent.touchStart(surface, {
				touches: [{ clientX: 10, clientY: 0 }],
			})
			fireEvent.touchMove(surface, {
				touches: [{ clientX: 10, clientY: 200 }],
				cancelable: true,
			})
			fireEvent.touchEnd(surface)

			await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1))
			await waitFor(() => {
				expect(container.querySelector('[aria-live="polite"]')).toBeNull()
			})
			expect(logDevError).toHaveBeenCalledWith(
				'Pull-to-refresh failed:',
				failure,
			)
		},
	)
})
