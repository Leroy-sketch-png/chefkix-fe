export interface SelectedMention {
	userId: string
	token: string
}

const escapeRegExp = (value: string): string =>
	value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const createMentionToken = (username: string): string =>
	`@${username.trim().replace(/^@+/, '')}`

export const reconcileSelectedMentions = (
	value: string,
	mentions: SelectedMention[],
): SelectedMention[] =>
	mentions.filter(({ token }) => {
		const tokenPattern = new RegExp(
			`(^|\\s)${escapeRegExp(token)}(?=$|[^\\p{L}\\p{N}._-])`,
			'u',
		)
		return tokenPattern.test(value)
	})

export const haveSameMentionIds = (
	left: SelectedMention[],
	right: SelectedMention[],
): boolean =>
	left.length === right.length &&
	left.every((mention, index) => mention.userId === right[index]?.userId)
