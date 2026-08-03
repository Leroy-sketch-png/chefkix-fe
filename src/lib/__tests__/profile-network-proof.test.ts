import fs from 'node:fs'
import path from 'node:path'
import {
	getSettledProfileNetworkCount,
	getSettledProfileNetworkTotal,
	parseProfileNetworkTab,
} from '@/lib/profile-network-proof'

describe('profile network proof authority', () => {
	it('accepts only supported relationship tabs', () => {
		expect(parseProfileNetworkTab('following')).toBe('following')
		expect(parseProfileNetworkTab('friends')).toBe('friends')
		expect(parseProfileNetworkTab('not-a-tab')).toBe('followers')
		expect(parseProfileNetworkTab(null)).toBe('followers')
	})

	it('does not convert loading or failed lanes into zero', () => {
		expect(
			getSettledProfileNetworkCount({
				isLoading: true,
				error: null,
				count: 0,
			}),
		).toBeNull()
		expect(
			getSettledProfileNetworkCount({
				isLoading: false,
				error: 'unavailable',
				count: 0,
			}),
		).toBeNull()
		expect(
			getSettledProfileNetworkCount({
				isLoading: false,
				error: null,
				count: 0,
			}),
		).toBe(0)
	})

	it('publishes a total only when every contributing lane is settled', () => {
		expect(
			getSettledProfileNetworkTotal([
				{ isLoading: false, error: null, count: 4 },
				{ isLoading: false, error: null, count: 7 },
			]),
		).toBe(11)
		expect(
			getSettledProfileNetworkTotal([
				{ isLoading: false, error: null, count: 4 },
				{ isLoading: true, error: null, count: 0 },
			]),
		).toBeNull()
	})

	it('keeps production ownership free of fabricated percentile and eager zeros', () => {
		const root = process.cwd()
		const header = fs.readFileSync(
			path.join(root, 'src/components/profile/ProfileHeaderGamified.tsx'),
			'utf8',
		)
		const network = fs.readFileSync(
			path.join(root, 'src/app/(main)/profile/followers/page.tsx'),
			'utf8',
		)

		expect(header).not.toContain("t('topPercent')")
		expect(header).toContain("t('xpLabel'")
		expect(network).not.toContain('{data[tab.key].length}')
		expect(network).toContain('Promise.all(')
		expect(network).toContain('getSettledProfileNetworkCount')
	})
})
