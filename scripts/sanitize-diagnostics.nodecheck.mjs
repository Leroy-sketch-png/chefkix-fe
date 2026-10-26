import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
	readOwnDataProperty,
	safeErrorMessage,
	safeErrorName,
	sanitizeDiagnosticText,
	sanitizeDiagnosticValue,
} from '../src/lib/sanitize-diagnostics.mjs'
import { serializePresenterDiagnosticReport } from './presenter-diagnostic-report.mjs'

test('redacts known credentials, URL userinfo, identifiers, and personal email', () => {
	const sanitized = sanitizeDiagnosticText(
		'https://alice:encoded%3Asecret@example.test/users/u-12?token=abc&code=oauth',
	)
	assert.doesNotMatch(sanitized, /alice|encoded%3Asecret|u-12|token=abc|code=oauth/)
	assert.match(sanitized, /https:\/\/\[REDACTED\]@example\.test\/users\/\[REDACTED_ID\]/)
	assert.match(sanitized, /token=\[REDACTED\]/)
	assert.match(sanitized, /code=\[REDACTED\]/)
	const queryText = sanitizeDiagnosticText('/search?userId=PRIVATE_USER_382&q=Rina%20Nguyen&sort=newest')
	assert.doesNotMatch(queryText, /PRIVATE_USER_382|Rina%20Nguyen/)
	assert.match(queryText, /userId=\[OMITTED_QUERY_VALUE\]/)
	assert.match(queryText, /q=\[OMITTED_QUERY_VALUE\]/)
	assert.match(queryText, /sort=\[OMITTED_QUERY_VALUE\]/)
	const relativeQueryText = sanitizeDiagnosticText('search?userId=PRIVATE_USER_382&q=Rina%20Nguyen')
	assert.doesNotMatch(relativeQueryText, /PRIVATE_USER_382|Rina%20Nguyen/)
	assert.match(relativeQueryText, /userId=\[OMITTED_QUERY_VALUE\]/)
	const encodedRelativeQuery = sanitizeDiagnosticText('search?user%49d=PRIVATE_USER_382&q=Rina%20Nguyen')
	assert.doesNotMatch(encodedRelativeQuery, /PRIVATE_USER_382|Rina%20Nguyen/)
	assert.match(encodedRelativeQuery, /user%49d=\[OMITTED_QUERY_VALUE\]/)
	const queryOnlyText = sanitizeDiagnosticText('?userId=PRIVATE_USER_382&q=Rina%20Nguyen')
	assert.doesNotMatch(queryOnlyText, /PRIVATE_USER_382|Rina%20Nguyen/)
	assert.match(queryOnlyText, /userId=\[OMITTED_QUERY_VALUE\]/)
	const bareSearchText = sanitizeDiagnosticText('search?q=Rina%20Nguyen')
	assert.doesNotMatch(bareSearchText, /Rina%20Nguyen/)
	assert.equal(sanitizeDiagnosticText('Do we support foo?bar=baz in the docs?'), 'Do we support foo?bar=baz in the docs?')
	assert.equal(sanitizeDiagnosticText('The query ?foo=bar should be preserved in prose.'), 'The query ?foo=bar should be preserved in prose.')
	assert.equal(
		sanitizeDiagnosticText('{"authorization":"Digest username=member,response=DIGEST_SENTINEL","status":"passed"}'),
		'{"authorization":"[REDACTED]","status":"passed"}',
	)
	const protocolRelative = sanitizeDiagnosticText('//alice%3Aplainpass@api/path')
	assert.doesNotMatch(protocolRelative, /alice|plainpass/)
	assert.match(protocolRelative, /\/\/\[REDACTED\]@api\/path/)
	assert.equal(sanitizeDiagnosticText('/recipes//ordinary/path'), '/recipes//ordinary/path')
	const basicHeader = sanitizeDiagnosticText('Authorization: Basic dXNlcjpwYXNz')
	assert.doesNotMatch(basicHeader, /dXNlcjpwYXNz/)
	assert.match(basicHeader, /Authorization: \[REDACTED\]/)
	for (const authHeader of [
		'Authorization: AWS4-HMAC-SHA256 Credential=ACCESS_SENTINEL, SignedHeaders=host, Signature=SIGNATURE_SENTINEL',
		'Authorization: Digest username="member@example.org", response="DIGEST_SENTINEL"',
	]) {
		const safe = sanitizeDiagnosticText(authHeader)
		assert.doesNotMatch(safe, /ACCESS_SENTINEL|SIGNATURE_SENTINEL|member@example|DIGEST_SENTINEL/)
		assert.match(safe, /Authorization: \[REDACTED\]/)
	}
	assert.doesNotMatch(sanitizeDiagnosticText('{"authorization":"Basic dXNlcjpwYXNz"}'), /dXNlcjpwYXNz/)
	assert.doesNotMatch(sanitizeDiagnosticText("authorization='Bearer opaque-token-value'"), /opaque-token-value/)
	assert.equal(sanitizeDiagnosticText('data:image/png;base64,PRIVATE_MEDIA_47'), '[OMITTED_MEDIA_URL]')
	assert.match(sanitizeDiagnosticText('/recipes/chefkix-senath-stage-10'), /chefkix-senath-stage-10/)
	assert.match(sanitizeDiagnosticText('tokenCount=5 codeCount=2'), /tokenCount=5 codeCount=2/)
	assert.doesNotMatch(sanitizeDiagnosticText('contact alice@example.org'), /alice@example\.org/)
	const structured = sanitizeDiagnosticText('{"sessionId":"SID_SECRET","password":"PASS_SECRET"}')
	assert.doesNotMatch(structured, /SID_SECRET|PASS_SECRET/)
	assert.match(structured, /sessionId.*\[REDACTED\]/)
})

