import React, { StrictMode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import ReferralCard from '@/components/referral/ReferralCard'
import {
	getMyReferralCode,
	getReferralStats,
	redeemReferralCode,
} from '@/services/referral'
import type {
	ReferralCodeResponse,
	ReferralStatsResponse,
} from '@/lib/types/referral'

const mockReplace = jest.fn()
let mockReferralParam: string | null = null

jest.mock('next/navigation', () => ({
	useRouter: () => ({ replace: mockReplace }),
	useSearchParams: () => ({
		get: (key: string) => (key === 'ref' ? mockReferralParam : null),
	}),
}))

jest.mock('@/services/referral', () => ({
	getMyReferralCode: jest.fn(),
	getReferralStats: jest.fn(),
	redeemReferralCode: jest.fn(),
}))

jest.mock('sonner', () => ({
	toast: {
		error: jest.fn(),
		success: jest.fn(),
	},
}))

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string, params?: Record<string, unknown>) =>
		params ? `${key}:${Object.values(params).join(',')}` : key,
}))

jest.mock('next/image', () => ({
	__esModule: true,
	default: ({ alt, ...props }: React.ComponentProps<'img'>) => (
		<img alt={alt} {...props} />
	),
}))

jest.mock('framer-motion', () => {
	const React = require('react')
	const motionProps = new Set([
		'animate',
		'exit',
		'initial',
		'layout',
		'transition',
		'whileHover',
		'whileTap',
	])
	return {
		AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
		motion: new Proxy(
			{},
			{
				get:
					(_target, tag: string) =>
					({ children, ...props }: React.HTMLAttributes<HTMLElement>) => {
						const domProps = Object.fromEntries(
							Object.entries(props).filter(([key]) => !motionProps.has(key)),
						)
						return React.createElement(tag, domProps, children)
					},
			},
		),
	}
})

const mockedGetCode = jest.mocked(getMyReferralCode)
const mockedGetStats = jest.mocked(getReferralStats)
const mockedRedeem = jest.mocked(redeemReferralCode)

const codeFixture = (
	overrides: Partial<ReferralCodeResponse> = {},
): ReferralCodeResponse => ({
	code: 'ABCD2345',
	usageCount: 2,
	maxUses: 100,
	active: true,
	createdAt: '2026-08-03T00:00:00Z',
	shareUrl: 'https://chefkix.app/join?ref=ABCD2345',
	...overrides,
})

const statsFixture = (
	overrides: Partial<ReferralStatsResponse> = {},
): ReferralStatsResponse => ({
	code: 'ABCD2345',
	totalReferrals: 2,
	totalXpEarned: 200,
	referrals: [
		{
			referredUsername: 'Mai',
			referredAvatar: null,
			xpAwarded: 100,
			redeemedAt: '2026-08-03T00:00:00Z',
		},
	],
	...overrides,
})

beforeEach(() => {
	jest.clearAllMocks()
	mockReferralParam = null
	mockedGetCode.mockResolvedValue(codeFixture())
	mockedGetStats.mockResolvedValue(statsFixture())
	mockedRedeem.mockResolvedValue(codeFixture())
	Object.defineProperty(navigator, 'clipboard', {
		configurable: true,
		value: { writeText: jest.fn().mockResolvedValue(undefined) },
	})
	Object.defineProperty(navigator, 'share', {
		configurable: true,
		value: undefined,
	})
})

