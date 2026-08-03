import fs from 'node:fs'
import path from 'node:path'
import { fireEvent, render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import RootError from '@/app/error'
import ExploreError from '@/app/(main)/explore/error'
import GlobalError, {
	GlobalErrorContent,
	GlobalErrorReporter,
} from '@/app/global-error'
import { logDevError } from '@/lib/dev-log'

jest.mock('@/lib/dev-log', () => ({
	logDevError: jest.fn(),
}))

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => {
		const messages: Record<string, string> = {
			'eyebrows.errorTitle': 'Something went wrong',
			'eyebrows.errorBody': 'ChefKix hit an unexpected problem.',
			failedLoadRecipes: 'Could not load recipes',
			failedLoadRecipesDescription: 'Try again in a moment.',
		}
		return messages[key] ?? key
	},
}))

jest.mock('@/i18n/hooks', () => ({
	useTranslations: () => (key: string) => {
		const messages: Record<string, string> = {
			tryAgain: 'Try again',
			goToDashboard: 'Go to dashboard',
			somethingWentWrong: 'Something went wrong',
			defaultErrorMessage: 'Please try again.',
		}
		return messages[key] ?? key
	},
}))

describe('root error recovery', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('uses the shared ordinary recovery surface with retry and dashboard exit', () => {
		const reset = jest.fn()
		const error = new Error('route failed')
		render(<RootError error={error} reset={reset} />)

		expect(screen.getByRole('alert').textContent).toContain(
			'Something went wrong',
		)
		fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
		expect(reset).toHaveBeenCalledTimes(1)
		expect(
			screen
				.getByRole('link', { name: 'Go to dashboard' })
				.getAttribute('href'),
		).toBe('/dashboard')
		expect(logDevError).toHaveBeenCalledTimes(1)
		expect(logDevError).toHaveBeenCalledWith('[RootError]', error)
	})

	it('keeps catastrophic recovery provider-independent and actionable', () => {
		const reset = jest.fn()
		render(<GlobalErrorContent reset={reset} />)

		const alert = screen.getByRole('alert')
		expect(alert.textContent).toContain('ChefKix could not load')
		fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
		expect(reset).toHaveBeenCalledTimes(1)
		const homeButton = screen.getByRole('button', { name: 'Return home' })
		expect(homeButton.closest('form')?.getAttribute('action')).toBe('/')
		expect(homeButton.closest('form')?.getAttribute('method')).toBe('get')
	})

	it('keeps Explore exceptions private while preserving retry and diagnostics', () => {
		const reset = jest.fn()
		const error = new Error('mongodb.internal:27017 refused connection')
		render(<ExploreError error={error} reset={reset} />)

		const alert = screen.getByRole('alert')
		expect(alert.textContent).toContain('Try again in a moment.')
		expect(alert.textContent).not.toContain('mongodb.internal')
		fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
		expect(reset).toHaveBeenCalledTimes(1)
		expect(logDevError).toHaveBeenCalledWith('[ExploreError]', error)
	})

	it('reports each catastrophic error identity once', () => {
		const firstError = new Error('root failed')
		const secondError = new Error('root failed again')
		const { rerender } = render(<GlobalErrorReporter error={firstError} />)

		expect(logDevError).toHaveBeenCalledTimes(1)
		rerender(<GlobalErrorReporter error={firstError} />)
		expect(logDevError).toHaveBeenCalledTimes(1)
		rerender(<GlobalErrorReporter error={secondError} />)
		expect(logDevError).toHaveBeenCalledTimes(2)
		expect(logDevError).toHaveBeenLastCalledWith('[GlobalError]', secondError)
	})

	it('preserves the required global document shell without app providers', () => {
		const markup = renderToStaticMarkup(
			<GlobalError error={new Error('root failed')} reset={jest.fn()} />,
		)
		const source = fs.readFileSync(
			path.join(process.cwd(), 'src/app/global-error.tsx'),
			'utf8',
		)
		expect(markup).toContain('<html lang="en">')
		expect(markup).toContain('<body')
		expect(markup).toContain('ChefKix could not load')
		expect(source).toContain("<html lang='en'>")
		expect(source).toContain('<body')
		expect(source).not.toContain('useTranslations')
		expect(source).not.toContain('ErrorState')
	})
})
