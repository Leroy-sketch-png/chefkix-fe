export const CHALLENGE_STREAMS = [
	'daily',
	'weekly',
	'community',
	'seasonal',
] as const

export type ChallengeStream = (typeof CHALLENGE_STREAMS)[number]

type ChallengeResult = { success?: boolean } | null | undefined

export const getFailedChallengeStreams = (
	results: Record<ChallengeStream, ChallengeResult>,
): ChallengeStream[] =>
	CHALLENGE_STREAMS.filter(stream => results[stream]?.success !== true)
