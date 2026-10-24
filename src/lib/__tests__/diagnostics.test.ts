import { safeDiagnosticValue } from '@/lib/diagnostics'

describe('diagnostic value redaction', () => {
	it('redacts nested auth, verification, and signed URL secrets', () => {
		const value = safeDiagnosticValue({
			request: {
				accessToken: 'secret-token-value',
				otpCode: '123456',
				url: 'https://media.example/photo?X-Amz-Credential=private&X-Amz-Signature=signed',
			},
		})

		expect(JSON.stringify(value)).not.toContain('secret-token-value')
		expect(JSON.stringify(value)).not.toContain('123456')
		expect(JSON.stringify(value)).not.toContain('private')
		expect(JSON.stringify(value)).not.toContain('signed')
	})

	it('redacts secret echoes in exception messages', () => {
		const value = safeDiagnosticValue(
			new Error('request failed: Bearer very-secret-auth-value'),
		)

		expect(JSON.stringify(value)).not.toContain('very-secret-auth-value')
	})
})
