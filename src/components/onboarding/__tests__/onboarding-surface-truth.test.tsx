import React from 'react'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { InterestPicker } from '@/components/onboarding/InterestPicker'
import { updateProfile } from '@/services/profile'

const mockSetUser = jest.fn()
let mockPreferences: string[] = []

jest.mock('@/store/authStore', () => ({
	useAuthStore: (selector: (state: unknown) => unknown) =>
		selector({
			setUser: mockSetUser,
			user: { preferences: mockPreferences },
		}),
}))

jest.mock('@/services/profile', () => ({
	updateProfile: jest.fn(),
}))

jest.mock('sonner', () => ({
	toast: { success: jest.fn(), error: jest.fn() },
}))

const translations: Record<string, string> = {
	ipItalian: 'Italian',
	ipTitle: 'Taste preferences',
	ipTitleEdit: 'Shape your taste',
	ipSubtitleEdit:
		'Choose cuisines and food styles to shape your recipe recommendations.',
	ipDismiss: 'Close',
	ipCancel: 'Cancel',
	ipSave: 'Save',
	ipSaveCount: 'Save ({count})',
	ipToastUpdated: 'Taste preferences updated',
}

jest.mock('next-intl', () => ({
	useTranslations: () => {
		const translate = (key: string, values?: Record<string, number>) => {
			const value = translations[key] ?? key
			return Object.entries(values ?? {}).reduce(
				(result, [name, replacement]) =>
					result.replace(`{${name}}`, String(replacement)),
				value,
			)
		}
		translate.rich = translate
		return translate
	},
}))

const mockedUpdateProfile = jest.mocked(updateProfile)

const readWorkspaceFile = (path: string) =>
	readFileSync(join(process.cwd(), path), 'utf8')

const collectSource = (path: string): string =>
	readdirSync(path, { withFileTypes: true })
		.flatMap(entry => {
			const entryPath = join(path, entry.name)
			if (entry.name === '__tests__') return []
			if (entry.isDirectory()) return [collectSource(entryPath)]
			if (!/\.(?:ts|tsx)$/.test(entry.name)) return []
			return [readFileSync(entryPath, 'utf8')]
		})
		.join('\n')

describe('content-first onboarding contract', () => {
	beforeEach(() => {
		mockPreferences = []
		mockSetUser.mockReset()
		mockedUpdateProfile.mockReset()
	})

	it('keeps automatic blocking onboarding out of routine product surfaces', () => {
		const source = collectSource(join(process.cwd(), 'src'))
		const layout = readWorkspaceFile('src/app/layout.tsx')
		const dashboard = readWorkspaceFile('src/app/(main)/dashboard/page.tsx')

		expect(source).not.toContain('useOnboardingOrchestrator')
		expect(source).not.toContain('FirstVisitHintsProvider')
		expect(layout).not.toContain('FirstVisitHints')
		expect(dashboard).not.toContain('InterestPicker')
	})

	it('keeps dietary safety in cooking settings and out of soft taste', async () => {
		mockPreferences = ['halal', 'italian']
		mockedUpdateProfile.mockResolvedValue({
			success: true,
			statusCode: 200,
			message: 'Updated',
			data: { preferences: ['italian'] } as never,
		})

		render(<InterestPicker editMode onComplete={jest.fn()} />)

		expect(await screen.findByRole('dialog')).toBeTruthy()
		expect(screen.queryByText('Dietary Restrictions')).toBeNull()
		expect(screen.queryByText('Halal')).toBeNull()
		expect(
			(screen.getByRole('button', { name: 'Save (1)' }) as HTMLButtonElement)
				.disabled,
		).toBe(false)

		fireEvent.click(screen.getByRole('button', { name: 'Save (1)' }))

		await waitFor(() =>
			expect(mockedUpdateProfile).toHaveBeenCalledWith({
				preferences: ['italian'],
			}),
		)

		const settings = readWorkspaceFile('src/app/(main)/settings/page.tsx')
		const messages = JSON.parse(readWorkspaceFile('messages/en.json')) as {
			settings: Record<string, string>
		}
		expect(settings).toContain('updateCookingPreferences')
		expect(settings).toContain('dietaryRestrictions')
		expect(settings).toContain('allergies')
		expect(messages.settings).toMatchObject({
			skillBeginner: 'Beginner',
			skillIntermediate: 'Intermediate',
			skillAdvanced: 'Advanced',
			skillExpert: 'Expert',
		})
	})

	it('uses color only for selection and exposes the pressed state', async () => {
		render(<InterestPicker editMode onComplete={jest.fn()} />)

		const italian = await screen.findByRole('button', { name: 'Italian' })
		expect(italian.getAttribute('aria-pressed')).toBe('false')
		expect(italian.innerHTML).toContain('bg-bg-elevated')

		fireEvent.click(italian)

		expect(italian.getAttribute('aria-pressed')).toBe('true')
		expect(italian.innerHTML).toContain('bg-brand/15')
		expect(screen.getByRole('button', { name: 'Save (1)' })).toBeTruthy()

		const pickerSource = readWorkspaceFile(
			'src/components/onboarding/InterestPicker.tsx',
		)
		const tileDefinitions = pickerSource.slice(
			pickerSource.indexOf('const INTEREST_TILES'),
			pickerSource.indexOf('const INTEREST_IDS'),
		)
		expect(tileDefinitions).not.toMatch(
			/gradient|error|warning|success|info|streak|accent-teal/,
		)
		expect(pickerSource).not.toContain('tile.gradient')
	})
})
