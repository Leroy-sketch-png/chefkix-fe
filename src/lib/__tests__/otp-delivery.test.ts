import {
	clearOtpDeliveryTiming,
	isOtpDeliveryTiming,
	readOtpDeliveryTiming,
	saveOtpDeliveryTiming,
} from '@/lib/otp-delivery'

const timing = {
	expiresAt: '2026-08-03T10:10:00Z',
	resendAvailableAt: '2026-08-03T10:01:00Z',
}

describe('OTP delivery timing continuity', () => {
	beforeEach(() => sessionStorage.clear())

	it('restores only server-shaped timing for the matching email', () => {
		expect(saveOtpDeliveryTiming('Cook@Example.com', timing)).toBe(true)
		expect(readOtpDeliveryTiming('cook@example.com')).toEqual(timing)
		expect(readOtpDeliveryTiming('other@example.com')).toBeNull()
	})

	it('rejects malformed timestamps instead of inventing replacements', () => {
		expect(
			isOtpDeliveryTiming({
				expiresAt: 'not-a-date',
				resendAvailableAt: timing.resendAvailableAt,
			}),
		).toBe(false)
		expect(readOtpDeliveryTiming('cook@example.com')).toBeNull()
	})

	it('clears only the active email flow', () => {
		saveOtpDeliveryTiming('cook@example.com', timing)
		clearOtpDeliveryTiming('other@example.com')
		expect(readOtpDeliveryTiming('cook@example.com')).toEqual(timing)
		clearOtpDeliveryTiming('cook@example.com')
		expect(readOtpDeliveryTiming('cook@example.com')).toBeNull()
	})
})
