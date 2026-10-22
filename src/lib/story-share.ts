export function storyViewPath(userId: string, storyId: string): string {
	return `/story/view/${encodeURIComponent(userId)}?startAt=${encodeURIComponent(storyId)}`
}

export function storyShareUrl(origin: string, userId: string, storyId: string) {
	return `${origin.replace(/\/$/, '')}${storyViewPath(userId, storyId)}`
}
