export interface CookSessionLike {
	status?: string | null
	recipeId?: string | null
}

export function hasActiveCookSession(
	session?: CookSessionLike | null,
): boolean {
	return session?.status === 'in_progress' && Boolean(session.recipeId)
}
