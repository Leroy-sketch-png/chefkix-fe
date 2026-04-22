import React, { useState } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import {
	AsyncCombobox,
	type AsyncComboboxOption,
} from '@/components/ui/async-combobox'

jest.mock('framer-motion', () => ({
	AnimatePresence: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
	motion: {
		div: ({
			children,
			initial: _initial,
			animate: _animate,
			exit: _exit,
			transition: _transition,
			...props
		}: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => (
			<div {...props}>{children}</div>
		),
	},
}))

jest.mock('@/components/ui/portal', () => ({
	Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

function AsyncComboboxHarness({
	fetchOptions,
}: {
	fetchOptions: (query: string) => Promise<AsyncComboboxOption[]>
}) {
	const [value, setValue] = useState('')

	return (
		<AsyncCombobox
			fetchOptions={fetchOptions}
			onSelect={jest.fn()}
			value={value}
			onChange={setValue}
			placeholder='Search ingredients'
			minChars={1}
			debounceMs={50}
		/>
	)
}

describe('AsyncCombobox', () => {
	beforeEach(() => {
		jest.useFakeTimers()
	})

	afterEach(() => {
		jest.runOnlyPendingTimers()
		jest.useRealTimers()
	})

	it('ignores stale async results when a newer query resolves first', async () => {
		const resolvers: Record<string, (options: AsyncComboboxOption[]) => void> =
			{}

		const fetchOptions = jest.fn(
			(query: string) =>
				new Promise<AsyncComboboxOption[]>(resolve => {
					resolvers[query] = resolve
				}),
		)

		render(<AsyncComboboxHarness fetchOptions={fetchOptions} />)

		const input = screen.getByRole('combobox')

		fireEvent.focus(input)
		fireEvent.change(input, { target: { value: 'a' } })
		await act(async () => {
			jest.advanceTimersByTime(50)
		})

		fireEvent.change(input, { target: { value: 'ab' } })
		await act(async () => {
			jest.advanceTimersByTime(50)
		})

		await act(async () => {
			resolvers.ab([{ value: 'fresh', label: 'Fresh basil' }])
		})

		expect(screen.getByText('Fresh basil')).toBeTruthy()

		await act(async () => {
			resolvers.a([{ value: 'stale', label: 'Stale apple' }])
		})

		expect(screen.getByText('Fresh basil')).toBeTruthy()
		expect(screen.queryByText('Stale apple')).toBeNull()
	})
})
