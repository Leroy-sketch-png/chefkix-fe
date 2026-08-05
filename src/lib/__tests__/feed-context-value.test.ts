import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const readSource = (path: string) =>
	readFileSync(join(process.cwd(), path), 'utf8')

const railSource = readSource('src/components/social/FeedContextRail.tsx')
const deckSource = readSource('src/components/social/FeedCommandDeck.tsx')
const feedSource = readSource('src/app/(main)/feed/page.tsx')
const feedRailCall = feedSource.match(/<FeedContextRail[\s\S]*?\/>/)?.[0]
const feedDeckCall = feedSource.match(/<FeedCommandDeck[\s\S]*?\/>/)?.[0]
const messages = JSON.parse(readSource('messages/en.json')) as {
	feed: Record<string, string>
}

const telemetryKeys = [
	'pulseEyebrow',
	'pulseHeading',
	'pulseVisiblePosts',
	'pulseMode',
	'pulseAudience',
	'pulseAudiencePersonalized',
	'pulseAudienceFollowing',
	'pulseAudiencePublic',
]

describe('feed context rail consumer value', () => {
	it('does not expose render-state telemetry or accept telemetry props', () => {
		expect(feedRailCall).toBeDefined()
		expect(feedDeckCall).toBeDefined()
		expect(railSource).not.toContain('MetricRow')
		expect(railSource).not.toContain('postCount')
		expect(railSource).not.toContain('feedMode')
		expect(feedRailCall).not.toContain('postCount=')
		expect(feedRailCall).not.toContain('feedMode=')
		expect(deckSource).not.toContain('postCount')
		expect(deckSource).not.toContain('hasMore')
		expect(deckSource).not.toContain('isLoading')
		expect(deckSource).not.toContain("t('postsCount'")
		expect(deckSource).not.toContain("t('loadMore')")
		expect(feedDeckCall).not.toContain('postCount=')
		expect(feedDeckCall).not.toContain('hasMore=')
		expect(feedDeckCall).not.toContain('isLoading=')
		expect(feedSource).not.toContain("t('postsCount'")
		expect(messages.feed).not.toHaveProperty('postsCount')
		expect(messages.feed).not.toHaveProperty('loadMore')

		for (const key of telemetryKeys) {
			expect(railSource).not.toContain(key)
			expect(messages.feed).not.toHaveProperty(key)
		}
	})

	it('preserves direct scroller actions and authenticated friend presence', () => {
		for (const key of [
			'quickMovesCommunity',
			'quickMovesExplore',
			'quickMovesMessages',
			'quickMovesChallenges',
		]) {
			expect(railSource).toContain(key)
			expect(messages.feed).toHaveProperty(key)
		}

		expect(railSource).toContain('<FriendsOnlineWidget />')
		expect(feedRailCall).toContain('showFriendsOnline={Boolean(user)}')
	})
})
