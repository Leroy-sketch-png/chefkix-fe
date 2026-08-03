import {
	getReferralCodeFromRedeemPath,
	getReferralRedeemPath,
	normalizeReferralCode,
} from '@/lib/referral-intent'

describe('referral intent authority', () => {
	it.each([
		['abcd2345', 'ABCD2345'],
		['  JKLM6789  ', 'JKLM6789'],
	])('normalizes a valid backend code %s', (input, expected) => {
		expect(normalizeReferralCode(input)).toBe(expected)
	})

	it.each(['', 'SHORT', 'ABCD1234', 'ABCDI234', 'ABCD0234', 'ABCD-234'])(
		'rejects invalid or impossible backend code %s',
		input => {
			expect(normalizeReferralCode(input)).toBeNull()
		},
	)

	it('builds one internal settings destination from a valid code', () => {
		expect(getReferralRedeemPath('abcd2345')).toBe(
			'/settings?tab=referral&ref=ABCD2345',
		)
	})

	it('cannot turn invalid input into an external redirect', () => {
		expect(getReferralRedeemPath('//attacker.example')).toBe(
			'/settings?tab=referral',
		)
	})

	it('recovers intent only from the canonical referral settings destination', () => {
		expect(
			getReferralCodeFromRedeemPath('/settings?tab=referral&ref=abcd2345'),
		).toBe('ABCD2345')
		expect(getReferralCodeFromRedeemPath('/settings?ref=ABCD2345')).toBeNull()
		expect(
			getReferralCodeFromRedeemPath('//attacker.example?ref=ABCD2345'),
		).toBeNull()
	})
})
