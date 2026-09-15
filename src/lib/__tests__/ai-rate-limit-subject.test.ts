/** @jest-environment node */

import {
	createAiRateLimitSubject,
	isAiRateLimitSubjectSecretConfigured,
	verifyAiRateLimitSubjectForTest,
} from '@/lib/ai-rate-limit-subject'

const SECRET = 'rate-limit-subject-secret-at-least-32-characters'
const PSEUDONYM_SECRET = 'stable-pseudonym-secret-at-least-32-characters'
const NOW = 2_000_000_000

describe('AI rate-limit subject token', () => {
	it('is deterministic per user and contains no raw identifier', () => {
		const first = createAiRateLimitSubject(
			'private-user-id',
			PSEUDONYM_SECRET,
			SECRET,
			NOW,
		)
		const second = createAiRateLimitSubject(
			'private-user-id',
			PSEUDONYM_SECRET,
			SECRET,
			NOW,
		)
		const other = createAiRateLimitSubject(
			'other-user-id',
			PSEUDONYM_SECRET,
			SECRET,
			NOW,
		)

		expect(first).toBe(second)
		expect(first).not.toBe(other)
		expect(first).not.toContain('private-user-id')
		expect(verifyAiRateLimitSubjectForTest(first, SECRET, NOW)).toBe(true)
	})

	it('rejects tampering, expiry, future issuance, and the wrong trust domain', () => {
		const token = createAiRateLimitSubject(
			'user-1',
			PSEUDONYM_SECRET,
			SECRET,
			NOW,
		)
		const tampered = `${token.slice(0, -1)}${token.endsWith('A') ? 'B' : 'A'}`

		expect(verifyAiRateLimitSubjectForTest(tampered, SECRET, NOW)).toBe(false)
		expect(verifyAiRateLimitSubjectForTest(token, SECRET, NOW + 61)).toBe(false)
		expect(verifyAiRateLimitSubjectForTest(token, SECRET, NOW - 6)).toBe(false)
		expect(
			verifyAiRateLimitSubjectForTest(
				token,
				'another-rate-limit-secret-at-least-32-characters',
				NOW,
			),
		).toBe(false)
	})

	it('rejects blank subjects and weak secrets', () => {
		expect(() =>
			createAiRateLimitSubject(' ', PSEUDONYM_SECRET, SECRET, NOW),
		).toThrow()
		expect(() =>
			createAiRateLimitSubject('user-1', 'short', SECRET, NOW),
		).toThrow()
		expect(() =>
			createAiRateLimitSubject('user-1', PSEUDONYM_SECRET, 'short', NOW),
		).toThrow()
	})

	it('rejects placeholder and service-key trust-domain reuse', () => {
		expect(
			isAiRateLimitSubjectSecretConfigured(
				PSEUDONYM_SECRET,
				'CHANGE_ME_RATE_LIMIT_SUBJECT_SECRET_32_CHARS_MINIMUM',
				'service-key',
			),
		).toBe(false)
		expect(
			isAiRateLimitSubjectSecretConfigured(PSEUDONYM_SECRET, SECRET, SECRET),
		).toBe(false)
		expect(
			isAiRateLimitSubjectSecretConfigured(SECRET, SECRET, 'service-key'),
		).toBe(false)
		expect(
			isAiRateLimitSubjectSecretConfigured(
				PSEUDONYM_SECRET,
				SECRET,
				'other-service-key',
			),
		).toBe(true)
	})

	it('preserves the pseudonym while signing authority rotates', () => {
		const nextSecret = 'next-signing-secret-that-is-at-least-32-characters'
		const oldToken = createAiRateLimitSubject(
			'user-1',
			PSEUDONYM_SECRET,
			SECRET,
			NOW,
		)
		const newToken = createAiRateLimitSubject(
			'user-1',
			PSEUDONYM_SECRET,
			nextSecret,
			NOW,
		)

		expect(oldToken.split('.')[2]).toBe(newToken.split('.')[2])
		expect(oldToken).not.toBe(newToken)
		expect(verifyAiRateLimitSubjectForTest(oldToken, SECRET, NOW)).toBe(true)
		expect(verifyAiRateLimitSubjectForTest(newToken, nextSecret, NOW)).toBe(true)
	})
})
