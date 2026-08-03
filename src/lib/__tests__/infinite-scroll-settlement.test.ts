import fs from 'fs'
import path from 'path'
import { createAsyncRequestAuthority } from '@/lib/async-request-authority'

const readSource = (...segments: string[]) =>
	fs.readFileSync(path.join(process.cwd(), 'src', ...segments), 'utf8')

describe('async request authority', () => {
	it('invalidates an outstanding request when the query generation changes', () => {
		const authority = createAsyncRequestAuthority()
		const oldRequest = authority.begin()

		authority.reset()

		expect(authority.isCurrent(oldRequest)).toBe(false)
		expect(authority.isCurrent(authority.begin())).toBe(true)
	})

	it('lets only the newest request settle within one generation', () => {
		const authority = createAsyncRequestAuthority()
		const firstRequest = authority.begin()
		const retryRequest = authority.begin()

		expect(authority.isCurrent(firstRequest)).toBe(false)
		expect(authority.isCurrent(retryRequest)).toBe(true)
	})

	it.each([
		['Feed', 'app', '(main)', 'feed', 'page.tsx'],
		['Explore', 'app', '(main)', 'explore', 'ExploreClient.tsx'],
		['User Discovery', 'components', 'discover', 'UserDiscoveryClient.tsx'],
	])(
		'%s rejects stale pagination and suspends observation after failure',
		(_label, ...segments) => {
			const source = readSource(...segments)

			expect(source).toContain('createAsyncRequestAuthority()')
			expect(source).toContain('isCurrent(ticket)')
			expect(source).toContain('setLoadMoreError(true)')
			expect(source).toMatch(/isLoading\s*\|\|\s*loadMoreError/)
			expect(source).toContain("role='alert'")
		},
	)

	it('does not promise an unavailable pull-to-refresh gesture', () => {
		const messages = fs.readFileSync(
			path.join(process.cwd(), 'messages', 'en.json'),
			'utf8',
		)

		expect(messages).not.toContain('Pull down to retry')
	})
})
