import { act, render, screen, within } from '@testing-library/react'
import type { Profile } from '@/lib/types/profile'

const getFollowers = jest.fn()
const getFollowing = jest.fn()
const getFriends = jest.fn()

jest.mock('@/services/social', () => ({
	getFollowers: (...args: unknown[]) => getFollowers(...args),
	getFollowing: (...args: unknown[]) => getFollowing(...args),
	getFriends: (...args: unknown[]) => getFriends(...args),
	getSuggestedFollows: jest.fn(),
}))

jest.mock('next/navigation', () => ({
	useRouter: () => ({ back: jest.fn() }),
	useSearchParams: () => ({ get: () => null }),
}))

jest.mock('next-intl', () => {
	const translate = (key: string, values?: Record<string, string | number>) => {
		const labels: Record<string, string> = {
			tabFollowers: 'Followers',
			tabFollowing: 'Following',
			tabFriends: 'Friends',
			networkTitle: 'Your network',
			networkSubtitle: 'People around your kitchen',
			loading: 'Loading',
		}
		if (key.endsWith('totalLinks')) return `${values?.n} links`
		if (key.endsWith('nProfiles')) return `${values?.n} profiles`
		return labels[key] ?? key
	}

	return { useTranslations: () => translate }
})

jest.mock('framer-motion', () => {
	const ReactRuntime = jest.requireActual('react')
	const withoutMotionProps = (props: Record<string, unknown>) => {
		const domProps = { ...props }
		for (const key of [
			'animate',
			'exit',
			'initial',
			'transition',
			'whileTap',
		]) {
			delete domProps[key]
		}
		return domProps
	}

	return {
		motion: {
			button: (props: Record<string, unknown>) =>
				ReactRuntime.createElement('button', withoutMotionProps(props)),
			div: (props: Record<string, unknown>) =>
				ReactRuntime.createElement('div', withoutMotionProps(props)),
		},
		AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
	}
})

jest.mock('@/components/layout/PageContainer', () => ({
	PageContainer: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
}))
jest.mock('@/components/layout/PageTransition', () => ({
	PageTransition: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
}))
jest.mock('@/components/layout/PageHeader', () => ({
	PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}))
jest.mock('@/components/layout/PremiumSurface', () => ({
	PremiumSurface: ({
		children,
		chipText,
	}: {
		children: React.ReactNode
		chipText?: string
	}) => (
		<section>
			{chipText ? <output>{chipText}</output> : null}
			{children}
		</section>
	),
	SurfaceSectionHeader: () => null,
}))
jest.mock('@/components/profile/FollowUserCard', () => ({
	FollowUserCard: ({ profile }: { profile: Profile }) => (
		<div>{profile.userId}</div>
	),
}))
jest.mock('@/components/social/FollowSuggestionCard', () => ({
	FollowSuggestionCard: () => null,
}))
jest.mock('@/components/shared', () => ({
	EmptyStateGamified: () => <div>empty</div>,
}))
jest.mock('@/components/ui/stagger-animation', () => ({
	StaggerContainer: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
}))

import FollowersPage from '../page'

interface Deferred<T> {
	promise: Promise<T>
	resolve: (value: T) => void
}

const deferred = <T,>(): Deferred<T> => {
	let resolve!: (value: T) => void
	const promise = new Promise<T>(settle => {
		resolve = settle
	})
	return { promise, resolve }
}

const profiles = (prefix: string, count: number): Profile[] =>
	Array.from(
		{ length: count },
		(_, index) => ({ userId: `${prefix}-${index + 1}` }) as Profile,
	)

describe('profile network request settlement', () => {
	it('withholds unresolved counts and reveals each lane only after it settles', async () => {
		const followers = deferred<{
			success: boolean
			data: Profile[]
		}>()
		const following = deferred<{
			success: boolean
			data: Profile[]
		}>()
		const friends = deferred<{
			success: boolean
			data: Profile[]
		}>()
		getFollowers.mockReturnValue(followers.promise)
		getFollowing.mockReturnValue(following.promise)
		getFriends.mockReturnValue(friends.promise)

		render(<FollowersPage />)

		expect(getFollowers).toHaveBeenCalledTimes(1)
		expect(getFollowing).toHaveBeenCalledTimes(1)
		expect(getFriends).toHaveBeenCalledTimes(1)
		expect(screen.queryByText('0')).toBeNull()
		expect(screen.queryByText(/links$/)).toBeNull()

		await act(async () => {
			followers.resolve({ success: true, data: profiles('follower', 2) })
		})

		expect(
			within(screen.getByRole('button', { name: /Followers/ })).getByText('2'),
		).toBeTruthy()
		expect(screen.queryByText(/links$/)).toBeNull()

		await act(async () => {
			following.resolve({ success: true, data: profiles('following', 3) })
			friends.resolve({ success: true, data: [] })
		})

		expect(
			within(screen.getByRole('button', { name: /Following/ })).getByText('3'),
		).toBeTruthy()
		expect(
			within(screen.getByRole('button', { name: /Friends/ })).getByText('0'),
		).toBeTruthy()
		expect(screen.getByText('5 links')).toBeTruthy()
	})
})
