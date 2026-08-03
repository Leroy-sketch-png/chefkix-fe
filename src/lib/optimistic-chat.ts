import type { ChatMessage, ChatParticipant } from '@/services/chat'

interface OptimisticMessageInput {
	clientMessageId: string
	conversationId: string
	message: string
	sender: ChatParticipant
	replyTo?: ChatMessage['replyTo']
}

export function createClientMessageId(): string {
	if (
		typeof crypto !== 'undefined' &&
		typeof crypto.randomUUID === 'function'
	) {
		return crypto.randomUUID()
	}

	return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function createOptimisticMessage({
	clientMessageId,
	conversationId,
	message,
	sender,
	replyTo,
}: OptimisticMessageInput): ChatMessage {
	return {
		id: `pending:${clientMessageId}`,
		clientMessageId,
		conversationId,
		me: true,
		message,
		sender,
		createdDate: new Date().toISOString(),
		type: 'TEXT',
		replyTo: replyTo ?? null,
		deliveryStatus: 'sending',
	}
}

export function reconcileChatMessage(
	messages: ChatMessage[],
	incoming: ChatMessage,
): ChatMessage[] {
	const authoritativeIndex = messages.findIndex(
		message => message.id === incoming.id,
	)
	if (authoritativeIndex >= 0) {
		return messages.map((message, index) =>
			index === authoritativeIndex ? incoming : message,
		)
	}

	const pendingIndex = incoming.clientMessageId
		? messages.findIndex(
				message => message.clientMessageId === incoming.clientMessageId,
			)
		: -1
	if (pendingIndex >= 0) {
		return messages.map((message, index) =>
			index === pendingIndex ? incoming : message,
		)
	}

	return [...messages, incoming]
}

export function removePendingMessage(
	messages: ChatMessage[],
	clientMessageId: string,
): ChatMessage[] {
	return messages.filter(
		message =>
			message.clientMessageId !== clientMessageId ||
			!message.id.startsWith('pending:'),
	)
}
