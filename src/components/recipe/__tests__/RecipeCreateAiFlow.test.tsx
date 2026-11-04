import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { RecipeCreateAiFlow } from '../RecipeCreateAiFlow'
import type { RecipeFormData } from '../RecipeFormDetailed'
import { recipeDraftRepository } from '@/lib/recipe-draft-repository'
import { processRecipe } from '@/services/ai'
import { toast } from 'sonner'

jest.mock('@/services/ai', () => ({
	processRecipe: jest.fn(),
	calculateMetas: jest.fn(),
	validateRecipe: jest.fn(),
}))

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) =>
		(
			({
				aiFlowBackToDrafts: 'Back to drafts',
				manualDraftExitTitle: "Your latest recipe changes aren't saved",
				manualDraftExitDescription:
					"ChefKix couldn't save these changes on this device. Stay to retry, or leave and risk losing them.",
				manualDraftStay: 'Stay and retry',
				manualDraftLeave: 'Leave anyway',
				aiFlowPasteAndParse: 'Paste & Parse',
				aiFlowManualEntry: 'Manual Entry',
				aiFlowPasteYourRecipe: 'Paste your recipe',
				aiFlowFromWebsite: 'From a website, document, or notes',
				aiFlowParseRecipe: 'Parse Recipe',
				pasteAreaPlaceholder: 'Paste recipe text here',
				parsingYourRecipe: 'Parsing your recipe...',
				aiFlowProcessing: 'Processing...',
				cancelButton: 'Cancel',
				formTitlePlaceholder: 'e.g., Classic Italian Carbonara',
				draftSaving: 'Saving on this device...',
				draftSaveFailed: 'Not saved on this device',
				draftRetry: 'Retry',
			}) as Record<string, string>
		)[key] ?? key,
}))

jest.mock('next/image', () => ({
	__esModule: true,
	default: (props: Record<string, unknown>) => <img {...props} />,
}))

jest.mock('framer-motion', () => {
	const React = jest.requireActual('react') as typeof import('react')
	const motion = new Proxy(
		{},
		{
			get:
				(_target, tag: string) =>
				({
					children,
					...props
				}: Record<string, unknown> & {
					children?: React.ReactNode
				}) =>
					React.createElement(
						tag,
						Object.fromEntries(
							Object.entries(props).filter(
								([key]) =>
									![
										'initial',
										'animate',
										'exit',
										'transition',
										'whileHover',
										'whileTap',
										'variants',
									].includes(key),
							),
						),
						children,
					),
		},
	)
	return {
		motion,
		AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
		Reorder: { Group: 'div', Item: 'div' },
	}
})

jest.mock('@/hooks/useKeyboardShortcuts', () => ({
	useModifierSymbol: () => 'Ctrl',
}))

jest.mock('@/hooks/useBeforeUnloadWarning', () => ({
	useBeforeUnloadWarning: jest.fn(),
}))

jest.mock('@/hooks/useAutoSave', () => ({
	useAutoSave: () => ({
		saveStatus: 'idle',
		lastSavedAt: null,
		saveNow: jest.fn(),
	}),
}))

jest.mock('@/lib/recipe-draft-repository', () => ({
	recipeDraftRepository: {
		save: jest.fn().mockRejectedValue(new Error('storage unavailable')),
	},
}))

jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }))

jest.mock('@/store/authStore', () => ({
	useAuthStore: (selector: (state: { user: { userId: string } }) => unknown) =>
		selector({ user: { userId: 'creator-1' } }),
}))

jest.mock('../MethodCard', () => ({
	MethodCard: ({
		method,
		title,
		onClick,
	}: {
		method: string
		title: string
		onClick: () => void
	}) => (
		<button type='button' data-method={method} onClick={onClick}>
			{title}
		</button>
	),
}))

jest.mock('@/components/ui/step-indicator', () => ({
	StepIndicator: () => null,
}))

jest.mock('@/components/ui/overlay-loader', () => ({
	OverlayLoader: () => null,
}))

