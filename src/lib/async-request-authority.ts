export interface AsyncRequestTicket {
	readonly generation: number
	readonly request: number
}

export interface AsyncRequestAuthority {
	reset: () => void
	begin: () => AsyncRequestTicket
	isCurrent: (ticket: AsyncRequestTicket) => boolean
}

export function createAsyncRequestAuthority(): AsyncRequestAuthority {
	let generation = 0
	let request = 0

	return {
		reset() {
			generation += 1
			request += 1
		},
		begin() {
			request += 1
			return { generation, request }
		},
		isCurrent(ticket) {
			return ticket.generation === generation && ticket.request === request
		},
	}
}
