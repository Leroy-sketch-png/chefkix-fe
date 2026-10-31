import { safeDiagnosticValue } from '@/lib/diagnostics'
import {
	readOwnDataProperty,
	safeErrorMessage,
	safeErrorName,
} from '../sanitize-diagnostics.mjs'

describe('safeDiagnosticValue', () => {
	it('redacts identity and credential fields while preserving ordinary counts', () => {
		const safe = safeDiagnosticValue({
			sessionId: 'session-secret',
			username: 'chef@example.org',
			memberId: 'member-secret',
			password: 'password-secret',
			errorMessage: 'private member note with no regex-shaped identifier',
			bodySnippet: 'private response content',
			failureText: 'private network error prose',
		description: 'private recipe instructions',
		url: 'data:image/png;base64,IMAGE_PRIVATE_SENTINEL_44',
			tokenCount: 5,
			text: 'private page text',
		})

		expect(safe).toMatchObject({
			sessionId: '[REDACTED]',
			username: '[REDACTED]',
			memberId: '[REDACTED]',
			password: '[REDACTED]',
			errorMessage: '[OMITTED_DIAGNOSTIC_TEXT]',
			bodySnippet: '[OMITTED_DIAGNOSTIC_TEXT]',
			failureText: '[OMITTED_DIAGNOSTIC_TEXT]',
		description: '[OMITTED_DIAGNOSTIC_TEXT]',
		url: '[OMITTED_MEDIA_URL]',
			tokenCount: 5,
			text: '[OMITTED_DIAGNOSTIC_TEXT]',
		})
		expect(JSON.stringify(safe)).not.toMatch(/session-secret|chef@example|member-secret|password-secret/)
	})

	it('fails closed on cyclic/custom objects and omits arbitrary error text', () => {
		const cyclic: Record<string, unknown> = { accessToken: 'TOKEN_SENTINEL_9302' }
		cyclic.self = cyclic
		cyclic.toString = () => 'TOKEN_SENTINEL_9302'

		const safe = safeDiagnosticValue({
			cyclic,
			error: new Error('private user message TOKEN_SENTINEL_9302'),
			errorMessage: 'private recipe text without a detectable identifier',
		})
		const serialized = JSON.stringify(safe)

		expect(serialized).not.toContain('TOKEN_SENTINEL_9302')
		expect(serialized).not.toContain('private user message')
		expect(serialized).toContain('[CIRCULAR]')
		expect(serialized).toContain('[OMITTED_DIAGNOSTIC_TEXT]')
	})

	it('does not invoke accessors and preserves repeated acyclic references', () => {
		let getterCalls = 0
		const shared = { status: 'passed' }
		const value: Record<string, unknown> = { left: shared, right: shared }
		Object.defineProperty(value, 'debug', {
			enumerable: true,
			get() {
				getterCalls += 1
				return 'PRIVATE_MEMBER_VALUE_99'
			},
		})

		const safe = safeDiagnosticValue(value)
		const serialized = JSON.stringify(safe)

		expect(getterCalls).toBe(0)
		expect(safe).toMatchObject({
			left: { status: 'passed' },
			right: { status: 'passed' },
			debug: '[OMITTED_ACCESSOR]',
		})
		expect(serialized).not.toContain('PRIVATE_MEMBER_VALUE_99')
		expect(serialized.match(/passed/g)).toHaveLength(2)
	})

	it('does not read custom Error name or message accessors', () => {
		let nameGetterCalls = 0
		let messageGetterCalls = 0
		const error = new Error()
		Object.defineProperty(error, 'name', {
			enumerable: true,
			get() {
				nameGetterCalls += 1
				return 'Private member Rina Nguyen'
			},
		})
		Object.defineProperty(error, 'message', {
			enumerable: true,
			get() {
				messageGetterCalls += 1
				throw new Error('getter must not execute')
			},
		})

		const safe = safeDiagnosticValue(error)
		const serialized = JSON.stringify(safe)

		expect(nameGetterCalls).toBe(0)
		expect(messageGetterCalls).toBe(0)
		expect(serialized).not.toContain('Rina Nguyen')
		expect(serialized).not.toContain('getter must not execute')
		expect(serialized).toContain('[OMITTED_ACCESSOR]')
	})

	it('redacts arbitrary authorization schemes and omits arbitrary URL query values', () => {
		const safe = safeDiagnosticValue({
			url: '/search?userId=PRIVATE_USER_382&q=Rina%20Nguyen&sort=newest',
			label: 'Authorization: AWS4-HMAC-SHA256 Credential=ACCESS_SENTINEL, Signature=SIGNATURE_SENTINEL',
			note: 'Authorization: Digest username="member@example.org", response="DIGEST_SENTINEL"',
		})
		const serialized = JSON.stringify(safe)
		expect(serialized).not.toMatch(/PRIVATE_USER_382|Rina%20Nguyen|ACCESS_SENTINEL|SIGNATURE_SENTINEL|member@example|DIGEST_SENTINEL/)
		expect(safe).toMatchObject({ url: '/search?userId=[OMITTED_QUERY_VALUE]&q=[OMITTED_QUERY_VALUE]&sort=[OMITTED_QUERY_VALUE]' })
		expect(safeDiagnosticValue({ url: 'search?userId=PRIVATE_USER_382&q=Rina%20Nguyen' }).url).toBe('search?userId=[OMITTED_QUERY_VALUE]&q=[OMITTED_QUERY_VALUE]')
		expect(safeDiagnosticValue({ url: 'search?user%49d=PRIVATE_USER_382&q=Rina%20Nguyen' }).url).toBe('search?user%49d=[OMITTED_QUERY_VALUE]&q=[OMITTED_QUERY_VALUE]')
		expect(safeDiagnosticValue({ url: '?userId=PRIVATE_USER_382&q=Rina%20Nguyen' }).url).toBe('?userId=[OMITTED_QUERY_VALUE]&q=[OMITTED_QUERY_VALUE]')
		expect(safeDiagnosticValue({ url: 'search?q=Rina%20Nguyen' }).url).toBe('search?q=[OMITTED_QUERY_VALUE]')
		expect(safeDiagnosticValue({ url: 'The query ?foo=bar is harmless prose.' }).url).toBe('The query ?foo=bar is harmless prose.')
		expect(safeDiagnosticValue({ url: 'Do we support foo?bar=baz in the docs?' }).url).toBe('Do we support foo?bar=baz in the docs?')
		expect(safeDiagnosticValue({
			url: '{"authorization":"Digest username=member,response=DIGEST_SENTINEL","status":"passed"}',
		}).url).toBe('{"authorization":"[REDACTED]","status":"passed"}')
	})

	it('reads error data properties without invoking accessors', () => {
		let getterCalls = 0
		const error = new Error('ordinary error')
		Object.defineProperty(error, 'name', {
			get() {
				getterCalls += 1
				throw new Error('blocked')
			},
		})
		const accessor = Object.defineProperty({}, 'message', {
			get() {
				getterCalls += 1
				return 'private'
			},
		})
		expect(safeErrorMessage(error)).toBe('ordinary error')
		expect(safeErrorName(error)).toBe('Error')
		expect(readOwnDataProperty(accessor, 'message', 'fallback')).toBe('fallback')
		expect(getterCalls).toBe(0)
		class InheritedTimeoutError extends Error {}
		Object.defineProperty(InheritedTimeoutError.prototype, 'name', { value: 'TimeoutError' })
		expect(safeErrorName(new InheritedTimeoutError('wait timed out'))).toBe('TimeoutError')
	})
})
