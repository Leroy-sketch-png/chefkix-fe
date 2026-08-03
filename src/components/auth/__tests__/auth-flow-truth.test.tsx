import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ResendOtpButton } from '@/components/ui/resend-otp-button'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string, values?: Record<string, number>) => {
		if (key === 'resendAvailableIn') {
			return `Resend available in ${values?.seconds}s`
		}
		return {
			resendCode: 'Resend code',
			resendingCode: 'Sending...',
		}[key]
	},
}))

describe('auth flow truth', () => {
	it('honors an authoritative cooldown supplied by the server', () => {
		const resendAvailableAt = new Date(Date.now() + 60_000).toISOString()
		render(
			<ResendOtpButton
				onResend={jest.fn()}
				resendAvailableAt={resendAvailableAt}
			/>,
		)

		expect(screen.getByRole('button')).toHaveProperty('disabled', true)
		expect(screen.getByText(/Resend available in 6\d?s/)).toBeTruthy()
	})

	it('starts cooldown only after a successful response returns timing', async () => {
		const delivery = {
			expiresAt: new Date(Date.now() + 600_000).toISOString(),
			resendAvailableAt: new Date(Date.now() + 120_000).toISOString(),
		}
		const onResend = jest.fn().mockResolvedValue(delivery)
		render(<ResendOtpButton onResend={onResend} />)

		fireEvent.click(screen.getByRole('button', { name: 'Resend code' }))

		await waitFor(() => expect(onResend).toHaveBeenCalledTimes(1))
		await waitFor(() =>
			expect(screen.getByRole('button')).toHaveProperty('disabled', true),
		)
		expect(screen.getByText(/Resend available in 12\d?s/)).toBeTruthy()
	})

	it('does not fabricate cooldown when delivery timing is unavailable', async () => {
		const onResend = jest.fn().mockResolvedValue(null)
		render(<ResendOtpButton onResend={onResend} />)

		fireEvent.click(screen.getByRole('button', { name: 'Resend code' }))

		await waitFor(() => expect(onResend).toHaveBeenCalledTimes(1))
		await waitFor(() =>
			expect(screen.getByRole('button')).toHaveProperty('disabled', false),
		)
		expect(screen.getByText('Resend code')).toBeTruthy()
	})
})
