import assert from 'node:assert/strict'
import test from 'node:test'
import {
	sanitizeDiagnosticText,
	sanitizeDiagnosticValue,
} from '../src/lib/sanitize-diagnostics.mjs'

test('redacts credentials in browser diagnostics and response payloads', () => {
	const text = [
		'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature',
		'GET /api?access_token=access-secret&next=/feed',
		'GET /media?X-Amz-Signature=aws-signature-secret&code=oauth-code-secret',
		'{"refreshToken":"refresh-secret","api_key":"provider-secret"}',
		'ghp_123456789012345678901234567890123456',
	].join(' ')

	const sanitized = sanitizeDiagnosticText(text)
	assert.doesNotMatch(
		sanitized,
		/access-secret|refresh-secret|provider-secret|aws-signature-secret|oauth-code-secret|ghp_123/,
	)
	assert.doesNotMatch(sanitized, /eyJhbGciOiJIUzI1NiJ9/)
	assert.match(sanitized, /Authorization: Bearer \[REDACTED\]/)
})

test('redacts nested diagnostic data without changing non-string fields', () => {
	const sanitized = sanitizeDiagnosticValue({
		url: 'https://example.test/?token=url-secret',
		status: 503,
		accessToken: 'opaque-short-access-token',
		nested: [{ text: 'cookie refresh_token=cookie-secret' }],
	})

	assert.deepEqual(sanitized, {
		url: 'https://example.test/?token=[REDACTED]',
		status: 503,
		accessToken: '[REDACTED]',
		nested: [{ text: 'cookie refresh_token=[REDACTED]' }],
	})
})
