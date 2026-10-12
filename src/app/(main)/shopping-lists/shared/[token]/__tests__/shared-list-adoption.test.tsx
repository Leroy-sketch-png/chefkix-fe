import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import SharedShoppingListPage from '../page'
import {
	copySharedShoppingList,
	getSharedShoppingList,
} from '@/services/shoppingList'
import { toast } from 'sonner'

const push = jest.fn()
let isAuthenticated = true

jest.mock('next/navigation', () => ({
	useParams: () => ({ token: 'shared-token' }),
	useRouter: () => ({ push }),
}))

jest.mock('@/hooks/useAuth', () => ({
	useAuth: () => ({ isAuthenticated }),
}))

jest.mock('@/services/shoppingList', () => ({
	getSharedShoppingList: jest.fn(),
	copySharedShoppingList: jest.fn(),
}))

jest.mock('sonner', () => ({
	toast: { success: jest.fn(), error: jest.fn() },
}))

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => key,
}))

jest.mock('framer-motion', () => ({
	motion: new Proxy(
		{},
		{
			get:
				(_target, tag: string) =>
				({
					children,
					...props
				}: {
					children?: ReactNode
					[key: string]: unknown
				}) => {
					const domProps = Object.fromEntries(
						Object.entries(props).filter(
							([key]) =>
								!['initial', 'animate', 'transition', 'whileTap'].includes(key),
						),
					)
					return require('react').createElement(tag, domProps, children)
				},
		},
	),
}))

jest.mock('@/components/layout/PageContainer', () => ({
	PageContainer: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
}))
jest.mock('@/components/layout/PageTransition', () => ({
	PageTransition: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
jest.mock('@/components/layout/PageHeader', () => ({
	PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}))

const sharedList = {
	id: 'sender-list',
	name: 'Friday groceries',
	items: [
		{
			itemId: 'item-1',
			ingredient: 'Jasmine rice',
			quantity: '500',
			unit: 'g',
			category: 'Grains',
			recipes: ['Family rice bowl'],
			checked: true,
			addedManually: false,
		},
	],
	source: 'Custom' as const,
	sourceMealPlanId: null,
	sourceRecipeId: null,
	shareToken: 'shared-token',
	totalItems: 1,
	checkedItems: 1,
	createdAt: '2026-10-07T00:00:00Z',
	updatedAt: '2026-10-07T00:00:00Z',
}

const mockedGetShared = jest.mocked(getSharedShoppingList)
const mockedCopyShared = jest.mocked(copySharedShoppingList)

describe('shared shopping list adoption', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		isAuthenticated = true
		mockedGetShared.mockResolvedValue(sharedList)
		mockedCopyShared.mockResolvedValue({
			...sharedList,
			id: 'recipient-list',
			shareToken: 'recipient-token',
		})
	})

	it('copies once and opens the exact recipient-owned list', async () => {
		render(<SharedShoppingListPage />)

		const copyButton = await screen.findByRole('button', { name: 'copyAction' })
		fireEvent.click(copyButton)
		fireEvent.click(copyButton)

		await waitFor(() =>
			expect(mockedCopyShared).toHaveBeenCalledWith('shared-token'),
		)
		expect(mockedCopyShared).toHaveBeenCalledTimes(1)
		expect(toast.success).toHaveBeenCalledWith('copySuccess')
		expect(push).toHaveBeenCalledWith('/shopping-lists?list=recipient-list')
	})

	it('reports copy failure without navigating away from the shared list', async () => {
		mockedCopyShared.mockRejectedValue(new Error('offline'))
		render(<SharedShoppingListPage />)

		fireEvent.click(await screen.findByRole('button', { name: 'copyAction' }))

		await waitFor(() => expect(toast.error).toHaveBeenCalledWith('copyFailed'))
		expect(push).not.toHaveBeenCalled()
	})

	it('preserves the shared-list return path when a guest signs up', async () => {
		isAuthenticated = false
		render(<SharedShoppingListPage />)

		const signUp = await screen.findByRole('link', { name: 'ctaSignUp' })
		expect(signUp.getAttribute('href')).toBe(
			'/auth/sign-up?returnTo=%2Fshopping-lists%2Fshared%2Fshared-token',
		)
		expect(screen.queryByRole('button', { name: 'copyAction' })).toBeNull()
	})
})
