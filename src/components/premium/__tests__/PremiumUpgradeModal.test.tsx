import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import PremiumUpgradeModal from '../PremiumUpgradeModal'
import { startTrial } from '@/services/subscription'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => key,
}))

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
	useRouter: () => ({
		push: mockPush,
	}),
}))

jest.mock('@/components/ui/border-beam', () => ({
	BorderBeam: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

jest.mock('@/services/subscription', () => ({
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

const mockedStartTrial = jest.mocked(startTrial)

describe('PremiumUpgradeModal', () => {
	const onCloseMock = jest.fn()

	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('does not render dialog content when isOpen is false', () => {
		render(
			<PremiumUpgradeModal
				isOpen={false}
				onClose={onCloseMock}
			/>
		)

		expect(screen.queryByText('title')).not.toBeInTheDocument()
		expect(screen.queryByText('startTrial')).not.toBeInTheDocument()
	})

	it('renders generic title and perks when isOpen is true and no featureName provided', () => {
		render(
			<PremiumUpgradeModal
				isOpen={true}
				onClose={onCloseMock}
			/>
		)

		expect(screen.getByText('title')).toBeInTheDocument()
		expect(screen.getByText('Custom Profile Themes')).toBeInTheDocument()
		expect(screen.getByText('Advanced Creator Analytics')).toBeInTheDocument()
		expect(screen.getByText('startTrial')).toBeInTheDocument()
	})

	it('renders feature-specific title when featureName is provided', () => {
		render(
			<PremiumUpgradeModal
				isOpen={true}
				onClose={onCloseMock}
				featureName="Advanced Analytics"
			/>
		)

		expect(screen.getByText('Unlock Advanced Analytics')).toBeInTheDocument()
	})

	it('handles start trial success by closing modal and toasting success', async () => {
		mockedStartTrial.mockResolvedValueOnce({
			success: true,
			statusCode: 200,
			message: 'Trial started',
			data: {} as any,
		})

		render(
			<PremiumUpgradeModal
				isOpen={true}
				onClose={onCloseMock}
			/>
		)

		const trialButton = screen.getByText('startTrial')
		fireEvent.click(trialButton)

		await waitFor(() => {
			expect(mockedStartTrial).toHaveBeenCalledTimes(1)
			expect(toast.success).toHaveBeenCalledWith('toastTrialStarted')
			expect(onCloseMock).toHaveBeenCalledTimes(1)
		})
	})

	it('handles start trial failure by displaying error toast and keeping modal open', async () => {
		mockedStartTrial.mockResolvedValueOnce({
			success: false,
			statusCode: 400,
			message: 'Trial already used',
			data: null,
		})

		render(
			<PremiumUpgradeModal
				isOpen={true}
				onClose={onCloseMock}
			/>
		)

		const trialButton = screen.getByText('startTrial')
		fireEvent.click(trialButton)

		await waitFor(() => {
			expect(mockedStartTrial).toHaveBeenCalledTimes(1)
			expect(toast.error).toHaveBeenCalledWith('Trial already used')
			expect(onCloseMock).not.toHaveBeenCalled()
		})
	})

	it('navigates to settings tab=premium when Explore All Features is clicked', () => {
		render(
			<PremiumUpgradeModal
				isOpen={true}
				onClose={onCloseMock}
			/>
		)

		const exploreButton = screen.getByText('Explore All Features')
		fireEvent.click(exploreButton)

		expect(onCloseMock).toHaveBeenCalledTimes(1)
		expect(mockPush).toHaveBeenCalledWith('/settings?tab=premium')
	})
})
