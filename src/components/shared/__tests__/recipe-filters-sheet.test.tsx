import { fireEvent, render, screen } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import { ActiveFilters } from '../FilterSort'
import { RecipeFiltersSheet } from '../RecipeFiltersSheet'

const translations: Record<string, string> = {
	fsDietVegetarian: 'Vegetarisch',
	fsCuisineItalian: 'Italienisch',
	fsDiffEasy: 'Einfach',
	fsActiveFilters: 'Aktive Filter:',
	fsClearAll: 'Alle loeschen',
	rfApply: 'Filter anwenden',
}

const creatorSource = fs.readFileSync(
	path.join(process.cwd(), 'src/components/recipe/RecipeCreateAiFlow.tsx'),
	'utf8',
)
const messages = JSON.parse(
	fs.readFileSync(path.join(process.cwd(), 'messages/en.json'), 'utf8'),
) as { shared: Record<string, string> }

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => translations[key] ?? key,
}))

jest.mock('@/components/ui/sheet', () => ({
	Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	SheetContent: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	SheetHeader: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	SheetTitle: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	SheetBody: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	SheetFooter: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	SheetTrigger: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
}))

jest.mock('@/components/ui/range-slider', () => ({
	RangeSlider: () => <div data-testid='range-slider' />,
}))

jest.mock('@/components/ui/rating-selector', () => ({
	RatingSelector: () => <div data-testid='rating-selector' />,
}))

describe('RecipeFiltersSheet language contract', () => {
	it('renders translated option labels while applying stable domain values', () => {
		const onApply = jest.fn()
		render(<RecipeFiltersSheet onApply={onApply} />)

		fireEvent.click(screen.getByRole('button', { name: 'Vegetarisch' }))
		fireEvent.click(screen.getByRole('button', { name: 'Italienisch' }))
		fireEvent.click(screen.getByRole('button', { name: 'Einfach' }))
		fireEvent.click(screen.getByRole('button', { name: 'Filter anwenden (3)' }))

		expect(onApply).toHaveBeenCalledWith(
			expect.objectContaining({
				dietary: ['vegetarian'],
				cuisine: ['italian'],
				difficulty: ['easy'],
			}),
		)
	})

	it('routes adjacent active-filter commands through the same translation owner', () => {
		render(
			<ActiveFilters
				filters={['vegetarian', 'vegan']}
				onClearAll={jest.fn()}
			/>,
		)

		expect(screen.getByText('Aktive Filter:')).toBeTruthy()
		expect(screen.getByRole('button', { name: 'Alle loeschen' })).toBeTruthy()
	})

	it('translates creator cuisine labels without changing recipe payload values', () => {
		expect(creatorSource).toContain(
			"{ value: 'Middle Eastern', labelKey: 'fsCuisineMiddleEastern' }",
		)
		expect(creatorSource).toContain('label: tShared(option.labelKey)')
		expect(creatorSource).not.toContain(
			".map(c => ({ value: c, label: c }))",
		)

		const creatorKeys = [
			'fsCuisineMiddleEastern',
			'fsCuisineAfrican',
			'fsCuisineCaribbean',
			'fsCuisineBrazilian',
			'fsCuisineGreek',
			'fsCuisineSpanish',
			'fsCuisineFusion',
			'fsCuisineOther',
		]
		for (const key of creatorKeys) {
			expect(messages.shared[key]).toBeTruthy()
		}
	})
})
