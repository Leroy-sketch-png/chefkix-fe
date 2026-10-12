import { fireEvent, render, screen } from '@testing-library/react'
import { RoomReactionControl } from '../RoomReactionControl'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => key,
}))

describe('RoomReactionControl', () => {
	it('prevents reactions while the room connection is unavailable', () => {
		const onSelect = jest.fn()

		render(<RoomReactionControl isConnected={false} onSelect={onSelect} />)

		const trigger = screen.getByRole('button', {
			name: 'ctConnecting',
		}) as HTMLButtonElement
		expect(trigger.disabled).toBe(true)
		fireEvent.click(trigger)
		expect(screen.queryByRole('menu')).toBeNull()
		expect(onSelect).not.toHaveBeenCalled()
	})

	it('sends one allowlisted reaction from the accessible menu', async () => {
		const onSelect = jest.fn()

		render(<RoomReactionControl isConnected onSelect={onSelect} />)

		fireEvent.keyDown(
			screen.getByRole('button', { name: 'ctReactionPickerLabel' }),
			{ key: 'Enter', code: 'Enter' },
		)
		const reaction = await screen.findByRole('menuitem', {
			name: 'ctReactionFire',
		})
		fireEvent.click(reaction)

		expect(onSelect).toHaveBeenCalledTimes(1)
		expect(onSelect).toHaveBeenCalledWith('🔥')
		expect(
			screen.queryByRole('menuitem', { name: 'ctReactionFire' }),
		).toBeNull()
	})
})
