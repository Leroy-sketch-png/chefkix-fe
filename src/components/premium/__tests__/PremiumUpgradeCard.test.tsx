import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import PremiumUpgradeCard from '../PremiumUpgradeCard'
import {
	cancelSubscription,
	getMySubscription,
	startTrial,
} from '@/services/subscription'
import type { SubscriptionResponse } from '@/lib/types/subscription'

jest.mock('next-intl', () => ({
	useTranslations: (() => {
		const translate = (key: string) => key
		return () => translate
	})(),
}))
jest.mock('framer-motion', () => ({
	AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
	motion: {
		div: ({ children, ...props }: React.ComponentProps<'div'>) => (
			<div {...props}>{children}</div>
		),
	},
}))
jest.mock('@/components/ui/border-beam', () => ({
	BorderBeam: ({ children }: { children: React.ReactNode }) => children,
}))
jest.mock('@/services/subscription', () => ({
	cancelSubscription: jest.fn(),
	getMySubscription: jest.fn(),
	startTrial: jest.fn(),
}))
jest.mock('sonner', () => ({
	toast: {
		error: jest.fn(),
		success: jest.fn(),
	},
}))
jest.mock('@/lib/dev-log', () => ({
	logDevError: jest.fn(),
}))

const mockedCancelSubscription = jest.mocked(cancelSubscription)
const mockedGetMySubscription = jest.mocked(getMySubscription)
const mockedStartTrial = jest.mocked(startTrial)

const subscriptionFixture = (
	overrides: Partial<SubscriptionResponse> = {},
): SubscriptionResponse => ({
	tier: 'Free',
	active: false,
	premium: false,
	startDate: null,
	endDate: null,
	trialUsed: false,
	trialActive: false,
	cancelledAtPeriodEnd: false,
	cancelledAt: null,
	availableFeatures: [],
	createdAt: '2026-07-24T00:00:00Z',
	...overrides,
})

describe('PremiumUpgradeCard subscription truth', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('renders a recoverable error instead of Free for an unsuccessful load', async () => {
		mockedGetMySubscription.mockResolvedValue({
			success: false,
			statusCode: 503,
			message: 'Unavailable',
		})

		render(<PremiumUpgradeCard />)

		expect(await screen.findByText('errorLoad')).toBeTruthy()
		expect(screen.queryByText('titleFree')).toBeNull()
		expect(screen.getByRole('button', { name: 'tryAgain' })).toBeTruthy()
	})

	it('keeps retry loading until a verified Free response arrives', async () => {
		let resolveRetry!: (
			value: Awaited<ReturnType<typeof getMySubscription>>,
		) => void
		mockedGetMySubscription
			.mockResolvedValueOnce({
				success: false,
				statusCode: 503,
				message: 'Unavailable',
			})
			.mockReturnValueOnce(
				new Promise(resolve => {
					resolveRetry = resolve
				}),
			)

		const { container } = render(<PremiumUpgradeCard />)
		fireEvent.click(await screen.findByRole('button', { name: 'tryAgain' }))

		expect(screen.queryByText('errorLoad')).toBeNull()
		expect(screen.queryByText('titleFree')).toBeNull()
		expect(container.querySelector('.animate-pulse')).toBeTruthy()

		resolveRetry({
			success: true,
			statusCode: 200,
			data: subscriptionFixture(),
		})

		expect(await screen.findByText('titleFree')).toBeTruthy()
	})

	it('surfaces an unsuccessful trial envelope and preserves Free state', async () => {
		mockedGetMySubscription.mockResolvedValue({
			success: true,
			statusCode: 200,
			data: subscriptionFixture(),
		})
		mockedStartTrial.mockResolvedValue({
			success: false,
			statusCode: 409,
			message: 'Trial unavailable',
		})

		render(<PremiumUpgradeCard />)
		fireEvent.click(await screen.findByRole('button', { name: 'startTrial' }))

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith('toastTrialFailed'),
		)
		expect(screen.getByText('titleFree')).toBeTruthy()
		expect(toast.success).not.toHaveBeenCalled()
	})

	it('surfaces an unsuccessful cancellation and preserves Premium state', async () => {
		mockedGetMySubscription.mockResolvedValue({
			success: true,
			statusCode: 200,
			data: subscriptionFixture({
				tier: 'Premium',
				active: true,
				premium: true,
				trialUsed: true,
				trialActive: true,
			}),
		})
		mockedCancelSubscription.mockResolvedValue({
			success: false,
			statusCode: 503,
			message: 'Cancellation unavailable',
		})

		render(<PremiumUpgradeCard />)
		fireEvent.click(
			await screen.findByRole('button', { name: 'cancelSubscription' }),
		)
		fireEvent.click(screen.getByRole('button', { name: 'cancelConfirmYes' }))

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith('toastCancelFailed'),
		)
		expect(screen.getByText('title')).toBeTruthy()
		expect(screen.getByText('cancelConfirmTitle')).toBeTruthy()
		expect(toast.success).not.toHaveBeenCalled()
	})
})
