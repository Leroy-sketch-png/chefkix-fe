import {
	createOptimisticMessage,
	reconcileChatMessage,
	removePendingMessage,
} from '@/lib/optimistic-chat'
import type { ChatMessage, ChatParticipant } from '@/services/chat'

const sender: ChatParticipant = {
	userId: 'cook-1',
	username: 'cook',
	firstName: 'Kitchen',
	lastName: 'Cook',
	avatar: '/cook.jpg',
}

const pending = createOptimisticMessage({
	clientMessageId: 'client-1',
	conversationId: 'conversation-1',
	message: 'Water is boiling',
	sender,
})

const authoritative: ChatMessage = {
	...pending,
	id: 'message-1',
	deliveryStatus: undefined,
}

describe('optimistic chat reconciliation', () => {
	it('replaces a pending row with the authoritative response', () => {
		expect(reconcileChatMessage([pending], authoritative)).toEqual([
			authoritative,
		])
	})

	it('deduplicates a later websocket echo after the response', () => {
		expect(reconcileChatMessage([authoritative], authoritative)).toEqual([
			authoritative,
		])
	})

	it('removes only an unresolved pending row on failure', () => {
		expect(removePendingMessage([pending], 'client-1')).toEqual([])
		expect(removePendingMessage([authoritative], 'client-1')).toEqual([
			authoritative,
		])
	})

	it('keeps both message surfaces on acknowledged idempotent commands', () => {
		const page = fs.readFileSync(
			path.join(process.cwd(), 'src', 'app', '(main)', 'messages', 'page.tsx'),
			'utf8',
		)
		const drawer = fs.readFileSync(
			path.join(
				process.cwd(),
				'src',
				'components',
				'layout',
				'MessagesDrawer.tsx',
			),
			'utf8',
		)
		const hook = fs.readFileSync(
			path.join(process.cwd(), 'src', 'hooks', 'useChatWebSocket.ts'),
			'utf8',
		)

		expect(page).not.toContain('sendMessageWs')
		expect(page).toContain('createOptimisticMessage')
		expect(page).toContain('clientMessageId')
		expect(drawer).toContain('createOptimisticMessage')
		expect(drawer).toContain('clientMessageId')
		expect(drawer).toContain('useChatWebSocket')
		expect(drawer).toContain('reconcileChatMessage(prev, message)')
		expect(hook).not.toContain("destination: '/app/chat.sendMessage'")
	})

	it('keeps the chat composer truthful while preserving keyboard submission', () => {
		const page = fs.readFileSync(
			path.join(process.cwd(), 'src', 'app', '(main)', 'messages', 'page.tsx'),
			'utf8',
		)

		expect(page).not.toContain("from '@/components/shared/MentionInput'")
		expect(page).not.toContain('taggedUserIdsRef')
		expect(page).toContain("event.key === 'Enter' && !event.shiftKey")
		expect(page).toContain('handleSendMessage()')
		expect(page).toContain("aria-label={t('ariaMessageInput')}")
	})
})
import fs from 'fs'
import path from 'path'