describe('ReferralCard lifecycle truth', () => {
	it('renders catalog-owned referral data and accessible commands', async () => {
		render(<ReferralCard />)

		expect(await screen.findByText('ABCD2345')).toBeTruthy()
		expect(screen.getByText('friendsInvited')).toBeTruthy()
		expect(screen.getByText('recentReferrals')).toBeTruthy()
		expect(screen.getByText('xpAmount:100')).toBeTruthy()
		expect(
			screen
				.getByRole('button', { name: 'copyCodeLabel' })
				.hasAttribute('disabled'),
		).toBe(false)
		expect(
			screen
				.getByRole('button', { name: 'shareCodeLabel' })
				.hasAttribute('disabled'),
		).toBe(false)
		expect(screen.getByRole('textbox', { name: 'enterCodeLabel' })).toBeTruthy()

		fireEvent.click(screen.getByRole('button', { name: 'copyCodeLabel' }))
		await waitFor(() =>
			expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABCD2345'),
		)
		expect(toast.success).toHaveBeenCalledWith('toastCodeCopied')

		fireEvent.click(screen.getByRole('button', { name: 'shareCodeLabel' }))
		await waitFor(() =>
			expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith(
				expect.stringContaining('/join?ref=ABCD2345'),
			),
		)
	})

	it('preserves stats and retries only the failed code source', async () => {
		mockedGetCode
			.mockRejectedValueOnce(new Error('code unavailable'))
			.mockResolvedValueOnce(codeFixture())

		render(<ReferralCard />)

		expect(await screen.findByText('codeLoadFailed')).toBeTruthy()
		expect(screen.getByText('friendsInvited')).toBeTruthy()
		fireEvent.click(screen.getByRole('button', { name: 'retry' }))

		expect(await screen.findByText('ABCD2345')).toBeTruthy()
		expect(mockedGetCode).toHaveBeenCalledTimes(2)
		expect(mockedGetStats).toHaveBeenCalledTimes(1)
	})

	it('shows recoverable errors when both independent sources fail', async () => {
		mockedGetCode.mockRejectedValue(new Error('code unavailable'))
		mockedGetStats.mockRejectedValue(new Error('stats unavailable'))

		render(<ReferralCard />)

		expect(await screen.findByText('codeLoadFailed')).toBeTruthy()
		expect(screen.getByText('statsLoadFailed')).toBeTruthy()
		expect(screen.getAllByRole('alert')).toHaveLength(2)
		expect(screen.getAllByRole('button', { name: 'retry' })).toHaveLength(2)
	})

	it('keeps inactive or exhausted codes visible but not shareable', async () => {
		mockedGetCode.mockResolvedValue(
			codeFixture({ active: false, usageCount: 100, maxUses: 100 }),
		)

		render(<ReferralCard />)

		expect(await screen.findByText('codeUnavailable')).toBeTruthy()
		expect(
			screen
				.getByRole('button', { name: 'copyCodeLabel' })
				.hasAttribute('disabled'),
		).toBe(true)
		expect(
			screen
				.getByRole('button', { name: 'shareCodeLabel' })
				.hasAttribute('disabled'),
		).toBe(true)
	})

	it('ignores a superseded Strict Mode response', async () => {
		let resolveFirst!: (value: ReferralCodeResponse) => void
		mockedGetCode
			.mockReturnValueOnce(
				new Promise(resolve => {
					resolveFirst = resolve
				}),
			)
			.mockResolvedValueOnce(codeFixture({ code: 'CURR2345' }))

		render(
			<StrictMode>
				<ReferralCard />
			</StrictMode>,
		)

		expect(await screen.findByText('CURR2345')).toBeTruthy()
		resolveFirst(codeFixture({ code: 'STAL2345' }))
		await waitFor(() => expect(screen.queryByText('STAL2345')).toBeNull())
	})

	it('prefills valid invite intent and removes it after explicit redemption', async () => {
		mockReferralParam = 'abcd2345'
		render(<ReferralCard />)

		const input = await screen.findByRole('textbox', { name: 'enterCodeLabel' })
		expect((input as HTMLInputElement).value).toBe('ABCD2345')
		expect(screen.getByText('inviteCodeReady')).toBeTruthy()
		fireEvent.click(screen.getByRole('button', { name: 'redeem' }))

		await waitFor(() =>
			expect(mockedRedeem).toHaveBeenCalledWith({ code: 'ABCD2345' }),
		)
		expect(mockReplace).toHaveBeenCalledWith('/settings?tab=referral', {
			scroll: false,
		})
	})

	it('maps known redemption outcomes without exposing backend copy', async () => {
		mockReferralParam = 'ABCD2345'
		mockedRedeem.mockRejectedValue({
			response: {
				status: 400,
				data: { message: 'Cannot redeem your own referral code' },
			},
		})
		render(<ReferralCard />)

		const input = await screen.findByRole('textbox', { name: 'enterCodeLabel' })
		expect((input as HTMLInputElement).value).toBe('ABCD2345')
		const redeemButton = screen.getByRole('button', { name: 'redeem' })
		expect(redeemButton.hasAttribute('disabled')).toBe(false)
		fireEvent.click(redeemButton)

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith('redeemOwnCode'),
		)
		expect(toast.error).not.toHaveBeenCalledWith(
			'Cannot redeem your own referral code',
		)
	})
})
