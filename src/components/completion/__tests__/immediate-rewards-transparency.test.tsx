import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { toast } from 'sonner'

import { ImmediateRewards } from '../ImmediateRewards'

jest.mock('next-intl', () => ({
	useTranslations:
		() => (key: string, values?: Record<string, string | number>) => {
			const copy: Record<string, string> = {
				niceWorkChef: 'Nice Work, Chef!',
				youCompleted: 'You completed {recipeName}',
				recipeCompletionXp: 'Recipe completion',
				earnedForCompleting: 'Earned for completing',
				challengeCompleted: '{kind} challenge completed',
				challengeKindDAILY: 'Daily',
				challengeKindWEEKLY: 'Weekly',
				challengeKindSEASONAL: 'Seasonal',
				coCookingBonus: 'Cook together bonus',
				coCookingDuoBonusPercent: '{percent}% duo bonus',
				coCookingGroupBonusPercent: '{percent}% group bonus',
				postReward: 'Post Reward',
				shareToUnlock: 'Share your creation to unlock',
				earnedNow: 'Earned Now',
				xpProcessing: 'XP Processing',
				pending: 'Pending',
				maximumPostXp: 'Maximum post XP',
				ariaCookingRewards: 'Cooking rewards',
				ariaClose: 'Close',
				postToUnlockMore: 'Post to unlock more',
				whyLocked: 'Why locked?',
				whyLockedExplain: 'Post to unlock.',
				postRewardPolicyDays:
					'For the full amount, post within 7 days with at least 2 photos. Eligible posts through day {count} earn less.',
				captureYourDish: 'Capture your dish',
				photosCount: '{count}/{max} photos',
				capturedPhotoAlt: 'Captured dish photo {number}',
				removeCapturedPhoto: 'Remove captured dish photo {number}',
				photoSizeLimit: 'Each photo must be under 10MB',
				photoLimitReached:
					'Only {max} photos can be shared. Remove one to add another.',
				addPhoto: 'Add',
				photoHintZero: 'Add photos',
				photoHintFull: 'Photo requirement met',
				shareYourCreation: 'Share Your Creation',
				sharePhotosPlural: 'Share {count} Photos',
				upToXp: 'Up to +{amount} XP',
				postLater: "I'll Post Later",
				savingDraft: 'Saving draft...',
			}
			return Object.entries(values ?? {}).reduce(
				(result, [name, value]) => result.replace(`{${name}}`, String(value)),
				copy[key] ?? key,
			)
		},
}))

jest.mock('sonner', () => ({
	toast: { error: jest.fn(), warning: jest.fn() },
}))

jest.mock('@/lib/confetti', () => ({
	triggerRecipeCompleteConfetti: jest.fn(),
}))

jest.mock('framer-motion', () => {
	const React = require('react')

	return {
		AnimatePresence: ({ children }: { children: React.ReactNode }) => (
			<>{children}</>
		),
		motion: new Proxy(
			{},
			{
				get:
					(_target, tag: string) =>
					({
						children,
						initial: _initial,
						animate: _animate,
						exit: _exit,
						transition: _transition,
						variants: _variants,
						whileHover: _whileHover,
						whileTap: _whileTap,
						...props
					}: React.HTMLAttributes<HTMLElement> & Record<string, unknown>) =>
						React.createElement(tag, props, children),
			},
		),
	}
})

jest.mock('@/components/ui/animated-number', () => ({
	AnimatedNumber: ({ value }: { value: number }) => <span>{value}</span>,
}))

const baseProps = {
	isOpen: true,
	onClose: jest.fn(async () => true),
	sessionId: 'session-1',
	recipeName: 'Spicy Noodles',
	recipeXpAwarded: 30,
	coOpBonusXp: 18,
	immediateXp: 108,
	pendingXp: 84,
	xpDeliveryStatus: 'APPLIED' as 'APPLIED' | 'QUEUED',
	xpMultiplier: 1.2,
	xpMultiplierReason: 'CO_OP_DUO',
	completedChallengeRewards: [
		{
			completed: true,
			challengeKind: 'DAILY' as const,
			challengeId: 'daily-1',
			challengeTitle: 'Daily Heat',
			bonusXp: 10,
		},
		{
			completed: true,
			challengeKind: 'WEEKLY' as const,
			challengeId: 'weekly-1',
			challengeTitle: 'Weekly Heat',
			bonusXp: 20,
		},
		{
			completed: true,
			challengeKind: 'SEASONAL' as const,
			challengeId: 'season-1',
			challengeTitle: 'Season Heat',
			bonusXp: 30,
		},
	],
	postDeadlineHours: 336 as number | null,
	onPostNow: jest.fn(async () => true),
	onPostLater: jest.fn(async () => true),
}

const originalCreateObjectURL = Object.getOwnPropertyDescriptor(
	URL,
	'createObjectURL',
)
const originalRevokeObjectURL = Object.getOwnPropertyDescriptor(
	URL,
	'revokeObjectURL',
)
const createObjectURL = jest.fn((file: File) => `blob:${file.name}`)
const revokeObjectURL = jest.fn()

