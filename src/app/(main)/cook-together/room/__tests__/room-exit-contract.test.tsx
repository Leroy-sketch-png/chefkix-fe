import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import CookingRoomPage from '../page'

const mockReplace = jest.fn()
const mockLeaveRoom = jest.fn()

jest.mock('next/navigation', () => ({
	useRouter: () => ({ replace: mockReplace }),
}))

jest.mock('@/i18n/hooks', () => ({
	useTranslations: () => (key: string) => {
		const labels: Record<string, string> = {
			ctLeave: 'Leave',
			ctLeaving: 'Leaving...',
			ctLeaveFailed: 'Could not leave the room. Try again.',
		}
		return labels[key] ?? key
	},
}))

jest.mock('@/store/cookingStore', () => {
	const useCookingStore = Object.assign(
		jest.fn(() => ({
			roomCode: 'ROOM42',
			participants: [],
			isInRoom: true,
			isHost: true,
			recipe: null,
			session: null,
			leaveRoom: mockLeaveRoom,
			handleRoomEvent: jest.fn(),
			joinRoom: jest.fn(),
			loadSession: jest.fn(),
		})),
		{
			persist: {
				hasHydrated: () => true,
				onFinishHydration: () => jest.fn(),
			},
		},
	)

	return { useCookingStore }
})

jest.mock('@/store/authStore', () => ({
	useAuthStore: (selector: (state: object) => unknown) =>
		selector({ user: { userId: 'user-1' }, isHydrated: true }),
}))

jest.mock('@/store/uiStore', () => ({
	useUiStore: () => ({
		openCookingPanel: jest.fn(),
		expandCookingPanel: jest.fn(),
	}),
}))

jest.mock('@/hooks/useRoomSocket', () => ({
	useRoomSocket: () => ({ isConnected: true }),
}))

jest.mock('sonner', () => ({
	toast: Object.assign(jest.fn(), {
		error: jest.fn(),
		success: jest.fn(),
	}),
}))

jest.mock('next/image', () => ({
	__esModule: true,
	default: (props: React.ComponentProps<'img'>) => <img {...props} />,
}))

jest.mock('framer-motion', () => {
	const motionProps = new Set([
		'animate',
		'exit',
		'initial',
		'transition',
		'whileHover',
		'whileTap',
	])
	return {
		AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
		motion: new Proxy(
			{},
			{
				get:
					(_target, tag: string) =>
					({ children, ...props }: React.HTMLAttributes<HTMLElement>) => {
						const domProps = Object.fromEntries(
							Object.entries(props).filter(([key]) => !motionProps.has(key)),
						)
						return React.createElement(tag, domProps, children)
					},
			},
		),
	}
})

jest.mock('@/components/layout/PageContainer', () => ({
	PageContainer: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
}))

jest.mock('@/components/layout/PageTransition', () => ({
	PageTransition: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
}))

jest.mock('@/components/layout/PremiumSurface', () => ({
	PremiumSurface: ({ children }: { children: React.ReactNode }) => (
		<section>{children}</section>
	),
	SurfaceSectionHeader: () => null,
}))

describe('co-cook room exit lifecycle', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('settles one leave command before navigating despite rapid activation', async () => {
		let resolveLeave!: (value: boolean) => void
		mockLeaveRoom.mockReturnValue(
			new Promise<boolean>(resolve => {
				resolveLeave = resolve
			}),
		)

		render(<CookingRoomPage />)
		const leaveButtons = screen.getAllByRole('button', { name: 'Leave' })

		fireEvent.click(leaveButtons[0])
		fireEvent.click(leaveButtons[1])

		expect(mockLeaveRoom).toHaveBeenCalledTimes(1)
		expect(mockReplace).not.toHaveBeenCalled()
		expect(screen.getAllByRole('button', { name: 'Leaving...' })).toHaveLength(
			2,
		)
		expect(
			screen
				.getAllByRole('button', { name: 'Leaving...' })
				.every(button => button.hasAttribute('disabled')),
		).toBe(true)

		await act(async () => resolveLeave(true))

		await waitFor(() =>
			expect(mockReplace).toHaveBeenCalledWith('/cook-together'),
		)
		expect(mockReplace).toHaveBeenCalledTimes(1)
	})

	it('keeps the user in the room and restores retry when leave is rejected', async () => {
		mockLeaveRoom.mockResolvedValue(false)

		render(<CookingRoomPage />)
		fireEvent.click(screen.getAllByRole('button', { name: 'Leave' })[0])

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith(
				'Could not leave the room. Try again.',
			),
		)
		expect(mockReplace).not.toHaveBeenCalled()
		expect(screen.getAllByRole('button', { name: 'Leave' })).toHaveLength(2)
	})
})
