import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { XpPreviewModal } from '@/components/recipe/XpPreviewModal'
import type { ParsedRecipe, XpBreakdown } from '@/lib/types/recipeCreate'

jest.mock('next-intl', () => ({
	useTranslations: () => {
		const translate = (
			key: string,
			values?: { count?: number; difficulty?: string; confidence?: number },
		) => {
			switch (key) {
				case 'xpPreview':
					return 'XP Preview'
				case 'ariaClose':
					return 'Close'
				case 'servingsLabel':
					return `${values?.count} servings`
				case 'baseDifficulty':
					return `Base ${values?.difficulty}`
				case 'stepsCount':
					return `${values?.count} steps`
				case 'timeCookTime':
					return 'Cook time'
				case 'technique':
					return 'Technique'
				case 'xpValidated':
					return 'Validated'
				case 'xpValidatedDesc':
					return 'Validated by AI'
				case 'xpConfident':
					return `Confidence ${values?.confidence}`
				case 'cooksCanEarn':
					return 'Cooks can earn'
				case 'creatorXpEarn':
					return 'Creator XP'
				case 'creatorXpWhenOthersCook':
					return 'When others cook'
				case 'creatorXpProjection':
					return 'Projected XP'
				case 'editRecipe':
					return 'Edit recipe'
				case 'publishRecipe':
					return 'Publish recipe'
				case 'readyToGoLive':
					return 'Ready to go live'
				case 'waitGoBack':
					return 'Wait, go back'
				case 'publishing':
					return 'Publishing'
				case 'publishBang':
					return 'Publish!'
				case 'publishConfirmDesc':
					return 'Confirm publish'
				case 'totalRecipeXp':
					return 'Total recipe XP'
				default:
					return key
			}
		}

		translate.rich = (key: string) => {
			if (key === 'publishConfirmDesc') {
				return 'Confirm publish'
			}

			return key
		}

		return translate
	},
}))

jest.mock('next/image', () => ({
	__esModule: true,
	default: ({
		fill: _fill,
		unoptimized: _unoptimized,
		...props
	}: Record<string, unknown>) => <img {...props} />,
}))

jest.mock('framer-motion', () => ({
	motion: {
		div: ({
			children,
			initial: _initial,
			animate: _animate,
			exit: _exit,
			transition: _transition,
			whileHover: _whileHover,
			whileTap: _whileTap,
			...props
		}: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => (
			<div {...props}>{children}</div>
		),
		button: ({
			children,
			whileHover: _whileHover,
			whileTap: _whileTap,
			...props
		}: React.ButtonHTMLAttributes<HTMLButtonElement> &
			Record<string, unknown>) => (
			<button type='button' {...props}>
				{children}
			</button>
		),
	},
}))

jest.mock('@/hooks/useEscapeKey', () => ({
	useEscapeKey: jest.fn(),
}))

jest.mock('@/components/ui/portal', () => ({
	Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('@/components/ui/animated-number', () => ({
	AnimatedNumber: ({ value }: { value: number }) => <span>{value}</span>,
}))

jest.mock('@/components/ui/alert-dialog', () => ({
	AlertDialog: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	AlertDialogContent: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	AlertDialogDescription: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	AlertDialogFooter: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	AlertDialogHeader: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	AlertDialogTitle: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	AlertDialogCancel: ({
		children,
		...props
	}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
		<button type='button' {...props}>
			{children}
		</button>
	),
}))

const recipe: ParsedRecipe = {
	title: 'Night Market Noodles',
	description: 'A quick noodle bowl.',
	coverImageUrl: 'https://example.com/noodles.jpg',
	cookTime: '20 min',
	difficulty: 'Beginner',
	servings: 2,
	cuisine: 'Asian',
	ingredients: [{ id: 'ing-1', quantity: '200g', name: 'Noodles' }],
	steps: [{ id: 'step-1', instruction: 'Boil noodles' }],
	detectedBadges: [{ emoji: '🔥', name: 'Quick Win' }],
	xpReward: 120,
}

const xpBreakdown: XpBreakdown = {
	base: 40,
	steps: 30,
	time: 20,
	techniques: [{ name: 'Boil', xp: 10 }],
	total: 100,
	isValidated: true,
	confidence: 95,
}

describe('XpPreviewModal', () => {
	it('blocks duplicate confirm clicks before publishing state rerenders', () => {
		const onPublish = jest.fn()

		render(
			<XpPreviewModal
				recipe={recipe}
				xpBreakdown={xpBreakdown}
				onBack={jest.fn()}
				onPublish={onPublish}
				isPublishing={false}
			/>,
		)

		fireEvent.click(screen.getByRole('button', { name: /Publish recipe/i }))

		const confirmButton = screen.getByRole('button', { name: 'Publish!' })
		fireEvent.click(confirmButton)
		fireEvent.click(confirmButton)

		expect(onPublish).toHaveBeenCalledTimes(1)
		expect(onPublish).toHaveBeenCalledWith(recipe)
	})
})
