import fs from 'node:fs'
import path from 'node:path'
import {
	getRoomCodeFromParams,
	isValidRoomCode,
	normalizeRoomCode,
	roomInvitePath,
} from '@/lib/room-code'

describe('co-cook room code contract', () => {
	it('normalizes human-pasted separators without weakening the contract', () => {
		expect(normalizeRoomCode(' ra-men 7 ')).toBe('RAMEN7')
		expect(normalizeRoomCode('abcd-ef-extra')).toBe('ABCDEF')
		expect(isValidRoomCode('RA-MEN7')).toBe(true)
		expect(isValidRoomCode('RAMEN')).toBe(false)
	})

	it('reads the canonical query and preserves legacy invite compatibility', () => {
		expect(getRoomCodeFromParams(new URLSearchParams('code=ra-men7'))).toBe(
			'RAMEN7',
		)
		expect(getRoomCodeFromParams(new URLSearchParams('roomCode=pho-123'))).toBe(
			'PHO123',
		)
	})

	it('generates canonical, encoded invite paths', () => {
		expect(roomInvitePath(' ramen7 ')).toBe('/cook-together?code=RAMEN7')
		expect(roomInvitePath('pho-123', 'SPECTATOR')).toBe(
			'/cook-together?code=PHO123&role=SPECTATOR',
		)
	})

	it('guards URL auto-join against repeated failure attempts', () => {
		const source = fs.readFileSync(
			path.join(process.cwd(), 'src/app/(main)/cook-together/page.tsx'),
			'utf8',
		)
		expect(source).toContain('autoJoinAttemptRef.current !== inviteKey')
		expect(source).toContain('autoJoinAttemptRef.current = inviteKey')
		expect(source).toContain('getRoomCodeFromParams(searchParams)')
	})
})
