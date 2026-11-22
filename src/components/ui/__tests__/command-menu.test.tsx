import React, { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import {
	CommandMenu,
	type CommandMenuGroup,
} from '@/components/ui/command-menu'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => key,
}))

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

function CommandMenuHarness({ onSelect }: { onSelect: () => void }) {
	const [open, setOpen] = useState(false)
	const groups: CommandMenuGroup[] = [
		{
			heading: 'Navigation',
			items: [{ id: 'explore', label: 'Explore', action: onSelect }],
		},
	]

	return (
		<>
			<button type='button' onClick={() => setOpen(true)}>
				Open menu
			</button>
			<CommandMenu
				open={open}
				onOpenChange={setOpen}
				groups={groups}
				placeholder='Search commands'
			/>
		</>
	)
}

describe('CommandMenu keyboard dismissal', () => {
	it('closes on Escape without selecting a command', async () => {
		const onSelect = jest.fn()
		render(<CommandMenuHarness onSelect={onSelect} />)

		const opener = screen.getByRole('button', { name: 'Open menu' })
		opener.focus()
		fireEvent.click(opener)
		const input = screen.getByRole('textbox', { name: 'commandPlaceholder' })
		await waitFor(() => expect(input).toHaveFocus())
		const wasNotCanceled = fireEvent.keyDown(input, { key: 'Escape' })

		expect(wasNotCanceled).toBe(false)
		expect(screen.queryByRole('dialog')).toBeNull()
		expect(onSelect).not.toHaveBeenCalled()
		expect(opener).toHaveFocus()
	})
})
