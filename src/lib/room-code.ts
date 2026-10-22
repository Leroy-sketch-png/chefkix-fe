export const ROOM_CODE_LENGTH = 6

export function normalizeRoomCode(value: string | null | undefined): string {
	return (value ?? '')
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, '')
		.slice(0, ROOM_CODE_LENGTH)
}

export function isValidRoomCode(value: string | null | undefined): boolean {
	return normalizeRoomCode(value).length === ROOM_CODE_LENGTH
}

export function getRoomCodeFromParams(params: {
	get(name: string): string | null
}): string {
	return normalizeRoomCode(params.get('code') || params.get('roomCode'))
}

export function roomInvitePath(
	roomCode: string,
	role?: 'COOK' | 'SPECTATOR',
): string {
	const code = normalizeRoomCode(roomCode)
	const params = new URLSearchParams()
	if (code) params.set('code', code)
	if (role) params.set('role', role)
	const query = params.toString()
	return query ? `/cook-together?${query}` : '/cook-together'
}
