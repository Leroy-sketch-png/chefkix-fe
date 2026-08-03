export const PROFILE_NETWORK_TABS = [
	'followers',
	'following',
	'friends',
] as const

export type ProfileNetworkTab = (typeof PROFILE_NETWORK_TABS)[number]

export interface ProfileNetworkLaneState {
	isLoading: boolean
	error: string | null
	count: number
}

export const parseProfileNetworkTab = (
	value: string | null,
): ProfileNetworkTab =>
	PROFILE_NETWORK_TABS.includes(value as ProfileNetworkTab)
		? (value as ProfileNetworkTab)
		: 'followers'

export const getSettledProfileNetworkCount = ({
	isLoading,
	error,
	count,
}: ProfileNetworkLaneState): number | null => {
	if (isLoading || error) return null
	return Math.max(0, count)
}

export const getSettledProfileNetworkTotal = (
	lanes: ProfileNetworkLaneState[],
): number | null => {
	const counts = lanes.map(getSettledProfileNetworkCount)
	if (counts.some(count => count === null)) return null
	return counts.reduce<number>((total, count) => total + (count ?? 0), 0)
}
