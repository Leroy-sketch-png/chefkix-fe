import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const page = readFileSync(
	join(process.cwd(), 'src/app/(main)/messages/page.tsx'),
	'utf8',
)
const messages = JSON.parse(
	readFileSync(join(process.cwd(), 'messages/en.json'), 'utf8'),
) as { messages: Record<string, string> }

describe('messages user-facing copy contract', () => {
	it('uses the messages catalog for labels, reply context, and connection state', () => {
		for (const key of [
			'inboxLabel',
			'activeConversations',
			'retry',
			'replyingTo',
			'yourself',
			'message',
			'connectionUnavailable',
			'liveUpdatesUnavailable',
		]) {
			expect(messages.messages[key]).toBeTruthy()
			expect(page).toContain(`t('${key}'`)
		}

		expect(page).not.toContain('WebSocket unavailable — messages sent via REST')
		expect(page).not.toContain('Replying to')
		expect(page).not.toContain('Active conversations')
	})

	it('keeps REST message sending available when real-time updates fail', () => {
		expect(page).toContain('sendMessage as sendMessageRest')
		expect(page).toContain('await sendMessageRest({')
		expect(messages.messages.liveUpdatesUnavailable).toContain(
			'You can still send messages',
		)
		expect(messages.messages.liveUpdatesUnavailable).toContain(
			'new replies may not appear',
		)
	})
})