beforeAll(() => {
	Object.defineProperty(URL, 'createObjectURL', {
		configurable: true,
		value: createObjectURL,
	})
	Object.defineProperty(URL, 'revokeObjectURL', {
		configurable: true,
		value: revokeObjectURL,
	})
})

beforeEach(() => {
	createObjectURL.mockClear()
	revokeObjectURL.mockClear()
	jest.clearAllMocks()
})

afterAll(() => {
	if (originalCreateObjectURL) {
		Object.defineProperty(URL, 'createObjectURL', originalCreateObjectURL)
	} else {
		Reflect.deleteProperty(URL, 'createObjectURL')
	}
	if (originalRevokeObjectURL) {
		Object.defineProperty(URL, 'revokeObjectURL', originalRevokeObjectURL)
	} else {
		Reflect.deleteProperty(URL, 'revokeObjectURL')
	}
})

function renderRewards(overrides: Partial<typeof baseProps> = {}) {
	return render(<ImmediateRewards {...baseProps} {...overrides} />)
}

describe('ImmediateRewards reward transparency', () => {
	it('renders recipe, simultaneous challenges, and co-cooking as reconcilable rows', () => {
		renderRewards()

		const expectations = [
			['Recipe completion', '30 XP'],
			['Daily Heat', '10 XP'],
			['Weekly Heat', '20 XP'],
			['Season Heat', '30 XP'],
			['Cook together bonus', '18 XP'],
		] as const

		expectations.forEach(([label, amount]) => {
			const row = screen.getByText(label).closest('div.flex.items-center')
			expect(row).not.toBeNull()
			expect(row?.textContent).toContain(amount)
		})

		const earnedTotal = screen.getByText('Earned Now').parentElement
		expect(earnedTotal?.textContent).toContain('108 XP')
	})

	it('does not claim queued XP has already been applied', () => {
		renderRewards({ xpDeliveryStatus: 'QUEUED' })

		expect(screen.queryByText('XP Processing')).not.toBeNull()
		expect(screen.queryByText('Earned Now')).toBeNull()
	})

	it('states that post XP is a maximum and explains the full-reward conditions', () => {
		renderRewards()

		expect(
			screen.getByText('Maximum post XP').parentElement?.textContent,
		).toContain('84 XP')
		expect(
			screen.getByText(
				'For the full amount, post within 7 days with at least 2 photos. Eligible posts through day 14 earn less.',
			),
		).not.toBeNull()
		expect(screen.getByText('Up to +84 XP')).not.toBeNull()
	})

	it('omits exact deadline claims when the server timestamps are unavailable', () => {
		renderRewards({ postDeadlineHours: null })

		expect(screen.queryByText(/Eligible posts through day/)).toBeNull()
		expect(screen.queryByText(/Post within/)).toBeNull()
	})

	it('enforces and communicates the same three-photo capacity', async () => {
		renderRewards()
		const fileInput =
			document.querySelector<HTMLInputElement>('input[type="file"]')
		expect(fileInput).not.toBeNull()

		const files = Array.from(
			{ length: 4 },
			(_, index) =>
				new File(['dish'], `dish-${index + 1}.png`, { type: 'image/png' }),
		)
		fireEvent.change(fileInput!, { target: { files } })

		await waitFor(() => {
			expect(screen.getByText('3/3 photos')).not.toBeNull()
			expect(screen.getAllByAltText(/Captured dish photo/)).toHaveLength(3)
		})
		expect(document.querySelector('input[type="file"]')).toBeNull()
		expect(
			screen.getByRole('button', { name: 'Remove captured dish photo 1' }),
		).not.toBeNull()
	})

	it('keeps valid photos and reports oversized files without blocking retry', async () => {
		renderRewards()
		const fileInput =
			document.querySelector<HTMLInputElement>('input[type="file"]')!
		const accepted = new File(['dish'], 'dish.png', { type: 'image/png' })
		const oversized = new File(
			[new Uint8Array(10 * 1024 * 1024 + 1)],
			'large.png',
			{ type: 'image/png' },
		)

		fireEvent.change(fileInput, { target: { files: [accepted, oversized] } })

		await waitFor(() => expect(screen.getByText('1/3 photos')).not.toBeNull())
		expect(toast.error).toHaveBeenCalledWith('Each photo must be under 10MB')
		expect(fileInput.value).toBe('')
		expect(screen.getAllByAltText(/Captured dish photo/)).toHaveLength(1)
	})

	it('warns when a selection exceeds the remaining review capacity', async () => {
		renderRewards()
		const fileInput =
			document.querySelector<HTMLInputElement>('input[type="file"]')!
		const files = Array.from(
			{ length: 4 },
			(_, index) =>
				new File(['dish'], `dish-${index}.png`, { type: 'image/png' }),
		)

		fireEvent.change(fileInput, { target: { files } })

		await waitFor(() => expect(screen.getByText('3/3 photos')).not.toBeNull())
		expect(toast.warning).toHaveBeenCalledWith(
			'Only 3 photos can be shared. Remove one to add another.',
		)
		expect(fileInput.value).toBe('')
	})

	it('preloads step photos into the review list and counts them toward the cap', async () => {
		const onPostLater = jest.fn(async () => true)
		const stepPhotos = ['step-1.jpg', 'step-2.jpg'].map(
			name => new File([name], name, { type: 'image/jpeg' }),
		)
		const added = new File(['finish'], 'finish.jpg', { type: 'image/jpeg' })
		render(
			<ImmediateRewards
				{...baseProps}
				stepPhotos={stepPhotos}
				onPostLater={onPostLater}
			/>,
		)

		await waitFor(() => {
			expect(screen.getByText('2/3 photos')).not.toBeNull()
			expect(screen.getByAltText('Captured dish photo 1')).not.toBeNull()
		})
		const fileInput =
			document.querySelector<HTMLInputElement>('input[type="file"]')
		fireEvent.change(fileInput!, {
			target: { files: [added, new File(['extra'], 'extra.jpg')] },
		})
		await waitFor(() => expect(screen.getByText('3/3 photos')).not.toBeNull())

		fireEvent.click(screen.getByRole('button', { name: "I'll Post Later" }))
		await waitFor(() => {
			expect(onPostLater).toHaveBeenCalledWith([...stepPhotos, added])
		})
	})

	it('hands captured photos to Post Later before dismissing the reward', async () => {
		const onPostLater = jest.fn(async () => true)
		renderRewards({ onPostLater })
		const file = new File(['dish'], 'dish.png', { type: 'image/png' })
		const fileInput =
			document.querySelector<HTMLInputElement>('input[type="file"]')

		fireEvent.change(fileInput!, { target: { files: [file] } })
		await waitFor(() => {
			expect(screen.getByText('1/3 photos')).not.toBeNull()
		})
		fireEvent.click(screen.getByRole('button', { name: "I'll Post Later" }))

		await waitFor(() => {
			expect(onPostLater).toHaveBeenCalledWith([file])
		})
	})

	it('keeps selected files and previews ordered through removal and posting', async () => {
		const onPostLater = jest.fn(async () => true)
		const { unmount } = renderRewards({ onPostLater })
		const files = ['first.png', 'second.png', 'third.png'].map(
			name => new File([name], name, { type: 'image/png' }),
		)
		const fileInput =
			document.querySelector<HTMLInputElement>('input[type="file"]')

		fireEvent.change(fileInput!, { target: { files } })

		const firstPreview = await screen.findByAltText('Captured dish photo 1')
		const secondPreview = screen.getByAltText('Captured dish photo 2')
		const thirdPreview = screen.getByAltText('Captured dish photo 3')
		expect(
			[firstPreview, secondPreview, thirdPreview].map(image =>
				image.getAttribute('src'),
			),
		).toEqual(['blob:first.png', 'blob:second.png', 'blob:third.png'])

		fireEvent.load(thirdPreview)
		fireEvent.load(firstPreview)
		fireEvent.click(
			screen.getByRole('button', { name: 'Remove captured dish photo 2' }),
		)
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:second.png')
		expect(screen.getByText('2/3 photos')).not.toBeNull()
		expect(
			screen.getByAltText('Captured dish photo 2').getAttribute('src'),
		).toBe('blob:third.png')

		fireEvent.click(screen.getByRole('button', { name: "I'll Post Later" }))
		await waitFor(() => {
			expect(onPostLater).toHaveBeenCalledWith([files[0], files[2]])
		})

		unmount()
		expect(revokeObjectURL.mock.calls).toEqual([
			['blob:second.png'],
			['blob:first.png'],
			['blob:third.png'],
		])
	})

	it('persists captured photos when the close command dismisses the modal', async () => {
		const onClose = jest.fn(async () => true)
		renderRewards({ onClose })
		const file = new File(['dish'], 'dish.png', { type: 'image/png' })
		const fileInput =
			document.querySelector<HTMLInputElement>('input[type="file"]')

		fireEvent.change(fileInput!, { target: { files: [file] } })
		await waitFor(() => {
			expect(screen.getByText('1/3 photos')).not.toBeNull()
		})
		fireEvent.click(screen.getByRole('button', { name: 'Close' }))

		await waitFor(() => {
			expect(onClose).toHaveBeenCalledWith([file])
		})
	})

	it('keeps the modal actionable when draft persistence fails', async () => {
		const onPostLater = jest.fn(async () => false)
		renderRewards({ onPostLater })
		const postLater = screen.getByRole('button', { name: "I'll Post Later" })

		fireEvent.click(postLater)
		fireEvent.click(postLater)

		await waitFor(() => {
			expect(onPostLater).toHaveBeenCalledTimes(1)
			expect(
				(
					screen.getByRole('button', {
						name: "I'll Post Later",
					}) as HTMLButtonElement
				).disabled,
			).toBe(false)
		})
	})
})
