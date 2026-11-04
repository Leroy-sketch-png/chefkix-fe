/** @jest-environment node */

describe('GhostDriver server initialization', () => {
	it('can import its eager singleton when window is unavailable', () => {
		expect(() => require('../ghost-driver')).not.toThrow()
	})
})
