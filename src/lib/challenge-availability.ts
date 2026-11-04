export const CHALLENGE_STREAMS = [
	'daily',
	'weekly',
	'community',
	'seasonal',
] as const

export type ChallengeStream = (typeof CHALLENGE_STREAMS)[number]

export const getChallengeCommandMetrics = (input: {
	failedStreams: readonly ChallengeStream[]
	hasDaily: boolean
	hasWeekly: boolean
	communityCount: number
	seasonalStatuses: readonly string[]
}) => {
	const unavailable = new Set(input.failedStreams)
	const dailyCount = unavailable.has('daily') ? null : Number(input.hasDaily)
	const weeklyCount = unavailable.has('weekly') ? null : Number(input.hasWeekly)
	const communityCount = unavailable.has('community')
		? null
		: input.communityCount
	const seasonalCount = unavailable.has('seasonal')
		? null
		: input.seasonalStatuses.length
	const activeChallengeCount =
		unavailable.size > 0
			? null
			: Number(input.hasDaily) +
				Number(input.hasWeekly) +
				input.communityCount +
				input.seasonalStatuses.filter(status => status === 'ACTIVE').length

	return {
		activeChallengeCount,
		dailyCount,
		weeklyCount,
		communityCount,
		seasonalCount,
	}
}

type ChallengeResult = { success?: boolean } | null | undefined

export const getFailedChallengeStreams = (
	results: Record<ChallengeStream, ChallengeResult>,
): ChallengeStream[] =>
	CHALLENGE_STREAMS.filter(stream => results[stream]?.success !== true)