describe('RecipeCreateAiFlow', () => {
	const initialManualDraft = {
		title: 'Saved soup',
		ingredients: [],
		steps: [],
	} as RecipeFormData

	const mockedDraftSave = jest.mocked(recipeDraftRepository.save)
	const mockedProcessRecipe = jest.mocked(processRecipe)
	const findLocalSaveError = () =>
		screen.findByText('Not saved on this device', {}, { timeout: 10_000 })

	beforeEach(() => {
		mockedDraftSave.mockClear()
		mockedProcessRecipe.mockReset()
		jest.mocked(toast.success).mockClear()
		mockedDraftSave.mockImplementation(
			() =>
				new Promise<void>((_resolve, reject) =>
					setTimeout(() => reject(new Error('storage unavailable')), 20),
				),
		)
	})

	it('aborts parsing on cancel and ignores a late response without losing pasted text', async () => {
		let resolveParse!: (
			response: Awaited<ReturnType<typeof processRecipe>>,
		) => void
		let parseSignal: AbortSignal | undefined
		mockedProcessRecipe.mockImplementationOnce(
			(_text, signal) =>
				new Promise(resolve => {
					parseSignal = signal
					resolveParse = resolve
				}),
		)

		render(<RecipeCreateAiFlow onBack={jest.fn()} />)
		fireEvent.click(screen.getByRole('button', { name: 'Paste & Parse' }))
		const paste = screen.getByTestId('recipe-ai-raw-text')
		fireEvent.change(paste, { target: { value: 'My recipe notes' } })
		fireEvent.click(screen.getByTestId('recipe-ai-parse'))

		await screen.findByRole('status')
		expect(parseSignal?.aborted).toBe(false)
		fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

		expect(parseSignal?.aborted).toBe(true)
		expect(screen.getByTestId('recipe-ai-raw-text')).toHaveProperty(
			'value',
			'My recipe notes',
		)

		await act(async () => {
			resolveParse({ success: true, data: {} as never, statusCode: 200 })
		})

		expect(screen.getByTestId('recipe-ai-raw-text')).toBeTruthy()
		expect(screen.getByTestId('recipe-ai-parse')).toBeTruthy()
		expect(toast.success).not.toHaveBeenCalled()
	})

	it('asks before leaving changed manual work after device persistence fails', async () => {
		const onBack = jest.fn()
		render(
			<RecipeCreateAiFlow
				initialManualDraft={initialManualDraft}
				onBack={onBack}
			/>,
		)

		await findLocalSaveError()
		fireEvent.change(
			screen.getByPlaceholderText('e.g., Classic Italian Carbonara'),
			{ target: { value: 'Edited soup' } },
		)
		await waitFor(() =>
			expect(screen.queryByText('Not saved on this device')).toBeNull(),
		)
		await findLocalSaveError()
		expect(mockedDraftSave).toHaveBeenCalledWith(
			'creator-1',
			expect.objectContaining({ title: 'Edited soup' }),
		)
		fireEvent.click(screen.getByRole('button', { name: 'Back to drafts' }))

		expect(screen.getByRole('alertdialog').textContent).toContain(
			"Your latest recipe changes aren't saved",
		)
		expect(onBack).not.toHaveBeenCalled()

		fireEvent.click(screen.getByRole('button', { name: 'Stay and retry' }))
		expect(screen.queryByRole('alertdialog')).toBeNull()
		expect(onBack).not.toHaveBeenCalled()
	})

	it('leaves only after explicit confirmation when changed work failed to save', async () => {
		const onBack = jest.fn()
		render(
			<RecipeCreateAiFlow
				initialManualDraft={initialManualDraft}
				onBack={onBack}
			/>,
		)

		await findLocalSaveError()
		fireEvent.change(
			screen.getByPlaceholderText('e.g., Classic Italian Carbonara'),
			{ target: { value: 'Edited soup' } },
		)
		await waitFor(() =>
			expect(screen.queryByText('Not saved on this device')).toBeNull(),
		)
		await findLocalSaveError()

		fireEvent.click(screen.getByRole('button', { name: 'Back to drafts' }))
		expect(screen.getByRole('alertdialog')).not.toBeNull()
		fireEvent.click(screen.getByRole('button', { name: 'Leave anyway' }))
		expect(onBack).toHaveBeenCalledTimes(1)
	})

	it('leaves immediately for an unchanged draft even when its save attempt fails', async () => {
		const onBack = jest.fn()
		render(
			<RecipeCreateAiFlow
				initialManualDraft={initialManualDraft}
				onBack={onBack}
			/>,
		)

		await findLocalSaveError()
		fireEvent.click(screen.getByRole('button', { name: 'Back to drafts' }))

		expect(onBack).toHaveBeenCalledTimes(1)
		expect(screen.queryByRole('alertdialog')).toBeNull()
	})
})
