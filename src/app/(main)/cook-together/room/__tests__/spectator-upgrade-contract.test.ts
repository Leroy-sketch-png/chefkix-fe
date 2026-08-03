import fs from 'node:fs'
import path from 'node:path'

describe('spectator-to-cook page contract', () => {
	const source = fs.readFileSync(
		path.join(process.cwd(), 'src/app/(main)/cook-together/room/page.tsx'),
		'utf8',
	)

	it('upgrades in place without leaving or redirecting on rejection', () => {
		const handler = source.slice(
			source.indexOf('const handleUpgradeToCook'),
			source.indexOf('const recoverySessionId'),
		)

		expect(handler).toContain("joinRoom(roomCode, 'COOK')")
		expect(handler).not.toContain('leaveRoom(')
		expect(handler).not.toContain('router.replace')
	})

	it('offers bounded recovery when a promoted session is not hydrated', () => {
		expect(source).toContain('const recoverySessionId =')
		expect(source).toContain('loadSession(recoverySessionId)')
		expect(source).toContain("role='alert'")
		expect(source).toContain("t('ctRetryCookSetup')")
		expect(source).toContain('disabled={!session}')
	})

	it('keeps activity auto-scroll inside the feed and idle mount at page top', () => {
		expect(source).toContain('if (activityFeed.length === 0) return')
		expect(source).toContain('feed?.scrollTo({ top: feed.scrollHeight')
		expect(source).not.toContain('scrollIntoView')
	})
})
