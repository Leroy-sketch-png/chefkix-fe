import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SkillTree } from '@/components/achievements/SkillTree'
import type { SkillTreeResponse } from '@/lib/types/achievement'
import { getMySkillTree } from '@/services/achievement'

jest.mock('@/services/achievement', () => ({
	getMySkillTree: jest.fn(),
	getUserSkillTree: jest.fn(),
}))

jest.mock('sonner', () => ({
	toast: { error: jest.fn() },
}))

jest.mock('next-intl', () => ({
	useTranslations:
		() => (key: string, values?: Record<string, string | number>) => {
			const copy: Record<string, string> = {
				bronzeTier: 'Bronze',
				silverTier: 'Silver',
				goldTier: 'Gold',
				diamondTier: 'Diamond',
				unlocked: 'Achievements Unlocked',
				complete: 'Complete',
				categoryCuisine: 'Cuisine',
			}
			if (key === 'tabAllPaths') return `All paths (${values?.n})`
			return copy[key] ?? key
		},
}))

jest.mock('framer-motion', () => {
	const React = require('react')

	return {
		AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
		motion: new Proxy(
			{},
			{
				get:
					(_target, tag: string) =>
					({ children, ...props }: React.HTMLAttributes<HTMLElement>) => {
						const domProps = { ...props } as Record<string, unknown>
						for (const key of [
							'animate',
							'exit',
							'initial',
							'layout',
							'transition',
							'variants',
							'whileHover',
						]) {
							delete domProps[key]
						}
						return React.createElement(tag, domProps, children)
					},
			},
		),
	}
})

const node = (
	code: string,
	tier: number,
	overrides: Partial<SkillTreeResponse['paths'][number]['nodes'][number]> = {},
): SkillTreeResponse['paths'][number]['nodes'][number] => ({
	code,
	name: `${code} achievement`,
	description: `${code} description`,
	icon: '★',
	tier,
	category: 'Cuisine',
	hidden: false,
	premium: false,
	currentProgress: 1,
	requiredProgress: 1,
	unlocked: true,
	unlockedAt: '2026-08-01T00:00:00Z',
	prerequisiteCode: null,
	prerequisiteMet: true,
	...overrides,
})

const skillTree: SkillTreeResponse = {
	paths: [
		{
			pathId: 'cuisine-foundations',
			pathName: 'Cuisine foundations',
			category: 'Cuisine',
			unlockedCount: 5,
			totalCount: 6,
			nodes: [
				node('bronze', 1),
				node('silver', 2, { premium: true }),
				node('gold', 3),
				node('diamond', 4),
				node('fallback', 99),
				node('locked-progress', 2, {
					currentProgress: 2,
					requiredProgress: 5,
					unlocked: false,
					unlockedAt: null,
					prerequisiteCode: 'bronze',
					prerequisiteMet: false,
				}),
			],
		},
	],
	totalUnlocked: 5,
	totalAchievements: 6,
}

describe('SkillTree presentation truth', () => {
	beforeEach(() => {
		jest.mocked(getMySkillTree).mockResolvedValue(skillTree)
	})

	it('distinguishes every tier and keeps a Bronze fallback', async () => {
		const { container } = render(<SkillTree isOwnProfile />)

		fireEvent.click(
			await screen.findByRole('button', { name: /Cuisine foundations/ }),
		)

		await waitFor(() => {
			expect(container.querySelector('.from-medal-bronze-glow')).toBeTruthy()
		})
		expect(container.querySelector('.from-medal-silver-glow')).toBeTruthy()
		expect(container.querySelector('.from-medal-gold-glow')).toBeTruthy()
		expect(container.querySelector('.from-rare')).toBeTruthy()
		expect(container.querySelectorAll('.from-medal-bronze-glow')).toHaveLength(
			2,
		)
	})

	it('names count units and preserves delivered progress and premium metadata', async () => {
		const { container } = render(<SkillTree isOwnProfile />)

		expect(await screen.findByText('Achievements Unlocked')).toBeTruthy()
		expect(screen.getByRole('button', { name: 'All paths (1)' })).toBeTruthy()

		fireEvent.click(screen.getByRole('button', { name: /Cuisine foundations/ }))

		expect(await screen.findByText('2/5')).toBeTruthy()
		expect(container.querySelector('.lucide-sparkles')).toBeTruthy()
	})
})
