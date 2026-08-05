import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { PostCaption } from '@/components/social/PostCaption'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) =>
		key === 'showFullCaption' ? 'More' : key,
}))

let clientHeight = 40
let scrollHeight = 40
let resizeCallback: ResizeObserverCallback | undefined

class MockResizeObserver implements ResizeObserver {
	disconnect = jest.fn()
	observe = jest.fn()
	unobserve = jest.fn()

	constructor(callback: ResizeObserverCallback) {
		resizeCallback = callback
	}
}

const triggerResize = () => {
	act(() => {
		resizeCallback?.([], {} as ResizeObserver)
	})
}

describe('PostCaption', () => {
	beforeAll(() => {
		Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
			configurable: true,
			get() {
				return this.dataset.testid === 'post-caption' ? clientHeight : 0
			},
		})
		Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
			configurable: true,
			get() {
				return this.dataset.testid === 'post-caption' ? scrollHeight : 0
			},
		})
	})

	beforeEach(() => {
		clientHeight = 40
		scrollHeight = 40
		resizeCallback = undefined
		global.ResizeObserver = MockResizeObserver
	})

	it('keeps a complete short caption quiet', async () => {
		render(<PostCaption content='A quick dinner.' />)
		triggerResize()

		await waitFor(() => expect(screen.queryByRole('button')).toBeNull())
		expect(
			screen.getByTestId('post-caption').classList.contains('line-clamp-2'),
		).toBe(true)
	})

	it('offers expansion only for measured overflow', async () => {
		scrollHeight = 88
		render(
			<PostCaption content='A long caption that occupies several lines.' />,
		)
		triggerResize()

		const more = await screen.findByRole('button', { name: 'More' })
		expect(more.getAttribute('aria-expanded')).toBe('false')
		fireEvent.click(more)

		expect(
			screen.getByTestId('post-caption').classList.contains('line-clamp-2'),
		).toBe(false)
		expect(screen.queryByRole('button', { name: 'More' })).toBeNull()
	})

	it('resets and remeasures when content changes', async () => {
		scrollHeight = 88
		const { rerender } = render(<PostCaption content='First long caption.' />)
		triggerResize()
		fireEvent.click(await screen.findByRole('button', { name: 'More' }))

		rerender(<PostCaption content='Updated long caption.' />)
		triggerResize()

		await waitFor(() =>
			expect(
				screen.getByTestId('post-caption').classList.contains('line-clamp-2'),
			).toBe(true),
		)
		expect(await screen.findByRole('button', { name: 'More' })).toBeTruthy()
	})

	it('never clamps or measures the full-detail mode', () => {
		scrollHeight = 88
		render(<PostCaption content='Complete detail caption.' mode='full' />)

		expect(
			screen.getByTestId('post-caption').classList.contains('line-clamp-2'),
		).toBe(false)
		expect(screen.queryByRole('button')).toBeNull()
		expect(resizeCallback).toBeUndefined()
	})

	it('remeasures on window resize when ResizeObserver is unavailable', async () => {
		Reflect.deleteProperty(global, 'ResizeObserver')
		render(<PostCaption content='Fallback measurement caption.' />)

		scrollHeight = 88
		fireEvent(window, new Event('resize'))

		expect(await screen.findByRole('button', { name: 'More' })).toBeTruthy()
	})
})