test('redacts identity aliases and omits untrusted text without broad key matches', () => {
	const sanitized = sanitizeDiagnosticValue({
		session: 'session-secret',
		sessionId: 'sid-secret',
		sid: 'short-id',
		username: 'chef@example.org',
		member_id: 'member-42',
		caption: 'a private user caption',
		text: 'untrusted page text',
		error: 'page text with user details',
		errorMessage: 'member note Rina Nguyen',
		bodySnippet: 'private response body',
		failureText: 'private network failure text',
		userMessage: 'private user-authored text',
		validationErrors: ['private validation detail'],
		tokenCount: 20,
		codeCount: 4,
	})
	assert.deepEqual({ ...sanitized }, {
		session: '[REDACTED]',
		sessionId: '[REDACTED]',
		sid: '[REDACTED]',
		username: '[REDACTED]',
		member_id: '[REDACTED]',
		caption: '[OMITTED_DIAGNOSTIC_TEXT]',
		text: '[OMITTED_DIAGNOSTIC_TEXT]',
		error: '[OMITTED_DIAGNOSTIC_TEXT]',
		errorMessage: '[OMITTED_DIAGNOSTIC_TEXT]',
		bodySnippet: '[OMITTED_DIAGNOSTIC_TEXT]',
		failureText: '[OMITTED_DIAGNOSTIC_TEXT]',
		userMessage: '[OMITTED_DIAGNOSTIC_TEXT]',
		validationErrors: '[OMITTED_DIAGNOSTIC_TEXT]',
		tokenCount: 20,
		codeCount: 4,
	})
	assert.deepEqual({ ...sanitizeDiagnosticValue({ description: 'private recipe note', url: 'data:image/png;base64,PRIVATE_MEDIA_47' }) }, {
		description: '[OMITTED_DIAGNOSTIC_TEXT]',
		url: '[OMITTED_MEDIA_URL]',
	})
	assert.equal(sanitizeDiagnosticValue('private free-form top-level text'), '[OMITTED_DIAGNOSTIC_TEXT]')
	assert.equal(sanitizeDiagnosticValue({ status: 'passed' }).status, 'passed')
})

test('cycle-safe traversal never invokes caller stringification', () => {
	const cyclic = { accessToken: 'TOKEN_SENTINEL_7301' }
	cyclic.self = cyclic
	cyclic.toString = () => 'TOKEN_SENTINEL_7301'
	const serialized = JSON.stringify(sanitizeDiagnosticValue(cyclic))
	assert.doesNotMatch(serialized, /TOKEN_SENTINEL_7301/)
	assert.match(serialized, /\[CIRCULAR\]/)
	assert.match(serialized, /\[OMITTED_UNSERIALIZABLE_VALUE\]/)
	assert.equal(sanitizeDiagnosticText({ toString: () => 'PRIVATE_MEMBER_VALUE_10' }), '[OMITTED_UNSERIALIZABLE_VALUE]')
})

test('throwing accessors are omitted without execution', () => {
	let getterCalls = 0
	const value = Object.defineProperty({}, 'private', {
		enumerable: true,
		get() {
			getterCalls += 1
			throw new Error('do not call')
		},
	})
	assert.deepEqual({ ...sanitizeDiagnosticValue(value) }, { private: '[OMITTED_ACCESSOR]' })
	assert.equal(getterCalls, 0)
})

test('does not execute successful accessors and preserves shared references', () => {
	let getterCalls = 0
	const shared = { status: 'passed' }
	const value = { left: shared, right: shared }
	Object.defineProperty(value, 'debug', {
		enumerable: true,
		get() {
			getterCalls += 1
			return 'PRIVATE_MEMBER_VALUE_99'
		},
	})

	const safe = sanitizeDiagnosticValue(value)
	const serialized = JSON.stringify(safe)
	assert.equal(getterCalls, 0)
	assert.deepEqual(JSON.parse(serialized), {
		left: { status: 'passed' },
		right: { status: 'passed' },
		debug: '[OMITTED_ACCESSOR]',
	})
	assert.equal(serialized.match(/passed/g)?.length, 2)
})

