import {
	VIDEO_SIGNALING_BEARER_PROTOCOL_PREFIX,
	VIDEO_SIGNALING_PROTOCOL,
	buildVideoSignalingProtocols,
	buildVideoSignalingUrl,
} from '@/lib/video-signaling-auth'

describe('video signaling auth helpers', () => {
	it('builds a websocket URL without putting auth material in the query string', () => {
		const url = new URL(buildVideoSignalingUrl())

		expect(url.protocol).toBe('ws:')
		expect(url.pathname).toContain('/ws/video-signaling')
		expect(url.searchParams.has('access_token')).toBe(false)
		expect(url.searchParams.has('token')).toBe(false)
		expect(url.search).toBe('')
	})

	it('sends browser websocket auth through protocols instead of the URL', () => {
		const protocols = buildVideoSignalingProtocols(' jwt.header.payload ')

		expect(protocols).toEqual([
			VIDEO_SIGNALING_PROTOCOL,
			`${VIDEO_SIGNALING_BEARER_PROTOCOL_PREFIX}jwt.header.payload`,
		])
	})

	it('does not create an empty bearer protocol when the token is missing', () => {
		expect(buildVideoSignalingProtocols('   ')).toEqual([
			VIDEO_SIGNALING_PROTOCOL,
		])
	})
})