test('error helpers read own data properties only and never invoke accessors', () => {
	let getterCalls = 0
	const error = new Error('ordinary error')
	Object.defineProperty(error, 'name', {
		get() {
			getterCalls += 1
			throw new Error('do not invoke')
		},
	})
	const details = Object.defineProperty({}, 'code', {
		get() {
			getterCalls += 1
			return 'PRIVATE_CODE'
		},
	})
	assert.equal(safeErrorMessage(error), 'ordinary error')
	assert.equal(safeErrorName(error), 'Error')
	assert.equal(readOwnDataProperty(details, 'code', 'unknown'), 'unknown')
	assert.equal(getterCalls, 0)
	assert.equal(safeErrorMessage({ message: 'own message' }), 'own message')
	assert.equal(safeErrorMessage({ get message() { throw new Error('blocked') } }, 'fallback'), 'fallback')
	class InheritedTimeoutError extends Error {}
	Object.defineProperty(InheritedTimeoutError.prototype, 'name', { value: 'TimeoutError' })
	assert.equal(safeErrorName(new InheritedTimeoutError('wait timed out')), 'TimeoutError')
})

test('orchestrator summaries omit local artifact paths from diagnostic sinks', () => {
	const source = readFileSync(new URL('./live-demo-orchestrator.mjs', import.meta.url), 'utf8')
	assert.match(source, /'- artifacts: \[local path omitted\]'/)
	assert.match(source, /step\('Run artifacts written; local path omitted'\)/)
	assert.match(source, /Unable to inspect configured artifact directory/)
	assert.match(source, /Unable to prepare configured artifact directory/)
	assert.match(source, /Unable to write configured diagnostic artifact/)
	assert.equal(source.match(/fs\.writeFileSync\(/g)?.length, 1)
	assert.equal(source.match(/fs\.mkdirSync\(/g)?.length, 1)
})

test('presenter reports sanitize both persistence paths and omit raw failure output', () => {
	const source = readFileSync(new URL('./demo-presenter-check.mjs', import.meta.url), 'utf8')
	assert.match(source, /serializePresenterDiagnosticReport/)
	assert.equal(source.match(/writeFile\(reportPath, serializePresenterDiagnosticReport\(report\)\)/g)?.length, 2)
	assert.doesNotMatch(source, /writeFile\(reportPath, JSON\.stringify\(report/)
	assert.doesNotMatch(source, /String\(error\?\.stack \|\| error\)/)
	assert.doesNotMatch(source, /console\.(?:log|error)\(`Presenter check report: \$\{reportPath\}`\)/)
	assert.match(source, /untrusted diagnostic text was omitted/)
	assert.match(source, /report could not be saved; filesystem diagnostics were omitted/)
	assert.match(source, /Presenter browser cleanup failed; diagnostics were omitted/)
	assert.match(source, /Presenter check could not start; diagnostic details were omitted/)

	const successReport = serializePresenterDiagnosticReport({
		ok: true,
		baseUrl: 'https://tenant-private.example/demo/PRIVATE_PATH_SENTINEL?token=TOKEN_SENTINEL',
		cockpitUrl: 'https://example.invalid/sessions/COCKPIT_SENTINEL',
		remoteUrl: 'https://example.invalid/profiles/REMOTE_SENTINEL',
		stepCount: 6,
		signals: {
			pageErrors: [],
			console: [],
			requests: [{ url: 'https://tenant-private.example/recipes/PRIVATE_RECIPE_PATH?token=NESTED_TOKEN_SENTINEL' }],
		},
	})
	const failureReport = serializePresenterDiagnosticReport({
		ok: false,
		baseUrl: 'https://tenant-private.example/demo/PRIVATE_PATH_SENTINEL?token=TOKEN_SENTINEL',
		cockpitUrl: 'https://example.invalid/sessions/COCKPIT_SENTINEL',
		remoteUrl: 'https://example.invalid/profiles/REMOTE_SENTINEL',
		error: 'STACK_SENTINEL C:\\private\\browser\\profile',
		cockpitText: 'PAGE_TEXT_SENTINEL',
		pageErrorCount: 1,
		signals: {
			pageErrors: [{ message: 'PAGE_ERROR_SENTINEL', url: 'https://demo.test/tenants/PRIVATE_TENANT_PATH' }],
			console: [{ text: 'CONSOLE_TEXT_SENTINEL', href: 'https://tenant-private.example/private/HREF_PATH_SENTINEL' }],
		},
	})
	for (const serialized of [successReport, failureReport]) {
		assert.doesNotMatch(serialized, /PRIVATE_PATH_SENTINEL|TOKEN_SENTINEL|COCKPIT_SENTINEL|REMOTE_SENTINEL|PRIVATE_RECIPE_PATH|NESTED_TOKEN_SENTINEL|PRIVATE_TENANT_PATH|HREF_PATH_SENTINEL/)
	}
	assert.doesNotMatch(failureReport, /STACK_SENTINEL|private\\browser|PAGE_TEXT_SENTINEL|PAGE_ERROR_SENTINEL|CONSOLE_TEXT_SENTINEL|SESSION_SENTINEL/)
	assert.deepEqual(Object.keys(JSON.parse(successReport).signals.requests[0]), [])
	assert.match(successReport, /"ok": true/)
	assert.match(successReport, /"stepCount": 6/)
	assert.match(failureReport, /"ok": false/)
	assert.match(failureReport, /"pageErrorCount": 1/)
})
